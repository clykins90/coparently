const express = require('express');
const router = express.Router();
const { User, Conversation, ChildParentLink } = require('../models');
const bcrypt = require('bcrypt');
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Endpoint: Login
router.post('/login', async (req, res) => {
  try {
    console.log('[LOGIN] Request received:', req.body ? { hasEmail: !!req.body.email } : 'no body');
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('[LOGIN] Missing required fields');
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log(`[LOGIN] User not found for email: ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    
    // Check if user exists and password matches
    const passwordMatch = await bcrypt.compare(password, user.hashed_password);
    if (!passwordMatch) {
      console.log(`[LOGIN] Password match failed for user: ${user.id}`);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    
    console.log(`[LOGIN] Successful authentication for user: ${user.id}`);
    
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
  } catch (err) {
    console.error('Error in /api/login:', err);
    // Provide more specific error messages for common issues
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeDatabaseError') {
      console.log('[LOGIN] Database validation error:', err.message);
      return res.status(400).json({ success: false, message: 'Invalid data format' });
    }
    
    // Log the error type and message for debugging
    console.log('[LOGIN] Error type:', err.name, 'Message:', err.message);
    
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
    console.log('[CHECK] Authentication check request received');
    let user;

    // First, try JWT if provided
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        console.log('[CHECK] JWT token verified, decoded:', decoded);
        
        if (!decoded.userId) {
          console.log('[CHECK] No userId found in JWT token');
          return res.json({ authenticated: false });
        }
        
        user = await User.findByPk(decoded.userId);
        console.log('[CHECK] User found from JWT:', user ? `ID: ${user.id}` : 'null');
      } catch (error) {
        console.error('[CHECK] JWT verification error:', error.message);
        return res.json({ authenticated: false });
      }
    }
    // Fallback to Passport.js session if no valid JWT
    else if (req.isAuthenticated()) {
      user = req.user;
      console.log('[CHECK] User found from session:', user ? `ID: ${user.id}` : 'null');
    } else {
      console.log('[CHECK] No authentication method found (no JWT, no session)');
    }

    if (!user) {
      console.log('[CHECK] No user found, returning unauthenticated');
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

// Google OAuth routes for authentication only (no calendar access)
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

router.get('/google/callback', (req, res, next) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  
  passport.authenticate('google', { 
    failureRedirect: `${clientUrl}/login`,
    session: false
  }, (err, user, info) => {
    if (err) {
      console.error('Error in Google OAuth callback:', err);
      return res.redirect(`${clientUrl}/login?error=server_error`);
    }
    
    if (!user) {
      console.error('No user returned from Google OAuth');
      return res.redirect(`${clientUrl}/login?error=auth_failed`);
    }
    
    // Prepare user info to pass to the client
    const userInfo = {
      userId: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      hasPartner: false, // This would be set based on your business logic
      requiresProfile: !(user.first_name && user.last_name && user.email),
      authProvider: user.auth_provider,
      profilePicture: user.google_profile_picture,
      role: user.role || 'parent',
      token: info.token
    };
    
    // Redirect to client with user data
    const redirectUrl = `${clientUrl}/google-auth-callback?data=${encodeURIComponent(JSON.stringify(userInfo))}`;
    res.redirect(redirectUrl);
  })(req, res, next);
});

module.exports = router;