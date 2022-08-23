import { Dataset } from "../models/Dataset";
import { User } from "../models/User";
import { Repository } from "./repository/Repository";
import { Image } from "../models/Images";
import { FindOptions, Includeable, Op } from "sequelize";

/**
 * manages and checks user routes
 */
export class Controller {
  // controller interacts with the repository for CRUD operations
  private repository: Repository;
  private user: User;

  // instantiates the repository
  constructor(user: User) {
    this.repository = new Repository(user);
    this.user = user;
  }

  // checks if a list contains duplicated entries
  private checkDuplicateEntries(list: Array<any>): boolean {
    if ([...new Set(list)].length !== list.length) return true;
    return false;
  }

  // from a list of Models and an original list
  // checks which model attributes are not in the original list
  private showNotAuthorizedItems(
    list: any,
    originalList: Array<any>,
    key: string
  ): void {
    let ids: Array<any> = [];
    for (let result of list) {
      ids.push(result[key]);
    }

    let difference = originalList.filter((id) => !ids.includes(id));

    throw new Error(difference.join(",") + ` id(s) are not accessible`);
  }

  // checks if dataset id is owned by the authenticated user
  // returns the datasets found
  async checkUserDataset(datasetId: number): Promise<Array<Dataset>> {
    let results = await Dataset.scope("visible").findAll({
      where: {
        id: datasetId,
        userId: this.user.id,
      },
    });

    // if the dataset wasn't found
    if (results.length === 0)
      this.showNotAuthorizedItems(results, [datasetId], "id");

    return results;
  }

  // checks if exists another dataset with the same name
  private async checkDatasetWithSameName(
    name: string,
    datasetId: number = null
  ): Promise<void> {
    if (name !== undefined) {
      // final Sequelize filtering options
      const FILTER_OPTIONS: FindOptions = {
        where: {
          name: name,
          userId: this.user.id,
        },
      };

      // checks that the dataset is not itself
      if (datasetId !== null) {
        FILTER_OPTIONS["where"]["id"] = {
          [Op.ne]: datasetId,
        };
      }

      let dataset = await Dataset.scope("visible").findOne(FILTER_OPTIONS);

      if (dataset !== null)
        throw new Error(`there is already a dataset with name ${name}`);
    }
  }
  // returns a new dataset instance
  async checkCreateDataset(datasetJson: any): Promise<Object | Error> {
    try {
      await this.checkDatasetWithSameName(datasetJson.name);
      return await this.repository.createDataset(datasetJson);
    } catch (error) {
      return new Error(error.message);
    }
  }

  // checks if dataset id is owned by the authenticated user
  // updates the dataset
  // returns the updated dataset
  async checkUpdateDataset(datasetJson: any): Promise<Object | Error> {
    try {
      await this.checkDatasetWithSameName(datasetJson.name, datasetJson.datasetId);

      let dataset = await this.checkUserDataset(datasetJson.datasetId);

      delete datasetJson.datasetId;

      return await this.repository.updateDataset(datasetJson, dataset[0]);
    } catch (error) {
      return new Error(error.message);
    }
  }

  // checks if dataset id is owned by the authenticated user
  // returns a list of Dataset filtering by date of creation and/or associated tags
  async checkGetDataset(filters: any): Promise<Array<Object> | Error> {
    try {
      return await this.repository.getDatasetList(filters);
    } catch (error) {
      return new Error(error.message);
    }
  }

  // checks if images are owned by the authenticated user
  // returns the list of images found
  async checkUserImages(imageIds: Array<any>): Promise<Array<Image>> {
    let datasets = await Dataset.scope("visible").findAll({
      attributes: ["id"],
      include: {
        model: Image,
        required: true,
        where: {
          id: {
            [Op.in]: imageIds,
          },
        },
      },
      where: {
        userId: this.user.id,
      },
    });

    // retrieves images inside the dataset array
    let images: Array<Image> = [];
    for (let dataset of datasets) {
      for (let image of dataset["Images"]) {
        images.push(image);
      }
    }

    // if images found are less than provided list
    if (images.length !== imageIds.length)
      this.showNotAuthorizedItems(images, imageIds, "id");

    return images;
  }

