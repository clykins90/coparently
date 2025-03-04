import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaGoogle, FaToggleOn, FaToggleOff, FaSync, FaCheck, FaTimes } from 'react-icons/fa';
import { googleCalendarAPI } from '../../services/api';
import Button from '../common/Button';

function GoogleCalendarSync() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({
    connected: false,
    syncEnabled: false,
    lastUpdated: null
  });
  const [calendars, setCalendars] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await googleCalendarAPI.getStatus();
      const statusData = response.data || response;
      
      console.log('Calendar status data received in GoogleCalendarSync:', statusData);
      
      // Ensure we have a valid status object
      if (statusData && typeof statusData === 'object') {
        // Don't log valid responses as invalid
        setStatus({
          connected: !!statusData.connected,
          syncEnabled: !!statusData.syncEnabled,
          lastUpdated: statusData.lastUpdated || null,
          coparentlyCalendarId: statusData.coparentlyCalendarId || null
        });
        
        if (statusData.connected) {
          await fetchCalendars();
        } else {
          setLoading(false);
        }
      } else {
        // Handle case where statusData is not a valid object
        console.error('Invalid status data received:', statusData);
        setStatus({
          connected: false,
          syncEnabled: false,
          lastUpdated: null
        });
        setError('Failed to load Google Calendar status: Invalid response');
        setLoading(false);
      }
      
      setInitialized(true);
    } catch (error) {
      console.error('Error fetching Google Calendar status:', error);
      setError('Failed to load Google Calendar status');
      // Ensure status is set to a default value when the API call fails
      setStatus({
        connected: false,
        syncEnabled: false,
        lastUpdated: null
      });
      setLoading(false);
      setInitialized(true);
    }
  };

  const fetchCalendars = async () => {
    try {
      const response = await googleCalendarAPI.getCalendars();
      
      // Ensure calendars have proper 'selected' property
      if (response && response.data) {
        // Handle response wrapped in data property
        const formattedCalendars = response.data.map(calendar => ({
          ...calendar,
          selected: !!calendar.selected  // Ensure boolean value
        }));
        setCalendars(formattedCalendars);
      } else if (Array.isArray(response)) {
        // Handle direct array response
        const formattedCalendars = response.map(calendar => ({
          ...calendar,
          selected: !!calendar.selected  // Ensure boolean value
        }));
        setCalendars(formattedCalendars);
      } else if (response && response.calendars && Array.isArray(response.calendars)) {
        // Handle response with calendars property (new format)
        const formattedCalendars = response.calendars.map(calendar => ({
          ...calendar,
          selected: !!calendar.selected  // Ensure boolean value
        }));
        setCalendars(formattedCalendars);
      } else {
        console.error('Unexpected calendar data format:', response);
        setError('Received unexpected data format from server');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching Google Calendars:', error);
      setError('Failed to load Google Calendars');
      setLoading(false);
    }
  };

  const handleConnectGoogle = () => {
    try {
      console.log('Google Calendar connect button clicked');
      
      // Get the API URL from env or use default
      const API_URL = process.env.REACT_APP_API_URL || '';
      
      // Get token from storage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log('Auth token exists:', !!token);
      
      if (!token) {
        console.error('No authentication token found');
        setError('You must be logged in to connect Google Calendar');
        return;
      }

      // Store token in sessionStorage as a backup
      sessionStorage.setItem('token', token);
      
      // Clear any existing flags to ensure a clean state
      localStorage.removeItem('coparently_calendar_connection_processing');
      
      // Set flag to indicate calendar connection is in progress
      localStorage.setItem('coparently_calendar_connection_in_progress', 'true');
      
      // Check if we previously completed calendar sync but UI hasn't updated
      localStorage.removeItem('coparently_calendar_sync_completed');

      // Create a temporary form for secure token submission
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${API_URL}/api/google-calendar/authorize-redirect`;
      form.style.display = 'none';
      form.enctype = 'application/x-www-form-urlencoded';

      // Add token as hidden field
      const tokenField = document.createElement('input');
      tokenField.type = 'hidden';
      tokenField.name = 'token';
      tokenField.value = token;
      form.appendChild(tokenField);

      // Add to body, submit form, then remove
      document.body.appendChild(form);
      console.log('Submitting form with token:', token);
      
      // Set loading state before form submission
      setLoading(true);
      setMessage('Redirecting to Google authorization...');
      
      // Submit the form after a short delay to ensure UI updates
      setTimeout(() => {
        form.submit();
      }, 100);
    } catch (error) {
      console.error('Error in connect handler:', error);
      setError('Failed to connect to Google Calendar');
      localStorage.removeItem('coparently_calendar_connection_in_progress');
      localStorage.removeItem('coparently_calendar_connection_processing');
      setLoading(false);
    }
  };

  const handleToggleSync = async () => {
    try {
      setLoading(true);
      const result = await googleCalendarAPI.toggleSync(!status.syncEnabled);
      setStatus({
        ...status,
        syncEnabled: !status.syncEnabled
      });
      setMessage(result.message);
      setLoading(false);
    } catch (error) {
      console.error('Error toggling sync:', error);
      setError('Failed to toggle sync');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm('Are you sure you want to disconnect Google Calendar? This will remove all calendar sync settings.')) {
      try {
        setLoading(true);
        await googleCalendarAPI.disconnect();
        setStatus({
          connected: false,
          syncEnabled: false,
          lastUpdated: null
        });
        setCalendars([]);
        setMessage('Google Calendar disconnected successfully');
        setLoading(false);
      } catch (error) {
        console.error('Error disconnecting Google Calendar:', error);
        setError('Failed to disconnect Google Calendar');
        setLoading(false);
      }
    }
  };

  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      const result = await googleCalendarAPI.syncAll();
      setMessage(result.message);
      setSyncing(false);
    } catch (error) {
      console.error('Error syncing events:', error);
      setError('Failed to sync events');
      setSyncing(false);
    }
  };

  const handleToggleCalendar = async (calendarId, display) => {
    try {
      const updatedCalendars = calendars.map(cal => {
        if (cal.id === calendarId) {
          return { ...cal, selected: !cal.selected };
        }
        return cal;
      });
      
      setCalendars(updatedCalendars);
      
      // Save selected calendars
      await googleCalendarAPI.saveSelectedCalendars(
        updatedCalendars
          .filter(cal => cal.selected)
          .map(cal => ({
            google_calendar_id: cal.id,
            calendar_name: cal.summary || "",
            color: cal.backgroundColor || null,
            display_in_coparently: true
          }))
      );
      
      setMessage('Calendar preferences saved');
    } catch (error) {
      console.error('Error updating calendar selection:', error);
      setError('Failed to update calendar selection');
      // Revert changes on error
      fetchCalendars();
    }
  };

  if (loading && !initialized) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-4">
          <FaCalendarAlt className="text-primary mr-2" />
          <h3 className="text-xl font-semibold text-gray-700">Google Calendar Sync</h3>
        </div>
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center mb-4">
        <FaCalendarAlt className="text-primary mr-2" />
        <h3 className="text-xl font-semibold text-gray-700">Google Calendar Sync</h3>
      </div>
      
      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
          {message}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {status && !status.connected ? (
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-md">
          <div className="text-center mb-4">
            <FaGoogle className="text-4xl text-gray-400 mx-auto mb-2" />
            <h4 className="text-lg font-medium text-gray-700">Connect Google Calendar</h4>
            <p className="text-gray-600 mb-4">
              Connect your Google Calendar to sync events between Coparently and Google Calendar.
            </p>
            <Button 
              onClick={handleConnectGoogle}
              className="flex items-center justify-center mx-auto"
            >
              <FaGoogle className="mr-2" /> Connect with Google
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-blue-700">Google Calendar Connected</h4>
                <p className="text-blue-600 text-sm">
                  Last updated: {status && status.lastUpdated ? new Date(status.lastUpdated).toLocaleString() : 'Never'}
                </p>
              </div>
              <div className="flex items-center">
                <button
                  onClick={handleToggleSync}
                  className="flex items-center mr-4 bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                  aria-label={status && status.syncEnabled ? "Turn sync off" : "Turn sync on"}
                >
                  {status && status.syncEnabled ? (
                    <>
                      <FaToggleOn className="text-2xl mr-1" /> Sync On
                    </>
                  ) : (
                    <>
                      <FaToggleOff className="text-2xl mr-1" /> Sync Off
                    </>
                  )}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors text-sm"
                  aria-label="Disconnect Google Calendar"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
          
          {status && status.syncEnabled && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-700">Manual Sync</h4>
                <button
                  onClick={handleSyncAll}
                  disabled={syncing}
                  className="flex items-center bg-primary-dark text-white px-3 py-1 rounded-md hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Sync all events to Google Calendar"
                >
                  {syncing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <FaSync className="mr-2" /> Sync All Events
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Manually sync all Coparently events to Google Calendar.
              </p>
            </div>
          )}
          
          {calendars && calendars.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-4">Your Google Calendars</h4>
              <p className="text-sm text-gray-600 mb-4">
                Check the boxes to enable or disable syncing with these calendars:
              </p>
              <div className="flex justify-between items-center mb-3 px-2">
                <span className="text-sm font-medium text-gray-600">Calendar Name</span>
                <span className="text-sm font-medium text-gray-600">Sync</span>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto p-2">
                {calendars.map(calendar => (
                  <div 
                    key={calendar.id}
                    className="flex items-center justify-between p-2 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <div className="flex items-center flex-grow">
                      <div 
                        className="w-4 h-4 rounded-full mr-3" 
                        style={{ backgroundColor: calendar.backgroundColor || '#4285F4' }}
                      ></div>
                      <label 
                        htmlFor={`calendar-${calendar.id}`}
                        className="text-gray-800 flex-grow cursor-pointer"
                      >
                        {calendar.summary}
                        {calendar.primary && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Primary
                          </span>
                        )}
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`calendar-${calendar.id}`}
                        checked={calendar.selected}
                        onChange={() => handleToggleCalendar(calendar.id, calendar.selected)}
                        className="w-5 h-5 text-primary focus:ring-primary rounded cursor-pointer"
                        aria-label={calendar.selected ? "Unselect calendar" : "Select calendar"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default GoogleCalendarSync; 