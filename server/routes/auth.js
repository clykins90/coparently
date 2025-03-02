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
    if (user && await bcrypt.compare(password, user.hashed_password)) {
      // Different handling based on user role
      let hasPartner = false;
      
      if (user.role === 'parent') {
        // For parent users, check for linked partner conversation
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
        // For child users, check for parent links
        const parentLinks = await ChildParentLink.findAll({
          where: { child_user_id: user.id, status: 'active' }
        });
        // Child users don't have partners, so hasPartner remains false
      }
      
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
        
        // End the session if one exists after passport logout is complete
        if (req.session) {
          req.session.destroy((err) => {
            if (err) {
              console.error('[LOGOUT] Error destroying session:', err);
              return res.status(500).json({ success: false, message: 'Server error during logout' });
            }
            
            // Clear the session cookie and all other possible auth cookies
            res.clearCookie('connect.sid', { path: '/' }); 
            res.clearCookie('session', { path: '/' });
            
            // Also clear cookies with various path options
            const cookieNames = ['connect.sid', 'session', 'jwt', 'token', 'auth'];
            const pathOptions = ['/', '/api', '/auth'];
            
            cookieNames.forEach(name => {
              pathOptions.forEach(path => {
                // Clear cookie with various options to ensure it's removed
                res.clearCookie(name, { path });
                // Also try with domain specifications if you're using subdomains
                res.clearCookie(name, { path, domain: req.hostname });
              });
            });
            
            console.log('[LOGOUT] Session destroyed and cookies cleared');
            return res.json({ 
              success: true, 
              message: 'Logout successful. All server-side session data cleared.' 
            });
          });
        } else {
          // No session to destroy
          console.log('[LOGOUT] No session to destroy');
          return res.json({ success: true });
        }
      });
    } else {
      // No passport logout function available
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error('[LOGOUT] Error destroying session:', err);
            return res.status(500).json({ success: false, message: 'Server error during logout' });
          }
          
          // Clear all possible auth cookies
          res.clearCookie('connect.sid', { path: '/' });
          res.clearCookie('session', { path: '/' });
          
          // Also clear cookies with various path options
          const cookieNames = ['connect.sid', 'session', 'jwt', 'token', 'auth'];
          const pathOptions = ['/', '/api', '/auth'];
          
          cookieNames.forEach(name => {
            pathOptions.forEach(path => {
              // Clear cookie with various options to ensure it's removed
              res.clearCookie(name, { path });
              // Also try with domain specifications if you're using subdomains
              res.clearCookie(name, { path, domain: req.hostname });
            });
          });
          
          console.log('[LOGOUT] Session destroyed and cookies cleared');
          return res.json({ 
            success: true, 
            message: 'Logout successful. All server-side session data cleared.' 
          });
        });
      } else {
        // No session to destroy
        console.log('[LOGOUT] No session to destroy');
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
    let user;

    // First, try JWT if provided
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
      user = await User.findByPk(decoded.userId);
    }
    // Fallback to Passport.js session if no valid JWT
    else if (req.isAuthenticated()) {
      user = req.user;
    }

    if (!user) {
      return res.json({ authenticated: false });
    }

    // Role-specific checks (hasPartner, isProfileComplete)
    let hasPartner = false;
    if (user.role === 'parent') {
      // Restored from your original /check endpoint
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
      // Restored from your original /check endpoint
      const parentLinks = await ChildParentLink.findAll({
        where: { child_user_id: user.id, status: 'active' }
      });
      // Note: parentLinks isn't used here, but kept for consistency with original
    }

    const isProfileComplete = user.first_name && user.last_name && user.email;
    const newToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your_jwt_secret_key', { expiresIn: '24h' });

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
    // Use the client URL from environment variables
    const clientUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-production-domain.com' 
      : process.env.CLIENT_URL || 'http://localhost:3000';
    
    console.log(`[Google OAuth] Starting authentication with passport, clientUrl: ${clientUrl}`);
      
    passport.authenticate('google', { 
      failureRedirect: `${clientUrl}/login?error=auth_failed`,
      failWithError: true
    })(req, res, next);
  },
  async (req, res, next) => {
    try {
      // User is authenticated and available in req.user
      const user = req.user;
      
      console.log(`[Google OAuth] Authentication completed, user:`, 
        user ? { id: user.id, email: user.email, role: user.role } : 'null');
      
      if (!user) {
        console.error('[Google OAuth] No user data available after authentication');
        // Use the client URL from environment variables
        const clientUrl = process.env.NODE_ENV === 'production' 
          ? 'https://your-production-domain.com' 
          : process.env.CLIENT_URL || 'http://localhost:3000';
        return res.redirect(`${clientUrl}/login?error=no_user_data`);
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
      
      console.log(`[Google OAuth] User ${user.id} has partner: ${hasPartner}`);
      
      const isProfileComplete = 
        user.first_name && 
        user.last_name && 
        user.email;
      
      console.log(`[Google OAuth] User ${user.id} profile complete: ${isProfileComplete}`);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'your_jwt_secret_key',
        { expiresIn: '24h' }
      );
      
      console.log(`[Google OAuth] Generated JWT token for user ${user.id}`);
      
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
        role: user.role, // Make sure role is included
        token: token // Add JWT token to response
      };
      
      console.log(`[Google OAuth] Prepared user info for redirect:`, 
        { ...userInfo, token: token ? 'present' : 'missing' });
      
      // Use the client URL from environment variables
      const clientUrl = process.env.NODE_ENV === 'production' 
        ? 'https://your-production-domain.com' 
        : process.env.CLIENT_URL || 'http://localhost:3000';
      
      const redirectUrl = `${clientUrl}/auth-success?data=${encodeURIComponent(JSON.stringify(userInfo))}`;
      
      console.log(`[Google OAuth] Redirecting to: ${redirectUrl.substring(0, 100)}...`);
      
      // Redirect to frontend with token or session
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('[Google OAuth] Error in callback:', error);
      // Use the client URL from environment variables
      const clientUrl = process.env.NODE_ENV === 'production' 
        ? 'https://your-production-domain.com' 
        : process.env.CLIENT_URL || 'http://localhost:3000';
      res.redirect(`${clientUrl}/login?error=server_error`);
    }
  },
  // Error handler for authentication failures
  (err, req, res, next) => {
    console.error('[Google OAuth] Authentication error:', err);
    // Use the client URL from environment variables
    const clientUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-production-domain.com' 
      : process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/login?error=auth_failed`);
  }
);

// Verify child invitation token
router.get('/verify-child-invitation', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invitation token is required' 
      });
    }
    
    // Since invitation_token column doesn't exist in the database,
    // we need to handle this differently
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
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token and password are required' 
      });
    }
    
    // Since invitation_token column doesn't exist in the database,
    // we need to handle this differently
    return res.status(404).json({ 
      success: false, 
      message: 'Child invitation feature is not available in this version' 
    });
  } catch (err) {
    console.error('Error completing child signup:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Test endpoint to check Google OAuth configuration
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
    clientUrlValue: process.env.CLIENT_URL || 'Using default: http://localhost:3000',
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
  
  if (!configStatus.clientUrlExists) {
    configErrors.push('CLIENT_URL is not set (using default)');
  }
  
  res.json({
    isConfigValid,
    configStatus,
    configErrors,
    message: isConfigValid ? 'Google OAuth configuration appears valid' : 'Google OAuth configuration has issues'
  });
});

// Debug route: Force clear session (for troubleshooting)
router.get('/force-clear-session', (req, res) => {
  console.log('[DEBUG] Force clearing session');
  
  // If there's a passport logout function, use it
  if (req.logout) {
    req.logout(function(err) {
      if (err) {
        console.error('[DEBUG] Error during passport logout:', err);
      }
      console.log('[DEBUG] Passport logout completed');
    });
  }
  
  // Destroy the session
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('[DEBUG] Error destroying session:', err);
      } else {
        console.log('[DEBUG] Session destroyed successfully');
      }
    });
  }
  
  // Clear cookies
  res.clearCookie('connect.sid');
  
  // Return success for client to clear its own state
  res.json({
    success: true,
    message: 'Session forcibly cleared. You should clear browser storage and cookies manually.'
  });
});

module.exports = router; 