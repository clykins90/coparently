/**
 * Google Calendar Controller
 * Handles API endpoints for Google Calendar integration
 */

const googleCalendarService = require('../services/googleCalendarService');
const { User, UserGoogleCalendar, UserSelectedCalendar } = require('../models');

/**
 * Get a user's Google Calendar connection status and sync settings
 */
exports.getGoogleCalendarStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user has Google Calendar tokens
    const userGoogleCalendar = await UserGoogleCalendar.findOne({
      where: { user_id: userId }
    });
    
    if (!userGoogleCalendar) {
      return res.json({
        connected: false,
        syncEnabled: false,
        message: 'Google Calendar not connected'
      });
    }
    
    // Get selected calendars
    const selectedCalendars = await UserSelectedCalendar.findAll({
      where: { user_id: userId }
    });
    
    res.json({
      connected: true,
      syncEnabled: userGoogleCalendar.sync_enabled,
      coparentlyCalendarId: userGoogleCalendar.coparently_calendar_id,
      selectedCalendarCount: selectedCalendars.length,
      lastUpdated: userGoogleCalendar.updated_at
    });
  } catch (error) {
    console.error('Error getting Google Calendar status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get user's Google Calendars for selection
 */
exports.getGoogleCalendars = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user has Google Calendar tokens
    const userTokens = await googleCalendarService.getUserGoogleTokens(userId);
    if (!userTokens) {
      return res.status(401).json({ 
        message: 'Google Calendar not connected',
        calendars: [] 
      });
    }
    
    // Create OAuth client with user's tokens
    const auth = googleCalendarService.createOAuth2Client(userTokens);
    
    // Get all calendars from Google
    const { google } = require('googleapis');
    const calendar = google.calendar({ version: 'v3', auth });
    const response = await calendar.calendarList.list();
    
    // Get user's selected calendars from database
    const selectedCalendars = await UserSelectedCalendar.findAll({
      where: { user_id: userId }
    });
    const selectedCalendarIds = selectedCalendars.map(cal => cal.google_calendar_id);
    
    // Format calendars for response
    const formattedCalendars = response.data.items.map(cal => ({
      id: cal.id,
      summary: cal.summary,
      description: cal.description,
      selected: selectedCalendarIds.includes(cal.id),
      primary: cal.primary === true,
      backgroundColor: cal.backgroundColor,
      foregroundColor: cal.foregroundColor
    }));
    
    res.json({ 
      calendars: formattedCalendars,
      count: formattedCalendars.length
    });
  } catch (error) {
    console.error('Error getting Google Calendars:', error);
    res.status(500).json({ message: 'Error fetching calendars', error: error.message });
  }
};

/**
 * Save selected Google Calendars
 */
exports.saveSelectedCalendars = async (req, res) => {
  try {
    const userId = req.user.id;
    const { calendars } = req.body;
    
    if (!Array.isArray(calendars)) {
      return res.status(400).json({ message: 'Invalid calendar data format' });
    }
    
    // Delete existing selections
    await UserSelectedCalendar.destroy({
      where: { user_id: userId }
    });
    
    // Add new selections
    if (calendars.length > 0) {
      const calendarRecords = calendars.map(calendar => ({
        user_id: userId,
        google_calendar_id: calendar.google_calendar_id,
        calendar_name: calendar.calendar_name,
        color: calendar.color,
        display_in_coparently: calendar.display_in_coparently || true
      }));
      
      await UserSelectedCalendar.bulkCreate(calendarRecords);
    }
    
    res.json({ 
      message: 'Calendar selections saved',
      count: calendars.length
    });
  } catch (error) {
    console.error('Error saving selected calendars:', error);
    res.status(500).json({ message: 'Error saving calendars', error: error.message });
  }
};

/**
 * Toggle Google Calendar sync
 */
exports.toggleSync = async (req, res) => {
  try {
    const userId = req.user.id;
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'Invalid enabled parameter' });
    }
    
    const result = await googleCalendarService.toggleGoogleCalendarSync(userId, enabled);
    
    if (!result.success) {
      return res.status(404).json({ message: result.message });
    }
    
    res.json({ 
      message: `Calendar sync ${enabled ? 'enabled' : 'disabled'}`, 
      syncEnabled: enabled 
    });
  } catch (error) {
    console.error('Error toggling Google Calendar sync:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Disconnect Google Calendar
 */
exports.disconnectGoogleCalendar = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Delete selected calendars
    await UserSelectedCalendar.destroy({
      where: { user_id: userId }
    });
    
    // Delete Google Calendar tokens
    await UserGoogleCalendar.destroy({
      where: { user_id: userId }
    });
    
    res.json({ message: 'Google Calendar disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Manually sync all events to Google Calendar
 */
exports.syncAllEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if sync is enabled
    const syncEnabled = await googleCalendarService.isGoogleCalendarSyncEnabled(userId);
    if (!syncEnabled) {
      return res.status(400).json({ message: 'Calendar sync is not enabled' });
    }
    
    // Get all calendar events for this user
    const { CalendarEvent } = require('../models');
    const events = await CalendarEvent.findAll({
      where: { created_by_id: userId }
    });
    
    // Sync each event to Google Calendar
    const results = {
      total: events.length,
      success: 0,
      failed: 0
    };
    
    for (const event of events) {
      try {
        await googleCalendarService.syncEventToGoogle(userId, event);
        results.success++;
      } catch (error) {
        console.error(`Error syncing event ${event.id}:`, error);
        results.failed++;
      }
    }
    
    res.json({
      message: 'Calendar sync completed',
      results
    });
  } catch (error) {
    console.error('Error syncing events to Google Calendar:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 