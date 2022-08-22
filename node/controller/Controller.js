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
exports.Controller = void 0;
const Dataset_1 = require("../models/Dataset");
const User_1 = require("../models/User");
const Repository_1 = require("./repository/Repository");
const Images_1 = require("../models/Images");
const sequelize_1 = require("sequelize");
/**
 * manages and checks user routes
 */
class Controller {
    // instantiates the repository
    constructor(user) {
        this.repository = new Repository_1.Repository(user);
        this.user = user;
    }
    // checks if a list contains duplicated entries
    checkDuplicateEntries(list) {
        if ([...new Set(list)].length !== list.length)
            return true;
        return false;
    }
    // from a list of Models and an original list
    // checks which model attributes are not in the original list
    showNotAuthorizedItems(list, originalList, key, modelName) {
        let ids = [];
        for (let result of list) {
            ids.push(result[key]);
        }
        let difference = originalList.filter((id) => !ids.includes(id));
        throw new Error(difference.join(",") + ` id(s) are not accessible`);
    }
    // checks if dataset id is owned by the authenticated user
    // returns the datasets found
    checkUserDataset(datasetId) {
        return __awaiter(this, void 0, void 0, function* () {
            let results = yield Dataset_1.Dataset.scope("visible").findAll({
                where: {
                    id: datasetId,
                    userId: this.user.id,
                },
            });
            // if the dataset wasn't found
            if (results.length === 0)
                this.showNotAuthorizedItems(results, [datasetId], "id", "dataset");
            return results;
        });
    }
    // checks if exists another dataset with the same name
    checkDatasetWithSameName(name, datasetId = null) {
        return __awaiter(this, void 0, void 0, function* () {
            if (name !== undefined) {
                // final Sequelize filtering options
                const FILTER_OPTIONS = {
                    where: {
                        name: name,
                        userId: this.user.id,
                    },
                };
                // checks that the dataset is not itself
                if (datasetId !== null) {
                    FILTER_OPTIONS["where"]["id"] = {
                        [sequelize_1.Op.ne]: datasetId,
                    };
                }
                let dataset = yield Dataset_1.Dataset.scope("visible").findOne(FILTER_OPTIONS);
                if (dataset !== null)
                    throw new Error(`there is already a dataset with name ${name}`);
            }
        });
    }
    // returns a new dataset instance
    checkCreateDataset(datasetJson) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.checkDatasetWithSameName(datasetJson.name);
                return yield this.repository.createDataset(datasetJson);
            }
            catch (error) {
                return new Error(error.message);
            }
        });
    }
    // checks if dataset id is owned by the authenticated user
    // updates the dataset
    // returns the updated dataset
    checkUpdateDataset(datasetJson) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.checkDatasetWithSameName(datasetJson.name, datasetJson.datasetId);
                let dataset = yield this.checkUserDataset(datasetJson.datasetId);
                delete datasetJson.datasetId;
                return yield this.repository.updateDataset(datasetJson, dataset[0]);
            }
            catch (error) {
                return new Error(error.message);
            }
        });
    }
    // checks if dataset id is owned by the authenticated user
    // returns a list of Dataset filtering by date of creation and/or associated tags
    checkGetDataset(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.repository.getDatasetList(filters);
            }
            catch (error) {
                return new Error(error.message);
            }
        });
    }
    // checks if images are owned by the authenticated user
    // returns the list of images found
    checkUserImages(imageIds) {
        return __awaiter(this, void 0, void 0, function* () {
            let datasets = yield Dataset_1.Dataset.scope("visible").findAll({
                attributes: ["id"],
                include: {
                    model: Images_1.Image,
                    required: true,
                    where: {
                        UUID: {
                            [sequelize_1.Op.in]: imageIds,
                        },
                    },
                },
                where: {
                    userId: this.user.id,
                },
            });
            // retrieves images inside the dataset array
            let images = [];
            for (let dataset of datasets) {
                for (let image of dataset["Images"]) {
                    images.push(image);
                }
            }
            // if images found are less than given list
            if (images.length !== imageIds.length)
                this.showNotAuthorizedItems(images, imageIds, "UUID", "images");
            return images;
        });
    }
    // returns the current user token amount
    getUserToken() {
        return { token: this.user.token };
    }
    // request must contains a list of uuids of images
    // checks if images are owned by the authenticated user
    // returns the results of the inference done by the CNN model
    checkDoInference(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.checkDuplicateEntries(request.images))
                    return new Error("there are duplicated entries on images");
                let images = yield this.checkUserImages(request.images);
                // if user gives one image
                // checks if the image has already an inference
                if (images.length === 1) {
                    if (images[0].inference !== null) {
                        return new Error(`image id ${images[0].UUID} has already an inference: ${images[0].inference}`);
                    }
                }
                const COST = parseFloat(process.env.INFERENCE_COST);
                return yield this.repository.getInference(images, COST);
            }
            catch (err) {
                return new Error(err.message);
            }
        });
    }
    // request must contains a list of uuids of images and associated labels
    // checks if images are owned by the authenticated user
    // sets labels (real, fake) to the list of images
    checkSetLabel(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.checkDuplicateEntries(request.images))
                    return new Error("there are duplicated entries on images");
                // the length of the labels must be equal to that of the images
                if (request.images.length !== request.labels.length)
                    return new Error("labels length must be equal to images length");
                let images = yield this.checkUserImages(request.images);
                const COST = parseFloat(process.env.LABEL_COST);
                this.repository.checkUserToken(this.user, COST * images.length);
                return yield this.repository.setLabel(images, request.labels, COST);
            }
            catch (err) {
                return new Error(err.message);
            }
        });
    }
    // checks if dataset is owned by the authenticated user
    // deletes (logically) the dataset
    checkDeleteDataset(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let dataset = yield this.checkUserDataset(request.datasetId);
                return yield this.repository.deleteDataset(dataset[0]);
            }
            catch (err) {
                return new Error(err.message);
            }
        });
    }
    // updates a specified user token
    checkSetToken(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let userToUpdate = yield User_1.User.findOne({
                    where: {
                        email: request.email,
                    },
                });
                if (userToUpdate === null)
                    throw new Error(`user with email ${request.email} doesn't exist`);
                return yield this.repository.updateUserToken(userToUpdate, request.token);
            }
            catch (err) {
                return new Error(err.message);
            }
        });
    }
    // file is an image or a .zip of images
    // checks if dataset id is owned by the authenticated user
    // inserts images in the dataset
    checkInsertImagesFromFile(file, request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (file.images === undefined)
                    return new Error("an image or .zip must be given");
                yield this.checkUserDataset(request.datasetId);
                file = file.images;
                const IS_VALID_FILE = Images_1.Image.isValidMimetype(file.mimetype);
                let cost = parseFloat(process.env.INSERT_IMAGE_COST);
                if (IS_VALID_FILE) {
                    let uuids = yield this.repository.saveImage(file, request.datasetId, cost);
                    if (Object.keys(uuids).length === 0)
                        return new Error("no images was valid");
                    return uuids;
                }
                return new Error("file must be an image or a .zip of images");
            }
            catch (err) {
                return new Error(err.message);
            }
        });
    }
    // request must contains a public url of an image or a .zip file, and the related dataset id
    // checks if dataset id is owned by the authenticated user
    // inserts images in the dataset
    checkInsertImagesFromUrl(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.checkUserDataset(request.datasetId);
                let cost = parseFloat(process.env.INSERT_IMAGE_COST);
                return yield this.repository.saveImage(null, request.datasetId, cost, request.url, request.singleImageName);
            }
            catch (err) {
                return new Error(err.message);
            }
        });
    }
}
exports.Controller = Controller;
