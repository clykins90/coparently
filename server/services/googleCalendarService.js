/**
 * Google Calendar API Service
 * Handles interactions with the Google Calendar API for two-way sync
 */

const { google } = require('googleapis');
const { User, UserGoogleCalendar, UserSelectedCalendar, EventSyncMapping, CalendarEvent } = require('../models');
const { Op } = require('sequelize');

/**
 * Create an OAuth2 client with the given credentials
 * @param {Object} tokens - The OAuth2 tokens
 * @returns {OAuth2Client} The OAuth2 client
 */
const createOAuth2Client = (tokens) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALENDAR_CALLBACK_URL
  );
  
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.token_expiry ? new Date(tokens.token_expiry).getTime() : null
  });
  
  return oauth2Client;
};

/**
 * Get a user's Google Calendar tokens
 * @param {number} userId - The user ID
 * @returns {Promise<Object|null>} The tokens or null if not found
 */
const getUserGoogleTokens = async (userId) => {
  try {
    const userGoogleCalendar = await UserGoogleCalendar.findOne({
      where: { user_id: userId }
    });
    
    if (!userGoogleCalendar || !userGoogleCalendar.refresh_token) {
      return null;
    }
    
    return {
      access_token: userGoogleCalendar.access_token,
      refresh_token: userGoogleCalendar.refresh_token,
      token_expiry: userGoogleCalendar.token_expiry
    };
  } catch (error) {
    console.error('Error getting user Google tokens:', error);
    return null;
  }
};

/**
 * Save or update a user's Google Calendar tokens
 * @param {number} userId - The user ID
 * @param {Object} tokens - The tokens to save
 * @returns {Promise<boolean>} Success status
 */
const saveUserGoogleTokens = async (userId, tokens) => {
  try {
    // Normalize token structure - handle different formats that might come from OAuth
    const normalizedTokens = {
      access_token: tokens.access_token || tokens.accessToken,
      refresh_token: tokens.refresh_token || tokens.refreshToken,
      expiry_date: tokens.expiry_date || tokens.expiry || 
                  (tokens.expires_in ? Date.now() + (tokens.expires_in * 1000) : null)
    };
    
    // Validate tokens
    if (!normalizedTokens.access_token) {
      console.error('No access token provided for user', userId);
      return false;
    }
    
    const [userGoogleCalendar, created] = await UserGoogleCalendar.findOrCreate({
      where: { user_id: userId },
      defaults: {
        user_id: userId,
        access_token: normalizedTokens.access_token,
        refresh_token: normalizedTokens.refresh_token,
        token_expiry: normalizedTokens.expiry_date ? new Date(normalizedTokens.expiry_date) : null,
        sync_enabled: true
      }
    });
    
    if (!created) {
      // Update existing tokens
      userGoogleCalendar.access_token = normalizedTokens.access_token;
      
      // Only update refresh token if provided
      if (normalizedTokens.refresh_token) {
        userGoogleCalendar.refresh_token = normalizedTokens.refresh_token;
      }
      
      // Update token expiry
      if (normalizedTokens.expiry_date) {
        userGoogleCalendar.token_expiry = new Date(normalizedTokens.expiry_date);
      }
      
      await userGoogleCalendar.save();
    }
    
    return true;
  } catch (error) {
    console.error('Error saving user Google tokens:', error);
    return false;
  }
};

/**
 * Get or create the Coparently calendar in Google Calendar
 * @param {OAuth2Client} auth - The authenticated OAuth2 client
 * @param {number} userId - The user ID
 * @returns {Promise<string|null>} The calendar ID or null on error
 */
const getOrCreateCoparentlyCalendar = async (auth, userId) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth });
    
    // Check if we already have the Coparently calendar ID stored
    const userGoogleCalendar = await UserGoogleCalendar.findOne({
      where: { user_id: userId }
    });
    
    if (userGoogleCalendar && userGoogleCalendar.coparently_calendar_id) {
      // Verify the calendar still exists
      try {
        await calendar.calendars.get({
          calendarId: userGoogleCalendar.coparently_calendar_id
        });
        return userGoogleCalendar.coparently_calendar_id;
      } catch (error) {
        // Calendar doesn't exist or is inaccessible, create a new one
        console.log('Stored Coparently calendar not found, creating a new one');
      }
    }
    
    // Check if Coparently calendar already exists in user's calendar list
    const calendarList = await calendar.calendarList.list();
    const coparentlyCalendar = calendarList.data.items.find(
      cal => cal.summary === 'Coparently'
    );
    
    if (coparentlyCalendar) {
      // Store the calendar ID
      if (userGoogleCalendar) {
        userGoogleCalendar.coparently_calendar_id = coparentlyCalendar.id;
        await userGoogleCalendar.save();
      }
      return coparentlyCalendar.id;
    }
    
    // Create new calendar
    const newCalendar = await calendar.calendars.insert({
      requestBody: {
        summary: 'Coparently',
        description: 'Calendar for Coparently events',
        timeZone: 'America/Los_Angeles' // Default timezone, can be customized
      }
    });
    
    // Store the calendar ID
    if (userGoogleCalendar) {
      userGoogleCalendar.coparently_calendar_id = newCalendar.data.id;
      await userGoogleCalendar.save();
    }
    
    return newCalendar.data.id;
  } catch (error) {
    console.error('Error getting or creating Coparently calendar:', error);
    return null;
  }
};

