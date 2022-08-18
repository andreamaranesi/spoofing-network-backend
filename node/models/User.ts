import {Model, DataTypes} from "sequelize";
import { DatabaseSingleton } from "../controller/repository/DatabaseSingleton";

export class User extends Model{
    declare id:number;
    declare userName: string;
    declare email: string;
    declare token: number;
    declare isAdmin: boolean;
}

let sequelize = DatabaseSingleton.getInstance()

User.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    token: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    isAdmin: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
  }, {
    sequelize, 
    modelName: 'User', 
    tableName: 'user',
    timestamps: false
  });