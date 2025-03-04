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
    
    try {
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // For non-JSON responses, just store as text or something similar
        data = { success: response.ok };
      }
    } catch (parseError) {
      console.error(`[API] Error parsing response: ${parseError.message}`);
      data = { success: response.ok, error: 'Invalid response format' };
    }

    if (!response.ok) {
      console.error(`[API] Request failed: ${response.status}`, data);
      throw new Error(data.message || `API request failed with status ${response.status}`);
    }

    // For Google Calendar specific endpoints, format the return data properly
    if (endpoint.includes('/google-calendar/') && response.ok) {
      return { success: true, data };
    }

    console.log(`[API] Request successful: ${response.status}`, data);
    // Return the data directly instead of wrapping it in a new object
    // This preserves the original structure from the server
    return { success: true, ...data };
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

  sendMessage: (conversationId, senderId, content, bypassAiFilter = false) =>
    apiRequest(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ senderId, content, bypassAiFilter })
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
  deleteChildUser: (childId, deleteUser = false) =>
    apiRequest(`/api/users/children/${childId}${deleteUser ? '?deleteUser=true' : ''}`, {
      method: 'DELETE'
    }),

  // POST /api/users/children/invite
  inviteChildUser: (inviteData) =>
    apiRequest('/api/users/children/invite', {
      method: 'POST',
      body: JSON.stringify(inviteData)
    }),
    
  // GET /api/users/children/linked-parents
  getLinkedParents: () =>
    apiRequest('/api/users/children/linked-parents'),
    
  // GET /api/users/children/:childId/linked-parents
  getLinkedParentsForChild: async (childId) => {
    try {
      const result = await apiRequest(`/api/users/children/${childId}/linked-parents`);
      
      // Ensure we have a consistent response format
      if (result.success && result.data) {
        return {
          success: true,
          parents: result.data.parents || []
        };
      } else if (result.success) {
        // Direct response without data wrapper
        return {
          success: true,
          parents: result.parents || []
        };
      } else {
        console.error('Error in getLinkedParentsForChild response:', result);
        return { success: false, parents: [] };
      }
    } catch (error) {
      console.error('Error in getLinkedParentsForChild:', error);
      return { success: false, parents: [] };
    }
  },
    
  // GET /api/users/children/linked-siblings
  getLinkedSiblings: () =>
    apiRequest('/api/users/children/linked-siblings')
};

// Google Calendar API
export const googleCalendarAPI = {
  // Get Google Calendar status
  getStatus: async () => {
    try {
      const response = await apiRequest('/api/google-calendar/status');
      
      // Ensure we have a valid response
      if (response && response.data) {
        return response;
      } else if (response && Object.keys(response).length > 0) {
        // This might be a direct response without the success wrapper
        return { success: true, data: response };
      } else {
        console.warn('Invalid response from Google Calendar status API:', response);
        return {
          success: false,
          data: {
            connected: false,
            syncEnabled: false,
            lastUpdated: null,
            error: 'Invalid response from server'
          }
        };
      }
    } catch (error) {
      console.error('Error getting Google Calendar status:', error);
      // Return a default status object when the API call fails
      return {
        success: false,
        data: {
          connected: false,
          syncEnabled: false,
          lastUpdated: null,
          error: error.message
        }
      };
    }
  },

  // Save Google Calendar tokens
  saveTokens: async (tokens) => {
    try {
      const response = await apiRequest('/api/google-calendar/tokens', {
        method: 'POST',
        body: JSON.stringify({ tokens })
      });
      return response;
    } catch (error) {
      console.error('Error saving Google Calendar tokens:', error);
      throw error;
    }
  },

  // Toggle Google Calendar sync
  toggleSync: async (enabled) => {
    try {
      const response = await apiRequest('/api/google-calendar/toggle-sync', {
        method: 'POST',
        body: JSON.stringify({ enabled })
      });
      return response;
    } catch (error) {
      console.error('Error toggling Google Calendar sync:', error);
      throw error;
    }
  },

  // Get Google Calendars
  getCalendars: async () => {
    try {
      const response = await apiRequest('/api/google-calendar/calendars');
      
      // Check if response has expected format
      if (response && response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response && response.data && response.data.calendars && Array.isArray(response.data.calendars)) {
        // Handle {calendars: Array, count: number} format
        return response.data.calendars;
      } else if (response && response.success && response.data) {
        return response.data;
      } else if (response && response.calendars && Array.isArray(response.calendars)) {
        // Direct response with calendars property
        return response.calendars;
      } else {
        // Direct response without wrapper
        return response || [];
      }
    } catch (error) {
      console.error('Error getting Google Calendars:', error);
      throw error;
    }
  },

  // Save selected Google Calendars
  saveSelectedCalendars: async (calendars) => {
    try {
      const response = await apiRequest('/api/google-calendar/calendars', {
        method: 'POST',
        body: JSON.stringify({ calendars })
      });
      return response;
    } catch (error) {
      console.error('Error saving selected Google Calendars:', error);
      throw error;
    }
  },

  // Save calendar visibility preferences
  saveCalendarVisibility: async (visibilitySettings) => {
    try {
      // First get all calendars to maintain sync settings
      const allCalendars = await googleCalendarAPI.getCalendars();
      
      // Prepare calendars to save, maintaining sync settings but updating display preferences
      const calendarsToSave = allCalendars
        .filter(cal => cal.selected === true) // Only include calendars selected for syncing
        .map(cal => ({
          google_calendar_id: cal.id,
          calendar_name: cal.summary || cal.name || "",
          color: visibilitySettings.colors && visibilitySettings.colors[cal.id] 
            ? visibilitySettings.colors[cal.id] 
            : (cal.backgroundColor || "#4285F4"),
          display_in_coparently: visibilitySettings.visibility && cal.id in visibilitySettings.visibility 
            ? visibilitySettings.visibility[cal.id] 
            : true
        }));
      
      // Save using the existing endpoint
      return await googleCalendarAPI.saveSelectedCalendars(calendarsToSave);
    } catch (error) {
      console.error('Error saving calendar visibility preferences:', error);
      throw error;
    }
  },

  // Disconnect Google Calendar
  disconnect: async () => {
    try {
      const response = await apiRequest('/api/google-calendar/disconnect', {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      throw error;
    }
  },

  // Manually sync all events to Google Calendar
  syncAll: async () => {
    try {
      const response = await apiRequest('/api/google-calendar/sync-all', {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error('Error syncing all events to Google Calendar:', error);
      throw error;
    }
  }
};

export default {
  auth: authAPI,
  user: userAPI,
  partner: partnerAPI,
  message: messageAPI,
  childUser: childUserAPI,
  googleCalendar: googleCalendarAPI
};