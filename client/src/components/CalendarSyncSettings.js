import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaCheck, FaTimes, FaArrowLeft, FaSave } from 'react-icons/fa';
import { googleCalendarAPI } from '../services/api';
import Button from './common/Button';
import { useAuth } from '../context/AuthContext';

function CalendarSyncSettings() {
  const [loading, setLoading] = useState(true);
  const [calendars, setCalendars] = useState([]);
  const [selectedCalendars, setSelectedCalendars] = useState([]);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, refreshToken } = useAuth();

  useEffect(() => {
    // Check if we have a valid token before proceeding
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // Clear the calendar connection processing flags if they exist
    localStorage.removeItem('coparently_calendar_connection_processing');
    localStorage.removeItem('coparently_calendar_connection_in_progress');
    
    // Check if we just completed a calendar sync
    const calendarSyncCompleted = localStorage.getItem('coparently_calendar_sync_completed');
    
    if (!token && !calendarSyncCompleted && user) {
      console.log('No token found in CalendarSyncSettings, attempting to refresh');
      refreshToken()
        .then(result => {
          if (result.success) {
            fetchStatus();
          } else {
            console.error('Failed to refresh token, redirecting to login');
            navigate('/login', { state: { message: 'Your session has expired. Please log in again.' } });
          }
        })
        .catch(error => {
          console.error('Error refreshing token:', error);
          navigate('/login', { state: { message: 'Authentication error. Please log in again.' } });
        });
    } else {
      // If we have a token or just completed calendar sync, proceed with fetching status
      fetchStatus();
    }
    
    // Clear the calendar sync completed flag after using it
    localStorage.removeItem('coparently_calendar_sync_completed');
  }, [user, refreshToken, navigate]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await googleCalendarAPI.getStatus();
      const statusData = response.data || response;
      
      console.log('Calendar status data received:', statusData);
      
      if (!statusData.connected) {
        // If not connected, redirect to settings
        console.log('Not connected to Google Calendar, redirecting to settings');
        navigate('/settings?tab=calendar');
        return;
      }
      
      // Calendar is connected, proceed with fetching calendars
      console.log('Connected to Google Calendar, sync enabled:', statusData.syncEnabled);
      setSyncEnabled(statusData.syncEnabled);
      await fetchCalendars();
    } catch (error) {
      console.error('Error fetching Google Calendar status:', error);
      
      // Check if this is an authentication error
      if (error.message && (
          error.message.includes('unauthorized') || 
          error.message.includes('Unauthorized') || 
          error.message.includes('Authentication') ||
          error.message.includes('token')
      )) {
        setError('Authentication error. Please try logging in again.');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError('Failed to load Google Calendar status');
        setLoading(false);
      }
    }
  };

  const fetchCalendars = async () => {
    try {
      const response = await googleCalendarAPI.getCalendars();
      const calendarsData = response.data || response.calendars || [];
      
      console.log('Calendar data received:', calendarsData);
      setCalendars(calendarsData);
      
      // Set initially selected calendars
      const initialSelected = calendarsData
        .filter(calendar => calendar.selected)
        .map(calendar => calendar.id);
      
      setSelectedCalendars(initialSelected);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching Google Calendars:', error);
      setError('Failed to load Google Calendars');
      setLoading(false);
    }
  };

  const handleToggleCalendar = (calendarId) => {
    setSelectedCalendars(prev => {
      if (prev.includes(calendarId)) {
        return prev.filter(id => id !== calendarId);
      } else {
        return [...prev, calendarId];
      }
    });
  };

  const handleToggleSync = async () => {
    try {
      setLoading(true);
      const result = await googleCalendarAPI.toggleSync(!syncEnabled);
      setSyncEnabled(!syncEnabled);
      setMessage(result.message);
      setLoading(false);
    } catch (error) {
      console.error('Error toggling sync:', error);
      setError('Failed to toggle sync');
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const result = await googleCalendarAPI.saveSelectedCalendars(selectedCalendars);
      setMessage('Calendar settings saved successfully');
      setLoading(false);
      
      // Redirect to calendar page after saving
      setTimeout(() => {
        navigate('/app/calendar');
      }, 2000);
    } catch (error) {
      console.error('Error saving calendar settings:', error);
      setError('Failed to save calendar settings');
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/settings?tab=calendar');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Loading calendar settings...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FaCalendarAlt className="text-primary text-2xl mr-3" />
            <h2 className="text-2xl font-bold">Google Calendar Sync Settings</h2>
          </div>
          <Button 
            onClick={handleBack}
            variant="secondary"
            className="flex items-center"
          >
            <FaArrowLeft className="mr-2" /> Back to Settings
          </Button>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Enable Calendar Sync</h3>
            <div 
              className={`relative inline-block w-14 h-7 transition-colors duration-200 ease-in-out rounded-full cursor-pointer ${
                syncEnabled ? 'bg-primary' : 'bg-gray-300'
              }`}
              onClick={handleToggleSync}
            >
              <span 
                className={`absolute left-1 top-1 w-5 h-5 transition-transform duration-200 ease-in-out transform bg-white rounded-full ${
                  syncEnabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
          <p className="text-gray-600 mb-2">
            {syncEnabled 
              ? 'Calendar sync is enabled. Your events will be synced with Google Calendar.' 
              : 'Calendar sync is disabled. Enable to sync events with Google Calendar.'}
          </p>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Select Calendars to Sync</h3>
          <p className="text-gray-600 mb-4">
            Choose which Google Calendars you want to sync with Coparently. Events will be synced in both directions.
          </p>
          
          <div className="space-y-3 max-h-80 overflow-y-auto p-2">
            {calendars.length > 0 ? (
              calendars.map(calendar => (
                <div 
                  key={calendar.id} 
                  className="flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleToggleCalendar(calendar.id)}
                >
                  <div 
                    className={`w-5 h-5 mr-3 flex items-center justify-center rounded border ${
                      selectedCalendars.includes(calendar.id) 
                        ? 'bg-primary border-primary' 
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedCalendars.includes(calendar.id) && (
                      <FaCheck className="text-white text-xs" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{calendar.summary}</div>
                    <div className="text-sm text-gray-500">{calendar.description || 'No description'}</div>
                  </div>
                  <div 
                    className="w-4 h-4 rounded-full mr-2" 
                    style={{ backgroundColor: calendar.backgroundColor || '#4285F4' }}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                No calendars found in your Google account
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSaveSettings}
            variant="primary"
            className="flex items-center"
            disabled={loading}
          >
            <FaSave className="mr-2" /> Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CalendarSyncSettings; 