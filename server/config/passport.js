const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');
const jwt = require('jsonwebtoken');

// Load environment variables
require('dotenv').config();

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Strategy 1: Google OAuth for user authentication (no calendar access)
passport.use('google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3001/auth/google/callback",
    scope: ['profile', 'email'],
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google OAuth authentication callback received');
      
      // Check if profile has required fields
      if (!profile || !profile.id || !profile.emails || !profile.emails[0] || !profile.name) {
        console.log('Google OAuth failed: Incomplete profile data');
        return done(null, false, { message: 'Incomplete profile data' });
      }
      
      // Check if user already exists
      let user = await User.findOne({ where: { google_id: profile.id } });
      
      if (!user) {
        // Check if user exists with the same email
        const existingUser = await User.findOne({ where: { email: profile.emails[0].value } });
        
        if (existingUser) {
          // Link Google account to existing user
          existingUser.google_id = profile.id;
          existingUser.google_profile_picture = profile.photos ? profile.photos[0].value : null;
          existingUser.auth_provider = 'google';
          await existingUser.save();
          user = existingUser;
        } else {
          // Create a new user
          user = await User.create({
            username: profile.emails[0].value,
            email: profile.emails[0].value,
            first_name: profile.name.givenName,
            last_name: profile.name.familyName,
            google_id: profile.id,
            google_profile_picture: profile.photos ? profile.photos[0].value : null,
            auth_provider: 'google'
          });
        }
      }
      
      // Generate JWT for client-side authentication
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Pass both the user and token to the callback
      return done(null, user, { token });
    } catch (error) {
      console.error('Error in Google authentication strategy:', error);
      return done(error, null);
    }
  }
));

// Strategy 2: Google Calendar authorization (separate from authentication)
passport.use('google-calendar', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALENDAR_CALLBACK_URL,
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'],
    passReqToCallback: true,
    accessType: 'offline',
    prompt: 'consent'
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google Calendar authorization callback received');
      
      if (!accessToken) {
        console.error('No access token received from Google Calendar authorization');
        return done(null, false, { message: 'Authorization failed' });
      }
      
      // Get user ID from multiple possible sources
      let userId = null;
      
      // 1. Try calendarUserId (set in handleGoogleCalendarCallback)
      if (req.calendarUserId) {
        userId = req.calendarUserId;
        console.log(`Using userId ${userId} from request.calendarUserId`);
      }
      // 2. Try to get from session
      else if (req.session && req.session.calendarUserId) {
        userId = req.session.calendarUserId;
        console.log(`Using userId ${userId} from session`);
      }
      // 3. Try to get from authenticated user
      else if (req.user) {
        userId = req.user.id;
        console.log(`Using userId ${userId} from authenticated user`);
      }
      // 4. Try to get from state parameter
      else if (req.query.state) {
        try {
          const stateData = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
          if (stateData.userId) {
            userId = stateData.userId;
            console.log(`Using userId ${userId} from state parameter`);
          }
        } catch (error) {
          console.error('Error decoding state parameter:', error);
        }
      }
      
      if (!userId) {
        console.error('No user ID found in any source');
        return done(new Error('User not authenticated'), null);
      }
      
      // Find user in database
      const user = await User.findByPk(userId);
      if (!user) {
        console.error(`User with ID ${userId} not found`);
        return done(new Error('User not found'), null);
      }
      
      // Pass tokens and user to the callback
      const tokens = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expiry_date: Date.now() + 3600 * 1000 // Default expiry of 1 hour
      };
      
      return done(null, user, tokens);
    } catch (error) {
      console.error('Error in Google Calendar authorization strategy:', error);
      return done(error, null);
    }
  }
));

module.exports = passport; 