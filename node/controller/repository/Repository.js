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
const fs = require("fs");
const unzipper = require("unzipper");
const path = require("path");
const Images_1 = require("../../models/Images");
const stream_1 = require("stream");
const axios_1 = require("axios");
/**
 * communicate with models
 * models are the DAO level
 */
class Repository {
    constructor(user) {
        this.user = user;
    }
    // create a new user dataset
    createDataset(datasetJson) {
        return __awaiter(this, void 0, void 0, function* () {
            let tags = datasetJson.tags;
            // get current date
            datasetJson.creationDate = new Date();
            datasetJson.userId = this.user.id;
            // create the dataset on the database
            let dataset = yield Dataset_1.Dataset.create(datasetJson);
            // create tags
            let createdTags = yield this.createTags(tags, dataset.id);
            // we need the id to associate the tags
            let datasetId = dataset.id;
            return { dataset: dataset, tags: createdTags };
        });
    }
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
    // update a user dataset
    updateDataset(datasetJson, dataset) {
        return __awaiter(this, void 0, void 0, function* () {
            dataset.set(datasetJson);
            yield dataset.save();
            let createdTags;
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
    fileExtension(fileName) {
        return fileName.split(".").pop().toLowerCase();
    }
    isImage(fileName) {
        if (["png", "jpg", "gif", "jpeg"].includes(this.fileExtension(fileName)))
            return true;
        return false;
    }
    // extract all images from a zip for a specific dataset
    // save them in the storage
    // save them in the database
    unzipImages(stream, datasetId) {
        return __awaiter(this, void 0, void 0, function* () {
            let images = {};
            let $this = this;
            yield stream
                .pipe(unzipper.Parse())
                .on("entry", function (entry) {
                return __awaiter(this, void 0, void 0, function* () {
                    const fileName = entry.path;
                    const type = entry.type; // 'Directory' or 'File'
                    if (type === "File" && $this.isImage(fileName)) {
                        let image = yield $this.createImage(fileName, datasetId);
                        let outputPath = $this.getImagePath(image, datasetId, true);
                        yield entry.pipe(fs.createWriteStream(outputPath));
                        images[fileName] = image.UUID;
                    }
                    else
                        entry.autodrain();
                });
            })
                .promise()
                .then(() => "done")
                .catch(() => {
                throw new Error("error while unzipping");
            });
            return images;
        });
    }
    downloadImage(url) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    // save images from an uploaded file or a .zip of images
    // download image or .zip from an URL if the URL is specified
    saveImage(file, datasetId, url = null, singleImageName = "downloaded_file") {
        return __awaiter(this, void 0, void 0, function* () {
            let images = {};
            // download image or .zip
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
                    file = res.data;
                    if (mimetype.includes("image")) {
                        let extension = mimetype.split("/").pop();
                        let image = yield this.createImage(`${singleImageName}.${extension}`, datasetId);
                        yield file.pipe(fs.createWriteStream(this.getImagePath(image, datasetId, true)));
                        return { fileName: image.UUID };
                    }
                    else if (mimetype.includes("zip")) {
                        console.log("unzipping files..");
                        return yield this.unzipImages(file, datasetId);
                    }
                    return {};
                }))
                    .catch((err) => {
                    throw new Error(err);
                });
            }
            else {
                // we have uploaded a file
                if (file.mimetype.includes("image")) {
                    // save normal image file
                    console.log("image saving");
                    let image = yield this.createImage(file.name, datasetId);
                    file.mv(this.getImagePath(image, datasetId, true));
                    images[file.name] = image.UUID;
                }
                else if (file.mimetype.includes("zip")) {
                    console.log("extracting from zip file");
                    // save all images in the zip
                    images = yield this.unzipImages(stream_1.Readable.from(file.data), datasetId);
                }
            }
            return images;
        });
    }
    getImagePath(image, datasetId, createPath = false) {
        let finalPath = path.join(process.env.NODE_IMAGE_STORAGE, this.user.id.toString(), datasetId.toString());
        if (createPath && !fs.existsSync(finalPath)) {
            fs.mkdirSync(finalPath, { recursive: true });
        }
        return path.join(finalPath, image.UUID + "." + this.fileExtension(image.fileName));
    }
    createImage(fileName, datasetId) {
        return __awaiter(this, void 0, void 0, function* () {
            let image = yield Images_1.Image.create({
                fileName: fileName,
                datasetId: datasetId,
            });
            return image;
        });
    }
    // get user datasets
    // filtering by creation date and/or tags
    getDatasetList(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            let tags = filters.tags;
            delete filters.tags;
            const filterOption = {};
            return true;
        });
    }
    // get one or more images inference from .h5 model
    getInference(images) { }
    // set one label for one or more images
    setLabel(images, labels) { }
    // logically delete a dataset
    deleteDataset(id) { }
}
exports.Repository = Repository;
