import { DataTypes, Model } from "sequelize";
import { DatabaseSingleton } from "../db/DatabaseSingleton";
import { Dataset } from "./Dataset";

/*
  Tag Model
*/
export class DatasetTag extends Model {
  declare datasetId: number;
  declare tag: string;
}

let sequelize = DatabaseSingleton.getInstance().sequelize;

// relationship with database
DatasetTag.init(
  {
    datasetId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: Dataset,
        key: "id",
      },
    },
    tag: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      validate: {
        len: {
          args: [0, 50],
          msg: "tag must be less than 50 characters",
        },
      },
    },
  },
  {
    sequelize,
    timestamps: false,
    modelName: "DatasetTag",
    tableName: "datasetTag",
    defaultScope: {
      attributes: {
        exclude: ["DatasetId"],
      },
    },
  }
);

// one to many relationship
Dataset.hasMany(DatasetTag, {
  foreignKey: "datasetId", as: "datasetTags"
});

DatasetTag.belongsTo(Dataset);
