console.log("████████████████████████████████████████");
console.log("█ Server starting... (v2.5)            █");
console.log("████████████████████████████████████████");

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const http = require('http');
const { Server } = require('socket.io');

// Import Sequelize instance and models from our models folder
const { sequelize, User } = require('./models');

// Import route modules
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const partnerRoutes = require('./routes/partners');
const messageRoutes = require('./routes/messages');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict this to your client's domain
    methods: ['GET', 'POST']
  }
});

const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

// Use route modules
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', partnerRoutes);
app.use('/api', messageRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Join a conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`User ${socket.id} joined conversation ${conversationId}`);
  });
  
  // Leave a conversation room
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
    console.log(`User ${socket.id} left conversation ${conversationId}`);
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to our routes
app.set('io', io);

// Sync Sequelize models and start the server
sequelize.sync().then(() => {
  console.log('Database synchronized!');
  server.listen(port, () => {
    console.log(`\n=== SERVER STARTED ===`);
    console.log(`| Port: ${port}`);
    console.log(`==========================\n`);
  });
}).catch(err => {
  console.error("💥 CRITICAL DATABASE ERROR 💥", err);
  process.exit(1);
});