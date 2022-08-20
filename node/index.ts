import { Controller } from "./controller/Controller";
import {
  checkToken,
  verifyAndAuthenticate,
  errorHandler,
} from "./middleware/middleware";
import * as fileUpload from "express-fileupload";
import { check, body, oneOf, validationResult } from "express-validator";
import { getSystemErrorMap } from "util";

var express = require("express");
var app = express();

app.use(checkToken);
app.use(verifyAndAuthenticate);
app.use(errorHandler);

app.use(express.json());

const checkValidation = function(res, errors){
  if (!errors.isEmpty()) 
    return res.status(400).json({ errors: errors.array() });
  
}

app.get(
  "/create/dataset",
  body("name").exists(),
  body("numClasses").exists(),
  body("tags").optional().isString(),
  body("tags.*").optional().isString().withMessage("tag must be a string"),
  async function (req, res) {
    
    checkValidation(res, validationResult(req));

    console.log("Ok");
    

    let controller = new Controller(req.user);
    const dataset = await controller.checkCreateDataset(req.body);
    if (dataset instanceof Error)
      res.status(500).send({ error: dataset.message });
    else res.json(dataset);
  }
);

app.get(
  "/update/dataset",
  body("datasetId").isNumeric(),
  body("tags").optional().isString(),
  body("tags.*").optional().isString().withMessage("tag must be a string"),
  oneOf([
    body("name").exists(),
    body("numClasses").exists(),
    body("tags").exists(),
  ]),
  async function (req, res) {

    checkValidation(res, validationResult(req));

    console.log("Ok");

    console.log(req.user);
    let controller = new Controller(req.user);
    const response = await controller.checkUpdateDataset(req.body);
    if (response instanceof Error)
      res.status(500).send({ error: response.message });
    else res.send(response);
  }
);

app.get("/check/images", async function (req, res) {
  console.log(req.user);
  let controller = new Controller(req.user);
  const response = await controller.checkUserToken(req.body);
  if (response instanceof Error)
    res.status(500).send({ error: response.message });
  else res.send(response);
});

app.get(
  "/images/url",
  body("url").isURL(),
  body("databaseId").isNumeric(),
  async function (req, res) {

    checkValidation(res, validationResult(req));

    let controller = new Controller(req.user);
    const response = await controller.checkInsertImagesFromUrl(req.body);
    if (response instanceof Error)
      res.status(500).send({ error: response.message });
    else res.json(response);
  }
);


app.use(fileUpload());

app.post(
  "/images/file",
  body("datasetId").isNumeric(),
  async function (req, res) {

    checkValidation(res, validationResult(req));

    console.log(req.files);
    let controller = new Controller(req.user);
    const response = await controller.checkInsertImagesFromFile(
      req.files,
      req.body
    );
    if (response instanceof Error)
      res.status(500).send({ error: response.message });
    else res.json(response);
  }
);

app.listen(3000, "0.0.0.0");
console.log("avviato");
