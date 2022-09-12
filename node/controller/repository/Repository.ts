import { Dataset } from "../../models/Dataset";
import { DatasetTag } from "../../models/DatasetTag";
import { User } from "../../models/User";
import * as fs from "fs";
import * as unzipper from "unzipper";
import * as path from "path";
import { Image } from "../../models/Images";
import { Readable } from "stream";
import * as moment from "moment";
import axios from "axios";
import { FindOptions, Includeable, Op } from "sequelize";
import { BadRequestError, ForbiddenError, ServerError } from "../../factory/StatusCode";

/**
 * communicates with models
 * models are the DAO level
 */
export class Repository {
  // all actions require a default user
  private user: User;

  constructor(user) {
    this.user = user;
  }

  // creates a new user dataset
  // returns the new dataset and created tags
  async createDataset(datasetJson: any): Promise<Object> {
    let tags = datasetJson.tags;

    // gets current date
    datasetJson.creationDate = new Date();

    // adds user id
    datasetJson.userId = this.user.id;

    // creates the dataset on the database
    let dataset = await Dataset.create(datasetJson);

    // creates tags
    // removes duplicated tags
    let createdTags = await this.createTags([...new Set(tags)], dataset.id);

    return { dataset: dataset, tags: createdTags };
  }

  // creates new tags
  // saves only not empty tags
  // returns the list of created tags
  private async createTags(
    tags: Array<any>,
    datasetId: number
  ): Promise<Array<DatasetTag>> {
    let list: Array<DatasetTag> = [];
    if (tags !== undefined)
      for (let tag of tags) {
        tag = tag as string;
        if (tag != "") {
          tag = { tag: tag, datasetId: datasetId };

          list.push(
            (await DatasetTag.findOrCreate({ where: tag, defaults: tag }))[0]
          );
        }
      }

    return list;
  }

  // updates a user dataset
  // returns the dataset and related tags
  async updateDataset(datasetJson: any, dataset: Dataset): Promise<Object> {
    // updates dataset instance
    await dataset.set(datasetJson).save();

    let createdTags: Array<DatasetTag>;

    // updates tags if not undefined
    // deletes tags if new tags have been defined
    if (datasetJson.tags !== undefined) {
      // remove duplicated entries
      datasetJson.tags = [...new Set(datasetJson.tags)];

      await DatasetTag.destroy({ where: { datasetId: dataset.id } });
      createdTags = await this.createTags(datasetJson.tags, dataset.id);
    } else {
      createdTags = await DatasetTag.findAll({
        where: {
          datasetId: dataset.id,
        },
      });
    }

    return { dataset: dataset, tags: createdTags };
  }

  // checks if an image is supported
  private isImage(fileName: string): boolean {
    let mimetype = "image/" + Image.fileExtension(fileName);
    if (Image.isValidMimetype(mimetype)) return true;

    return false;
  }

  // updates the user token amount subtracting a cost
  // checks if the user has the available amount
  private async updateUserTokenByCost(user: User, cost: number): Promise<void> {
    this.checkUserToken(user, cost);

    try {
      console.log("sottraggo" + (this.user.token - cost));
      await this.user.set({ token: this.user.token - cost }).save();
    } catch (err) {
      throw new ServerError().setUpdatingToken();
    }
  }

  // extracts all images from a zip for a specific dataset
  // saves them in the storage
  // saves them in the database
  // returns the list of saved images
  private async unzipImages(
    stream: any,
    datasetId: number,
    cost: number
  ): Promise<Object> {
    let bufferList = [];

    // from a stream retrieves all the file entries
    // checks if the file entry is a supported image
    // saves the buffer in the storage
    // saves the image in the database
    return await new Promise((resolve, reject) => {
      stream
        .pipe(unzipper.Parse())
        .on("entry", async (entry) => {
          const FILE_NAME = entry.path;
          const TYPE = entry.type; // 'Directory' or 'File'
          if (TYPE === "File" && this.isImage(FILE_NAME)) {
            //save the buffer to a temporary list
            bufferList.push([await entry.buffer(), entry]);
          } else entry.autodrain();
        })
        .on("close", async () => {
          // the final cost to upload the valid images
          let finalCost = cost * bufferList.length;

          // updates the user cost
          await this.updateUserTokenByCost(this.user, finalCost);

          let images = {};

          // for each file, it will be saved on the database and the storage
          for (let buffer of bufferList) {
            let entry = buffer[1];

            let fileName = entry.path;
            let image = await this.createImage(fileName, datasetId);
            let outputPath = this.getImagePath(image, true);

            fs.writeFileSync(outputPath, buffer[0]);

            images[fileName] = image.id;
          }
          resolve(images);
        })
        .on("error", (error) => reject(new ServerError().set(error.message)));
    });
  }

