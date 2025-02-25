import React, { useEffect } from 'react';
import { Link, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Communication from './Communication';
import Finances from './Finances';
import Calendar from './Calendar';
import Settings from './Settings';
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
    <div>
      <nav className="sidebar">
        <div className="sidebar-header">
          <FaHome className="sidebar-logo" />
          <h2>CoParently</h2>
        </div>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>
            <Link to="communication" className="nav-link">
              <FaComments className="nav-icon" />
              <span>Communication</span>
            </Link>
          </li>
          <li>
            <Link to="finances" className="nav-link">
              <FaDollarSign className="nav-icon" />
              <span>Finances</span>
            </Link>
          </li>
          <li>
            <Link to="calendar" className="nav-link">
              <FaCalendarAlt className="nav-icon" />
              <span>Calendar</span>
            </Link>
          </li>
          <li>
            <Link to="settings" className="nav-link">
              <FaCog className="nav-icon" />
              <span>Settings</span>
            </Link>
          </li>
          <li>
            <button onClick={handleLogout} className="logout-button">
              Sign Out
            </button>
          </li>
        </ul>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="communication" element={<Communication />} />
          <Route path="finances" element={<Finances />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="communication" />} />
        </Routes>
      </main>
    </div>
  );
}

export default MainApp; 