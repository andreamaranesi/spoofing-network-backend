import { DataTypes, Model } from "sequelize";
import { DatabaseSingleton } from "../controller/repository/DatabaseSingleton";

export class DatasetTag extends Model{
    declare datasetId: number;
    declare tag: string;
}

let sequelize = DatabaseSingleton.getInstance();

DatasetTag.init({
    datasetId: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    tag: {
        type: DataTypes.STRING(50),
        primaryKey: true
    }
}, {
    sequelize,
    timestamps: false
});