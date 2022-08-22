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
const Controller_1 = require("./controller/Controller");
const middleware_1 = require("./middleware/middleware");
const fileUpload = require("express-fileupload");
const express_validator_1 = require("express-validator");
var express = require("express");
var app = express();
app.use(middleware_1.checkToken);
app.use(middleware_1.verifyAndAuthenticate);
app.use(middleware_1.verifyTokenAmount);
app.use(middleware_1.errorHandler);
app.get("/get/token", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let controller = new Controller_1.Controller(req.user);
        const RESULT = controller.getUserToken();
        if (RESULT instanceof Error)
            res.status(500).send({ error: RESULT.message });
        else
            res.json(RESULT);
    });
});
app.use(express.json());
// validate json data
const checkValidation = function (res, errors) {
    if (!errors.isEmpty())
        return errors;
    return null;
};
// send back validation errors
const sendValidationError = function (res, errors) {
    res.status(500).send({ error: errors.array() });
};
const validateListImages = [
    (0, express_validator_1.body)("images")
        .isArray()
        .notEmpty()
        .withMessage("images must be a list of id"),
    (0, express_validator_1.body)("images.*").isNumeric().withMessage("image id must be numeric"),
];
const validateTags = [
    (0, express_validator_1.body)("tags")
        .optional()
        .isArray()
        .notEmpty()
        .withMessage("tags must be a list of string"),
    (0, express_validator_1.body)("tags.*").optional().isString().withMessage("tag must be a string"),
];
// route to create a new dataset
app.get("/create/dataset", (0, express_validator_1.body)("name").exists(), (0, express_validator_1.body)("numClasses").exists(), validateTags, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let error = checkValidation(res, (0, express_validator_1.validationResult)(req));
        if (error !== null)
            sendValidationError(res, error);
        else {
            checkValidation(res, (0, express_validator_1.validationResult)(req));
            let controller = new Controller_1.Controller(req.user);
            const DATASET = yield controller.checkCreateDataset(req.body);
            if (DATASET instanceof Error)
                res.status(500).send({ error: DATASET.message });
            else
                res.json(DATASET);
        }
    });
});
// route to update a dataset
app.get("/update/dataset", (0, express_validator_1.body)("datasetId").isNumeric(), validateTags, (0, express_validator_1.oneOf)([
    (0, express_validator_1.body)("name").exists(),
    (0, express_validator_1.body)("numClasses").exists(),
    (0, express_validator_1.body)("tags").exists(),
]), function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let error = checkValidation(res, (0, express_validator_1.validationResult)(req));
        if (error !== null)
            sendValidationError(res, error);
        else {
            let controller = new Controller_1.Controller(req.user);
            const DATASET = yield controller.checkUpdateDataset(req.body);
            if (DATASET instanceof Error)
                res.status(500).send({ error: DATASET.message });
            else
                res.json(DATASET);
        }
    });
});
// route to logically delete a dataset
app.get("/delete/dataset", (0, express_validator_1.body)("datasetId").isNumeric(), function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let error = checkValidation(res, (0, express_validator_1.validationResult)(req));
        if (error !== null)
            sendValidationError(res, error);
        else {
            let controller = new Controller_1.Controller(req.user);
            const DATASET = yield controller.checkDeleteDataset(req.body);
            if (DATASET instanceof Error)
                res.status(500).send({ error: DATASET.message });
            else
                res.json(DATASET);
        }
    });
});
const EXPRESS_DATE_MESSAGE = "Date must be in the format DD-MM-YYYY";
// route to filter datasets by tag and/or creation date
app.get("/get/dataset", (0, express_validator_1.body)("startDate")
    .optional()
    .isDate({ format: "DD-MM-YYYY" })
    .withMessage(EXPRESS_DATE_MESSAGE), (0, express_validator_1.body)("endDate")
    .optional()
    .isDate({ format: "DD-MM-YYYY" })
    .withMessage(EXPRESS_DATE_MESSAGE), (0, express_validator_1.body)("tagRelationship")
    .optional()
    .toLowerCase()
    .isIn(["and", "or"])
    .withMessage("tag relationship can be 'or','and'"), validateTags, (0, express_validator_1.oneOf)([
    (0, express_validator_1.body)("startDate").exists(),
    (0, express_validator_1.body)("endDate").exists(),
    (0, express_validator_1.body)("tags").exists(),
]), function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let error = checkValidation(res, (0, express_validator_1.validationResult)(req));
        if (error !== null)
            sendValidationError(res, error);
        else {
            let controller = new Controller_1.Controller(req.user);
            const DATASET = yield controller.checkGetDataset(req.body);
            if (DATASET instanceof Error)
                res.status(500).send({ error: DATASET.message });
            else
                res.json(DATASET);
        }
    });
});
// admin route
// update a user token amount
app.get("/set/token", middleware_1.isAdmin, (0, express_validator_1.body)("email").isEmail(), (0, express_validator_1.body)("token").isNumeric(), function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let error = checkValidation(res, (0, express_validator_1.validationResult)(req));
        if (error !== null)
            sendValidationError(res, error);
        else {
            let controller = new Controller_1.Controller(req.user);
            const RESULT = yield controller.checkSetToken(req.body);
            if (RESULT instanceof Error)
                res.status(500).send({ error: RESULT.message });
            else
                res.json(RESULT);
        }
    });
});
// route to get image inferences
app.get("/get/inference", validateListImages, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let error = checkValidation(res, (0, express_validator_1.validationResult)(req));
        if (error !== null)
            sendValidationError(res, error);
        else {
            let controller = new Controller_1.Controller(req.user);
            const RESULT = yield controller.checkDoInference(req.body);
            if (RESULT instanceof Error)
                res.status(500).send({ error: RESULT.message });
            else
                res.json(RESULT);
        }
    });
});
// route to set labels of images
app.get("/set/label", validateListImages, (0, express_validator_1.body)("labels").isArray(), (0, express_validator_1.body)("labels.*")
    .toLowerCase()
    .isIn(["real", "fake"])
    .withMessage("label must be real or fake"), function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let error = checkValidation(res, (0, express_validator_1.validationResult)(req));
        if (error !== null)
            sendValidationError(res, error);
        else {
            let controller = new Controller_1.Controller(req.user);
            const RESULT = yield controller.checkSetLabel(req.body);
            if (RESULT instanceof Error)
                res.status(500).send({ error: RESULT.message });
            else
                res.json(RESULT);
        }
    });
});
// route to insert images to a dataset by an url
// url must be a supported image or a .zip of supported images
app.get("/images/url", (0, express_validator_1.body)("url").isURL(), (0, express_validator_1.body)("datasetId").isNumeric(), function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let error = checkValidation(res, (0, express_validator_1.validationResult)(req));
        if (error !== null)
            sendValidationError(res, error);
        else {
            let controller = new Controller_1.Controller(req.user);
            const RESULT = yield controller.checkInsertImagesFromUrl(req.body);
            if (RESULT instanceof Error)
                res.status(500).send({ error: RESULT.message });
            else
                res.json(RESULT);
        }
    });
});
app.use(fileUpload());
// route to insert images to a dataset by a form
// file must be a supported image or a .zip of supported images
app.post("/images/file", (0, express_validator_1.body)("datasetId").isNumeric(), function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let error = checkValidation(res, (0, express_validator_1.validationResult)(req));
        if (error !== null)
            sendValidationError(res, error);
        else {
            let controller = new Controller_1.Controller(req.user);
            const RESULT = yield controller.checkInsertImagesFromFile(req.files, req.body);
            if (RESULT instanceof Error)
                res.status(500).send({ error: RESULT.message });
            else
                res.json(RESULT);
        }
    });
});
app.listen(process.env.NODE_PORT || 3000, process.env.NODE_INTERFACE || "0.0.0.0");
console.log("node started");