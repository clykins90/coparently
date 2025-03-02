// server/routes/auth.js
const express = require('express');
const router = express.Router();
const { User, Conversation, ChildParentLink } = require('../models');
const bcrypt = require('bcrypt');
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Endpoint: Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    
    // Check if user exists and password matches
    if (user && user.hashed_password && await bcrypt.compare(password, user.hashed_password)) {
      // Different handling based on user role
      let hasPartner = false;
      
      // If a parent, check for a partner conversation
      if (user.role === 'parent') {
        const partnerConversation = await Conversation.findOne({
          where: { conversation_type: 'linked_partner' },
          include: [{
            model: User,
            through: { attributes: [] },
            where: { id: user.id }
          }]
        });
        hasPartner = !!partnerConversation;
      } else if (user.role === 'child') {
        // If child, check for parent links
        const parentLinks = await ChildParentLink.findAll({
          where: { child_user_id: user.id, status: 'active' }
        });
        // Child doesn't have "partners," so hasPartner stays false
      }
      
      const isProfileComplete = !!(user.first_name && user.last_name && user.email);
      
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
        role: user.role,
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
      username: email, // or some other logic for username
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

// Endpoint: Logout
router.post('/logout', (req, res) => {
  console.log('[LOGOUT] Logout request received');
  
  try {
    // Clear Passport.js session if it exists
    if (req.logout) {
      req.logout(function(err) {
        if (err) { 
          console.error('[LOGOUT] Error during passport logout:', err);
        }
        
        // End the session if one exists
        if (req.session) {
          req.session.destroy((err) => {
            if (err) {
              console.error('[LOGOUT] Error destroying session:', err);
              return res.status(500).json({ success: false, message: 'Server error during logout' });
            }
            res.clearCookie('connect.sid', { path: '/' }); 
            res.clearCookie('session', { path: '/' });
            
            // Also attempt to clear additional cookies
            const cookieNames = ['connect.sid', 'session', 'jwt', 'token', 'auth'];
            const pathOptions = ['/', '/api', '/auth'];
            cookieNames.forEach(name => {
              pathOptions.forEach(path => {
                res.clearCookie(name, { path });
                res.clearCookie(name, { path, domain: req.hostname });
              });
            });
            
            console.log('[LOGOUT] Session destroyed and cookies cleared');
            return res.json({ success: true, message: 'Logout successful. All server-side session data cleared.' });
          });
        } else {
          // No session to destroy
          console.log('[LOGOUT] No session to destroy (req.logout existed)');
          return res.json({ success: true });
        }
      });
    } else {
      // If no passport, just destroy any session
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error('[LOGOUT] Error destroying session:', err);
            return res.status(500).json({ success: false, message: 'Server error during logout' });
          }
          res.clearCookie('connect.sid', { path: '/' });
          res.clearCookie('session', { path: '/' });
          
          // Clear additional cookies
          const cookieNames = ['connect.sid', 'session', 'jwt', 'token', 'auth'];
          const pathOptions = ['/', '/api', '/auth'];
          cookieNames.forEach(name => {
            pathOptions.forEach(path => {
              res.clearCookie(name, { path });
              res.clearCookie(name, { path, domain: req.hostname });
            });
          });
          
          console.log('[LOGOUT] Session destroyed and cookies cleared (no passport logout)');
          return res.json({ success: true, message: 'Logout successful. All server-side session data cleared.' });
        });
      } else {
        // No session
        console.log('[LOGOUT] No session and no passport - basic success response');
        return res.json({ success: true });
      }
    }
  } catch (error) {
    console.error('[LOGOUT] Logout error:', error);
    res.status(500).json({ success: false, message: 'Server error during logout' });
  }
});

// Endpoint: Check authentication status
router.get('/check', async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ authenticated: false });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.json({ authenticated: false });
    }
    
    let hasPartner = false;
    if (user.role === 'parent') {
      const partnerConversation = await Conversation.findOne({
        where: { conversation_type: 'linked_partner' },
        include: [{
          model: User,
          through: { attributes: [] },
          where: { id: user.id }
        }]
      });
      hasPartner = !!partnerConversation;
    } else if (user.role === 'child') {
      // Check child-parent links if needed
      const parentLinks = await ChildParentLink.findAll({
        where: { child_user_id: user.id, status: 'active' }
      });
    }
    
    const isProfileComplete = !!(user.first_name && user.last_name && user.email);
    
    // Generate a new token to extend expiration
    const newToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '24h' }
    );
    
    res.json({ 
      authenticated: true,
      userId: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      hasPartner: hasPartner,
      requiresProfile: !isProfileComplete,
      authProvider: user.auth_provider,
      profilePicture: user.google_profile_picture,
      role: user.role,
      token: newToken
    });
  } catch (err) {
    console.error('Error in /api/auth/check:', err);
    res.json({ authenticated: false });
  }
});

