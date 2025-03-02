import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authLog, diagnoseAuthIssues } from '../utils/debug';

function AuthSuccess() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const hasRun = useRef(false); // Prevent multiple executions

  useEffect(() => {
    if (hasRun.current) return; // Exit if already run
    hasRun.current = true;

    const handleAuthSuccess = async () => {
      authLog.info('AuthSuccess component mounted');
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const authData = urlParams.get('data');

        if (authData) {
          const userData = JSON.parse(decodeURIComponent(authData));
          authLog.info('Parsed auth data from Google callback', {
            userId: userData.userId,
            email: userData.email,
            role: userData.role || 'undefined',
            hasToken: !!userData.token,
          });

          const result = await login(null, null, userData);
          if (result.success) {
            authLog.info('Login successful', { isChild: result.isChild });
            diagnoseAuthIssues();
            navigate(result.isChild ? '/child-dashboard' : '/app', { replace: true });
          } else {
            authLog.error('Login failed on AuthSuccess', { message: result.message });
            navigate('/login', {
              state: { message: 'Authentication failed. Please try again.' },
              replace: true,
            });
          }
        } else {
          authLog.warn('No auth data found in URL, attempting session check');
          await checkSession();
        }
      } catch (error) {
        authLog.error('Unexpected error in AuthSuccess', { error: error.message });
        navigate('/login', {
          state: { message: 'Authentication failed. Please try again.' },
          replace: true,
        });
      }
    };

    const checkSession = async () => {
      try {
        const response = await fetch('/auth/check', { credentials: 'include' });
        const data = await response.json();
        if (data.success) {
          const userData = data.userData;
          const result = await login(null, null, userData);
          if (result.success) {
            navigate(userData.role === 'child' ? '/child-dashboard' : '/app', { replace: true });
          } else {
            navigate('/login', {
              state: { message: 'Authentication failed. Please try again.' },
              replace: true,
            });
          }
        } else {
          navigate('/login', {
            state: { message: 'Authentication failed. Please try again.' },
            replace: true,
          });
        }
      } catch (err) {
        authLog.error('Error during session check', { error: err.message });
        navigate('/login', {
          state: { message: 'Authentication failed. Please try again.' },
          replace: true,
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