/**
 * Get the mapping between a Coparently event and Google Calendar event
 * @param {number} coparentlyEventId - The Coparently event ID
 * @returns {Promise<Object|null>} The mapping or null if not found
 */
const getEventMapping = async (coparentlyEventId) => {
  try {
    return await EventSyncMapping.findOne({
      where: { coparently_event_id: coparentlyEventId }
    });
  } catch (error) {
    console.error('Error getting event mapping:', error);
    return null;
  }
};

/**
 * Create a mapping between a Coparently event and Google Calendar event
 * @param {number} coparentlyEventId - The Coparently event ID
 * @param {string} googleEventId - The Google Calendar event ID
 * @param {string} googleCalendarId - The Google Calendar ID
 * @returns {Promise<Object|null>} The created mapping or null on error
 */
const createEventMapping = async (coparentlyEventId, googleEventId, googleCalendarId) => {
  try {
    return await EventSyncMapping.create({
      coparently_event_id: coparentlyEventId,
      google_event_id: googleEventId,
      google_calendar_id: googleCalendarId,
      last_synced: new Date()
    });
  } catch (error) {
    console.error('Error creating event mapping:', error);
    return null;
  }
};

/**
 * Update an event mapping's last synced timestamp
 * @param {number} mappingId - The mapping ID
 * @returns {Promise<boolean>} Success status
 */
const updateEventMappingTimestamp = async (mappingId) => {
  try {
    const mapping = await EventSyncMapping.findByPk(mappingId);
    if (mapping) {
      mapping.last_synced = new Date();
      await mapping.save();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating event mapping timestamp:', error);
    return false;
  }
};

/**
 * Convert a Coparently event to Google Calendar event format
 * @param {Object} event - The Coparently event
 * @returns {Object} The Google Calendar event
 */
const formatEventForGoogle = (event) => {
  // Format the event for Google Calendar
  const googleEvent = {
    summary: event.title,
    description: event.description || '',
    location: event.location || '',
    start: {
      dateTime: event.start_time,
      timeZone: 'America/Los_Angeles', // Default timezone, can be customized
    },
    end: {
      dateTime: event.end_time,
      timeZone: 'America/Los_Angeles', // Default timezone, can be customized
    },
    // Store Coparently event ID in extended properties
    extendedProperties: {
      private: {
        coparentlyEventId: event.id.toString(),
        eventType: event.event_type,
        isCoparentlyEvent: 'true'
      }
    }
  };
  
  // Handle all-day events
  if (event.is_all_day) {
    // For all-day events, use date instead of dateTime
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);
    
    // Format as YYYY-MM-DD
    googleEvent.start = {
      date: startDate.toISOString().split('T')[0],
      timeZone: 'America/Los_Angeles',
    };
    
    // For all-day events, the end date is exclusive in Google Calendar
    // So we need to add one day to the end date
    endDate.setDate(endDate.getDate() + 1);
    googleEvent.end = {
      date: endDate.toISOString().split('T')[0],
      timeZone: 'America/Los_Angeles',
    };
  }
  
  // Add color if specified
  if (event.color) {
    googleEvent.colorId = convertColorToGoogleColorId(event.color);
  }
  
  return googleEvent;
};

/**
 * Convert a Google Calendar event to Coparently event format
 * @param {Object} googleEvent - The Google Calendar event
 * @param {number} userId - The user ID
 * @returns {Object} The Coparently event
 */
