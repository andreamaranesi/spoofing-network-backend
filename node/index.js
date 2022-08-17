var db_name = process.env.DB_NAME || "dataset";
var db_username = process.env.MYSQL_USER || "root";
var db_password = process.env.MYSQL_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || "root";
var db_host = process.env.MYSQL_HOST || "db";
console.log(db_host);
var Sequelize = require("sequelize");
var sequelize = new Sequelize(db_name, db_username, db_password, {
    host: db_host,
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});
sequelize.authenticate().then(function () {
    console.log('Connection has been established successfully.');
})["catch"](function (error) {
    console.error('Unable to connect to the database: ', error);
});
