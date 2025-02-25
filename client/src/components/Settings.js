import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { partnerAPI } from '../services/api';
import MessageFilterTester from './MessageFilterTester';
import { formatPhoneNumber } from '../utils/validation';

function Settings() {
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
      try {
        const data = await partnerAPI.getPartner(user.id);
        if (data.success) {
          setPartnerData(data);
        }
      } catch (err) {
        console.error('Error fetching partner:', err);
      }
    };
    
    if (user) {
      fetchPartner();
    }
  }, [user]);

  const handleUnlink = async () => {
    if (window.confirm('Are you sure you want to unlink your partner?')) {
      try {
        const data = await partnerAPI.unlinkPartner(user.id);
        if (data.success) {
          setMessage('Partner unlinked successfully');
          setPartnerData(null);
          localStorage.removeItem('partnerLinked');
        }
      } catch (err) {
        setMessage('Failed to unlink partner');
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

  const handlePhoneChange = (e) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setProfileData({
      ...profileData,
      phone: formattedPhone
    });
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
              onChange={handlePhoneChange}
              placeholder="555-123-4567"
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

      <MessageFilterTester />
    </div>
  );
}

export default Settings; 