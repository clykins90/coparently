const express = require('express');
const router = express.Router();
const { User, Conversation } = require('../models');
const bcrypt = require('bcrypt');
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Endpoint: Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    
    // Check if user exists and password matches
    if (user && await bcrypt.compare(password, user.hashed_password)) {
      // Check for linked partner conversation (if exists)
      const partnerConversation = await Conversation.findOne({
        where: { conversation_type: 'linked_partner' },
        include: [{
          model: User,
          through: { attributes: [] },
          where: { id: user.id }
        }]
      });
      const hasPartner = !!partnerConversation;
      const isProfileComplete = 
        user.first_name && 
        user.last_name && 
        user.email;
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'your_jwt_secret_key',
        { expiresIn: '24h' }
      );
      
      res.json({ 
        success: true, 
        userId: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        hasPartner: hasPartner,
        requiresProfile: !isProfileComplete,
        authProvider: user.auth_provider,
        profilePicture: user.google_profile_picture,
        token: token // Add JWT token to response
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    console.error('Error in /api/login:', err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Endpoint: Register (create a new user)
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }
    
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await User.create({
      username: email, // or another logic to generate a username
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
      hashed_password: hashedPassword,
      auth_provider: 'local'
    });
    
    res.json({ success: true, user: newUser });
  } catch (err) {
    console.error("Error in /api/register:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Endpoint: Logout (simulated)
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy();
  }
  res.json({ success: true });
});

// Google OAuth routes
router.get('/google', (req, res, next) => {
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', 
  (req, res, next) => {
    passport.authenticate('google', { 
      failureRedirect: 'http://localhost:3000/login?error=auth_failed',
      failWithError: true
    })(req, res, next);
  },
  async (req, res, next) => {
    try {
      // User is authenticated and available in req.user
      const user = req.user;
      
      if (!user) {
        console.error('Google OAuth callback: No user data available');
        return res.redirect('http://localhost:3000/login?error=no_user_data');
      }
      
      // Check for linked partner conversation (if exists)
      const partnerConversation = await Conversation.findOne({
        where: { conversation_type: 'linked_partner' },
        include: [{
          model: User,
          through: { attributes: [] },
          where: { id: user.id }
        }]
      });
      const hasPartner = !!partnerConversation;
      const isProfileComplete = 
        user.first_name && 
        user.last_name && 
        user.email;
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'your_jwt_secret_key',
        { expiresIn: '24h' }
      );
      
      // Redirect to frontend with user info
      const userInfo = {
        userId: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        hasPartner: hasPartner,
        requiresProfile: !isProfileComplete,
        authProvider: user.auth_provider,
        profilePicture: user.google_profile_picture,
        token: token // Add JWT token to response
      };
      
      // Use the client URL for redirection
      const clientUrl = process.env.NODE_ENV === 'production' 
        ? 'https://your-production-domain.com' 
        : 'http://localhost:3000';
      
      const redirectUrl = `${clientUrl}/auth-success?data=${encodeURIComponent(JSON.stringify(userInfo))}`;
      
      // Redirect to frontend with token or session
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect('http://localhost:3000/login?error=server_error');
    }
  },
  // Error handler for authentication failures
  (err, req, res, next) => {
    console.error('Google OAuth authentication error:', err);
    res.redirect('http://localhost:3000/login?error=auth_failed');
  }
);

// Endpoint: Check if user is authenticated
router.get('/check', (req, res) => {
  if (req.isAuthenticated()) {
    // Generate JWT token
    const token = jwt.sign(
      { userId: req.user.id },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '24h' }
    );
    
    res.json({ 
      authenticated: true, 
      token: token,
      user: {
        userId: req.user.id,
        firstName: req.user.first_name,
        lastName: req.user.last_name,
        email: req.user.email,
        phone: req.user.phone,
        authProvider: req.user.auth_provider,
        profilePicture: req.user.google_profile_picture
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

module.exports = router; 