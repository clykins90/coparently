/**
 * Debug utilities for helping troubleshoot authentication issues
 */
const logWithDetails = (category, message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${category}] ${message}`);
  if (data) {
    console.log(`[${timestamp}] [${category}] Data:`, data);
  }
};

export const authLog = {
  info: (message, data = null) => logWithDetails('AUTH-INFO', message, data),
  error: (message, data = null) => logWithDetails('AUTH-ERROR', message, data),
  warning: (message, data = null) => logWithDetails('AUTH-WARNING', message, data),
};

export const inspectAuthStorage = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  authLog.info('Current auth storage state:', {
    tokenExists: !!token,
    tokenFirstChars: token ? `${token.substring(0, 10)}...` : null,
    userExists: !!user,
    userData: user ? JSON.parse(user) : null
  });
  
  return {
    tokenExists: !!token,
    userExists: !!user,
    userData: user ? JSON.parse(user) : null
  };
};

export const diagnoseAuthIssues = () => {
  const storage = inspectAuthStorage();
  let issues = [];
  
  if (!storage.tokenExists && storage.userExists) {
    issues.push('Token is missing but user data exists - might cause API auth failures');
  }
  if (storage.tokenExists && !storage.userExists) {
    issues.push('Token exists but user data is missing - might cause UI inconsistencies');
  }
  if (storage.userExists && storage.userData) {
    const requiredFields = ['id', 'firstName', 'lastName', 'email', 'role'];
    const missingFields = requiredFields.filter(f => !storage.userData[f]);
    if (missingFields.length > 0) {
      issues.push(`User data missing fields: ${missingFields.join(', ')}`);
    }
    if (storage.userData.role !== 'parent' && storage.userData.role !== 'child') {
      issues.push(`User has unexpected role: ${storage.userData.role}`);
    }
  }
  
  if (issues.length > 0) {
    authLog.warning('Authentication issues detected:', issues);
  } else {
    authLog.info('No obvious authentication issues detected in storage');
  }
  
  return issues;
};

export default {
  authLog,
  inspectAuthStorage,
  diagnoseAuthIssues
};