"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Image = void 0;
const sequelize_1 = require("sequelize");
const DatabaseSingleton_1 = require("../controller/repository/DatabaseSingleton");
const Dataset_1 = require("./Dataset");
/*
 Image Model
*/
class Image extends sequelize_1.Model {
    // check if a mimetype is supported
    static isValidMimetype(mimetype) {
        return [
            "application/zip",
            "image/jpeg",
            "image/jpg",
            "image/gif",
            "image/png",
        ].some((element) => {
            if (mimetype === element)
                return true;
            return false;
        });
    }
}
exports.Image = Image;
let sequelize = DatabaseSingleton_1.DatabaseSingleton.getInstance();
// will make the first letter of a string upper case, the remaining lower case
const capitalize = (string) => string[0].toUpperCase() + string.slice(1).toLowerCase();
// relationship with database
Image.init({
    UUID: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    fileName: {
        type: sequelize_1.DataTypes.STRING(100),
        validate: {
            notEmpty: { msg: "image fileName must be not empty" },
            max: {
                args: [100],
                msg: "image file name must be <= 100 characters (extension included)",
            },
        },
    },
    label: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
        set(value) {
            // Real or Fake
            this.setDataValue("label", capitalize(value));
        },
        validate: {
            notEmpty: { msg: "image label name must be not empty" },
            isIn: {
                args: [["Real", "Fake"]],
                msg: "label must be real or fake",
            },
        },
    },
    inference: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    datasetId: {
        type: sequelize_1.DataTypes.INTEGER,
        references: {
            model: Dataset_1.Dataset,
            key: "id",
        },
        allowNull: false,
    },
}, {
    sequelize,
    modelName: "Image",
    tableName: "image",
    timestamps: false,
    defaultScope: {
        attributes: {
            exclude: ["DatasetId"],
        },
    },
});
// one to many relationship
Dataset_1.Dataset.hasMany(Image, {
    foreignKey: "datasetId",
});
Image.belongsTo(Dataset_1.Dataset);