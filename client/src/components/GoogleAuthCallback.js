import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Component for handling Google auth callback 
function GoogleAuthCallback() {
  const [status, setStatus] = useState('Processing...');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Parse the URL query parameters
        const searchParams = new URLSearchParams(location.search);
        const data = searchParams.get('data');
        
        if (!data) {
          setError('No authentication data received');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        // Parse the JSON data with error handling
        let authData;
        try {
          authData = JSON.parse(decodeURIComponent(data));
          console.log('[GoogleAuthCallback] Received auth data:', { 
            hasToken: !!authData.token,
            hasUserId: !!authData.userId 
          });
        } catch (parseError) {
          console.error('[GoogleAuthCallback] Error parsing auth data:', parseError);
          setError('Invalid authentication data format');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        // Check if we have tokens
        if (!authData.token) {
          setError('No authentication token received');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        // Login the user
        setStatus('Logging you in...');
        try {
          const result = await login(authData);
          if (result.success) {
            setStatus('Login successful!');
          } else {
            setError(result.message || 'Login failed');
            setTimeout(() => navigate('/login'), 3000);
            return;
          }
        } catch (loginError) {
          console.error('[GoogleAuthCallback] Error during login:', loginError);
          setError('Login process failed');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        // Redirect to the appropriate page
        setTimeout(() => {
          if (location.state?.from) {
            navigate(location.state.from);
          } else if (authData.requiresProfile) {
            navigate('/settings');
          } else {
            navigate('/app/communication');
          }
        }, 2000);
      } catch (error) {
        console.error('Error processing Google auth callback:', error);
        setError('Failed to process authentication');
        setTimeout(() => navigate('/login'), 3000);
      }
    };
    
    processCallback();
  }, [location, navigate, login]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Google Authentication
        </h2>
        
        {error ? (
          <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            <p className="font-medium">Error</p>
            <p>{error}</p>
            <p className="mt-2 text-sm">Redirecting to login page...</p>
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

export default GoogleAuthCallback; 