"use strict";
exports.__esModule = true;
exports.DatabaseSingleton = void 0;
var sequelize_1 = require("sequelize");
var DatabaseSingleton = /** @class */ (function () {
    function DatabaseSingleton() {
    }
    DatabaseSingleton.setPool = function () {
        var db_name = process.env.DB_NAME || "dataset";
        var db_username = process.env.MYSQL_USER || "root";
        var db_password = process.env.MYSQL_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || "root";
        var db_host = process.env.MYSQL_HOST || "db";
        var sequelize = new sequelize_1.Sequelize(db_name, db_username, db_password, {
            host: db_host,
            dialect: "mysql",
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        });
        return sequelize;
    };
    DatabaseSingleton.getInstance = function () {
        if (this.pool === undefined)
            this.pool = this.setPool();
        return this.pool;
    };
    return DatabaseSingleton;
}());
exports.DatabaseSingleton = DatabaseSingleton;
