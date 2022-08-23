"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dataset = void 0;
const sequelize_1 = require("sequelize");
const DatabaseSingleton_1 = require("../db/DatabaseSingleton");
const User_1 = require("./User");
/**
 * Dataset Model
 */
class Dataset extends sequelize_1.Model {
}
exports.Dataset = Dataset;
let sequelize = DatabaseSingleton_1.DatabaseSingleton.getInstance().sequelize;
// relationship with database
Dataset.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        validate: {
            isNumeric: {
                msg: "dataset id must be a number",
            },
        },
    },
    name: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        field: "datasetName",
        validate: {
            notEmpty: { msg: "dataset name must be not empty" },
            len: {
                args: [0, 50],
                msg: "dataset name must be less than 50 characters",
            },
        },
    },
    numClasses: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        field: "classes",
        validate: {
            min: {
                args: [1],
                msg: "number of classes must be >= 1",
            },
            isInt: {
                msg: "number of classes must be an integer",
            },
        },
    },
    creationDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    isDeleted: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: true,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        references: {
            model: User_1.User,
            key: "id",
        },
        allowNull: false,
    },
}, {
    sequelize,
    modelName: "Dataset",
    tableName: "dataset",
    timestamps: false,
    scopes: {
        visible: {
            attributes: {
                exclude: ["isDeleted"],
            },
            where: {
                isDeleted: false,
            },
        },
    },
});
