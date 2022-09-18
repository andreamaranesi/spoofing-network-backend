import { Controller } from "./controller/Controller";
import {
  checkToken,
  verifyAndAuthenticate,
  verifyTokenAmount,
  authenticationErrorHandler,
  isAdmin,
} from "./middleware/middleware";
import * as fileUpload from "express-fileupload";
import { StatusCode } from "./factory/StatusCode";
import { ConcreteErrorFactory } from "./factory/ErrorFactory";
import { DatasetFields, ValidationBuilder } from "./builder/ValidationBuilder";
import { body, oneOf, validationResult } from "express-validator";
import * as express from "express";

var app = express();
var validationBuilder = new ValidationBuilder();

app.use(checkToken);
app.use(verifyAndAuthenticate);
app.use(verifyTokenAmount);
app.use(authenticationErrorHandler);

app.get("/token", async function (req: any, res: any) {
  let controller = new Controller(req.user);
  const RESULT = controller.getUserToken();
  if (RESULT instanceof StatusCode) RESULT.send(res);
  else res.json(RESULT);
});

app.use(express.json());

// validate json data
const checkValidation = function (res, errors) {
  if (!errors.isEmpty()) return errors;

  return null;
};

// send back validation errors
const sendValidationError = function (res, errors) {
  new ConcreteErrorFactory().createBadRequest().set(errors.array()).send(res);
};

// route to create a new dataset
app.post(
  "/dataset",
  validationBuilder
    .setDatasetName()
    .setDatasetNumClasses()
    .setTags(true)
    .build(),
  async function (req: any, res: any) {
    let error = checkValidation(res, validationResult(req));
    if (error !== null) sendValidationError(res, error);
    else {
      let controller = new Controller(req.user);
      const DATASET = await controller.checkCreateDataset(req.body);
      if (DATASET instanceof StatusCode) DATASET.send(res);
      else res.status(201).json(DATASET);
    }
  }
);

// route to update a dataset
app.put(
  "/dataset",
  validationBuilder
    .setDatasetId()
    .setDatasetName(true)
    .setDatasetNumClasses(true)
    .setTags(true)
    .build(),
  validationBuilder
    .setOneOf(DatasetFields.name, DatasetFields.classes, DatasetFields.tag)
    .buildOneOf(),
  async function (req: any, res: any) {
    let error = checkValidation(res, validationResult(req));
    if (error !== null) sendValidationError(res, error);
    else {
      let controller = new Controller(req.user);
      const DATASET = await controller.checkUpdateDataset(req.body);
      if (DATASET instanceof StatusCode) DATASET.send(res);
      else res.json(DATASET);
    }
  }
);

// route to logically delete a dataset
app.delete(
  "/dataset",
  validationBuilder.setDatasetId().build(),
  async function (req: any, res: any) {
    let error = checkValidation(res, validationResult(req));
    if (error !== null) sendValidationError(res, error);
    else {
      let controller = new Controller(req.user);
      const DATASET = await controller.checkDeleteDataset(req.body);
      if (DATASET instanceof StatusCode) DATASET.send(res);
      else res.json(DATASET);
    }
  }
);

// route to filter datasets by tag and/or creation date
app.get(
  "/dataset",
  validationBuilder
    .setDatasetDate(true, true)
    .setDatasetDate(false, true)
    .setTags(true)
    .setTagRelationship(true)
    .build(),
  validationBuilder
    .setOneOf(DatasetFields.startDate, DatasetFields.endDate, DatasetFields.tag)
    .buildOneOf(),
  async function (req: any, res: any) {
    let error = checkValidation(res, validationResult(req));
    if (error !== null) sendValidationError(res, error);
    else {
      let controller = new Controller(req.user);
      const DATASET = await controller.checkGetDataset(req.body);
      if (DATASET instanceof StatusCode) DATASET.send(res);
      else res.json(DATASET);
    }
  }
);

// admin route
// update a user token amount
app.put(
  "/token",
  isAdmin,
  validationBuilder.setUserEmail().setUserToken().build(),
  async function (req: any, res: any) {
    let error = checkValidation(res, validationResult(req));
    if (error !== null) sendValidationError(res, error);
    else {
      let controller = new Controller(req.user);
      const RESULT = await controller.checkSetToken(req.body);
      if (RESULT instanceof StatusCode) RESULT.send(res);
      else res.json(RESULT);
    }
  }
);

// route to get image inferences
app.get(
  "/inference",
  validationBuilder.setImages().build(),
  async function (req: any, res: any) {
    let error = checkValidation(res, validationResult(req));
    if (error !== null) sendValidationError(res, error);
    else {
      let controller = new Controller(req.user);
      const RESULT = await controller.checkDoInference(req.body);
      if (RESULT instanceof StatusCode) RESULT.send(res);
      else res.json(RESULT);
    }
  }
);

// route to set labels of images
app.put(
  "/label",
  validationBuilder.setImages().setImageLabels().build(),
  async function (req: any, res: any) {
    let error = checkValidation(res, validationResult(req));
    if (error !== null) sendValidationError(res, error);
    else {
      let controller = new Controller(req.user);
      const RESULT = await controller.checkSetLabel(req.body);
      if (RESULT instanceof StatusCode) RESULT.send(res);
      else res.json(RESULT);
    }
  }
);

// route to insert images to a dataset by an url
// url must be a supported image or a .zip of supported images
app.post(
  "/images/url",
  validationBuilder
    .setImageUrl()
    .setDatasetId()
    .setSingleImageName(true)
    .build(),
  async function (req: any, res: any) {
    let error = checkValidation(res, validationResult(req));
    if (error !== null) sendValidationError(res, error);
    else {
      let controller = new Controller(req.user);
      const RESULT = await controller.checkInsertImagesFromUrl(req.body);
      if (RESULT instanceof StatusCode) RESULT.send(res);
      else res.json(RESULT);
    }
  }
);

app.use(fileUpload());

// route to insert images to a dataset by a form
// file must be a supported image or a .zip of supported images
app.post(
  "/images/file",
  validationBuilder.setDatasetId().build(),
  async function (req: any, res: any) {
    let error = checkValidation(res, validationResult(req));
    if (error !== null) sendValidationError(res, error);
    else {
      let controller = new Controller(req.user);
      const RESULT = await controller.checkInsertImagesFromFile(
        req.files,
        req.body
      );
      if (RESULT instanceof StatusCode) RESULT.send(res);
      else res.json(RESULT);
    }
  }
);

const NODE_PORT = process.env.NODE_PORT || 3000;
const NODE_INTERFACE = process.env.NODE_INTERFACE || "0.0.0.0";

app.listen(<number>NODE_PORT, NODE_INTERFACE);

console.log("node started");
