const { CalendarEvent, User, Child, CustodySchedule } = require('../models');
const { Op } = require('sequelize');

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
      status,
      color,
      notes
    });
    
    // Update children associations if provided
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