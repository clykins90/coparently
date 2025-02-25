/**
 * Service for managing children
 */

/**
 * Get the JWT token from localStorage
 * @returns {string|null} - The JWT token or null if not found
 */
const getToken = () => {
  return localStorage.getItem('token');
};

const childrenService = {
  /**
   * Get all children for the current user
   * @returns {Promise<Array>} - Array of children
   */
  getChildren: async () => {
    try {
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/children', {
        method: 'GET',
        credentials: 'include',
        headers
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
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/children/${childId}`, {
        method: 'GET',
        credentials: 'include',
        headers
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
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/children', {
        method: 'POST',
        credentials: 'include',
        headers,
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
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/children/${childId}`, {
        method: 'PUT',
        credentials: 'include',
        headers,
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
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/children/${childId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers
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

export default childrenService; 