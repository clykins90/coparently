import React, { useEffect, useState } from 'react';
import { Link, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Communication from './Communication';
import ChildCommunication from './ChildCommunication';
import Finances from './Finances';
import Calendar from './Calendar';
import Settings from './Settings';
import ChildSettings from './ChildSettings';
import CalendarSyncSettings from './CalendarSyncSettings';
import ChildrenManager from './ChildrenManager/index';
import PartnerRequestNotification from './PartnerRequestNotification';
import Header from './Header';
import { 
  FaComments, 
  FaDollarSign, 
  FaCalendarAlt, 
  FaCog,
  FaHome,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

function MainApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, refreshToken } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const isChild = user?.role === 'child';

  // Check for token on component mount and when location changes
  useEffect(() => {
    const checkToken = async () => {
      // Check if calendar connection is in progress
      const calendarConnectionInProgress = localStorage.getItem('coparently_calendar_connection_in_progress') === 'true';
      
      // If user is logged in but no token exists, try to get a new one
      if (user && !localStorage.getItem('token')) {
        console.log('User is logged in but no token found. Attempting to get a new token...');
        try {
          // Try to refresh the token
          const result = await refreshToken();
          if (!result.success) {
            console.warn('Failed to refresh token. You may need to log in again.');
            
            // Only redirect to login if we're not already on a public route and not in the middle of calendar connection
            if (!location.pathname.includes('/login') && 
                !location.pathname.includes('/register') && 
                !location.pathname.includes('/auth-success') &&
                !location.pathname.includes('/calendar-connect-callback') &&
                !calendarConnectionInProgress) {
              navigate('/login', { state: { message: 'Your session has expired. Please log in again.' } });
            }
          }
        } catch (error) {
          console.error('Error checking authentication:', error);
        }
      }
    };
    
    checkToken();
  }, [user, location, navigate, refreshToken]);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate('/login', { state: { message: 'Logged out successfully' } });
    }
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - higher z-index to ensure it's on top */}
      <nav className={`${collapsed ? 'w-16' : 'w-56'} bg-primary text-white h-screen fixed left-0 top-0 shadow-lg z-50 transition-all duration-300`}>
        {/* Logo */}
        <div className={`${collapsed ? 'justify-center' : 'justify-start px-4'} flex items-center h-12 mt-2`}>
          <Link to="/app" className={`${collapsed ? 'text-xl' : 'text-2xl'} font-bold text-white flex items-center`}>
            <FaHome className={`${collapsed ? 'mx-auto' : 'mr-2'} text-white`} />
            {!collapsed && <span className="bg-clip-text text-white">Coparently</span>}
          </Link>
        </div>
        
        <button 
          onClick={toggleSidebar}
          className="absolute -right-3 top-16 bg-primary text-white p-1 rounded-full shadow-md hover:bg-primary-dark transition-colors z-50"
        >
          {collapsed ? <FaChevronRight size={14} /> : <FaChevronLeft size={14} />}
        </button>
        
        <ul className="mt-10 px-2 space-y-2">
          <li>
            <Link 
              to="communication" 
              className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-lg hover:bg-primary-dark transition-colors duration-200`}
            >
              <FaComments className="text-lg" />
              {!collapsed && <span>Communication</span>}
            </Link>
          </li>
          
          {/* Only show Finances and Calendar for parents */}
          {!isChild && (
            <>
              <li>
                <Link 
                  to="finances" 
                  className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-lg hover:bg-primary-dark transition-colors duration-200`}
                >
                  <FaDollarSign className="text-lg" />
                  {!collapsed && <span>Finances</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="calendar" 
                  className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-lg hover:bg-primary-dark transition-colors duration-200`}
                >
                  <FaCalendarAlt className="text-lg" />
                  {!collapsed && <span>Calendar</span>}
                </Link>
              </li>
            </>
          )}
          
          <li>
            <Link 
              to="settings" 
              className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-lg hover:bg-primary-dark transition-colors duration-200`}
            >
              <FaCog className="text-lg" />
              {!collapsed && <span>Settings</span>}
            </Link>
          </li>
        </ul>
      </nav>
      
      {/* Content area with header and main content */}
      <div className={`${collapsed ? 'ml-16' : 'ml-56'} flex-1 transition-all duration-300 relative`}>
        <Header handleLogout={handleLogout} collapsed={collapsed} />
        
        {/* Only show partner request notifications for parents */}
        {!isChild && <PartnerRequestNotification />}
        
        {/* Main Content - pt-24 and mt-2 ensure enough space for header and notifications */}
        <div className="p-6 pt-24 mt-2">
          <Routes>
            {/* Use different Communication component based on user role */}
            <Route path="communication" element={
              isChild ? <ChildCommunication /> : <Communication />
            } />
            
            {/* Only provide routes to Finances and Calendar for parents */}
            {!isChild ? (
              <>
                <Route path="finances" element={<Finances />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="calendar-sync-settings" element={<CalendarSyncSettings />} />
                <Route path="settings" element={<Settings />} />
              </>
            ) : (
              // Use ChildSettings for children
              <Route path="settings" element={<ChildSettings />} />
            )}
            
            {/* Default route based on user role */}
            <Route path="/" element={
              <Navigate to="communication" />
            } />
            <Route path="*" element={
              <Navigate to="communication" />
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default MainApp; 