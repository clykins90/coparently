import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authLog, diagnoseAuthIssues } from '../utils/debug';

function AuthSuccess() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleAuthSuccess = async () => {
      authLog.info('AuthSuccess component mounted');
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const authData = urlParams.get('data');
        
        if (authData) {
          try {
            const userData = JSON.parse(decodeURIComponent(authData));
            authLog.info('Parsed auth data from Google callback', {
              userId: userData.userId,
              email: userData.email,
              role: userData.role || 'undefined',
              hasToken: !!userData.token
            });
            
            const result = await login(null, null, userData);
            if (result.success) {
              authLog.info('Login successful', { isChild: result.isChild });
              diagnoseAuthIssues();
              
              if (result.isChild) {
                authLog.info('Redirecting child user to child-dashboard');
                navigate('/child-dashboard');
              } else {
                authLog.info('Redirecting parent user to app');
                navigate('/app');
              }
            } else {
              authLog.error('Login failed on AuthSuccess', { message: result.message });
              navigate('/login', { state: { message: 'Authentication failed. Please try again.' } });
            }
          } catch (parseError) {
            authLog.error('Failed to parse authData', { error: parseError.message });
            navigate('/login', { state: { message: 'Authentication failed: Invalid data format.' } });
          }
        } else {
          authLog.error('No auth data found in URL');
          navigate('/login', { state: { message: 'Authentication failed. Please try again.' } });
        }
      } catch (error) {
        authLog.error('Unexpected error in AuthSuccess', { error: error.message });
        navigate('/login', { state: { message: 'Authentication failed. Please try again.' } });
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