// Google OAuth routes
router.get('/google', (req, res, next) => {
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', 
  (req, res, next) => {
    const clientUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-production-domain.com' 
      : process.env.CLIENT_URL || 'http://localhost:3000';
    
    passport.authenticate('google', { 
      failureRedirect: `${clientUrl}/login?error=auth_failed`,
      failWithError: true
    })(req, res, next);
  },
  async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        const clientUrl = process.env.NODE_ENV === 'production' 
          ? 'https://your-production-domain.com'
          : process.env.CLIENT_URL || 'http://localhost:3000';
        return res.redirect(`${clientUrl}/login?error=no_user_data`);
      }
      
      let hasPartner = false;
      if (user.role === 'parent') {
        const partnerConversation = await Conversation.findOne({
          where: { conversation_type: 'linked_partner' },
          include: [{
            model: User,
            through: { attributes: [] },
            where: { id: user.id }
          }]
        });
        hasPartner = !!partnerConversation;
      }
      
      const isProfileComplete = !!(user.first_name && user.last_name && user.email);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'your_jwt_secret_key',
        { expiresIn: '24h' }
      );
      
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
        role: user.role,
        token: token
      };
      
      const clientUrl = process.env.NODE_ENV === 'production' 
        ? 'https://your-production-domain.com' 
        : process.env.CLIENT_URL || 'http://localhost:3000';
      
      const redirectUrl = `${clientUrl}/auth-success?data=${encodeURIComponent(JSON.stringify(userInfo))}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('[Google OAuth] Error in callback:', error);
      const clientUrl = process.env.NODE_ENV === 'production' 
        ? 'https://your-production-domain.com' 
        : process.env.CLIENT_URL || 'http://localhost:3000';
      res.redirect(`${clientUrl}/login?error=server_error`);
    }
  },
  (err, req, res, next) => {
    console.error('[Google OAuth] Authentication error:', err);
    const clientUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-production-domain.com' 
      : process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/login?error=auth_failed`);
  }
);

// Verify child invitation token
router.get('/verify-child-invitation', async (req, res) => {
  try {
    return res.status(404).json({ 
      success: false, 
      message: 'Child invitation feature is not available in this version' 
    });
  } catch (err) {
    console.error('Error verifying child invitation:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Complete child signup
router.post('/complete-child-signup', async (req, res) => {
  try {
    return res.status(404).json({ 
      success: false, 
      message: 'Child invitation feature is not available in this version' 
    });
  } catch (err) {
    console.error('Error completing child signup:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Test endpoint for Google config
router.get('/test-google-config', (req, res) => {
  const configStatus = {
    clientIdExists: !!process.env.GOOGLE_CLIENT_ID,
    clientIdValue: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 10)}...` : 'Not set',
    clientSecretExists: !!process.env.GOOGLE_CLIENT_SECRET,
    callbackUrlExists: !!process.env.GOOGLE_CALLBACK_URL,
    callbackUrlValue: process.env.GOOGLE_CALLBACK_URL || 'Using default: /auth/google/callback',
    sessionSecretExists: !!process.env.SESSION_SECRET,
    jwtSecretExists: !!process.env.JWT_SECRET,
    clientUrlExists: !!process.env.CLIENT_URL,
    clientUrlValue: process.env.CLIENT_URL || 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV || 'development'
  };
  
  let isConfigValid = true;
  const configErrors = [];
  
  if (!configStatus.clientIdExists) {
    isConfigValid = false;
    configErrors.push('GOOGLE_CLIENT_ID is not set');
  }
  if (!configStatus.clientSecretExists) {
    isConfigValid = false;
    configErrors.push('GOOGLE_CLIENT_SECRET is not set');
  }
  if (!configStatus.sessionSecretExists) {
    isConfigValid = false;
    configErrors.push('SESSION_SECRET is not set');
  }
  if (!configStatus.jwtSecretExists) {
    isConfigValid = false;
    configErrors.push('JWT_SECRET is not set');
  }
  
  res.json({
    isConfigValid,
    configStatus,
    configErrors,
    message: isConfigValid 
      ? 'Google OAuth configuration appears valid' 
      : 'Google OAuth configuration has issues'
  });
});

// Debug route: Force clear session
router.get('/force-clear-session', (req, res) => {
  console.log('[DEBUG] Force clearing session');
  
  if (req.logout) {
    req.logout(function(err) {
      if (err) {
        console.error('[DEBUG] Error during passport logout:', err);
      }
      console.log('[DEBUG] Passport logout completed');
    });
  }
  
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('[DEBUG] Error destroying session:', err);
      } else {
        console.log('[DEBUG] Session destroyed successfully');
      }
    });
  }
  
  res.clearCookie('connect.sid');
  res.json({
    success: true,
    message: 'Session forcibly cleared. You should clear browser storage and cookies manually.'
  });
});

module.exports = router;