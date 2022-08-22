"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Repository = void 0;
const Dataset_1 = require("../../models/Dataset");
const DatasetTag_1 = require("../../models/DatasetTag");
const User_1 = require("../../models/User");
const fs = require("fs");
const unzipper = require("unzipper");
const path = require("path");
const Images_1 = require("../../models/Images");
const stream_1 = require("stream");
const moment = require("moment");
const axios_1 = require("axios");
const sequelize_1 = require("sequelize");
/**
 * communicates with models
 * models are the DAO level
 */
class Repository {
    constructor(user) {
        this.user = user;
    }
    // creates a new user dataset
    // returns the new dataset and created tags
    createDataset(datasetJson) {
        return __awaiter(this, void 0, void 0, function* () {
            let tags = datasetJson.tags;
            // gets current date
            datasetJson.creationDate = new Date();
            // adds user id
            datasetJson.userId = this.user.id;
            // creates the dataset on the database
            let dataset = yield Dataset_1.Dataset.create(datasetJson);
            // create tags
            let createdTags = yield this.createTags(tags, dataset.id);
            return { dataset: dataset, tags: createdTags };
        });
    }
    // creates new tags
    // saves only not empty tags
    // returns the list of created tags
    createTags(tags, datasetId) {
        return __awaiter(this, void 0, void 0, function* () {
            let list = [];
            if (tags !== undefined)
                for (let tag of tags) {
                    tag = tag;
                    if (tag != "") {
                        tag = { tag: tag, datasetId: datasetId };
                        list.push((yield DatasetTag_1.DatasetTag.findOrCreate({ where: tag, defaults: tag }))[0]);
                    }
                }
            return list;
        });
    }
    // updates a user dataset
    // returns the dataset and related tags
    updateDataset(datasetJson, dataset) {
        return __awaiter(this, void 0, void 0, function* () {
            // updates dataset instance
            yield dataset.set(datasetJson).save();
            let createdTags;
            // updates tags if not undefined
            // deletes tags if new tags have been defined
            if (datasetJson.tags !== undefined) {
                yield DatasetTag_1.DatasetTag.destroy({ where: { datasetId: dataset.id } });
                createdTags = yield this.createTags(datasetJson.tags, dataset.id);
            }
            else {
                createdTags = yield DatasetTag_1.DatasetTag.findAll({
                    where: {
                        datasetId: dataset.id,
                    },
                });
            }
            return { dataset: dataset, tags: createdTags };
        });
    }
    // returns the file extension from the filename
    fileExtension(fileName) {
        return fileName.split(".").pop().toLowerCase();
    }
    // checks if an image is supported
    isImage(fileName) {
        let mimetype = "image/" + this.fileExtension(fileName);
        if (Images_1.Image.isValidMimetype(mimetype))
            return true;
        return false;
    }
    // updates the user token amount subtracting a cost
    // checks if the user has the available amount
    updateUserTokenByCost(user, cost) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkUserToken(user, cost);
            try {
                console.log("sottraggo" + (this.user.token - cost));
                yield this.user.set({ token: this.user.token - cost }).save();
            }
            catch (err) {
                throw new Error("error on updating token");
            }
        });
    }
    // extracts all images from a zip for a specific dataset
    // saves them in the storage
    // saves them in the database
    // returns the list of saved images
    unzipImages(stream, datasetId, cost) {
        return __awaiter(this, void 0, void 0, function* () {
            let bufferList = [];
            // from a stream retrieves all the file entries
            // checks if the file entry is a supported image
            // saves the buffer in the storage
            // saves the image in the database
            return yield new Promise((resolve, reject) => {
                stream
                    .pipe(unzipper.Parse())
                    .on("entry", (entry) => __awaiter(this, void 0, void 0, function* () {
                    const FILE_NAME = entry.path;
                    const TYPE = entry.type; // 'Directory' or 'File'
                    if (TYPE === "File" && this.isImage(FILE_NAME)) {
                        //save the buffer to a temporary list
                        bufferList.push([yield entry.buffer(), entry]);
                    }
                    else
                        entry.autodrain();
                }))
                    .on("close", () => __awaiter(this, void 0, void 0, function* () {
                    // the final cost to upload the valid images
                    let finalCost = cost * bufferList.length;
                    // updates the user cost
                    yield this.updateUserTokenByCost(this.user, finalCost);
                    let images = {};
                    // for each file, it will be saved on the database and the storage
                    for (let buffer of bufferList) {
                        let entry = buffer[1];
                        let fileName = entry.path;
                        let image = yield this.createImage(fileName, datasetId);
                        let outputPath = this.getImagePath(image, true);
                        fs.writeFileSync(outputPath, buffer[0]);
                        images[fileName] = image.UUID;
                    }
                    resolve(images);
                }))
                    .on("error", (error) => reject(error));
            });
        });
    }
    // checks if the user token amount is >= requested amount
    checkUserToken(user, amount) {
        if (user.token < amount)
            throw new Error(`you need ${amount} tokens for this operation`);
    }
    // saves images from an uploaded file or a .zip of images
    // downloads image or .zip from an URL if the URL is specified
    // returns a list of filenames with their generated ids
    saveImage(file, datasetId, cost, url = null, singleImageName = "downloaded_file") {
        return __awaiter(this, void 0, void 0, function* () {
            let images = {};
            // will download image or .zip
            if (url !== null) {
                // check URL validity
                // check if URL contains a .zip or an image
                images = yield axios_1.default
                    .get(url, { responseType: "stream" })
                    .then((res) => __awaiter(this, void 0, void 0, function* () {
                    console.log(`statusCode: ${res.status}`);
                    if (res.status !== 200)
                        throw new Error("can't access the file");
                    let mimetype = res.headers["content-type"];
                    if (!Images_1.Image.isValidMimetype(mimetype)) {
                        throw new Error("you must give an URL with supported images or zip file");
                    }
                    // the file stream
                    file = res.data;
                    // if the file is an image
                    // download and write the image on the storage if user tokens are sufficient
                    if (mimetype.includes("image")) {
                        yield this.updateUserTokenByCost(this.user, cost);
                        let extension = mimetype.split("/").pop();
                        let imageJson = {};
                        let fileName = `${singleImageName}.${extension}`;
                        let image = yield this.createImage(fileName, datasetId);
                        yield file.pipe(fs.createWriteStream(this.getImagePath(image, true)));
                        imageJson[fileName] = image.UUID;
                        return imageJson;
                    }
                    // if the file is a .zip
                    else if (mimetype.includes("zip")) {
                        // will write the .zip images on the storage if the user token amount is sufficient
                        console.log("unzipping files..");
                        return yield this.unzipImages(file, datasetId, cost);
                    }
                    return {};
                }))
                    .catch((err) => {
                    throw new Error(err);
                });
            }
            else {
                // user uploaded a file
                // if the file is an .image, will move it on the storage
                // checks user token amount
                if (file.mimetype.includes("image")) {
                    console.log("image saving");
                    yield this.updateUserTokenByCost(this.user, cost);
                    let image = yield this.createImage(file.name, datasetId);
                    file.mv(this.getImagePath(image, true));
                    images[file.name] = image.UUID;
                }
                // if the file is an .zip, will extract valid images
                else if (file.mimetype.includes("zip")) {
                    console.log("extracting from zip file");
                    images = yield this.unzipImages(stream_1.Readable.from(file.data), datasetId, cost);
                }
            }
            return images;
        });
    }
    // returns image path of a saved image
    // checks if the path is for node backend or python backend
    getImagePath(image, createPath = false, python = false) {
        // returns the directory path
        let finalPath = path.join(python
            ? process.env.PYTHON_IMAGE_STORAGE
            : process.env.NODE_IMAGE_STORAGE, this.user.id.toString(), image.datasetId.toString());
        // if createPath is true creates the directory where to store images
        if (createPath && !fs.existsSync(finalPath)) {
            fs.mkdirSync(finalPath, { recursive: true });
        }
        return path.join(finalPath, image.UUID + "." + this.fileExtension(image.fileName));
    }
    // saves the image on database
    // returns the created image
    createImage(fileName, datasetId) {
        return __awaiter(this, void 0, void 0, function* () {
            let image = yield Images_1.Image.create({
                fileName: fileName,
                datasetId: datasetId,
            });
            return image;
        });
    }
    // gets user datasets
    // filters by creation date and/or tags
    // returns the list of datasets found
    getDatasetList(filters) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let tags = filters.tags;
            let date = [filters.startDate, filters.endDate];
            let tagRelationship = (_a = filters.tagRelationship) !== null && _a !== void 0 ? _a : "or";
            // returns filter operator and value
            const checkStartDate = (arg) => {
                // if date is not a filter
                // returns null
                if (arg.every((x) => x === undefined))
                    return null;
                // formats date string
                let formattedArg = arg.map((x) => {
                    if (x !== undefined)
                        return moment(x, ["DD-MM-YYYY"]).format();
                    else
                        return x;
                });
                // checks if one of the date is invalid
                const SOME_INVALID = formattedArg.some((x) => x === undefined);
                // since there is only endDate, will filter <= endDate
                if (formattedArg[0] === undefined)
                    return [sequelize_1.Op.lte, formattedArg[1]];
                // since there is only startDate, will filter >= startDate
                if (SOME_INVALID)
                    return [sequelize_1.Op.gte, formattedArg[0]];
                // since there are both dates, will filter startDate <= x <= endDate
                return [sequelize_1.Op.between, formattedArg];
            };
            let dateFilter = checkStartDate(date);
            let includeOptions = [
                {
                    model: Images_1.Image,
                    required: false,
                },
            ];
            if (tags !== undefined) {
                // to remove duplicated entries
                tags = [...new Set(tags)];
                includeOptions.push({
                    model: DatasetTag_1.DatasetTag,
                    required: true,
                    where: {
                        tag: {
                            [sequelize_1.Op.in]: tags,
                        },
                    },
                });
            }
            // final Sequelize filtering options
            const FILTER_OPTION = {
                attributes: {
                    exclude: ["test"],
                },
                where: {
                    userId: this.user.id,
                },
                include: includeOptions,
            };
            if (dateFilter !== null) {
                FILTER_OPTION.where["creationDate"] = {
                    [dateFilter[0]]: dateFilter[1],
                };
            }
            let datasets = yield Dataset_1.Dataset.scope("visible").findAll(FILTER_OPTION);
            // if tagRelationship = and
            // filter datasets that have not the list of the given distinct tags
            if (tags !== undefined && tagRelationship === "and")
                return datasets.filter((dataset) => dataset["DatasetTags"].length === tags.length);
            return datasets;
        });
    }
    // gets one or more image inference results from .h5 model
    // if some images can't be inferred, chargebacks the cost
    // returns json of predictions and metrics
    getInference(images, cost) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.updateUserTokenByCost(this.user, cost * images.length);
            // create JSON for python backend
            const createJson = () => {
                var _a;
                const BODY = { images: [] };
                for (let image of images) {
                    BODY.images.push({
                        UUID: image.UUID,
                        label: (_a = image.label) !== null && _a !== void 0 ? _a : "",
                        path: this.getImagePath(image, false, true),
                    });
                }
                return BODY;
            };
            return yield axios_1.default
                .get(`http://${process.env.PYTHON_BACKEND}:${process.env.PYTHON_BACKEND_PORT}/predict`, {
                data: createJson(),
            })
                .then((res) => __awaiter(this, void 0, void 0, function* () {
                let data = res.data;
                let invalidImages = data.invalidPredictions;
                // chargeback if there are invalid images
                // for example no human faces or corrupted images
                if (invalidImages.length > 0) {
                    // updates user data from database
                    // the request maybe was too long and the user did other requests
                    this.user = yield User_1.User.findByPk(this.user.id);
                    // update user token amount
                    yield this.updateUserToken(this.user, this.user.token + cost * invalidImages.length);
                    res.data["updatedTokens"] = this.user.token;
                }
                let inferences = data.imagePredictions;
                // saves inferences on database
                for (let inference of inferences) {
                    let image = yield Images_1.Image.findByPk(inference.UUID);
                    let prediction = inference.prediction;
                    if (image !== null)
                        yield image.set({ inference: prediction }).save();
                }
                return res.data;
            }))
                .catch((err) => {
                throw new Error(err);
            });
        });
    }
    // sets labels for one or more images
    // returns the list of updated images
    setLabel(images, labels, cost) {
        return __awaiter(this, void 0, void 0, function* () {
            let updatedImages = [];
            // updates user token amount for each labeled image
            for (let i = 0; i < images.length; i++) {
                try {
                    yield this.updateUserTokenByCost(this.user, cost);
                }
                catch (_a) {
                    throw new Error("there was an error. List of already saved labels: " +
                        JSON.stringify(updatedImages));
                }
                yield images[i].set({ label: labels[i] }).save();
                updatedImages.push(images[i]);
            }
            return updatedImages;
        });
    }
    // logically deletes a dataset
    // returns the deleted dataset
    deleteDataset(dataset) {
        return __awaiter(this, void 0, void 0, function* () {
            yield dataset.set({ isDeleted: true }).save();
            return { deletedDataset: dataset };
        });
    }
    // updates the token amount of a specified user
    // returns the updated user
    updateUserToken(user, token) {
        return __awaiter(this, void 0, void 0, function* () {
            yield user.set({ token: token }).save();
            return { updatedUser: user };
        });
    }
}
exports.Repository = Repository;
