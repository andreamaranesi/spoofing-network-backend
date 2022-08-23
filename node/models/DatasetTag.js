"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatasetTag = void 0;
const sequelize_1 = require("sequelize");
const DatabaseSingleton_1 = require("../db/DatabaseSingleton");
const Dataset_1 = require("./Dataset");
/*
  Tag Model
*/
class DatasetTag extends sequelize_1.Model {
}
exports.DatasetTag = DatasetTag;
let sequelize = DatabaseSingleton_1.DatabaseSingleton.getInstance().sequelize;
// relationship with database
DatasetTag.init({
    datasetId: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: Dataset_1.Dataset,
            key: "id",
        },
    },
    tag: {
        type: sequelize_1.DataTypes.STRING(50),
        primaryKey: true,
        validate: {
            len: {
                args: [0, 50],
                msg: "tag must be less than 50 characters",
            },
        },
    },
}, {
    sequelize,
    timestamps: false,
    modelName: "DatasetTag",
    tableName: "datasetTag",
    defaultScope: {
        attributes: {
            exclude: ["DatasetId"],
        },
    },
});
// one to many relationship
Dataset_1.Dataset.hasMany(DatasetTag, {
    foreignKey: "datasetId",
});
DatasetTag.belongsTo(Dataset_1.Dataset);
