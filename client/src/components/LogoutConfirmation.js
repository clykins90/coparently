import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authLog, inspectAuthStorage } from '../utils/debug';

// Helper to delete all cookies
const deleteAllCookies = () => {
  const cookies = document.cookie.split(";");
  authLog.info(`Clearing ${cookies.length} cookies`);
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
    
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/api`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/auth`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    
    authLog.info(`Cleared cookie: ${name}`);
  }
};

// Helper to clear all storage
const clearAllStorage = () => {
  authLog.info('Clearing localStorage');
  localStorage.clear();
  authLog.info('Clearing sessionStorage');
  sessionStorage.clear();
};

export default function LogoutConfirmation() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [logoutStatus, setLogoutStatus] = useState('pending');
  const [error, setError] = useState(null);

  useEffect(() => {
    const performLogout = async () => {
      authLog.info('Starting logout process');
      
      authLog.info('Auth state before logout:');
      inspectAuthStorage();
      
      try {
        setLogoutStatus('inProgress');
        
        // Clear client-side
        clearAllStorage();
        deleteAllCookies();
        
        // Call server logout
        try {
          const result = await logout();
          authLog.info('Server logout response:', result);
        } catch (logoutError) {
          authLog.warning('Server logout failed, continuing with client cleanup', { error: logoutError.message });
        }
        
        authLog.info('Check if all auth data is cleared');
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token || user) {
          authLog.warning('Remaining auth data found after logout', { hasToken: !!token, hasUser: !!user });
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        
        deleteAllCookies();
        
        setLogoutStatus('success');
        authLog.info('Logout successful, redirecting to login');
        navigate('/login', { state: { message: 'Logged out successfully' } });
      } catch (err) {
        authLog.error('Logout failed', { error: err.message });
        setError(err.message || 'An error occurred during logout');
        setLogoutStatus('failed');
        
        // Attempt emergency cleanup
        authLog.info('Performing emergency cleanup');
        clearAllStorage();
        deleteAllCookies();
        
        setTimeout(() => {
          navigate('/login', {
            state: { message: 'Logout may have been incomplete. Please clear your browser cookies and try again.' }
          });
        }, 2000);
      }
    };
    
    performLogout();
  }, [navigate, logout]);

  if (error) {
    return (
      <div className="logout-error">
        <h2>Logout Error</h2>
        <p>{error}</p>
        <p>Redirecting to login page...</p>
      </div>
    );
  }

  return (
    <div className="logout-message">
      <h2>Logging out...</h2>
      <p>
        {logoutStatus === 'inProgress'
          ? 'Please wait while we log you out.'
          : logoutStatus === 'success'
          ? 'Logout successful!'
          : 'Redirecting to login page...'
        }
      </p>
    </div>
  );
}