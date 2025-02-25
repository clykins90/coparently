console.log("████████████████████████████████████████");
console.log("█ Server starting... (v2.4)            █");
console.log("████████████████████████████████████████");

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');

// Import Sequelize instance and models from our models folder
const { sequelize, User } = require('./models');

// Import route modules
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const partnerRoutes = require('./routes/partners');
const messageRoutes = require('./routes/messages');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

// Use route modules
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', partnerRoutes);
app.use('/api', messageRoutes);

// Sync Sequelize models and start the server
sequelize.sync().then(() => {
  console.log('Database synchronized!');
  app.listen(port, () => {
    console.log(`\n=== SERVER STARTED ===`);
    console.log(`| Port: ${port}`);
    console.log(`==========================\n`);
  });
}).catch(err => {
  console.error("💥 CRITICAL DATABASE ERROR 💥", err);
  process.exit(1);
});