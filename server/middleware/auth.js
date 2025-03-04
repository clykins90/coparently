// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware to authenticate users based on JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticateUser = async (req, res, next) => {
  try {
    // Special debug logging for Google Calendar routes
    if (req.originalUrl && req.originalUrl.includes('/google-calendar')) {
      console.log('=== AUTH MIDDLEWARE FOR GOOGLE CALENDAR ===');
      console.log('Request path:', req.originalUrl);
      console.log('Auth header present:', !!req.headers.authorization);
      console.log('=== END AUTH MIDDLEWARE LOGGING ===');
    }
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // More detailed logging for Google Calendar routes
      if (req.originalUrl && req.originalUrl.includes('/google-calendar')) {
        console.log('AUTH FAILED: No valid authorization header for Google Calendar route');
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
      }
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by id
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    ) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

// Middleware to restrict access to parent users only
const parentOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  if (req.user.role !== 'parent') {
    return res.status(403).json({ success: false, message: 'Access denied. Parents only.' });
  }
  
  next();
};

// Middleware to restrict access to child users only
const childOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  if (req.user.role !== 'child') {
    return res.status(403).json({ success: false, message: 'Access denied. Children only.' });
  }
  
  next();
};

module.exports = {
  authenticateUser,
  parentOnly,
  childOnly
};