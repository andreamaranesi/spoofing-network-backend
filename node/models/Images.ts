import { DataTypes, Model } from "sequelize";
import { DatabaseSingleton } from "../controller/repository/DatabaseSingleton";
import { Dataset } from "./Dataset";

export class Image extends Model{
    declare UUID: number;
    declare label: string;
    declare inference: string;
    declare datasetId: number;
}

let sequelize = DatabaseSingleton.getInstance()

Image.init({
    UUID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    label: {
        type: DataTypes.STRING(50)
    },
    inference: {
        type: DataTypes.STRING(50)
    },
    datasetId: {
        type: DataTypes.INTEGER,
        references:  {
            model: Dataset,
            key: 'id'
        },
        allowNull: false
    }   
},
    {sequelize,
    modelName: 'Image',
    tableName: 'image',
    timestamps: false
});