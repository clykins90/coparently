import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { partnerAPI } from '../services/api';
import MessageFilterTester from './MessageFilterTester';
import { formatPhoneNumber } from '../utils/validation';

function Settings() {
  const [partnerData, setPartnerData] = useState(null);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });
  const [message, setMessage] = useState('');
  const [cancellingRequestId, setCancellingRequestId] = useState(null);
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
    
    const fetchOutgoingRequests = async () => {
      try {
        const data = await partnerAPI.getOutgoingRequests(user.id);
        if (data.success) {
          setOutgoingRequests(data.requests);
        }
      } catch (err) {
        console.error('Error fetching outgoing requests:', err);
      }
    };
    
    if (user) {
      fetchPartner();
      fetchOutgoingRequests();
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

  const handleCancelRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to cancel this request?')) {
      try {
        setCancellingRequestId(requestId);
        const data = await partnerAPI.cancelRequest(requestId, user.id);
        if (data.success) {
          setMessage('Request canceled successfully');
          // Remove the canceled request from the list
          setOutgoingRequests(outgoingRequests.filter(request => request.id !== requestId));
        } else {
          setMessage('Failed to cancel request');
        }
      } catch (err) {
        console.error('Error canceling request:', err);
        setMessage('Failed to cancel request');
      } finally {
        setCancellingRequestId(null);
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
        ) : outgoingRequests.length > 0 ? (
          <>
            <h5>Pending Link Requests</h5>
            <ul className="outgoing-requests-list">
              {outgoingRequests.map(request => (
                <li key={request.id} className="outgoing-request-item">
                  {request.status === 'invited' ? (
                    <>
                      <p>
                        You sent an invitation to <strong>{request.recipient.email}</strong>
                      </p>
                      <p className="request-status">Status: <span className="invited-status">Invitation Sent</span></p>
                    </>
                  ) : (
                    <>
                      <p>
                        You sent a link request to <strong>{request.recipient.first_name} {request.recipient.last_name}</strong> ({request.recipient.email})
                      </p>
                      <p className="request-status">Status: <span className="pending-status">Pending</span></p>
                    </>
                  )}
                  <div className="request-actions">
                    <button 
                      onClick={() => handleCancelRequest(request.id)} 
                      className="danger-button"
                      disabled={cancellingRequestId === request.id}
                    >
                      {cancellingRequestId === request.id ? 'Cancelling...' : 'Cancel Request'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>No partner linked. <Link to="/add-partner">Add a partner</Link></p>
        )}
        {message && <p className="success-message">{message}</p>}
      </div>

      <MessageFilterTester />
    </div>
  );
}

export default Settings; 