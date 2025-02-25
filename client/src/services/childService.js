/**
 * Service for handling child-related API calls
 */
const childService = {
  /**
   * Get all children for the current user
   * @returns {Promise<Array>} - Array of children
   */
  getChildren: async () => {
    try {
      const response = await fetch('/api/calendar/children', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch children');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching children:', error);
      throw error;
    }
  },
  
  /**
   * Get a child by ID
   * @param {number} childId - Child ID
   * @returns {Promise<Object>} - Child data
   */
  getChildById: async (childId) => {
    try {
      const response = await fetch(`/api/calendar/children/${childId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch child');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching child:', error);
      throw error;
    }
  },
  
  /**
   * Create a new child
   * @param {Object} childData - Child data
   * @returns {Promise<Object>} - Created child
   */
  createChild: async (childData) => {
    try {
      const response = await fetch('/api/calendar/children', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(childData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create child');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating child:', error);
      throw error;
    }
  },
  
  /**
   * Update an existing child
   * @param {number} childId - Child ID
   * @param {Object} childData - Updated child data
   * @returns {Promise<Object>} - Updated child
   */
  updateChild: async (childId, childData) => {
    try {
      const response = await fetch(`/api/calendar/children/${childId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(childData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update child');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating child:', error);
      throw error;
    }
  },
  
  /**
   * Delete a child
   * @param {number} childId - Child ID
   * @returns {Promise<Object>} - Success message
   */
  deleteChild: async (childId) => {
    try {
      const response = await fetch(`/api/calendar/children/${childId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete child');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting child:', error);
      throw error;
    }
  }
};

export default childService; 