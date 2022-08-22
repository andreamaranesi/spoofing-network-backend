import { Model, DataTypes } from "sequelize";
import { DatabaseSingleton } from "../controller/repository/DatabaseSingleton";

/*
 User Model
*/
export class User extends Model {
  declare id: number;
  declare userName: string;
  declare email: string;
  declare token: number;
  declare isAdmin: boolean;
}

let sequelize = DatabaseSingleton.getInstance();

// relationship with database
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    token: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      get() {
        return parseFloat(this.getDataValue("token"));
      },
      validate: {
        min: {
          args: [0],
          msg: "token must be >= 0",
        },
        isNumeric: {
          msg: "token must be numeric",
        },
      },
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "user",
    timestamps: false,
  }
);
