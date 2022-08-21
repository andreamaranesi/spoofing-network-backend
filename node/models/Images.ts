import { DataTypes, Model } from "sequelize";
import { DatabaseSingleton } from "../controller/repository/DatabaseSingleton";
import { Dataset } from "./Dataset";

// Image Model
export class Image extends Model{
    declare UUID: number;
    declare label: string;
    declare inference: string;
    declare datasetId: number;
    declare fileName: string;

    static isValidMimetype(mimetype: string):boolean{
        return ["application/zip","image/jpeg","image/jpg","image/gif","image/png"].some(element => {
            if (mimetype === element) {
              return true;
            }
            return false;
          });
    }
}

let sequelize = DatabaseSingleton.getInstance()

// relationship with database
Image.init({
    UUID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    fileName: {
        type: DataTypes.STRING(100),
        validate: {
            notEmpty: { msg: "image fileName must be not empty" },
            max: {
                args: [100],
                msg: "image file name must be <= 100 characters (extension included)",
              },
        },
        
    },
    label: {
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: {
            notEmpty: { msg: "image label name must be not empty" },
        },
    },
    inference: {
        type: DataTypes.STRING(50),
        allowNull: true
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


Dataset.hasMany(Image, {
    foreignKey: 'datasetId'
  });
Image.belongsTo(Dataset);

