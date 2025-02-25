/**
 * Centralized API service for making requests to the server
 */

const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * Make a request to the API
 * @param {string} endpoint - The API endpoint to request
 * @param {Object} options - The fetch options
 * @returns {Promise<Object>} - The response data
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data;
    } else {
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      return { success: true };
    }
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Auth API
export const authAPI = {
  login: (email, password) => 
    apiRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
    
  register: (userData) => 
    apiRequest('/api/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
    
  logout: () => 
    apiRequest('/api/logout', {
      method: 'POST'
    })
};

// User API
export const userAPI = {
  updateProfile: (userId, profileData) => 
    apiRequest('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({
        userId,
        ...profileData
      })
    })
};

// Partner API
export const partnerAPI = {
  getPartner: (userId) => 
    apiRequest(`/api/partner?userId=${userId}`),
    
  linkPartner: (userId, partnerEmail) => 
    apiRequest('/api/link-partner', {
      method: 'POST',
      body: JSON.stringify({ userId, partnerEmail })
    }),
    
  invitePartner: (userId, partnerEmail) => 
    apiRequest('/api/invite-partner', {
      method: 'POST',
      body: JSON.stringify({ userId, partnerEmail })
    }),
    
  unlinkPartner: (userId) => 
    apiRequest(`/api/partner/${userId}`, {
      method: 'DELETE'
    })
};

// Message API
export const messageAPI = {
  getMessages: (conversationId) => 
    apiRequest(`/api/conversations/${conversationId}/messages`),
    
  sendMessage: (conversationId, senderId, content) => 
    apiRequest(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ senderId, content })
    }),
    
  testFilter: (message) => 
    apiRequest('/api/test-filter', {
      method: 'POST',
      body: JSON.stringify({ message })
    })
};

export default {
  auth: authAPI,
  user: userAPI,
  partner: partnerAPI,
  message: messageAPI
}; 