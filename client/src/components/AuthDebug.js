import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authLog, inspectAuthStorage, diagnoseAuthIssues } from '../utils/debug';

/**
 * Component for debugging authentication issues
 * This provides manual actions to help users recover from auth problems
 */
function AuthDebug() {
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  
  // Check current auth state
  const checkAuthState = () => {
    const authState = inspectAuthStorage();
    const issues = diagnoseAuthIssues();
    
    setDebugInfo({
      tokenExists: authState.tokenExists,
      userExists: authState.userExists,
      userData: authState.userData,
      issues: issues
    });
    
    setStatusMessage('Auth state inspected. Check browser console for details.');
  };
  
  // Manual browser storage cleanup
  const clearLocalStorage = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear any other app-related items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('coparently_')) {
        localStorage.removeItem(key);
      }
    });
    
    setStatusMessage('Local storage cleared successfully.');
    checkAuthState();
  };
  
  // Clear cookies
  const clearCookies = () => {
    document.cookie.split(';').forEach(c => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    
    setStatusMessage('Browser cookies cleared successfully.');
  };
  
  // Call server to force clear session
  const forceServerSessionClear = async () => {
    try {
      setStatusMessage('Attempting to clear server session...');
      
      const baseUrl = process.env.REACT_APP_API_URL || '';
      const response = await fetch(`${baseUrl}/auth/force-clear-session`, {
        method: 'GET',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatusMessage('Server session cleared successfully.');
      } else {
        setStatusMessage('Failed to clear server session: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      setStatusMessage('Error clearing server session: ' + error.message);
      console.error('Error clearing server session:', error);
    }
  };
  
  // Complete reset and redirect to login
  const completeReset = async () => {
    try {
      setStatusMessage('Performing complete reset...');
      
      // Clear client storage
      clearLocalStorage();
      clearCookies();
      
      // Clear server session
      await forceServerSessionClear();
      
      setStatusMessage('Reset complete. Redirecting to login...');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/login', { state: { message: 'Authentication has been reset. Please try logging in again.' } });
      }, 2000);
    } catch (error) {
      setStatusMessage('Error during reset: ' + error.message);
    }
  };
  
  return (
    <div className="auth-debug">
      <h1>Authentication Troubleshooting</h1>
      <p>If you're having trouble logging in or out, use these tools to help resolve the issue.</p>
      
      {statusMessage && (
        <div className="status-message">
          <p>{statusMessage}</p>
        </div>
      )}
      
      <div className="debug-actions">
        <button onClick={checkAuthState}>
          Check Auth State
        </button>
        <button onClick={clearLocalStorage}>
          Clear Local Storage
        </button>
        <button onClick={clearCookies}>
          Clear Cookies
        </button>
        <button onClick={forceServerSessionClear}>
          Clear Server Session
        </button>
        <button onClick={completeReset} className="danger-button">
          Complete Reset & Redirect to Login
        </button>
      </div>
      
      {debugInfo && (
        <div className="debug-info">
          <h2>Auth State</h2>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
      
      <div className="debug-help">
        <h2>Still having issues?</h2>
        <p>Try these steps:</p>
        <ol>
          <li>Use an incognito/private browsing window</li>
          <li>Clear your browser cache and cookies completely</li>
          <li>Try a different browser</li>
          <li>Contact support with screenshots of console errors</li>
        </ol>
      </div>
    </div>
  );
}

export default AuthDebug; 