const formatGoogleEventForCoparently = (googleEvent, userId) => {
  // Check if this is an all-day event
  const isAllDay = !!googleEvent.start.date;
  
  // Format the event for Coparently
  const coparentlyEvent = {
    title: googleEvent.summary,
    description: googleEvent.description || '',
    location: googleEvent.location || '',
    is_all_day: isAllDay,
    created_by_id: userId,
    responsible_parent_id: userId,
    event_type: 'other', // Default type for Google Calendar events
    status: 'approved',
    color: convertGoogleColorIdToColor(googleEvent.colorId)
  };
  
  // Handle start and end times based on whether it's an all-day event
  if (isAllDay) {
    // For all-day events, use the date
    coparentlyEvent.start_time = new Date(googleEvent.start.date);
    
    // Google's end date is exclusive, so subtract one day
    const endDate = new Date(googleEvent.end.date);
    endDate.setDate(endDate.getDate() - 1);
    coparentlyEvent.end_time = endDate;
  } else {
    // For regular events, use the dateTime
    coparentlyEvent.start_time = new Date(googleEvent.start.dateTime);
    coparentlyEvent.end_time = new Date(googleEvent.end.dateTime);
  }
  
  return coparentlyEvent;
};

/**
 * Convert a color hex code to Google Calendar color ID
 * @param {string} color - The color hex code
 * @returns {string} The Google Calendar color ID
 */
const convertColorToGoogleColorId = (color) => {
  // Google Calendar uses color IDs 1-11
  // This is a simple mapping of common colors to Google color IDs
  const colorMap = {
    '#a4bdfc': '1', // Lavender
    '#7ae7bf': '2', // Sage
    '#dbadff': '3', // Grape
    '#ff887c': '4', // Flamingo
    '#fbd75b': '5', // Banana
    '#ffb878': '6', // Tangerine
    '#46d6db': '7', // Peacock
    '#e1e1e1': '8', // Graphite
    '#5484ed': '9', // Blueberry
    '#51b749': '10', // Basil
    '#dc2127': '11', // Tomato
  };
  
  // Default to Peacock (blue) if no match
  return colorMap[color.toLowerCase()] || '7';
};

/**
 * Convert a Google Calendar color ID to color hex code
 * @param {string} colorId - The Google Calendar color ID
 * @returns {string} The color hex code
 */
const convertGoogleColorIdToColor = (colorId) => {
  // Google Calendar uses color IDs 1-11
  // This is a simple mapping of Google color IDs to hex codes
  const colorMap = {
    '1': '#a4bdfc', // Lavender
    '2': '#7ae7bf', // Sage
    '3': '#dbadff', // Grape
    '4': '#ff887c', // Flamingo
    '5': '#fbd75b', // Banana
    '6': '#ffb878', // Tangerine
    '7': '#46d6db', // Peacock
    '8': '#e1e1e1', // Graphite
    '9': '#5484ed', // Blueberry
    '10': '#51b749', // Basil
    '11': '#dc2127', // Tomato
  };
  
  // Default to Peacock (blue) if no match
  return colorMap[colorId] || '#46d6db';
};

/**
 * Sync a Coparently event to Google Calendar
 * @param {number} userId - The user ID
 * @param {Object} event - The Coparently event
 * @returns {Promise<boolean>} Success status
 */
const syncEventToGoogle = async (userId, event) => {
  try {
    // Get user's Google tokens
    const userTokens = await getUserGoogleTokens(userId);
    if (!userTokens) {
      console.log(`User ${userId} has no Google Calendar tokens`);
      return false;
    }
    
    // Check if sync is enabled
    const userGoogleCalendar = await UserGoogleCalendar.findOne({
      where: { user_id: userId }
    });
    
    if (!userGoogleCalendar || !userGoogleCalendar.sync_enabled) {
      console.log(`Google Calendar sync is disabled for user ${userId}`);
      return false;
    }
    
    const auth = createOAuth2Client(userTokens);
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = await getOrCreateCoparentlyCalendar(auth, userId);
    
    if (!calendarId) {
      console.error(`Failed to get or create Coparently calendar for user ${userId}`);
      return false;
    }
    
    // Format event for Google Calendar
    const googleEvent = formatEventForGoogle(event);
    
    // Check if event already exists in Google Calendar
    const existingMapping = await getEventMapping(event.id);
    
    if (existingMapping && existingMapping.google_event_id) {
      // Update existing event
      try {
        await calendar.events.update({
          calendarId,
          eventId: existingMapping.google_event_id,
          requestBody: googleEvent
        });
        
        // Update last synced timestamp
        await updateEventMappingTimestamp(existingMapping.id);
        
        console.log(`Updated Google Calendar event ${existingMapping.google_event_id} for Coparently event ${event.id}`);
        return true;
      } catch (error) {
        // If the event doesn't exist in Google Calendar anymore, create a new one
        if (error.code === 404) {
          console.log(`Google Calendar event ${existingMapping.google_event_id} not found, creating a new one`);
          
          // Delete the old mapping
          await existingMapping.destroy();
          
          // Create a new event
          const response = await calendar.events.insert({
            calendarId,
            requestBody: googleEvent
          });
          
          // Create a new mapping
          await createEventMapping(event.id, response.data.id, calendarId);
          
          console.log(`Created new Google Calendar event ${response.data.id} for Coparently event ${event.id}`);
          return true;
        }
        
        console.error(`Error updating Google Calendar event ${existingMapping.google_event_id}:`, error);
        return false;
      }
    } else {
      // Create new event
      try {
        const response = await calendar.events.insert({
          calendarId,
          requestBody: googleEvent
        });
        
        // Store mapping between Coparently and Google event IDs
        await createEventMapping(event.id, response.data.id, calendarId);
        
        console.log(`Created Google Calendar event ${response.data.id} for Coparently event ${event.id}`);
        return true;
      } catch (error) {
        console.error(`Error creating Google Calendar event for Coparently event ${event.id}:`, error);
        return false;
      }
    }
  } catch (error) {
    console.error(`Error syncing event ${event.id} to Google Calendar:`, error);
    return false;
  }
};