  // returns the current user token amount
  getUserToken(): Object {
    return { token: this.user.token };
  }

  // request must contains a list of ids of images
  // checks if images are owned by the authenticated user
  // returns the results of the inference done by the CNN model
  async checkDoInference(request: any): Promise<Object | Error> {
    try {
      if (this.checkDuplicateEntries(request.images))
        return new Error("there are duplicated entries on images");

      let images = await this.checkUserImages(request.images);

      // if user gives one image
      // checks if the image has already an inference
      if (images.length === 1) {
        if (images[0].inference !== null) {
          return new Error(
            `image id ${images[0].id} has already an inference: ${images[0].inference}`
          );
        }
      }

      const COST = parseFloat(process.env.INFERENCE_COST);

      return await this.repository.getInference(images, COST);
      
    } catch (err) {
      return new Error(err.message);
    }
  }

  // request must contains a list of ids of images and associated labels
  // checks if images are owned by the authenticated user
  // sets labels (real, fake) to the list of images
  async checkSetLabel(request: any): Promise<Array<Object> | Error> {
    try {
      if (this.checkDuplicateEntries(request.images))
        return new Error("there are duplicated entries on images");

      // the length of the labels must be equal to that of the images
      if (request.images.length !== request.labels.length)
        return new Error("labels length must be equal to images length");

      let images = await this.checkUserImages(request.images);

      const COST = parseFloat(process.env.LABEL_COST);

      this.repository.checkUserToken(this.user, COST * images.length);

      return await this.repository.setLabel(images, request.labels, COST);
    } catch (err) {
      return new Error(err.message);
    }
  }

  // checks if dataset is owned by the authenticated user
  // deletes (logically) the dataset
  async checkDeleteDataset(request: any): Promise<Object | Error> {
    try {
      let dataset = await this.checkUserDataset(request.datasetId);

      return await this.repository.deleteDataset(dataset[0]);
    } catch (err) {
      return new Error(err.message);
    }
  }

  // updates a specified user token
  async checkSetToken(request: any): Promise<Object | Error> {
    try {
      let userToUpdate = await User.findOne({
        where: {
          email: request.email,
        },
      });

      if (userToUpdate === null)
        throw new Error(`user with email ${request.email} doesn't exist`);

      return await this.repository.updateUserToken(userToUpdate, request.token);
    } catch (err) {
      return new Error(err.message);
    }
  }

  // file is an image or a .zip of images
  // checks if dataset id is owned by the authenticated user
  // inserts images in the dataset
  async checkInsertImagesFromFile(
    file: any,
    request: any
  ): Promise<Object | Error> {
    try {
      if (file === null || file.images === undefined)
        return new Error("an image or .zip must be provided");

      await this.checkUserDataset(request.datasetId);

      file = file.images;

      const IS_VALID_FILE = Image.isValidMimetype(file.mimetype);

      let cost = parseFloat(process.env.INSERT_IMAGE_COST);

      if (IS_VALID_FILE) {
        let ids = await this.repository.saveImage(
          file,
          request.datasetId,
          cost
        );
        if (Object.keys(ids).length === 0)
          return new Error("no images was valid");
        return ids;
      }

      return new Error("file must be an image or a .zip of images");
    } catch (err) {
      return new Error(err.message);
    }
  }

  // request must contains a public url of an image or a .zip file, and the related dataset id
  // checks if dataset id is owned by the authenticated user
  // inserts images in the dataset
  async checkInsertImagesFromUrl(request: any): Promise<any> {
    try {
      await this.checkUserDataset(request.datasetId);

      let cost = parseFloat(process.env.INSERT_IMAGE_COST);

      return await this.repository.saveImage(
        null,
        request.datasetId,
        cost,
        request.url,
        request.singleImageName
      );
    } catch (err) {
      return new Error(err.message);
    }
  }
}
