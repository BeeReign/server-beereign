const { Sequelize } = require('sequelize');

const {
  config: { Database },
} = require('../app/config');

const USER = encodeURIComponent(Database.user);
const PASSWORD = encodeURIComponent(Database.password);
const URI = `postgres://${USER}:${PASSWORD}@${Database.host}:${Database.port}/${Database.name}`;

// The connection pool is to a PostgreSQL database
const connectionToDb = new Sequelize(URI, {
  dialect: 'postgres',
  dialectOptions: {
    useUTC: true,
  },
  timezone: Database.timezone,
  logging: false,
  ssl: false,
});

module.exports = connectionToDb;