/**
 * Delete a Coparently event from Google Calendar
 * @param {number} userId - The user ID
 * @param {number} eventId - The Coparently event ID
 * @returns {Promise<boolean>} Success status
 */
const deleteEventFromGoogle = async (userId, eventId) => {
  try {
    // Get user's Google tokens
    const userTokens = await getUserGoogleTokens(userId);
    if (!userTokens) {
      console.log(`User ${userId} has no Google Calendar tokens`);
      return false;
    }
    
    // Check if event exists in Google Calendar
    const existingMapping = await getEventMapping(eventId);
    if (!existingMapping || !existingMapping.google_event_id) {
      console.log(`No Google Calendar mapping found for Coparently event ${eventId}`);
      return true; // Nothing to delete
    }
    
    const auth = createOAuth2Client(userTokens);
    const calendar = google.calendar({ version: 'v3', auth });
    
    // Delete the event from Google Calendar
    try {
      await calendar.events.delete({
        calendarId: existingMapping.google_calendar_id,
        eventId: existingMapping.google_event_id
      });
      
      // Delete the mapping
      await existingMapping.destroy();
      
      console.log(`Deleted Google Calendar event ${existingMapping.google_event_id} for Coparently event ${eventId}`);
      return true;
    } catch (error) {
      // If the event doesn't exist in Google Calendar anymore, just delete the mapping
      if (error.code === 404) {
        console.log(`Google Calendar event ${existingMapping.google_event_id} not found, deleting mapping`);
        await existingMapping.destroy();
        return true;
      }
      
      console.error(`Error deleting Google Calendar event ${existingMapping.google_event_id}:`, error);
      return false;
    }
  } catch (error) {
    console.error(`Error deleting event ${eventId} from Google Calendar:`, error);
    return false;
  }
};

/**
 * Get a user's Google Calendars
 * @param {number} userId - The user ID
 * @returns {Promise<Array|null>} The calendars or null on error
 */
const getUserGoogleCalendars = async (userId) => {
  try {
    // Get user's Google tokens
    const userTokens = await getUserGoogleTokens(userId);
    if (!userTokens) {
      console.log(`User ${userId} has no Google Calendar tokens`);
      return null;
    }
    
    const auth = createOAuth2Client(userTokens);
    const calendar = google.calendar({ version: 'v3', auth });
    
    // Get the user's calendar list
    const response = await calendar.calendarList.list();
    
    return response.data.items.map(cal => ({
      id: cal.id,
      name: cal.summary,
      description: cal.description,
      color: cal.backgroundColor,
      primary: cal.primary || false,
      accessRole: cal.accessRole
    }));
  } catch (error) {
    console.error(`Error getting Google Calendars for user ${userId}:`, error);
    return null;
  }
};

/**
 * Save a user's selected Google Calendars
 * @param {number} userId - The user ID
 * @param {Array} calendars - The calendars to save
 * @returns {Promise<boolean>} Success status
 */
const saveUserSelectedCalendars = async (userId, calendars) => {
  try {
    // Delete existing selected calendars
    await UserSelectedCalendar.destroy({
      where: { user_id: userId }
    });
    
    // Create new selected calendars
    for (const cal of calendars) {
      await UserSelectedCalendar.create({
        user_id: userId,
        google_calendar_id: cal.id,
        calendar_name: cal.name,
        color: cal.color,
        display_in_coparently: cal.display || true
      });
    }
    
    return true;
  } catch (error) {
    console.error(`Error saving selected calendars for user ${userId}:`, error);
    return false;
  }
};

