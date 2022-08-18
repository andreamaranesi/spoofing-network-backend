import { Sequelize } from "sequelize";

export class DatabaseSingleton {
  private static pool: Sequelize;

  private static setPool(){
    const db_name = process.env.DB_NAME || "dataset";
    const db_username = process.env.MYSQL_USER || "root";
    const db_password =
      process.env.MYSQL_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || "root";

    const db_host = process.env.MYSQL_HOST || "db";
    
    const sequelize = new Sequelize(db_name, db_username, db_password, {
      host: db_host,
      dialect: "mysql",
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });

    return sequelize;
  }

  static getInstance() {
    if (this.pool === undefined) this.pool = this.setPool()

    return this.pool;
  }
}
