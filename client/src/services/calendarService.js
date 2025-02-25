/**
 * Service for handling calendar-related API calls
 */

/**
 * Get the JWT token from localStorage
 * @returns {string|null} - The JWT token or null if not found
 */
const getToken = () => {
  return localStorage.getItem('token');
};

const calendarService = {
  /**
   * Get events for a date range
   * @param {string} start - Start date in ISO format
   * @param {string} end - End date in ISO format
   * @returns {Promise<Array>} - Array of events
   */
  getEvents: async (start, end) => {
    try {
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/calendar/events?start=${start}&end=${end}`, {
        method: 'GET',
        credentials: 'include',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch events');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },
  
  /**
   * Create a new event
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} - Created event
   */
  createEvent: async (eventData) => {
    try {
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(eventData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create event');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing event
   * @param {number} eventId - Event ID
   * @param {Object} eventData - Updated event data
   * @returns {Promise<Object>} - Updated event
   */
  updateEvent: async (eventId, eventData) => {
    try {
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify(eventData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update event');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },
  
  /**
   * Delete an event
   * @param {number} eventId - Event ID
   * @returns {Promise<Object>} - Success message
   */
  deleteEvent: async (eventId) => {
    try {
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete event');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },
  
  /**
   * Get custody schedules
   * @returns {Promise<Array>} - Array of custody schedules
   */
  getCustodySchedules: async () => {
    try {
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/calendar/custody-schedules', {
        method: 'GET',
        credentials: 'include',
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch custody schedules');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching custody schedules:', error);
      throw error;
    }
  },
  
  /**
   * Create a new custody schedule
   * @param {Object} scheduleData - Schedule data
   * @returns {Promise<Object>} - Created schedule
   */
  createCustodySchedule: async (scheduleData) => {
    try {
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/calendar/custody-schedules', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(scheduleData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create custody schedule');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating custody schedule:', error);
      throw error;
    }
  },
  
  /**
   * Update custody schedule status (approve/reject)
   * @param {number} scheduleId - Schedule ID
   * @param {string} status - New status ('approved' or 'rejected')
   * @returns {Promise<Object>} - Updated schedule
   */
  updateCustodyScheduleStatus: async (scheduleId, status) => {
    try {
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/calendar/custody-schedules/${scheduleId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update custody schedule status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating custody schedule status:', error);
      throw error;
    }
  }
};

export default calendarService; 