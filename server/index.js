// server/index.js
console.log("████████████████████████████████████████");
console.log("█ Server starting... (v2.5)            █");
console.log("████████████████████████████████████████");

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const passport = require('./config/passport');

// Import Sequelize instance and models from our models folder
const { sequelize, User } = require('./models');

// Import route modules
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const partnerRoutes = require('./routes/partners');
const messageRoutes = require('./routes/messages');
const calendarRoutes = require('./routes/calendarRoutes');

// --- Here's the rename for child-user routes file ---
// Instead of "children-users.js", we call it "usersChildren.js"
// to align with the new path `/api/users/children`
const usersChildrenRoutes = require('./routes/usersChildren');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // If in development, allow these origins:
    origin: process.env.NODE_ENV === 'production'
      ? 'https://your-production-domain.com'
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }
});

const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://your-production-domain.com'
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configure session
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// Use route modules
app.use('/api', authRoutes);
app.use('/auth', authRoutes); // For Google OAuth routes
app.use('/api', userRoutes);
app.use('/api', partnerRoutes);
app.use('/api', messageRoutes);
app.use('/api/calendar', calendarRoutes);

// ---------------------------
// Mount your child-user routes
// ---------------------------
// This means that inside "usersChildren.js",
// if we have router.get('/'), it becomes /api/users/children/
app.use('/api/users/children', usersChildrenRoutes);

// Test route to confirm server is up
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

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