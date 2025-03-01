/**
 * Centralized API service for making requests to the server
 */

const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * Get the JWT token from localStorage
 * @returns {string|null} - The JWT token or null if not found
 */
const getToken = () => {
  return localStorage.getItem('token');
};

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
  
  // Add authorization header if token exists
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Include credentials for session cookies
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

/**
 * Make a multipart form data request to the API (for file uploads)
 * @param {string} endpoint - The API endpoint to request
 * @param {FormData} formData - The form data to send
 * @returns {Promise<Object>} - The response data
 */
async function apiFileRequest(endpoint, formData) {
  const url = `${API_URL}${endpoint}`;
  
  // Set headers for file upload (no Content-Type, let browser set it with boundary)
  const headers = {};
  
  // Add authorization header if token exists
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include' // Include credentials for session cookies
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API file upload failed');
    }
    
    return data;
  } catch (error) {
    console.error('API file upload error:', error);
    throw error;
  }
}

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const data = await apiRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    // Store token in localStorage if available
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
    return data;
  },
    
  register: (userData) => 
    apiRequest('/api/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
    
  logout: () => {
    // Clear token from localStorage
    localStorage.removeItem('token');
    
    return apiRequest('/api/logout', {
      method: 'POST'
    });
  },
    
  checkAuth: () =>
    apiRequest('/api/check', {
      method: 'GET'
    }),
    
  googleLogin: () => {
    const baseUrl = API_URL || 'http://localhost:3001';
    const googleAuthUrl = `${baseUrl}/auth/google`;
    window.location.href = googleAuthUrl;
    return Promise.resolve({ success: true });
  }
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
    }),
    
  updateProfilePicture: (userId, imageFile) => {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('profilePicture', imageFile);
    
    return apiFileRequest('/api/profile/picture', formData);
  },
  
  removeProfilePicture: (userId) =>
    apiRequest('/api/profile/picture', {
      method: 'DELETE',
      body: JSON.stringify({ userId })
    })
};

// Partner API
export const partnerAPI = {
  getPartner: (userId) => 
    apiRequest(`/api/partner?userId=${userId}`),
    
  checkPartner: (email) =>
    apiRequest(`/api/check-partner?email=${encodeURIComponent(email)}`),
    
  requestPartner: (userId, partnerEmail) => 
    apiRequest('/api/request-partner', {
      method: 'POST',
      body: JSON.stringify({ userId, partnerEmail })
    }),
    
  getPendingRequests: (userId) =>
    apiRequest(`/api/pending-requests?userId=${userId}`),
    
  getOutgoingRequests: (userId) =>
    apiRequest(`/api/outgoing-requests?userId=${userId}`),
    
  respondToRequest: (requestId, userId, accept) =>
    apiRequest('/api/respond-request', {
      method: 'POST',
      body: JSON.stringify({ requestId, userId, accept })
    }),
    
  cancelRequest: (requestId, userId) =>
    apiRequest(`/api/cancel-request/${requestId}?userId=${userId}`, {
      method: 'DELETE'
    }),
    
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
    
  testFilter: (message, context = null) => 
    apiRequest('/api/test-filter', {
      method: 'POST',
      body: JSON.stringify({ message, context })
    })
};

export default {
  auth: authAPI,
  user: userAPI,
  partner: partnerAPI,
  message: messageAPI
}; 