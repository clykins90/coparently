import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Component to handle successful authentication from Google OAuth
 * This component is rendered at the /auth-success route
 */
function AuthSuccess() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        // Get the user data from the URL query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const authData = urlParams.get('data');
        
        if (authData) {
          try {
            const userData = JSON.parse(decodeURIComponent(authData));
            
            // Login with the user data
            const loginResult = await login(null, null, userData);
            
            if (loginResult.success) {
              // Redirect to the app
              navigate('/app');
            } else {
              navigate('/login', { 
                state: { message: 'Authentication failed. Please try again.' } 
              });
            }
          } catch (parseError) {
            navigate('/login', { 
              state: { message: 'Authentication failed: Invalid data format.' } 
            });
          }
        } else {
          // No auth data found, redirect to login
          navigate('/login', { 
            state: { message: 'Authentication failed. Please try again.' } 
          });
        }
      } catch (error) {
        navigate('/login', { 
          state: { message: 'Authentication failed. Please try again.' } 
        });
      }
    };

    handleAuthSuccess();
  }, [login, navigate]);

  return (
    <div className="auth-success">
      <h2>Authentication Successful</h2>
      <p>Redirecting to the app...</p>
    </div>
  );
}

export default AuthSuccess; 