import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthSuccess() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const hasRun = useRef(false);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const handleAuthSuccess = async () => {
      console.log('AuthSuccess: Handling authentication success');
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const authData = urlParams.get('data');

        if (authData) {
          const userData = JSON.parse(decodeURIComponent(authData));
          console.log('AuthSuccess: Parsed auth data:', {
            userId: userData.userId,
            email: userData.email,
            role: userData.role,
            hasToken: !!userData.token,
          });

          // Log in with the received user data (including token)
          await login(null, null, userData);
          setIsProcessing(false);
        } else {
          console.warn('AuthSuccess: No auth data in URL, checking session');
          await checkSession();
        }
      } catch (error) {
        console.error('AuthSuccess: Error during authentication:', error.message);
        setIsProcessing(false);
        navigate('/login', {
          state: { message: 'Authentication failed. Please try again.' },
          replace: true,
        });
      }
    };

    const checkSession = async () => {
      try {
        // Get JWT token from localStorage if available
        const token = localStorage.getItem('token');
        
        const headers = {
          'Content-Type': 'application/json',
        };
        
        // Add JWT token to headers if available
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('/api/check', { 
          credentials: 'include',
          headers
        });
        
        const data = await response.json();
        if (data.success && data.userData) {
          console.log('AuthSuccess: Session check successful:', data.userData);
          await login(null, null, data.userData);
        } else {
          console.warn('AuthSuccess: Session check failed:', data);
          navigate('/login', {
            state: { message: 'Authentication failed. Please try again.' },
            replace: true,
          });
        }
        setIsProcessing(false);
      } catch (err) {
        console.error('AuthSuccess: Session check error:', err.message);
        setIsProcessing(false);
        navigate('/login', {
          state: { message: 'Authentication failed. Please try again.' },
          replace: true,
        });
      }
    };

    handleAuthSuccess();
  }, [login, navigate]);

  // Only navigate to /app when user state is set and processing is complete
  useEffect(() => {
    if (user && !isProcessing) {
      console.log('AuthSuccess: User authenticated, redirecting to /app/communication');
      navigate('/app/communication', { replace: true });
    }
  }, [user, navigate, isProcessing]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Authentication Successful</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <p className="text-center mt-4 text-gray-600">Redirecting to the app...</p>
      </div>
    </div>
  );
}

export default AuthSuccess;