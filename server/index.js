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
const childrenRoutes = require('./routes/children');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://your-production-domain.com' 
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
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

// Add a test route to verify the server is running
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Add a route to check the Google OAuth configuration
app.get('/check-google-config', (req, res) => {
  res.json({
    clientIdExists: !!process.env.GOOGLE_CLIENT_ID,
    clientSecretExists: !!process.env.GOOGLE_CLIENT_SECRET,
    sessionSecretExists: !!process.env.SESSION_SECRET
  });
});

app.use('/api', userRoutes);
app.use('/api', partnerRoutes);
app.use('/api', messageRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/children', childrenRoutes);

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