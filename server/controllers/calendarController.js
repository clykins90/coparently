const { CalendarEvent, User, Child, CustodySchedule } = require('../models');
const { Op } = require('sequelize');
const googleCalendarService = require('../services/googleCalendarService');

// Get all events for a user within a date range
exports.getEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start, end } = req.query;
    
    // Validate date parameters
    if (!start || !end) {
      return res.status(400).json({ message: 'Start and end dates are required' });
    }
    
    // Find all events where the user is either the creator or the responsible parent
    const events = await CalendarEvent.findAll({
      where: {
        [Op.or]: [
          { created_by_id: userId },
          { responsible_parent_id: userId }
        ],
        start_time: {
          [Op.gte]: new Date(start)
        },
        end_time: {
          [Op.lte]: new Date(end)
        }
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: User,
          as: 'responsibleParent',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: Child,
          through: { attributes: [] },
          attributes: ['id', 'first_name', 'last_name']
        }
      ]
    });
    
    // Check if user has Google Calendar sync enabled
    const isGoogleCalendarSyncEnabled = await googleCalendarService.isGoogleCalendarSyncEnabled(userId);
    
    if (isGoogleCalendarSyncEnabled) {
      try {
        // Fetch Google Calendar events
        const googleEvents = await googleCalendarService.fetchGoogleCalendarEvents(userId, start, end);
        
        // Format Google Calendar events to match Coparently events format
        const formattedGoogleEvents = googleEvents.map(googleEvent => {
          // Check if this is an all-day event
          const isAllDay = !!googleEvent.start.date;
          
          // Create a Coparently-compatible event object
          return {
            id: `google_${googleEvent.id}`, // Prefix with 'google_' to distinguish from Coparently events
            title: googleEvent.summary || 'Untitled Event',
            description: googleEvent.description || '',
            start_time: isAllDay ? new Date(googleEvent.start.date) : new Date(googleEvent.start.dateTime),
            end_time: isAllDay ? new Date(googleEvent.end.date) : new Date(googleEvent.end.dateTime),
            location: googleEvent.location || '',
            is_all_day: isAllDay,
            event_type: 'other',
            color: googleEvent.colorId ? googleCalendarService.convertGoogleColorIdToColor(googleEvent.colorId) : null,
            isGoogleEvent: true, // Flag to identify Google Calendar events
            googleCalendarId: googleEvent.calendarId,
            googleCalendarName: googleEvent.calendarName,
            googleEventId: googleEvent.id
          };
        });
        
        // Combine Coparently events with Google Calendar events
        const allEvents = [...events, ...formattedGoogleEvents];
        return res.json(allEvents);
      } catch (error) {
        console.error('Error fetching Google Calendar events:', error);
        // If there's an error fetching Google Calendar events, just return Coparently events
        return res.json(events);
      }
    }
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new event
exports.createEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      title, description, start_time, end_time, location, 
      event_type, is_recurring, recurrence_pattern, is_all_day,
      responsible_parent_id, status, color, notes, child_ids 
    } = req.body;
    
    // Validate required fields
    if (!title || !start_time || !end_time) {
      return res.status(400).json({ message: 'Title, start time, and end time are required' });
    }
    
    // Create the event
    const newEvent = await CalendarEvent.create({
      title,
      description,
      start_time,
      end_time,
      location,
      event_type,
      is_recurring,
      recurrence_pattern,
      is_all_day,
      responsible_parent_id,
      created_by_id: userId,
      status,
      color,
      notes
    });
    
    // Associate children with the event if provided
    if (child_ids && child_ids.length > 0) {
      await newEvent.setChildren(child_ids);
    }
    
    // Fetch the complete event with associations
    const event = await CalendarEvent.findByPk(newEvent.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: User,
          as: 'responsibleParent',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: Child,
          through: { attributes: [] },
          attributes: ['id', 'first_name', 'last_name']
        }
      ]
    });
    
    // Sync with Google Calendar if enabled
    try {
      const isGoogleCalendarSyncEnabled = await googleCalendarService.isGoogleCalendarSyncEnabled(userId);
      
      if (isGoogleCalendarSyncEnabled) {
        // Sync the event to Google Calendar
        await googleCalendarService.syncEventToGoogle(userId, event);
      }
    } catch (error) {
      console.error('Error syncing event to Google Calendar:', error);
      // Continue even if Google Calendar sync fails
    }
    
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update an existing event
exports.updateEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { 
      title, description, start_time, end_time, location, 
      event_type, is_recurring, recurrence_pattern, is_all_day,
      responsible_parent_id, status, color, notes, child_ids 
    } = req.body;
    
    // Find the event
    const event = await CalendarEvent.findByPk(id);
    
    // Check if event exists
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is authorized to update the event
    if (event.created_by_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }
    
    // Update the event
    await event.update({
      title: title || event.title,
      description: description !== undefined ? description : event.description,
      start_time: start_time || event.start_time,
      end_time: end_time || event.end_time,
      location: location !== undefined ? location : event.location,
      event_type: event_type || event.event_type,
      is_recurring: is_recurring !== undefined ? is_recurring : event.is_recurring,
      recurrence_pattern: recurrence_pattern !== undefined ? recurrence_pattern : event.recurrence_pattern,
      is_all_day: is_all_day !== undefined ? is_all_day : event.is_all_day,
      responsible_parent_id: responsible_parent_id !== undefined ? responsible_parent_id : event.responsible_parent_id,
      status: status || event.status,
      color: color !== undefined ? color : event.color,
      notes: notes !== undefined ? notes : event.notes
    });
    
    // Update children if provided
    if (child_ids) {
      await event.setChildren(child_ids);
    }
    
    // Fetch the updated event with associations
    const updatedEvent = await CalendarEvent.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: User,
          as: 'responsibleParent',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: Child,
          through: { attributes: [] },
          attributes: ['id', 'first_name', 'last_name']
        }
      ]
    });
    
    // Sync with Google Calendar if enabled
    try {
      const isGoogleCalendarSyncEnabled = await googleCalendarService.isGoogleCalendarSyncEnabled(userId);
      
      if (isGoogleCalendarSyncEnabled) {
        // Sync the updated event to Google Calendar
        await googleCalendarService.syncEventToGoogle(userId, updatedEvent);
      }
    } catch (error) {
      console.error('Error syncing updated event to Google Calendar:', error);
      // Continue even if Google Calendar sync fails
    }
    
    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Find the event
    const event = await CalendarEvent.findByPk(id);
    
    // Check if event exists
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is authorized to delete the event
    if (event.created_by_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }
    
    // Check if Google Calendar sync is enabled before deleting
    try {
      const isGoogleCalendarSyncEnabled = await googleCalendarService.isGoogleCalendarSyncEnabled(userId);
      
      if (isGoogleCalendarSyncEnabled && event.google_calendar_event_id) {
        // Delete the event from Google Calendar
        await googleCalendarService.deleteEventFromGoogle(userId, event.google_calendar_event_id);
      }
    } catch (error) {
      console.error('Error deleting event from Google Calendar:', error);
      // Continue even if Google Calendar sync fails
    }
    
    // Delete the event
    await event.destroy();
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single event by ID
exports.getEventById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Find the event
    const event = await CalendarEvent.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: User,
          as: 'responsibleParent',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: Child,
          through: { attributes: [] },
          attributes: ['id', 'first_name', 'last_name']
        }
      ]
    });
    
    // Check if event exists
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is authorized to view the event
    if (event.created_by_id !== userId && event.responsible_parent_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this event' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a custody schedule
exports.createCustodySchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      title, description, start_date, end_date, schedule_type,
      schedule_pattern, is_active, child_ids, parent_ids
    } = req.body;
    
    // Validate required fields
    if (!title || !start_date || !schedule_pattern) {
      return res.status(400).json({ message: 'Title, start date, and schedule pattern are required' });
    }
    
    // Create the custody schedule
    const newSchedule = await CustodySchedule.create({
      title,
      description,
      start_date,
      end_date,
      schedule_type,
      schedule_pattern,
      is_active,
      created_by_id: userId,
      status: 'pending' // Default to pending until approved by other parent
    });
    
    // Associate children with the schedule if provided
    if (child_ids && child_ids.length > 0) {
      await newSchedule.setChildren(child_ids);
    }
    
    // Associate parents with the schedule
    if (parent_ids && parent_ids.length > 0) {
      await newSchedule.setParents(parent_ids);
    } else {
      // If no parent IDs provided, at least add the creator
      await newSchedule.setParents([userId]);
    }
    
    // Fetch the complete schedule with associations
    const schedule = await CustodySchedule.findByPk(newSchedule.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: User,
          as: 'parents',
          through: { attributes: [] },
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: Child,
          through: { attributes: [] },
          attributes: ['id', 'first_name', 'last_name']
        }
      ]
    });
    
    res.status(201).json(schedule);
  } catch (error) {
    console.error('Error creating custody schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all custody schedules for a user
exports.getCustodySchedules = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all schedules where the user is either the creator or a parent
    const schedules = await CustodySchedule.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: User,
          as: 'parents',
          through: { attributes: [] },
          attributes: ['id', 'first_name', 'last_name'],
          where: {
            id: userId
          }
        },
        {
          model: Child,
          through: { attributes: [] },
          attributes: ['id', 'first_name', 'last_name']
        }
      ]
    });
    
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching custody schedules:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update custody schedule status (approve/reject)
exports.updateCustodyScheduleStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (approved/rejected) is required' });
    }
    
    // Find the schedule
    const schedule = await CustodySchedule.findByPk(id, {
      include: [
        {
          model: User,
          as: 'parents',
          through: { attributes: [] },
          attributes: ['id']
        }
      ]
    });
    
    // Check if schedule exists
    if (!schedule) {
      return res.status(404).json({ message: 'Custody schedule not found' });
    }
    
    // Check if user is authorized to update the status
    const isParent = schedule.parents.some(parent => parent.id === userId);
    if (!isParent) {
      return res.status(403).json({ message: 'Not authorized to update this schedule' });
    }
    
    // Check if user is not the creator (creator can't approve their own schedule)
    if (schedule.created_by_id === userId) {
      return res.status(400).json({ message: 'Cannot approve/reject your own schedule' });
    }
    
    // Update the schedule status
    await schedule.update({ status });
    
    // Fetch the updated schedule with associations
    const updatedSchedule = await CustodySchedule.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: User,
          as: 'parents',
          through: { attributes: [] },
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: Child,
          through: { attributes: [] },
          attributes: ['id', 'first_name', 'last_name']
        }
      ]
    });
    
    res.json(updatedSchedule);
  } catch (error) {
    console.error('Error updating custody schedule status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 