/**
 * Get a user's selected Google Calendars
 * @param {number} userId - The user ID
 * @returns {Promise<Array>} The selected calendars
 */
const getUserSelectedCalendars = async (userId) => {
  try {
    return await UserSelectedCalendar.findAll({
      where: { user_id: userId }
    });
  } catch (error) {
    console.error(`Error getting selected calendars for user ${userId}:`, error);
    return [];
  }
};

/**
 * Fetch events from a user's Google Calendars
 * @param {number} userId - The user ID
 * @param {string} startDate - The start date in ISO format
 * @param {string} endDate - The end date in ISO format
 * @returns {Promise<Array>} The events
 */
const fetchGoogleCalendarEvents = async (userId, startDate, endDate) => {
  try {
    // Get user's Google tokens
    const userTokens = await getUserGoogleTokens(userId);
    if (!userTokens) {
      console.log(`User ${userId} has no Google Calendar tokens`);
      return [];
    }
    
    // Get user's selected calendars
    const selectedCalendars = await getUserSelectedCalendars(userId);
    if (!selectedCalendars || selectedCalendars.length === 0) {
      console.log(`User ${userId} has no selected Google Calendars`);
      return [];
    }
    
    const auth = createOAuth2Client(userTokens);
    const calendar = google.calendar({ version: 'v3', auth });
    
    const allEvents = [];
    
    // Fetch events from each selected calendar
    for (const cal of selectedCalendars) {
      if (!cal.display_in_coparently) continue;
      
      try {
        const response = await calendar.events.list({
          calendarId: cal.google_calendar_id,
          timeMin: new Date(startDate).toISOString(),
          timeMax: new Date(endDate).toISOString(),
          singleEvents: true,
          orderBy: 'startTime'
        });
        
        // Filter out events that are already synced from Coparently
        const events = response.data.items.filter(event => {
          const extProps = event.extendedProperties?.private || {};
          return extProps.isCoparentlyEvent !== 'true';
        });
        
        // Add calendar info to each event
        events.forEach(event => {
          event.calendarId = cal.google_calendar_id;
          event.calendarName = cal.calendar_name;
          event.calendarColor = cal.color;
        });
        
        allEvents.push(...events);
      } catch (error) {
        console.error(`Error fetching events from calendar ${cal.calendar_name}:`, error);
      }
    }
    
    return allEvents;
  } catch (error) {
    console.error(`Error fetching Google Calendar events for user ${userId}:`, error);
    return [];
  }
};

/**
 * Enable or disable Google Calendar sync for a user
 * @param {number} userId - The user ID
 * @param {boolean} enabled - Whether sync is enabled
 * @returns {Promise<boolean>} Success status
 */
const toggleGoogleCalendarSync = async (userId, enabled) => {
  try {
    const userGoogleCalendar = await UserGoogleCalendar.findOne({
      where: { user_id: userId }
    });
    
    if (!userGoogleCalendar) {
      console.log(`No Google Calendar settings found for user ${userId}`);
      return { success: false, message: 'Google Calendar not connected' };
    }
    
    userGoogleCalendar.sync_enabled = enabled;
    await userGoogleCalendar.save();
    
    return { success: true, message: `Calendar sync ${enabled ? 'enabled' : 'disabled'}` };
  } catch (error) {
    console.error(`Error toggling Google Calendar sync for user ${userId}:`, error);
    return { success: false, message: 'Failed to toggle Google Calendar sync' };
  }
};

/**
 * Check if a user has Google Calendar sync enabled
 * @param {number} userId - The user ID
 * @returns {Promise<boolean>} Whether sync is enabled
 */
const isGoogleCalendarSyncEnabled = async (userId) => {
  try {
    const userGoogleCalendar = await UserGoogleCalendar.findOne({
      where: { user_id: userId }
    });
    
    return userGoogleCalendar ? userGoogleCalendar.sync_enabled : false;
  } catch (error) {
    console.error(`Error checking Google Calendar sync status for user ${userId}:`, error);
    return false;
  }
};

module.exports = {
  createOAuth2Client,
  getUserGoogleTokens,
  saveUserGoogleTokens,
  getOrCreateCoparentlyCalendar,
  syncEventToGoogle,
  deleteEventFromGoogle,
  getUserGoogleCalendars,
  saveUserSelectedCalendars,
  getUserSelectedCalendars,
  fetchGoogleCalendarEvents,
  toggleGoogleCalendarSync,
  isGoogleCalendarSyncEnabled
}; 