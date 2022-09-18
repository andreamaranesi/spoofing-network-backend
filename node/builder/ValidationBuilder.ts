import { body, oneOf, ValidationChain } from "express-validator";
import { Middleware } from "express-validator/src/base";
import { Builder } from "./Builder";

export enum ImageFields {
  image = "images",
  imageList = "images.*",
  label = "labels",
  labelList = "labels.*",
  url = "url",
  singleImageName = "singleImageName",
}

export enum DatasetFields {
  id = "datasetId",
  tag = "tags",
  tagList = "tags.*",
  name = "name",
  classes = "numClasses",
  startDate = "startDate",
  endDate = "endDate",
  tagRelationship = "tagRelationship",
}

export enum UserFields {
  email = "email",
  token = "token",
}

export class ValidationBuilder implements Builder {
  private list: Array<ValidationChain> = [];

  reset(): void {
    this.list = [];
  }

  build(): Array<ValidationChain> {
    let finalList = this.list;
    this.reset();
    return finalList;
  }

  buildOneOf(): Middleware {
    return oneOf(this.build());
  }

  setOneOf(...fields: Array<string>): ValidationBuilder {
    for (let field of fields) {
      this.list.push(body(field).exists());
    }

    return this;
  }

  setDatasetName(optional: boolean = false): ValidationBuilder {
    let bodyChain = body(DatasetFields.name);
    if (optional) bodyChain.optional();

    this.list.push(
      bodyChain
        .isString()
        .isLength({ min: 1, max: 50 })
        .withMessage("dataset name must be <= 50 characters")
    );
    return this;
  }

  setDatasetNumClasses(optional: boolean = false): ValidationBuilder {
    let bodyChain = body(DatasetFields.classes);
    if (optional) bodyChain.optional();

    this.list.push(
      bodyChain
        .isInt({
          min: 1,
          max: 50,
        })
        .withMessage("numClasses must be between 1 and 50")
    );
    return this;
  }

  setImages(optional: boolean = false): ValidationBuilder {
    let bodyChain = body(ImageFields.image);
    if (optional) bodyChain.optional();

    this.list.push(
      bodyChain.isArray().notEmpty().withMessage("images must be a list of id")
    );

    bodyChain = body(ImageFields.imageList);
    if (optional) bodyChain.optional();

    this.list.push(
      bodyChain.isInt().withMessage("image id must be an integer")
    );
    return this;
  }

  setTags(optional: boolean = false): ValidationBuilder {
    let bodyChain = body(DatasetFields.tag);
    if (optional) bodyChain.optional();

    this.list.push(
      bodyChain
        .isArray()
        .notEmpty()
        .withMessage("tags must be a list of string")
    );

    bodyChain = body(DatasetFields.tagList);
    if (optional) bodyChain.optional();

    this.list.push(
      bodyChain
        .isString()
        .withMessage("tags must be a list of string")
        .isLength({ min: 1, max: 50 })
        .withMessage("tag name must be <= 50 characters")
    );

    return this;
  }

  setDatasetId(): ValidationBuilder {
    this.list.push(body(DatasetFields.id).isInt());
    return this;
  }

  setDatasetDate(
    startDate: boolean = true,
    optional: boolean = false
  ): ValidationBuilder {
    let bodyChain = body(
      startDate ? DatasetFields.startDate : DatasetFields.endDate
    );
    if (optional) bodyChain.optional();

    this.list.push(
      bodyChain
        .isDate({ format: "DD-MM-YYYY" })
        .withMessage("the date must be in the format DD-MM-YYYY")
    );

    return this;
  }

  setTagRelationship(optional: boolean = false): ValidationBuilder {
    let bodyChain = body(DatasetFields.tagRelationship);
    if (optional) bodyChain.optional();

    this.list.push(
      bodyChain
        .toLowerCase()
        .isIn(["or", "and"])
        .withMessage("tag relationship can be 'or','and'")
    );

    return this;
  }

  setUserEmail(optional: boolean = false): ValidationBuilder {
    let bodyChain = body(UserFields.email);
    if (optional) bodyChain.optional();

    this.list.push(bodyChain.isEmail());
    return this;
  }

  setUserToken(optional: boolean = false): ValidationBuilder {
    let bodyChain = body(UserFields.token);
    if (optional) bodyChain.optional();

    this.list.push(
      bodyChain
        .isFloat({ min: 0, max: 100000 })
        .withMessage("token amount must be between 0 and 100000")
    );
    return this;
  }

  setImageLabels(optional: boolean = false): ValidationBuilder {
    let bodyChain = body(ImageFields.label);
    if (optional) bodyChain.optional();

    this.list.push(
      bodyChain
        .isArray()
        .notEmpty()
        .withMessage("labels must be a list of string")
    );

    bodyChain = body(ImageFields.labelList);
    if (optional) bodyChain.optional();

    this.list.push(
      bodyChain
        .toLowerCase()
        .isIn(["real", "fake"])
        .withMessage("label must be real or fake")
    );

    return this;
  }

  setImageUrl(optional: boolean = false): ValidationBuilder {
    let bodyChain = body(ImageFields.url);
    if (optional) bodyChain.optional();

    this.list.push(bodyChain.isURL());
    return this;
  }

  setSingleImageName(optional: boolean = false): ValidationBuilder {
    let bodyChain = body(ImageFields.singleImageName);
    if (optional) bodyChain.optional();

    this.list.push(bodyChain.isString().exists());
    return this;
  }
}
