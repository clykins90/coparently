import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Component for handling Google Calendar auth callback
function CalendarConnectCallback() {
  const [status, setStatus] = useState('Processing...');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshToken } = useAuth(); // Add useAuth to access auth context

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Parse the URL query parameters
        const searchParams = new URLSearchParams(location.search);
        const success = searchParams.get('success');
        const errorParam = searchParams.get('error');
        
        console.log('Calendar connect callback received with params:', 
          { success, error: errorParam });
        
        // Check if we're already in the middle of processing a callback
        const alreadyProcessing = localStorage.getItem('coparently_calendar_connection_processing');
        if (alreadyProcessing === 'true') {
          console.log('Already processing callback, preventing duplicate processing');
          return;
        }
        
        // Set processing flag to prevent multiple callbacks being processed simultaneously
        localStorage.setItem('coparently_calendar_connection_processing', 'true');
        
        if (errorParam) {
          setError(`Connection failed: ${errorParam}`);
          localStorage.removeItem('coparently_calendar_connection_processing');
          localStorage.removeItem('coparently_calendar_connection_in_progress');
          setTimeout(() => navigate('/settings?tab=calendar'), 3000);
          return;
        }
        
        if (success === 'true') {
          setStatus('Google Calendar connected successfully!');
          
          // Check if we have a valid token before redirecting
          const token = localStorage.getItem('token');
          if (!token) {
            console.log('No token found in localStorage');
            
            // Only attempt token refresh if we have a user object
            if (user) {
              try {
                console.log('Attempting to refresh token');
                const refreshResult = await refreshToken();
                if (refreshResult.success) {
                  console.log('Token refreshed successfully');
                } else {
                  console.warn('Token refresh unsuccessful');
                  setError('Authentication error. Please log in again.');
                  localStorage.removeItem('coparently_calendar_connection_processing');
                  localStorage.removeItem('coparently_calendar_connection_in_progress');
                  setTimeout(() => navigate('/login'), 3000);
                  return;
                }
              } catch (refreshError) {
                console.error('Failed to refresh token:', refreshError);
                setError('Authentication error. Please log in again.');
                localStorage.removeItem('coparently_calendar_connection_processing');
                localStorage.removeItem('coparently_calendar_connection_in_progress');
                setTimeout(() => navigate('/login'), 3000);
                return;
              }
            } else {
              console.warn('No user object and no token');
              setError('Authentication error. Please log in again.');
              localStorage.removeItem('coparently_calendar_connection_processing');
              localStorage.removeItem('coparently_calendar_connection_in_progress');
              setTimeout(() => navigate('/login'), 3000);
              return;
            }
          }
          
          // Clear the connection flags
          localStorage.removeItem('coparently_calendar_connection_processing');
          localStorage.removeItem('coparently_calendar_connection_in_progress');
          
          // Add calendar sync completion flag to prevent redirect loops
          localStorage.setItem('coparently_calendar_sync_completed', 'true');
          
          console.log('Google Calendar connected successfully, redirecting to calendar sync settings');
          
          // Redirect to calendar sync settings page
          setTimeout(() => {
            navigate('/app/calendar-sync-settings', { replace: true });
          }, 1000);
        } else {
          setError('Failed to connect Google Calendar');
          localStorage.removeItem('coparently_calendar_connection_processing');
          localStorage.removeItem('coparently_calendar_connection_in_progress');
          setTimeout(() => navigate('/settings?tab=calendar'), 3000);
        }
      } catch (error) {
        console.error('Error processing Google Calendar callback:', error);
        setError('Failed to process Google Calendar connection');
        localStorage.removeItem('coparently_calendar_connection_processing');
        localStorage.removeItem('coparently_calendar_connection_in_progress');
        setTimeout(() => navigate('/settings?tab=calendar'), 3000);
      }
    };
    
    processCallback();
  }, [location, navigate, user, refreshToken]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Google Calendar Connection
        </h2>
        
        {error ? (
          <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            <p className="font-medium">Error</p>
            <p>{error}</p>
            <p className="mt-2 text-sm">Redirecting to settings...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarConnectCallback; 