  // checks if the user token amount is >= requested amount
  checkUserToken(user: User, amount: number): void {
    if (user.token < amount)
      throw new ForbiddenError().setNeedMoreToken(amount);
  }

  // saves images from an uploaded file or a .zip of images
  // downloads image or .zip from an URL if the URL is specified
  // returns a list of filenames with their generated ids
  async saveImage(
    file: any,
    datasetId: number,
    cost: number,
    url: string = null,
    singleImageName: string = "downloaded_file"
  ): Promise<Object> {
    let images = {};

    // will download image or .zip
    if (url !== null) {
      // check URL validity
      // check if URL contains a .zip or an image
      images = await axios
        .get(url, { responseType: "stream" })
        .then(async (res) => {
          console.log(`statusCode: ${res.status}`);
          if (res.status !== 200 && res.status !== 201)
            throw new ForbiddenError().setInvalidUrlResponse(url);

          let mimetype = res.headers["content-type"];
          if (!Image.isValidMimetype(mimetype)) {
            throw new BadRequestError().setImageZipAbsent();
          }

          // the file stream
          file = res.data;

          // if the file is an image
          // download and write the image on the storage if user tokens are sufficient
          if (mimetype.includes("image")) {
            await this.updateUserTokenByCost(this.user, cost);

            let extension = mimetype.split("/").pop();

            let imageJson = {};
            let fileName = `${singleImageName}.${extension}`;

            let image = await this.createImage(fileName, datasetId);
            await file.pipe(
              fs.createWriteStream(this.getImagePath(image, true))
            );
            imageJson[fileName] = image.id;
            return imageJson;
          }
          // if the file is a .zip
          else if (mimetype.includes("zip")) {
            // will write the .zip images on the storage if the user token amount is sufficient
            console.log("unzipping files..");
            return await this.unzipImages(file, datasetId, cost);
          }

          return {};
        })
        .catch((error) => {
          // if it is an axios error
          if (error.response !== undefined) {
            throw new ForbiddenError().setUnreadableUrl(url);
          }
          throw error;
        });
    } else {
      // user uploaded a file

      // if the file is an .image, will move it on the storage
      // checks user token amount
      if (file.mimetype.includes("image")) {
        console.log("image saving");

        await this.updateUserTokenByCost(this.user, cost);

        let image = await this.createImage(file.name, datasetId);

        file.mv(this.getImagePath(image, true));

        images[file.name] = image.id;
      }
      // if the file is an .zip, will extract valid images
      else if (file.mimetype.includes("zip")) {
        console.log("extracting from zip file");

        images = await this.unzipImages(
          Readable.from(file.data),
          datasetId,
          cost
        );
      }
    }
    return images;
  }

  // returns image path of a saved image
  // checks if the path is for node backend or python backend
  private getImagePath(
    image: Image,
    createPath: boolean = false,
    python: boolean = false
  ): string {
    // returns the directory path
    let finalPath = path.join(
      python
        ? process.env.PYTHON_IMAGE_STORAGE
        : process.env.NODE_IMAGE_STORAGE,
      this.user.id.toString(),
      image.datasetId.toString()
    );

    // if createPath is true creates the directory where to store images
    if (createPath && !fs.existsSync(finalPath)) {
      fs.mkdirSync(finalPath, { recursive: true });
    }

    return path.join(
      finalPath,
      image.id + "." + Image.fileExtension(image.fileName)
    );
  }

  // saves the image on database
  // returns the created image
  private async createImage(
    fileName: string,
    datasetId: number
  ): Promise<Image> {
    let image = await Image.create({
      fileName: fileName,
      datasetId: datasetId,
    });
    return image;
  }

