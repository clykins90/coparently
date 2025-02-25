const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');

// Load environment variables
require('dotenv').config();

// Configure Passport to use Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // If no access token is provided, authentication failed
      if (!accessToken) {
        console.log('Google OAuth failed: No access token provided');
        return done(null, false, { message: 'Authentication failed' });
      }
      
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
          return done(null, existingUser);
        }
        
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
      
      return done(null, user);
    } catch (error) {
      console.error('Error in Google strategy:', error);
      return done(error, null);
    }
  }
));

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    console.error('Error deserializing user:', error);
    done(error, null);
  }
});

module.exports = passport; 