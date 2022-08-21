import { Dataset } from "../models/Dataset";
import { DatasetTag } from "../models/DatasetTag";
import { User } from "../models/User";
import { Repository } from "./repository/Repository";
import { Op, Sequelize } from "sequelize";
import { Image } from "../models/Images";

/**
 * manage and check user routes
 */
export class Controller {
  // controller interacts with the repository for CRUD operations
  private repository: Repository;
  private user: User;

  // instantiate the repository
  constructor(user: User) {
    this.repository = new Repository(user);
    this.user = user;
  }

  // take a list of functions to be executed as a validation pipeline
  private validatonPipeline(...functions: Array<Function>): Function {
    return (...argument: Array<any>) =>
      functions.reduce(
        (previous, next: any, currentIndex) => next(argument[currentIndex]),
        undefined
      );
  }

  private showNotAuthorizedItems(
    list: any,
    originalList: Array<any>,
    key: string,
    modelName: string
  ): void {
    let ids: Array<any> = [];
    for (let result of list) {
      ids.push(result[key]);
    }

    let difference = originalList.filter((id) => !ids.includes(id));

    throw new Error(difference.join(",") + ` id(s) are not accessible`);
  }

  // request must contains a list of dataset ids
  // check if dataset ids are owned by the authenticated user
  async checkUserDataset(
    datasetId: number,
    userId: number
  ): Promise<Array<Dataset>> {
    let results = await Dataset.findAll({
      where: {
        [Op.and]: [
          {
            id: {
              [Op.eq]: datasetId,
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
  }

  // dataset_json must contains all the required dataset attributes
  // return a new Dataset instance
  async checkCreateDataset(datasetJson: any): Promise<Object | Error> {
    try {
      return await this.repository.createDataset(datasetJson);
    } catch (error) {
      return new Error(error.message);
    }
  }

  // dataset_json must contains the dataset_id key
  // check if dataset id is owned by the authenticated user
  async checkUpdateDataset(datasetJson: any): Promise<Object | Error> {
    try {
      let dataset = await this.checkUserDataset(
        datasetJson.datasetId,
        this.user.id
      );

      delete datasetJson.datasetId;

      return await this.repository.updateDataset(datasetJson, dataset[0]);
    } catch (error) {
      return new Error(error.message);
    }
  }

  // validate filter request
  // return a list of Dataset filtering by date of creation and/or associated tags
  async checkGetDataset(filters: any): Promise<Array<Object> | Error> {
    try {
      let filterList = ["creationDate", "tags"];
      let filterKeys = Object.keys(filters);

      // remove invalid json keys
      // the user can add other json properties, but they will deleted from the request
      for (let invalidKey of filterKeys.filter(
        (key) => !filterList.includes(key)
      )) {
        delete filters[invalidKey];
      }

      return await this.repository.getDatasetList(filters);
    } catch (error) {
      return new Error(error.message);
    }
  }

  // request must contains a list of uuids of images
  // check if images are owned by the authenticated user
  async checkUserImages(
    imageIds: Array<any>,
    userId: number
  ): Promise<Array<Image>> {
    let datasets = await Dataset.findAll({
      attributes: ["id"],
      include: {
        model: Image,
        required: true,
        where: {
          UUID: {
            [Op.in]: imageIds,
          },
        },
      },
      where: {
        userId: userId,
      },
    });


    let images: Array<Image> = [];
    for (let dataset of datasets) {
      for (let image of dataset["Images"]) {
        images.push(image);
      }
    }

    if (images.length !== imageIds.length)
      this.showNotAuthorizedItems(images, imageIds, "UUID", "images");

    return images;
  }

  // check if user tokens are >= amount
  async checkUserToken(amount: any): Promise<boolean | Error> {
    try {
      await this.checkUserImages(amount.images, this.user.id);
    } catch (err) {
      return new Error(err.message);
    }
  }

  // request must contains a list of uuids of images
  // check if images are owned by the authenticated user
  // return the results of the inference done by the CNN model
  checkDoInference(request: Object): string {}

  // request must contains a list of uuids of images and associated labels
  // check if images are owned by the authenticated user
  checkSetLabel(request: Object): Array<Dataset> {}

  // check if images are owned by the authenticated user
  checkDeleteDataset(datasetId: number): boolean {}

  // file is an image or a .zip of images
  // check if dataset id is owned by the authenticated user
  // insert images in that dataset
  async checkInsertImagesFromFile(
    file: any,
    request: any
  ): Promise<Object | Error> {
    if (file.images === undefined)
      return new Error("an image or .zip must be given");


    await this.checkUserDataset(request.datasetId, this.user.id);

    file = file.images;
    let mimetype = file.mimetype;

    const isValidFile = Image.isValidMimetype(mimetype);

    if (isValidFile) {
      let uuids = await this.repository.saveImage(file, request.datasetId);
      if (Object.keys(uuids).length === 0)
        return new Error("no images was valid");
      return uuids;
    }

    return new Error("file must be an image or a .zip of images");
    //return await this.repository.createDataset(datasetJson);
  }

  // request must contains a public url of an image or a .zip file, and the related dataset id
  // check if images are owned by the authenticated user
  // insert images in that dataset
  async checkInsertImagesFromUrl(request: any): Promise<any> {
    await this.checkUserDataset(request.datasetId, this.user.id);

    return await this.repository.saveImage(
      null,
      request.datasetId,
      request.url,
      request.singleImageName
    );
  }
}
