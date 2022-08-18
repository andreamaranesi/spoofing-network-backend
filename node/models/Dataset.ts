import { DataTypes, Model } from "sequelize";
import { DatabaseSingleton } from "../controller/repository/DatabaseSingleton";
import { User } from "./User";

export class Dataset extends Model {
    declare id: number; // this is ok! The 'declare' keyword ensures this field will not be emitted by TypeScript.
    declare datasetName: string;
    declare classes: number;
    declare creationDate: Date;
    declare userId: number;
}
  
let sequelize = DatabaseSingleton.getInstance()

Dataset.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    datasetName: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    classes:{
        type: DataTypes.INTEGER,
        allowNull: false
    },
    creationDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        },
        allowNull: false
    }},
    {
    sequelize,
    modelName: 'Dataset',
    tableName: 'dataset',
    timestamps: false    
});
