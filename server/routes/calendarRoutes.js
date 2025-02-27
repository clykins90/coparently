const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { authenticateUser } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Calendar event routes
router.get('/events', calendarController.getEvents);
router.post('/events', calendarController.createEvent);
router.get('/events/:id', calendarController.getEventById);
router.put('/events/:id', calendarController.updateEvent);
router.delete('/events/:id', calendarController.deleteEvent);

// Custody schedule routes
router.get('/custody-schedules', calendarController.getCustodySchedules);
router.post('/custody-schedules', calendarController.createCustodySchedule);
router.put('/custody-schedules/:id/status', calendarController.updateCustodyScheduleStatus);

module.exports = router; 