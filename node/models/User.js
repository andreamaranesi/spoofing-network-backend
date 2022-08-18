"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const sequelize_1 = require("sequelize");
const DatabaseSingleton_1 = require("../controller/repository/DatabaseSingleton");
class User extends sequelize_1.Model {
}
exports.User = User;
let sequelize = DatabaseSingleton_1.DatabaseSingleton.getInstance();
User.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    userName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    token: {
        type: sequelize_1.DataTypes.DECIMAL,
        allowNull: false
    },
    isAdmin: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'User',
    tableName: 'user',
    timestamps: false
});
