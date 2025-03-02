/**
 * Centralized API service for making requests to the server
 */

const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * Get the JWT token from localStorage
 * @returns {string|null} - The JWT token or null if not found
 */
function getToken() {
  return localStorage.getItem('token');
}

/**
 * Make a request to the API
 * @param {string} endpoint - The API endpoint to request (e.g. "/api/users/children")
 * @param {Object} options - The fetch options (method, body, headers, etc.)
 * @returns {Promise<Object>} - The parsed JSON response data
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Add authorization if token present
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    // Prepare final fetch options
    const fetchOptions = {
      ...options,
      headers,
      credentials: 'include', // for cookies/sessions
      mode: 'cors'
    };

    console.log(`[API] Request: ${fetchOptions.method || 'GET'} ${url}`);
    const response = await fetch(url, fetchOptions);
    
    // Attempt to parse JSON (if applicable)
    const contentType = response.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // For non-JSON responses, just store as text or something similar
      data = { success: response.ok };
    }

    if (!response.ok) {
      console.error(`[API] Request failed: ${response.status}`, data);
      throw new Error(data.message || `API request failed with status ${response.status}`);
    }

    console.log(`[API] Request successful: ${response.status}`, data);
    return data;
  } catch (error) {
    console.error('[API] Error:', error);
    throw error;
  }
}

/**
 * Make a multipart/form-data request to the API (file uploads)
 * @param {string} endpoint
 * @param {FormData} formData
 * @returns {Promise<Object>}
 */
async function apiFileRequest(endpoint, formData) {
  const url = `${API_URL}${endpoint}`;

  // Prepare headers
  const headers = {};
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include'
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'File upload failed');
    }
    return data;
  } catch (error) {
    console.error('[API] File upload error:', error);
    throw error;
  }
}

// Authentication endpoints
export const authAPI = {
  login: (credentials) =>
    apiRequest('/api/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  register: (userData) =>
    apiRequest('/api/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  googleLogin: (tokenId) =>
    apiRequest('/api/google', {
      method: 'POST',
      body: JSON.stringify({ tokenId })
    }),

  logout: async () => {
    // Clears token locally, tries both /auth/logout and /api/logout
    try {
      localStorage.removeItem('token');
      console.log('[AUTH] Removed token from localStorage');
      
      let result;
      try {
        // Attempt the /auth/logout route
        result = await apiRequest('/auth/logout', { method: 'POST' });
      } catch (firstAttemptError) {
        console.log('[AUTH] /auth/logout failed, attempting /api/logout');
        result = await apiRequest('/api/logout', { method: 'POST' });
      }
      console.log('[AUTH] Server logout result:', result);

      // Also remove user from localStorage
      localStorage.removeItem('user');
      console.log('[AUTH] Removed user from localStorage');

      // Clear cookies
      document.cookie.split(';').forEach(c => {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });

      return { success: true };
    } catch (error) {
      console.error('[AUTH] Logout error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error;
    }
  },

  getCurrentUser: () => apiRequest('/api/me'),

  checkAuth: () => apiRequest('/api/check'),

  verifyChildInvitation: (token) =>
    apiRequest(`/api/verify-child-invitation?token=${token}`),

  completeChildSignup: (data) =>
    apiRequest('/api/complete-child-signup', {
      method: 'POST',
      body: JSON.stringify(data)
    })
};

// User endpoints
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

// Partner endpoints
export const partnerAPI = {
  getPartner: (userId) => apiRequest(`/api/partner?userId=${userId}`),

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
    apiRequest(`/api/partner/${userId}`, { method: 'DELETE' })
};

// Message endpoints
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
    }),

  getConversations: () => apiRequest('/api/conversations')
};

// -------------------------------------
// Child user endpoints at /api/users/children
// -------------------------------------
export const childUserAPI = {
  // GET /api/users/children
  getChildUsers: () => apiRequest('/api/users/children'),

  // POST /api/users/children
  createChildUser: (childData) =>
    apiRequest('/api/users/children', {
      method: 'POST',
      body: JSON.stringify(childData)
    }),

  // PUT /api/users/children/:childId
  updateChildUser: (childId, childData) =>
    apiRequest(`/api/users/children/${childId}`, {
      method: 'PUT',
      body: JSON.stringify(childData)
    }),

  // DELETE /api/users/children/:childId
  deleteChildUser: (childId) =>
    apiRequest(`/api/users/children/${childId}`, {
      method: 'DELETE'
    }),

  // POST /api/users/children/invite
  inviteChildUser: (inviteData) =>
    apiRequest('/api/users/children/invite', {
      method: 'POST',
      body: JSON.stringify(inviteData)
    })
};

export default {
  auth: authAPI,
  user: userAPI,
  partner: partnerAPI,
  message: messageAPI,
  childUser: childUserAPI
};