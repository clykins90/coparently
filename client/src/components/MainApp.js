import React, { useState, useEffect } from 'react';
import { Link, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Communication from './Communication';
import { 
  FaComments, 
  FaDollarSign, 
  FaCalendarAlt, 
  FaCog,
  FaHome 
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

// Stub components for demonstration
const Finances = () => <div><h3>Finances</h3></div>;
const Calendar = () => <div><h3>Calendar</h3></div>;
const Settings = () => {
  const [partnerData, setPartnerData] = useState(null);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        email: user.email || '' // Read-only
      });
    }

    const fetchPartner = async () => {
      const response = await fetch(`/api/partner?userId=${user.id}`);
      const data = await response.json();
      if (data.success) {
        setPartnerData(data);
      }
    };
    fetchPartner();
  }, [user]);

  const handleUnlink = async () => {
    if (window.confirm('Are you sure you want to unlink your partner?')) {
      const response = await fetch(`/api/partner/${user.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setMessage('Partner unlinked successfully');
        setPartnerData(null);
        localStorage.removeItem('partnerLinked');
      }
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const result = await updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone
      });
      
      if (result.success) {
        setMessage('Profile updated successfully');
      } else {
        setMessage('Failed to update profile: ' + result.message);
      }
    } catch (err) {
      setMessage('Failed to update profile');
    }
  };

  return (
    <div>
      <h3>Account Settings</h3>
      <div className="settings-section">
        <h4>Your Profile</h4>
        <form onSubmit={handleProfileUpdate}>
          <div className="form-group">
            <label>First Name:</label>
            <input
              type="text"
              value={profileData.firstName}
              onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Last Name:</label>
            <input
              type="text"
              value={profileData.lastName}
              onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={profileData.email}
              readOnly
              className="read-only"
            />
          </div>
          <div className="form-group">
            <label>Phone:</label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
            />
          </div>
          <button type="submit" className="update-button">
            Update Profile
          </button>
        </form>
      </div>
      
      <div className="settings-section">
        <h4>Linked Partner</h4>
        {partnerData ? (
          <>
            <p>Linked Partner: {partnerData.firstName} {partnerData.lastName}</p>
            <p>Contact: {partnerData.phone}</p>
            <button onClick={handleUnlink} className="danger-button">
              Unlink Partner
            </button>
          </>
        ) : (
          <p>No partner linked. <Link to="/link-partner">Link a partner</Link></p>
        )}
        {message && <p className="success-message">{message}</p>}
      </div>
    </div>
  );
};

function MainApp() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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