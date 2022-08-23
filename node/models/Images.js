"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Image = void 0;
const sequelize_1 = require("sequelize");
const DatabaseSingleton_1 = require("../db/DatabaseSingleton");
const Dataset_1 = require("./Dataset");
/*
 Image Model
*/
class Image extends sequelize_1.Model {
    // check if a mimetype is supported
    static isValidMimetype(mimetype) {
        return ["application/zip", "image/jpeg", "image/jpg", "image/png"].some((element) => {
            if (mimetype === element)
                return true;
            return false;
        });
    }
    // returns the file extension from the filename
    static fileExtension(name) {
        return name.split(".").pop().toLowerCase();
    }
}
exports.Image = Image;
let sequelize = DatabaseSingleton_1.DatabaseSingleton.getInstance().sequelize;
// relationship with database
Image.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    fileName: {
        type: sequelize_1.DataTypes.STRING(100),
        set(value) {
            // truncates the fileName so it will be equal to 100 character
            const truncateFileName = (string) => {
                if (value.length >= 100) {
                    let extension = Image.fileExtension(value);
                    return value.slice(0, 99 - extension.length) + "." + extension;
                }
                return value;
            };
            this.setDataValue("fileName", truncateFileName(value));
        },
        validate: {
            notEmpty: { msg: "image fileName must be not empty" },
            len: {
                args: [0, 100],
                msg: "image file name must be <= 100 characters (extension included)",
            },
        },
    },
    label: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
        set(value) {
            // makes the first letter of a string upper case, the remaining lower case
            const capitalize = (string) => string[0].toUpperCase() + string.slice(1).toLowerCase();
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
