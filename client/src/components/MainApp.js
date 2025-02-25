import React, { useEffect } from 'react';
import { Link, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Communication from './Communication';
import Finances from './Finances';
import Calendar from './Calendar';
import Settings from './Settings';
import PartnerRequestNotification from './PartnerRequestNotification';
import Header from './Header';
import { 
  FaComments, 
  FaDollarSign, 
  FaCalendarAlt, 
  FaCog,
  FaHome 
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

function MainApp() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Check for token on component mount
  useEffect(() => {
    const checkToken = async () => {
      // If user is logged in but no token exists, try to get a new one
      if (user && !localStorage.getItem('token')) {
        console.log('User is logged in but no token found. Attempting to get a new token...');
        try {
          // Call the auth check endpoint which should return a token
          const authCheck = await authAPI.checkAuth();
          if (authCheck.authenticated && authCheck.token) {
            console.log('Successfully retrieved new token');
            localStorage.setItem('token', authCheck.token);
          } else {
            console.warn('Failed to get a new token. You may need to log in again.');
          }
        } catch (error) {
          console.error('Error checking authentication:', error);
        }
      }
    };
    
    checkToken();
  }, [user]);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate('/login', { state: { message: 'Logged out successfully' } });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Header />
      <PartnerRequestNotification />
      
      {/* Sidebar */}
      <nav className="w-64 bg-primary text-white h-screen fixed left-0 top-0 pt-20 shadow-lg z-10">
        <ul className="mt-6 px-4 space-y-2">
          <li>
            <Link 
              to="communication" 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-dark transition-colors duration-200"
            >
              <FaComments className="text-lg" />
              <span>Communication</span>
            </Link>
          </li>
          <li>
            <Link 
              to="finances" 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-dark transition-colors duration-200"
            >
              <FaDollarSign className="text-lg" />
              <span>Finances</span>
            </Link>
          </li>
          <li>
            <Link 
              to="calendar" 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-dark transition-colors duration-200"
            >
              <FaCalendarAlt className="text-lg" />
              <span>Calendar</span>
            </Link>
          </li>
          <li>
            <Link 
              to="settings" 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-primary-dark transition-colors duration-200"
            >
              <FaCog className="text-lg" />
              <span>Settings</span>
            </Link>
          </li>
          <li className="mt-8">
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center justify-center space-x-3 p-3 rounded-lg text-white bg-accent hover:bg-accent-dark transition-colors duration-200"
            >
              Sign Out
            </button>
          </li>
        </ul>
      </nav>
      
      {/* Main Content */}
      <div className="ml-64 flex-1 p-6 pt-20">
        <Routes>
          <Route path="communication" element={<Communication />} />
          <Route path="finances" element={<Finances />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="communication" />} />
        </Routes>
      </div>
    </div>
  );
}

export default MainApp; 