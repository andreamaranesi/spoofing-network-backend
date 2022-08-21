import { Dataset } from "../../models/Dataset";
import { DatasetTag } from "../../models/DatasetTag";
import { User } from "../../models/User";
import { PythonDao } from "./dao/PythonDao";
import * as fs from "fs";
import * as unzipper from "unzipper";
import * as path from "path";
import { Image } from "../../models/Images";
import * as https from "https";
import { Readable } from "stream";
import { ClientRequest } from "http";
import { resolve } from "path";
import { rejects } from "assert";
import axios from "axios";

/**
 * communicate with models
 * models are the DAO level
 */
export class Repository {
  // all actions require a default user
  private user: User;

  public pythonDao: PythonDao;

  constructor(user) {
    this.user = user;
  }

  // create a new user dataset
  async createDataset(datasetJson: any): Promise<Object> {
    let tags = datasetJson.tags;

    // get current date
    datasetJson.creationDate = new Date();
    datasetJson.userId = this.user.id;

    // create the dataset on the database
    let dataset = await Dataset.create(datasetJson);

    // create tags
    let createdTags = await this.createTags(tags, dataset.id)

    // we need the id to associate the tags
    let datasetId = dataset.id;

    return {dataset: dataset, tags: createdTags};
  }

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

  // update a user dataset
  async updateDataset(datasetJson: any, dataset: Dataset): Promise<Object> {
    dataset.set(datasetJson);

    await dataset.save();

    let createdTags: Array<DatasetTag>;

    if (datasetJson.tags !== undefined) {
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

  private fileExtension(fileName: string) {
    return fileName.split(".").pop().toLowerCase();
  }

  private isImage(fileName: string): boolean {
    if (["png", "jpg", "gif", "jpeg"].includes(this.fileExtension(fileName)))
      return true;

    return false;
  }

  // extract all images from a zip for a specific dataset
  // save them in the storage
  // save them in the database
  private async unzipImages(stream: any, datasetId: number): Promise<Object> {
    let images = {};
    let $this = this;
    await stream
      .pipe(unzipper.Parse())
      .on("entry", async function (entry) {
        const fileName = entry.path;
        const type = entry.type; // 'Directory' or 'File'
        if (type === "File" && $this.isImage(fileName)) {
          let image = await $this.createImage(fileName, datasetId);
          let outputPath = $this.getImagePath(image, datasetId, true);
          await entry.pipe(fs.createWriteStream(outputPath));
          images[fileName] = image.UUID;
        } else entry.autodrain();
      })
      .promise()
      .then(() => "done")
      .catch(() => {
        throw new Error("error while unzipping");
      });

    return images;
  }

  private async downloadImage(url: string): Promise<Buffer> {}

  // save images from an uploaded file or a .zip of images
  // download image or .zip from an URL if the URL is specified
  async saveImage(
    file: any,
    datasetId: number,
    url: string = null,
    singleImageName: string = "downloaded_file",
  ): Promise<Object> {
    let images = {};

    // download image or .zip
    if (url !== null) {
      // check URL validity
      // check if URL contains a .zip or an image
      images = await axios
        .get(url, { responseType: "stream" })
        .then(async (res) => {
          console.log(`statusCode: ${res.status}`);
          if (res.status !== 200) throw new Error("can't access the file");

          let mimetype = res.headers["content-type"];
          if (!Image.isValidMimetype(mimetype)) {
            throw new Error(
              "you must give an URL with supported images or zip file"
            );
          }

          file = res.data;

          if (mimetype.includes("image")) {
            
            let extension = mimetype.split("/").pop();
            let image = await this.createImage(
              `${singleImageName}.${extension}`,
              datasetId
            );
            await file.pipe(
              fs.createWriteStream(this.getImagePath(image, datasetId, true))
            );
            return { fileName: image.UUID };
          } else if (mimetype.includes("zip")) {
            console.log("unzipping files..");
            return await this.unzipImages(file, datasetId);
          }

          return {};
        })
        .catch((err) => {
          throw new Error(err);
        });
    } else {
      // we have uploaded a file

      if (file.mimetype.includes("image")) {
        // save normal image file
        console.log("image saving");
        let image = await this.createImage(file.name, datasetId);

        file.mv(this.getImagePath(image, datasetId, true));

        images[file.name] = image.UUID;
      } else if (file.mimetype.includes("zip")) {
        console.log("extracting from zip file");
        // save all images in the zip
        images = await this.unzipImages(Readable.from(file.data), datasetId);
      }
    }
    return images;
  }

  private getImagePath(
    image: Image,
    datasetId: number,
    createPath: boolean = false
  ): string {
    let finalPath = path.join(
      process.env.NODE_IMAGE_STORAGE,
      this.user.id.toString(),
      datasetId.toString()
    );

    if (createPath && !fs.existsSync(finalPath)) {
      fs.mkdirSync(finalPath, { recursive: true });
    }
    return path.join(
      finalPath,
      image.UUID + "." + this.fileExtension(image.fileName)
    );
  }

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

  // get user datasets
  // filtering by creation date and/or tags
  async getDatasetList(filters: any): Promise<Array<Dataset>> {
    let tags = filters.tags;

    delete filters.tags;

    const filterOption = {};

    return true;
  }

  // get one or more images inference from .h5 model
  getInference(images: Array<string>): Object {}

  // set one label for one or more images
  setLabel(images: Array<string>, labels: Array<string>): string {}

  // logically delete a dataset
  deleteDataset(id: number): boolean {}
}
