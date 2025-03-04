const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const googleCalendarController = require('../controllers/googleCalendarController');
const { authenticateUser } = require('../middleware/auth');
const googleCalendarService = require('../services/googleCalendarService');

console.log('GOOGLE CALENDAR ROUTES MODULE LOADED');

// Apply authentication middleware to most routes
router.use(['/status', '/tokens', '/toggle-sync', '/calendars', '/disconnect', '/sync-all'], authenticateUser);

// Secure endpoint for initiating Google Calendar authorization with token in POST body
router.post('/authorize-redirect', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    console.log('Google Calendar authorize-redirect received');
    console.log('Request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    
    const { token } = req.body;
    
    if (!token) {
      console.error('No token provided in request body');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    console.log('Token found in request body');
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user by id
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        console.error('User not found for token');
        return res.status(401).json({ message: 'User not found' });
      }
      
      console.log(`Starting Google Calendar authorization for user ${user.id}`);
      
      // Store user ID in session for retrieval in callback
      req.session.calendarUserId = user.id;
      
      // Create state parameter with user ID 
      const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64');
      
      // Construct the authorization URL manually
      const authURL = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authURL.searchParams.append('client_id', process.env.GOOGLE_CLIENT_ID);
      authURL.searchParams.append('redirect_uri', process.env.GOOGLE_CALENDAR_CALLBACK_URL);
      authURL.searchParams.append('response_type', 'code');
      authURL.searchParams.append('scope', 'profile email https://www.googleapis.com/auth/calendar');
      authURL.searchParams.append('access_type', 'offline');
      authURL.searchParams.append('prompt', 'consent');
      authURL.searchParams.append('state', state);
      
      // Redirect to Google authorization
      return res.redirect(authURL.toString());
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({ message: 'Invalid authentication token' });
    }
  } catch (error) {
    console.error('Error in Google Calendar authorize-redirect route:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Google Calendar OAuth connect route
router.get('/connect', async (req, res, next) => {
  try {
    // Get token from authorization header (preferred) or query parameter (fallback)
    let token = null;
    
    // Check authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('Using token from Authorization header');
    } 
    // Fallback to query parameter (for backward compatibility)
    else if (req.query.auth_token) {
      token = req.query.auth_token;
      console.log('Using token from query parameter (deprecated)');
    }
    
    if (!token) {
      console.error('No authentication token provided');
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'Please provide a valid authentication token in the Authorization header'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user by id
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        console.error('User not found for token');
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Attach user to request
      req.user = user;
      
      console.log(`Starting Google Calendar authorization for user ${req.user.id}`);
      
      // Use state parameter to track the user's ID
      const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64');
      
      passport.authenticate('google-calendar', {
        scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'],
        accessType: 'offline',
        prompt: 'consent',
        state: state
      })(req, res, next);
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({ message: 'Invalid authentication token' });
    }
  } catch (error) {
    console.error('Error in Google Calendar connect route:', error);
    res.status(500).json({ message: 'Failed to initiate Google Calendar authorization' });
  }
});

// Handle the Google Calendar callback route - this should be registered at app level
const handleGoogleCalendarCallback = (req, res, next) => {
  console.log('Google Calendar callback handler invoked');
  console.log('Query parameters:', req.query);
  
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  
  // Get userId from state parameter or session
  let userId = null;
  
  // Try to get from state parameter
  if (req.query.state) {
    try {
      const stateData = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
      if (stateData.userId) {
        userId = stateData.userId;
        console.log(`Found userId ${userId} in state parameter`);
      }
    } catch (error) {
      console.error('Error decoding state parameter:', error);
    }
  }
  
  // If not found in state, try session
  if (!userId && req.session && req.session.calendarUserId) {
    userId = req.session.calendarUserId;
    console.log(`Found userId ${userId} in session`);
    // Clear it from session after using
    delete req.session.calendarUserId;
  }
  
  // Store userId in request for later use
  if (userId) {
    req.calendarUserId = userId;
    console.log(`Set calendarUserId in request: ${req.calendarUserId}`);
  } else {
    console.error('No userId found in state or session');
  }
  
  passport.authenticate('google-calendar', {
    failureRedirect: `${clientUrl}/settings?error=calendar_auth_failed`,
    session: false
  }, async (err, user, tokens) => {
    try {
      if (err) {
        console.error('Error in Google Calendar callback:', err);
        return res.redirect(`${clientUrl}/settings?error=calendar_auth_failed`);
      }
      
      // Try to get user from passport first, fall back to stored userId
      if (!user && req.calendarUserId) {
        const { User } = require('../models');
        user = await User.findByPk(req.calendarUserId);
        console.log(`Retrieved user ${user ? user.id : 'not found'} using stored userId`);
      }
      
      if (!user || !tokens) {
        console.error('No user or tokens returned from Google Calendar OAuth');
        return res.redirect(`${clientUrl}/settings?error=no_tokens`);
      }
      
      // Save tokens using the Google Calendar service
      await googleCalendarService.saveUserGoogleTokens(user.id, tokens);
      console.log(`Google Calendar tokens saved for user ${user.id}`);
      
      // Create or get Coparently calendar
      const auth = googleCalendarService.createOAuth2Client(tokens);
      await googleCalendarService.getOrCreateCoparentlyCalendar(auth, user.id);
      
      // Redirect to calendar connect callback with success parameter
      res.redirect(`${clientUrl}/calendar-connect-callback?success=true`);
    } catch (error) {
      console.error('Error saving Google Calendar tokens:', error);
      res.redirect(`${clientUrl}/calendar-connect-callback?error=token_save_failed`);
    }
  })(req, res, next);
};

// Get Google Calendar status
router.get('/status', googleCalendarController.getGoogleCalendarStatus);

// Get Google Calendars for selection
router.get('/calendars', googleCalendarController.getGoogleCalendars);

// Save selected Google Calendars
router.post('/calendars', googleCalendarController.saveSelectedCalendars);

// Toggle Google Calendar sync
router.post('/toggle-sync', googleCalendarController.toggleSync);

// Disconnect Google Calendar
router.delete('/disconnect', googleCalendarController.disconnectGoogleCalendar);

// Manually sync all events to Google Calendar
router.post('/sync-all', googleCalendarController.syncAllEvents);

module.exports = { router, handleGoogleCalendarCallback }; 