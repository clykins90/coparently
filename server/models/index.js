// server/models/index.js
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Use environment variables to store your credentials (create a .env file in the server folder)
const sequelize = new Sequelize(
  process.env.POSTGRES_DB || 'coparently-db',    // database name
  process.env.POSTGRES_USER || 'postgres',     // username
  process.env.POSTGRES_PASSWORD || 'postgres',// password
  {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    dialect: 'postgres',
    logging: false,  // change to console.log to debug SQL queries if needed
    // Add retry logic for connection
    retry: {
      max: 3,
      match: [/SequelizeConnectionError/]
    }
  }
);

// Load models dynamically
const models = {};
const modelsDir = path.join(__dirname, '.');

fs.readdirSync(modelsDir)
  .filter(file => file !== 'index.js' && file.endsWith('.js'))
  .forEach(file => {
    const model = require(path.join(modelsDir, file))(sequelize);
    models[model.name] = model;
  });

// Set up associations
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = {
  sequelize,
  Sequelize,
  ...models
};