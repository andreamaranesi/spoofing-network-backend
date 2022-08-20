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
const Repository_1 = require("./repository/Repository");
const sequelize_1 = require("sequelize");
const Images_1 = require("../models/Images");
/**
 * manage and check user routes
 */
class Controller {
    // instantiate the repository
    constructor(user) {
        this.repository = new Repository_1.Repository(user);
        this.user = user;
    }
    // take a list of functions to be executed as a validation pipeline
    validatonPipeline(...functions) {
        return (...argument) => functions.reduce((previous, next, currentIndex) => next(argument[currentIndex]), undefined);
    }
    showNotAuthorizedItems(list, originalList, key, modelName) {
        let ids = [];
        for (let result of list) {
            ids.push(result[key]);
        }
        let difference = originalList.filter((id) => !ids.includes(id));
        throw new Error(difference.join(",") + ` id(s) are not accessible`);
    }
    // request must contains a list of dataset ids
    // check if dataset ids are owned by the authenticated user
    checkUserDataset(datasetId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            let results = yield Dataset_1.Dataset.findAll({
                where: {
                    [sequelize_1.Op.and]: [
                        {
                            id: {
                                [sequelize_1.Op.eq]: datasetId,
                            },
                        },
                        {
                            userId: userId,
                        },
                    ],
                },
            });
            if (results.length === 0)
                this.showNotAuthorizedItems(results, [datasetId], "id", "dataset");
            return results;
        });
    }
    // dataset_json must contains all the required dataset attributes
    // return a new Dataset instance
    checkCreateDataset(datasetJson) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.repository.createDataset(datasetJson);
            }
            catch (error) {
                return new Error(error.message);
            }
        });
    }
    // dataset_json must contains the dataset_id key
    // check if dataset id is owned by the authenticated user
    checkUpdateDataset(datasetJson) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let dataset = yield this.checkUserDataset(datasetJson.datasetId, this.user.id);
                delete datasetJson.datasetId;
                return yield this.repository.updateDataset(datasetJson, dataset[0]);
            }
            catch (error) {
                return new Error(error.message);
            }
        });
    }
    // validate filter request
    // return a list of Dataset filtering by date of creation and/or associated tags
    checkGetDataset(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let filterList = ["creationDate", "tags"];
                let filterKeys = Object.keys(filters);
                // remove invalid json keys
                // the user can add other json properties, but they will deleted from the request
                for (let invalidKey of filterKeys.filter((key) => !filterList.includes(key))) {
                    delete filters[invalidKey];
                }
                return yield this.repository.getDatasetList(filters);
            }
            catch (error) {
                return new Error(error.message);
            }
        });
    }
    // request must contains a list of uuids of images
    // check if images are owned by the authenticated user
    checkUserImages(imageIds, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            let datasets = yield Dataset_1.Dataset.findAll({
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
                    userId: userId,
                },
            });
            let images = [];
            for (let dataset of datasets) {
                for (let image of dataset["Images"]) {
                    images.push(image);
                }
            }
            if (images.length !== imageIds.length)
                this.showNotAuthorizedItems(images, imageIds, "UUID", "images");
            return images;
        });
    }
    // check if user tokens are >= amount
    checkUserToken(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.checkUserImages(amount.images, this.user.id);
            }
            catch (err) {
                return new Error(err.message);
            }
        });
    }
    // request must contains a list of uuids of images
    // check if images are owned by the authenticated user
    // return the results of the inference done by the CNN model
    checkDoInference(request) { }
    // request must contains a list of uuids of images and associated labels
    // check if images are owned by the authenticated user
    checkSetLabel(request) { }
    // check if images are owned by the authenticated user
    checkDeleteDataset(datasetId) { }
    // file is an image or a .zip of images
    // check if dataset id is owned by the authenticated user
    // insert images in that dataset
    checkInsertImagesFromFile(file, request) {
        return __awaiter(this, void 0, void 0, function* () {
            if (file.images === undefined)
                return new Error("an image or .zip must be given");
            yield this.checkUserDataset(request.datasetId, this.user.id);
            file = file.images;
            let mimetype = file.mimetype;
            const isValidFile = Images_1.Image.isValidMimetype(mimetype);
            if (isValidFile) {
                let uuids = yield this.repository.saveImage(file, request.datasetId);
                if (Object.keys(uuids).length === 0)
                    return new Error("no images was valid");
                return uuids;
            }
            return new Error("file must be an image or a .zip of images");
            //return await this.repository.createDataset(datasetJson);
        });
    }
    // request must contains a public url of an image or a .zip file, and the related dataset id
    // check if images are owned by the authenticated user
    // insert images in that dataset
    checkInsertImagesFromUrl(request) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkUserDataset(request.datasetId, this.user.id);
            return yield this.repository.saveImage(null, request.datasetId, request.url, request.singleImageName);
        });
    }
}
exports.Controller = Controller;
