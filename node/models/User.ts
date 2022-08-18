import {Model, DataTypes} from "sequelize";
import { DatabaseSingleton } from "../controller/repository/DatabaseSingleton";
export class User extends Model{
    declare id:number;
    declare name: string;
    declare email: string;
    declare token: number;
    declare isAdmin: boolean;
}

let sequelize = DatabaseSingleton.getInstance()

User.init({
    // Model attributes are defined here
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
  }, {
    sequelize, // We need to pass the connection instance
    modelName: 'User' // We need to choose the model name
  });