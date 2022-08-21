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
app.use(middleware_1.errorHandler);
app.use(express.json());
const checkValidation = function (res, errors) {
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
};
app.get("/create/dataset", (0, express_validator_1.body)("name").exists(), (0, express_validator_1.body)("numClasses").exists(), (0, express_validator_1.body)("tags").optional().isString(), (0, express_validator_1.body)("tags.*").optional().isString().withMessage("tag must be a string"), function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        checkValidation(res, (0, express_validator_1.validationResult)(req));
        console.log("Ok");
        let controller = new Controller_1.Controller(req.user);
        const dataset = yield controller.checkCreateDataset(req.body);
        if (dataset instanceof Error)
            res.status(500).send({ error: dataset.message });
        else
            res.json(dataset);
    });
});
app.get("/update/dataset", (0, express_validator_1.body)("datasetId").isNumeric(), (0, express_validator_1.body)("tags").optional().isString(), (0, express_validator_1.body)("tags.*").optional().isString().withMessage("tag must be a string"), (0, express_validator_1.oneOf)([
    (0, express_validator_1.body)("name").exists(),
    (0, express_validator_1.body)("numClasses").exists(),
    (0, express_validator_1.body)("tags").exists(),
]), function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        checkValidation(res, (0, express_validator_1.validationResult)(req));
        console.log("Ok");
        console.log(req.user);
        let controller = new Controller_1.Controller(req.user);
        const response = yield controller.checkUpdateDataset(req.body);
        if (response instanceof Error)
            res.status(500).send({ error: response.message });
        else
            res.send(response);
    });
});
app.get("/check/images", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(req.user);
        let controller = new Controller_1.Controller(req.user);
        const response = yield controller.checkUserToken(req.body);
        if (response instanceof Error)
            res.status(500).send({ error: response.message });
        else
            res.send(response);
    });
});
app.get("/images/url", (0, express_validator_1.body)("url").isURL(), (0, express_validator_1.body)("databaseId").isNumeric(), function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        checkValidation(res, (0, express_validator_1.validationResult)(req));
        let controller = new Controller_1.Controller(req.user);
        const response = yield controller.checkInsertImagesFromUrl(req.body);
        if (response instanceof Error)
            res.status(500).send({ error: response.message });
        else
            res.json(response);
    });
});
app.use(fileUpload());
app.post("/images/file", (0, express_validator_1.body)("datasetId").isNumeric(), function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        checkValidation(res, (0, express_validator_1.validationResult)(req));
        console.log(req.files);
        let controller = new Controller_1.Controller(req.user);
        const response = yield controller.checkInsertImagesFromFile(req.files, req.body);
        if (response instanceof Error)
            res.status(500).send({ error: response.message });
        else
            res.json(response);
    });
});
app.listen(3000, "0.0.0.0");
console.log("avviato");
