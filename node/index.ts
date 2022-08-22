import { Controller } from "./controller/Controller";
import {
  checkToken,
  verifyAndAuthenticate,
  verifyTokenAmount,
  errorHandler,
  isAdmin,
} from "./middleware/middleware";
import * as fileUpload from "express-fileupload";
import { body, oneOf, validationResult } from "express-validator";

var express = require("express");
var app = express();

app.use(checkToken);
app.use(verifyAndAuthenticate);
app.use(verifyTokenAmount);
app.use(errorHandler);

app.get("/get/token", async function (req, res) {
  let controller = new Controller(req.user);
  const RESULT = controller.getUserToken();
  if (RESULT instanceof Error) res.status(500).send({ error: RESULT.message });
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
  res.status(500).send({ error: errors.array() });
};

const validateListImages = [
  body("images")
    .isArray()
    .notEmpty()
    .withMessage("images must be a list of id"),
  body("images.*").isInt().withMessage("image id must be an integer"),
];

const validateTags = [
  body("tags")
    .optional()
    .isArray()
    .notEmpty()
    .withMessage("tags must be a list of string"),
  body("tags.*")
    .optional()
    .isString()
    .withMessage("tag must be a string")
    .isLength({ max: 50 })
    .withMessage("tag name must be <= 50 characters"),
];

// route to create a new dataset
app.get(
  "/create/dataset",
  body("name")
    .exists()
    .isLength({ max: 50 })
    .withMessage("dataset name must be <= 50 characters"),
  body("numClasses").exists().isInt(),
  validateTags,
  async function (req, res) {
    let error = checkValidation(res, validationResult(req));
    if (error !== null) sendValidationError(res, error);
    else {
      checkValidation(res, validationResult(req));

      let controller = new Controller(req.user);
      const DATASET = await controller.checkCreateDataset(req.body);
      if (DATASET instanceof Error)
        res.status(500).send({ error: DATASET.message });
      else res.json(DATASET);
    }
  }
);

// route to update a dataset
app.get(
  "/update/dataset",
  body("datasetId").isInt(),
  validateTags,
  oneOf([
    body("name").exists(),
    body("numClasses").exists().isInt(),
    body("tags").exists(),
  ]),
  async function (req, res) {
    let error = checkValidation(res, validationResult(req));
    if (error !== null) sendValidationError(res, error);
    else {
      let controller = new Controller(req.user);
      const DATASET = await controller.checkUpdateDataset(req.body);
      if (DATASET instanceof Error)
        res.status(500).send({ error: DATASET.message });
      else res.json(DATASET);
    }
  }
);

// route to logically delete a dataset
app.get(
  "/delete/dataset",
  body("datasetId").isInt(),
  async function (req, res) {
    let error = checkValidation(res, validationResult(req));
    if (error !== null) sendValidationError(res, error);
    else {
      let controller = new Controller(req.user);
      const DATASET = await controller.checkDeleteDataset(req.body);
      if (DATASET instanceof Error)
        res.status(500).send({ error: DATASET.message });
      else res.json(DATASET);
    }
  }
);

const EXPRESS_DATE_MESSAGE = "Date must be in the format DD-MM-YYYY";

// route to filter datasets by tag and/or creation date
app.get(
  "/get/dataset",
  body("startDate")
    .optional()
    .isDate({ format: "DD-MM-YYYY" })
    .withMessage(EXPRESS_DATE_MESSAGE),
  body("endDate")
    .optional()
    .isDate({ format: "DD-MM-YYYY" })
    .withMessage(EXPRESS_DATE_MESSAGE),
  body("tagRelationship")
    .optional()
    .toLowerCase()
    .isIn(["and", "or"])
    .withMessage("tag relationship can be 'or','and'"),
  validateTags,
  oneOf([
    body("startDate").exists(),
    body("endDate").exists(),
    body("tags").exists(),
  ]),
  async function (req, res) {
    let error = checkValidation(res, validationResult(req));
    if (error !== null) sendValidationError(res, error);
    else {
      let controller = new Controller(req.user);
      const DATASET = await controller.checkGetDataset(req.body);
      if (DATASET instanceof Error)
        res.status(500).send({ error: DATASET.message });
      else res.json(DATASET);
    }
  }
);

// admin route
// update a user token amount
app.get(
  "/set/token",
  isAdmin,
  body("email").isEmail(),
  body("token").isFloat({max:100000}).withMessage("token amount must be less than 100000"),
  async function (req, res) {
    let error = checkValidation(res, validationResult(req));
    if (error !== null) sendValidationError(res, error);
    else {
      let controller = new Controller(req.user);
      const RESULT = await controller.checkSetToken(req.body);
      if (RESULT instanceof Error)
        res.status(500).send({ error: RESULT.message });
      else res.json(RESULT);
    }
  }
);

// route to get image inferences
app.get("/get/inference", validateListImages, async function (req, res) {
  let error = checkValidation(res, validationResult(req));
  if (error !== null) sendValidationError(res, error);
  else {
    let controller = new Controller(req.user);
    const RESULT = await controller.checkDoInference(req.body);
    if (RESULT instanceof Error)
      res.status(500).send({ error: RESULT.message });
    else res.json(RESULT);
  }
});

// route to set labels of images
app.get(
  "/set/label",
  validateListImages,
  body("labels").isArray(),
  body("labels.*")
    .toLowerCase()
    .isIn(["real", "fake"])
    .withMessage("label must be real or fake"),
  async function (req, res) {
    let error = checkValidation(res, validationResult(req));
    if (error !== null) sendValidationError(res, error);
    else {
      let controller = new Controller(req.user);
      const RESULT = await controller.checkSetLabel(req.body);
      if (RESULT instanceof Error)
        res.status(500).send({ error: RESULT.message });
      else res.json(RESULT);
    }
  }
);

// route to insert images to a dataset by an url
// url must be a supported image or a .zip of supported images
app.get(
  "/images/url",
  body("url").isURL(),
  body("datasetId").isInt(),
  body("singleImageName").optional().isString().exists(),
  async function (req, res) {
    let error = checkValidation(res, validationResult(req));
    if (error !== null) sendValidationError(res, error);
    else {
      let controller = new Controller(req.user);
      const RESULT = await controller.checkInsertImagesFromUrl(req.body);
      if (RESULT instanceof Error)
        res.status(500).send({ error: RESULT.message });
      else res.json(RESULT);
    }
  }
);

app.use(fileUpload());

// route to insert images to a dataset by a form
// file must be a supported image or a .zip of supported images
app.post(
  "/images/file",
  body("datasetId").isInt(),
  async function (req, res) {
    let error = checkValidation(res, validationResult(req));
    if (error !== null) sendValidationError(res, error);
    else {
      let controller = new Controller(req.user);
      const RESULT = await controller.checkInsertImagesFromFile(
        req.files,
        req.body
      );
      if (RESULT instanceof Error)
        res.status(500).send({ error: RESULT.message });
      else res.json(RESULT);
    }
  }
);

app.listen(
  process.env.NODE_PORT || 3000,
  process.env.NODE_INTERFACE || "0.0.0.0"
);

console.log("node started");
