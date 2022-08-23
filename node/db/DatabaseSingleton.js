"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseSingleton = void 0;
const sequelize_1 = require("sequelize");
/**
 * instantiates the database connection
 */
class DatabaseSingleton {
    constructor() { }
    // returns the database connection instance
    static setPool() {
        const DB_NAME = process.env.DB_NAME || "dataset";
        const DB_USERNAME = process.env.MYSQL_USER || "root";
        const DB_PASSWORD = process.env.MYSQL_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || "root";
        const DB_HOST = process.env.MYSQL_HOST || "db";
        const NEW_INSTANCE = new DatabaseSingleton();
        NEW_INSTANCE.sequelize = new sequelize_1.Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
            host: DB_HOST,
            dialect: "mysql",
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000,
            },
        });
        return NEW_INSTANCE;
    }
    static getInstance() {
        if (this.instance === undefined)
            this.instance = this.setPool();
        return this.instance;
    }
}
exports.DatabaseSingleton = DatabaseSingleton;
