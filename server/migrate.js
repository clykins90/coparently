// server/migrate.js
require('dotenv').config();
const { sequelize } = require('./models');

async function runMigrations() {
  try {
    console.log('Running migrations...');
    
    // Sync all models with the database
    await sequelize.sync({ alter: true });
    
    console.log('Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations(); 