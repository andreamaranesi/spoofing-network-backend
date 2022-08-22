import { DataTypes, Model } from "sequelize";
import { DatabaseSingleton } from "../controller/repository/DatabaseSingleton";
import { User } from "./User";

/**
 * Dataset Model
 */
export class Dataset extends Model {
  declare id: number; // this is ok! The 'declare' keyword ensures this field will not be emitted by TypeScript.
  declare name: string;
  declare classes: number;
  declare creationDate: Date;
  declare userId: number;

  // for logical deletion
  declare isDeleted: boolean;
}

let sequelize = DatabaseSingleton.getInstance();

// relationship with database
Dataset.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      validate: {
        isNumeric: {
          msg: "dataset id must be a number",
        },
      },
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "datasetName",
      validate: {
        notEmpty: { msg: "dataset name must be not empty" },
      },
    },
    numClasses: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "classes",
      validate: {
        min: {
          args: [1],
          msg: "number of classes must be >= 1",
        },
        isNumeric: {
          msg: "number of classes must be a number",
        },
      },
    },
    creationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: "id",
      },
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Dataset",
    tableName: "dataset",
    timestamps: false,
    scopes: {
      visible: {
        where: {
          isDeleted: false,
        },
      },
    },
  }
);
