const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const dbDialect = process.env.DB_DIALECT || 'sqlite';

let sequelize;

if (dbDialect === 'mysql') {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'lims_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? false : false,
      pool: { max: 20, min: 5, acquire: 60000, idle: 10000 },
      define: { timestamps: true, underscored: false, freezeTableName: true },
      dialectOptions: { dateStrings: true, typeCast: true },
      timezone: '+05:30',
    }
  );
} else {
  // SQLite for development (no MySQL installation needed)
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database.sqlite'),
    logging: false,
    define: { timestamps: true, underscored: false, freezeTableName: true },
  });
}

module.exports = sequelize;
