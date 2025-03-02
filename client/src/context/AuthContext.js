import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps the app and makes auth object available to any child component that calls useAuth()
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (persisted)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password, googleUserData = null) => {
    try {
      // If googleUserData is provided, skip calling API
      if (googleUserData) {
        console.log('[AuthContext] Processing Google login data', { 
          hasToken: !!googleUserData.token,
          userId: googleUserData.userId,
          email: googleUserData.email,
          role: googleUserData.role || 'parent'
        });
        
        if (!googleUserData.token) {
          return { success: false, message: 'Authentication failed: No token provided' };
        }
        
        const userData = {
          id: googleUserData.userId,
          firstName: googleUserData.firstName,
          lastName: googleUserData.lastName,
          email: googleUserData.email,
          phone: googleUserData.phone,
          hasPartner: googleUserData.hasPartner,
          requiresProfile: googleUserData.requiresProfile,
          authProvider: googleUserData.authProvider,
          profilePicture: googleUserData.profilePicture,
          role: googleUserData.role || 'parent'
        };
        
        localStorage.setItem('token', googleUserData.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        return { success: true, isChild: userData.role === 'child' };
      }
      
      // Regular email/password login
      const data = await authAPI.login({ email, password });
      if (data.success) {
        const userData = {
          id: data.userId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          hasPartner: data.hasPartner,
          requiresProfile: data.requiresProfile,
          authProvider: data.authProvider,
          profilePicture: data.profilePicture,
          role: data.role
        };
        
        // The token is put in localStorage by authAPI.login
        if (!localStorage.getItem('token') && data.token) {
          localStorage.setItem('token', data.token);
        }
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        return { success: true, isChild: data.role === 'child' };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      return { success: false, message: error.message || 'An error occurred during login' };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const data = await authAPI.register(userData);
      if (data.success) {
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'An error occurred during registration' };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('[AuthContext] Starting logout process');
      
      // Attempt server logout
      let serverLogoutSuccessful = false;
      try {
        const result = await authAPI.logout();
        serverLogoutSuccessful = true;
        console.log('[AuthContext] Server logout successful:', result);
      } catch (serverError) {
        console.error('[AuthContext] Server logout failed:', serverError);
        console.log('[AuthContext] Continuing with client-side logout...');
      }
      
      // Clear localStorage data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('coparently_')) {
          localStorage.removeItem(key);
        }
      });
      sessionStorage.clear();
      setUser(null);
      
      // Attempt to clear cookies (some modern browsers may restrict this)
      document.cookie
        .split(';')
        .forEach(c => {
          const cookieName = c.trim().split('=')[0];
          if (cookieName) {
            document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/api`;
            document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/auth`;
            document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          }
        });
      
      return { success: true, serverLogoutSuccessful };
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      setUser(null);
      
      return { success: false, message: 'An error occurred during logout' };
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const data = await userAPI.updateProfile(user.id, profileData);
      if (data.success) {
        const updatedUser = { ...user, ...profileData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Profile update failed' };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, message: 'An error occurred during profile update' };
    }
  };

  // Update profile picture
  const updateProfilePicture = async (imageFile) => {
    try {
      const data = await userAPI.updateProfilePicture(user.id, imageFile);
      if (data.success) {
        const updatedUser = { ...user, profilePicture: data.profilePicture };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true, profilePicture: data.profilePicture };
      } else {
        return { success: false, message: data.message || 'Profile picture update failed' };
      }
    } catch (error) {
      console.error('Profile picture update error:', error);
      return { success: false, message: 'An error occurred during profile picture update' };
    }
  };

  // Remove profile picture
  const removeProfilePicture = async () => {
    try {
      const data = await userAPI.removeProfilePicture(user.id);
      if (data.success) {
        const updatedUser = { ...user, profilePicture: null };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Failed to remove profile picture' };
      }
    } catch (error) {
      console.error('Remove profile picture error:', error);
      return { success: false, message: 'An error occurred while removing profile picture' };
    }
  };

  const isGoogleAuthenticated = () => {
    return user && user.authProvider === 'google';
  };

  const isChild = () => {
    return user && user.role === 'child';
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    updateProfilePicture,
    removeProfilePicture,
    isGoogleAuthenticated,
    isChild
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext;