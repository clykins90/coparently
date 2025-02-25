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
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password, googleUserData = null) => {
    try {
      // If googleUserData is provided, use that instead of making an API call
      if (googleUserData) {
        const userData = {
          id: googleUserData.userId,
          firstName: googleUserData.firstName,
          lastName: googleUserData.lastName,
          email: googleUserData.email,
          phone: googleUserData.phone,
          hasPartner: googleUserData.hasPartner,
          requiresProfile: googleUserData.requiresProfile,
          authProvider: googleUserData.authProvider,
          profilePicture: googleUserData.profilePicture
        };
        
        // Store token if provided
        if (googleUserData.token) {
          localStorage.setItem('token', googleUserData.token);
        }
        
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
      
      // Regular email/password login
      const data = await authAPI.login(email, password);
      
      if (data.success) {
        const userData = {
          id: data.userId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          hasPartner: data.hasPartner,
          requiresProfile: data.requiresProfile,
          authProvider: data.authProvider || 'local',
          profilePicture: data.profilePicture
        };
        
        // Token is stored in localStorage by the authAPI.login function
        
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login' };
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
      await authAPI.logout(); // This will clear the token from localStorage
      localStorage.removeItem('user');
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'An error occurred during logout' };
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const data = await userAPI.updateProfile(user.id, profileData);
      
      if (data.success) {
        const updatedUser = {
          ...user,
          ...profileData
        };
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

  // Check if user is authenticated with Google
  const isGoogleAuthenticated = () => {
    return user && user.authProvider === 'google';
  };

  // Value object that will be passed to any consumer components
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isGoogleAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext; 