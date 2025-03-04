import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaCheck, FaPalette, FaTimes } from 'react-icons/fa';
import { googleCalendarAPI } from '../../services/api';

function CalendarVisibilitySelector({ onCalendarVisibilityChange }) {
  const [loading, setLoading] = useState(true);
  const [calendars, setCalendars] = useState([]);
  const [visibleCalendars, setVisibleCalendars] = useState({});
  const [calendarColors, setCalendarColors] = useState({});
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [error, setError] = useState('');

  // Fetch calendars on component mount
  useEffect(() => {
    fetchCalendars();
  }, []);

  // Fetch Google Calendars
  const fetchCalendars = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get Google Calendar status first
      const statusResponse = await googleCalendarAPI.getStatus();
      const statusData = statusResponse.data || statusResponse;
      
      if (!statusData.connected) {
        setLoading(false);
        return;
      }
      
      // Get calendars
      const fetchedCalendars = await googleCalendarAPI.getCalendars();
      
      // Filter to only include calendars that are already selected for syncing
      const syncedCalendars = fetchedCalendars.filter(cal => cal.selected === true);
      
      // Initialize visibility and colors
      const initialVisibility = {};
      const initialColors = {};
      
      syncedCalendars.forEach(cal => {
        initialVisibility[cal.id] = true; // Default to visible
        initialColors[cal.id] = cal.backgroundColor || '#4285F4';
      });
      
      setCalendars(syncedCalendars);
      setVisibleCalendars(initialVisibility);
      setCalendarColors(initialColors);
      
      // Notify parent component of initial visibility
      if (onCalendarVisibilityChange) {
        onCalendarVisibilityChange(initialVisibility, initialColors);
      }
    } catch (error) {
      console.error('Error fetching Google Calendars:', error);
      setError('Failed to load Google Calendars');
    } finally {
      setLoading(false);
    }
  };

  // Toggle calendar visibility
  const toggleCalendarVisibility = (calendarId) => {
    const newVisibility = {
      ...visibleCalendars,
      [calendarId]: !visibleCalendars[calendarId]
    };
    
    setVisibleCalendars(newVisibility);
    
    // Notify parent component
    if (onCalendarVisibilityChange) {
      onCalendarVisibilityChange(newVisibility, calendarColors);
    }
  };

  // Update calendar color
  const updateCalendarColor = (calendarId, color) => {
    const newColors = {
      ...calendarColors,
      [calendarId]: color
    };
    
    setCalendarColors(newColors);
    setShowColorPicker(null);
    
    // Notify parent component
    if (onCalendarVisibilityChange) {
      onCalendarVisibilityChange(visibleCalendars, newColors);
    }
  };

  // Save calendar preferences to server
  const saveCalendarPreferences = async () => {
    try {
      setLoading(true);
      
      // Use the new API method to save visibility preferences
      await googleCalendarAPI.saveCalendarVisibility({
        visibility: visibleCalendars,
        colors: calendarColors
      });
      
      // Refresh calendars to get updated settings
      await fetchCalendars();
    } catch (error) {
      console.error('Error saving calendar preferences:', error);
      setError('Failed to save calendar preferences');
    } finally {
      setLoading(false);
    }
  };

  if (loading && calendars.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="flex justify-center items-center h-20">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">Loading calendars...</span>
        </div>
      </div>
    );
  }

  if (calendars.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="font-medium text-gray-700 mb-2">Calendar Visibility</h3>
        <p className="text-sm text-gray-500">
          {error || "No synced Google Calendars found. Please select calendars to sync in settings."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-medium text-gray-700 mb-3">Calendar Visibility</h3>
      
      <div className="space-y-3 mb-4">
        {calendars.map(calendar => (
          <div 
            key={calendar.id} 
            className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50"
          >
            <div className="flex items-center flex-1">
              <div 
                className="w-4 h-4 rounded-full mr-2" 
                style={{ backgroundColor: calendarColors[calendar.id] || calendar.backgroundColor || '#4285F4' }}
              ></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate" title={calendar.summary || calendar.name}>
                  {calendar.summary || calendar.name}
                </p>
                {calendar.primary && (
                  <span className="text-xs text-gray-500">Primary</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleCalendarVisibility(calendar.id)}
                className={`p-1.5 rounded-full ${visibleCalendars[calendar.id] ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-400 hover:bg-gray-100'}`}
                title={visibleCalendars[calendar.id] ? 'Hide calendar' : 'Show calendar'}
              >
                {visibleCalendars[calendar.id] ? <FaEye /> : <FaEyeSlash />}
              </button>
              
              <button
                onClick={() => setShowColorPicker(showColorPicker === calendar.id ? null : calendar.id)}
                className="p-1.5 rounded-full text-gray-600 hover:bg-gray-100"
                title="Change color"
              >
                <FaPalette />
              </button>
            </div>
            
            {showColorPicker === calendar.id && (
              <div className="absolute right-0 mt-1 bg-white border rounded-md shadow-lg p-3 z-10" style={{ top: '100%' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Select Color</span>
                  <button 
                    onClick={() => setShowColorPicker(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes />
                  </button>
                </div>
                
                <div className="grid grid-cols-5 gap-2 mb-2">
                  {['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#8E24AA', 
                    '#039BE5', '#7CB342', '#FB8C00', '#D81B60', '#F4511E'].map(color => (
                    <div 
                      key={color}
                      className="w-6 h-6 rounded-full cursor-pointer border hover:opacity-80"
                      style={{ backgroundColor: color }}
                      onClick={() => updateCalendarColor(calendar.id, color)}
                    ></div>
                  ))}
                </div>
                
                <div className="mt-2 flex items-center">
                  <label className="text-xs mr-2">Custom:</label>
                  <input 
                    type="color" 
                    value={calendarColors[calendar.id] || '#4285F4'}
                    onChange={(e) => updateCalendarColor(calendar.id, e.target.value)}
                    className="w-full h-6"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={saveCalendarPreferences}
          className="bg-primary hover:bg-primary-dark text-white px-3 py-1 rounded text-sm flex items-center"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <FaCheck className="mr-1" /> Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default CalendarVisibilitySelector; 