  // gets user datasets
  // filters by creation date and/or tags
  // returns the list of datasets found
  async getDatasetList(filters: any): Promise<Array<Dataset>> {
    let tags = filters.tags;
    let date = [filters.startDate, filters.endDate];
    let tagRelationship = filters.tagRelationship ?? "or";

    // returns filter operator and value
    const checkStartDate = (arg: Array<string>): [any, any] => {
      // if date is not a filter
      // returns null
      if (arg.every((x) => x === undefined)) return null;

      // formats date string
      let formattedArg: Array<string> = arg.map((x) => {
        if (x !== undefined) return moment(x, ["DD-MM-YYYY"]).format();
        else return x;
      });

      // checks if one of the date is invalid
      const SOME_INVALID = formattedArg.some((x) => x === undefined);

      // since there is only endDate, will filter <= endDate
      if (formattedArg[0] === undefined) return [Op.lte, formattedArg[1]];

      // since there is only startDate, will filter >= startDate
      if (SOME_INVALID) return [Op.gte, formattedArg[0]];

      // since there are both dates, will filter startDate <= x <= endDate
      return [Op.between, formattedArg];
    };

    let dateFilter = checkStartDate(date);

    let includeOptions: Array<Includeable> = [
      {
        model: Image,
        required: false,
      },
    ];

    if (tags !== undefined) {
      // to remove duplicated entries
      tags = [...new Set(tags)];

      includeOptions.push({
        model: DatasetTag,
        required: true,
        where: {
          tag: {
            [Op.in]: tags,
          },
        },
      });
    }

    // final Sequelize filtering options
    const FILTER_OPTIONS: FindOptions = {
      where: {
        userId: this.user.id,
      },
      include: includeOptions,
    };

    if (dateFilter !== null) {
      FILTER_OPTIONS.where["creationDate"] = {
        [dateFilter[0]]: dateFilter[1],
      };
    }

    let datasets = await Dataset.scope("visible").findAll(FILTER_OPTIONS);

    // if tagRelationship = and
    // filter datasets that have not the list of the given distinct tags
    if (tags !== undefined && tagRelationship === "and")
      return datasets.filter(
        (dataset) => dataset["DatasetTags"].length === tags.length
      );

    return datasets;
  }

  // gets one or more image inference results from .h5 model
  // if some images can't be inferred, chargebacks the cost
  // returns json of predictions and metrics
  async getInference(images: Array<Image>, cost: number): Promise<Object> {
    await this.updateUserTokenByCost(this.user, cost * images.length);

    // create JSON for python backend
    const createJson = () => {
      const BODY = { images: [] };
      for (let image of images) {
        BODY.images.push({
          id: image.id,
          label: image.label ?? "",
          path: this.getImagePath(image, false, true),
        });
      }
      return BODY;
    };

    return await axios
      .get(
        `http://${process.env.PYTHON_BACKEND}:${process.env.PYTHON_BACKEND_PORT}/predict`,
        {
          data: createJson(),
        }
      )
      .then(async (res) => {
        let data = res.data;

        let invalidImages = data.invalidPredictions;

        // chargeback if there are invalid images
        // for example no human faces or corrupted images
        if (invalidImages.length > 0) {
          // updates user data from database
          // the request maybe was too long and the user did other requests
          this.user = await User.findByPk(this.user.id);

          // update user token amount
          await this.updateUserToken(
            this.user,
            this.user.token + cost * invalidImages.length
          );

          res.data["updatedToken"] = this.user.token;
        }

        let inferences = data.imagePredictions;

        // saves inferences on database
        for (let inference of inferences) {
          let image = await Image.findByPk(inference.id);
          let prediction = inference.prediction;
          if (image !== null) await image.set({ inference: prediction }).save();
        }

        return res.data;
      })
      .catch((err) => {
        throw new ServerError().set(err.message);
      });
  }

  // sets labels for one or more images
  // returns the list of updated images
  async setLabel(
    images: Array<Image>,
    labels: Array<string>,
    cost: number
  ): Promise<Array<Image>> {
    let updatedImages: Array<Image> = [];

    // updates user token amount for each labeled image
    for (let i = 0; i < images.length; i++) {
      try {
        await this.updateUserTokenByCost(this.user, cost);
      } catch {
        throw new ServerError().setAlreadyUpdatedLabels(updatedImages);
      }

      await images[i].set({ label: labels[i] }).save();
      updatedImages.push(images[i]);
    }

    return updatedImages;
  }

  // logically deletes a dataset
  // returns the deleted dataset
  async deleteDataset(dataset: Dataset): Promise<Object> {
    await dataset.set({ isDeleted: true }).save();

    return { deletedDataset: dataset };
  }

  // updates the token amount of a specified user
  // returns the updated user
  async updateUserToken(user: User, token: number): Promise<Object> {
    await user.set({ token: token }).save();

    return { updatedUser: user };
  }
}
