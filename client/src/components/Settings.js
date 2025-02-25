import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { partnerAPI } from '../services/api';
import MessageFilterTester from './MessageFilterTester';
import { formatPhoneNumber } from '../utils/validation';
import ChildrenManager from './settings/ChildrenManager';
import { FaUser, FaUserFriends, FaPhone, FaEnvelope, FaExclamationTriangle } from 'react-icons/fa';

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
    
    fetchPartner();
    fetchOutgoingRequests();
  }, [user]);

  const handleUnlink = async () => {
    if (window.confirm('Are you sure you want to unlink your partner? This action cannot be undone.')) {
      try {
        const result = await partnerAPI.unlinkPartner(user.id);
        if (result.success) {
          setPartnerData(null);
          setMessage('Partner unlinked successfully');
        } else {
          setMessage('Failed to unlink partner');
        }
      } catch (err) {
        console.error('Error unlinking partner:', err);
        setMessage('An error occurred while unlinking partner');
      }
    }
  };

  const handleCancelRequest = async (requestId) => {
    setCancellingRequestId(requestId);
    try {
      const result = await partnerAPI.cancelRequest(requestId);
      if (result.success) {
        setOutgoingRequests(outgoingRequests.filter(req => req.id !== requestId));
        setMessage('Request cancelled successfully');
      } else {
        setMessage('Failed to cancel request');
      }
    } catch (err) {
      console.error('Error cancelling request:', err);
      setMessage('An error occurred while cancelling request');
    } finally {
      setCancellingRequestId(null);
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
        setMessage('Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage('An error occurred while updating profile');
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
    <div className="max-w-4xl mx-auto py-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h2>
      
      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
          {message}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-4">
          <FaUser className="text-primary mr-2" />
          <h3 className="text-xl font-semibold text-gray-700">Your Profile</h3>
        </div>
        
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={profileData.firstName}
                onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={profileData.lastName}
                onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaEnvelope className="inline mr-1" /> Email (Read Only)
            </label>
            <input
              type="email"
              value={profileData.email}
              readOnly
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FaPhone className="inline mr-1" /> Phone
            </label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={handlePhoneChange}
              placeholder="555-123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          
          <div>
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Update Profile
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-4">
          <FaUserFriends className="text-primary mr-2" />
          <h3 className="text-xl font-semibold text-gray-700">Linked Partner</h3>
        </div>
        
        {partnerData ? (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-md">
              <p className="font-medium">
                Linked with: <span className="text-primary">{partnerData.firstName} {partnerData.lastName}</span>
              </p>
              <p className="text-gray-600">
                <FaPhone className="inline mr-1" /> {partnerData.phone}
              </p>
            </div>
            
            <button 
              onClick={handleUnlink} 
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors flex items-center"
            >
              <FaExclamationTriangle className="mr-2" /> Unlink Partner
            </button>
          </div>
        ) : outgoingRequests.length > 0 ? (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">Pending Link Requests</h4>
            <ul className="space-y-3">
              {outgoingRequests.map(request => (
                <li key={request.id} className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  {request.status === 'invited' ? (
                    <div>
                      <p className="mb-1">
                        You sent an invitation to <span className="font-medium">{request.recipient.email}</span>
                      </p>
                      <p className="text-sm text-yellow-600 mb-3">
                        Status: <span className="font-medium">Invitation Sent</span>
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="mb-1">
                        You sent a link request to <span className="font-medium">{request.recipient.first_name} {request.recipient.last_name}</span> ({request.recipient.email})
                      </p>
                      <p className="text-sm text-yellow-600 mb-3">
                        Status: <span className="font-medium">Pending</span>
                      </p>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button 
                      onClick={() => handleCancelRequest(request.id)} 
                      disabled={cancellingRequestId === request.id}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {cancellingRequestId === request.id ? 'Cancelling...' : 'Cancel Request'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
            <p className="mb-3">No partner linked.</p>
            <Link 
              to="/add-partner" 
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors inline-block"
            >
              Add a partner
            </Link>
          </div>
        )}
      </div>

      <ChildrenManager />

      <MessageFilterTester />
    </div>
  );
}

export default Settings; 