import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { partnerAPI } from '../services/api';
import { formatPhoneNumber } from '../utils/validation';
import ChildrenManager from './settings/ChildrenManager';
import { FaUser, FaUserFriends, FaPhone, FaEnvelope, FaExclamationTriangle, FaChild, FaFileAlt, FaCamera, FaTrash, FaUpload } from 'react-icons/fa';
import Avatar from './common/Avatar';
import Button from './common/Button';

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
  const [activeTab, setActiveTab] = useState('profile'); // Default to profile tab
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { user, updateProfile, updateProfilePicture, removeProfilePicture } = useAuth();

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

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please select a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const result = await updateProfilePicture(file);
      if (result.success) {
        setMessage('Profile picture updated successfully');
      } else {
        setUploadError(result.message || 'Failed to update profile picture');
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setUploadError('An error occurred while uploading profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (window.confirm('Are you sure you want to remove your profile picture?')) {
      try {
        const result = await removeProfilePicture();
        if (result.success) {
          setMessage('Profile picture removed successfully');
        } else {
          setUploadError(result.message || 'Failed to remove profile picture');
        }
      } catch (err) {
        console.error('Error removing profile picture:', err);
        setUploadError('An error occurred while removing profile picture');
      }
    }
  };

  // Tab rendering functions
  const renderProfileAndPartnerTab = () => (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center mb-4">
          <FaUser className="text-primary mr-2" />
          <h3 className="text-xl font-semibold text-gray-700">Your Profile</h3>
        </div>

        {/* Profile Picture Section */}
        <div className="mb-6 flex flex-col items-center sm:flex-row sm:items-start">
          <div className="relative mb-4 sm:mb-0 sm:mr-6">
            <Avatar 
              src={user.profilePicture}
              firstName={user.firstName}
              lastName={user.lastName}
              size="2xl"
            />
            <div className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary-dark transition-colors">
              <FaCamera onClick={() => fileInputRef.current.click()} />
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleProfilePictureUpload}
              />
            </div>
          </div>
          
          <div className="flex flex-col items-center sm:items-start">
            <h4 className="text-lg font-medium text-gray-800 mb-2">Profile Picture</h4>
            <div className="flex space-x-2">
              <Button 
                onClick={() => fileInputRef.current.click()}
                disabled={isUploading}
                variant="subtle"
                size="sm"
                icon={<FaUpload />}
              >
                {isUploading ? 'Uploading...' : 'Upload New'}
              </Button>
              
              {user.profilePicture && (
                <Button 
                  onClick={handleRemoveProfilePicture}
                  variant="dangerSubtle"
                  size="sm"
                  icon={<FaTrash />}
                >
                  Remove
                </Button>
              )}
            </div>
            {uploadError && (
              <p className="text-red-500 text-sm mt-2">{uploadError}</p>
            )}
            <p className="text-gray-500 text-sm mt-2">
              Recommended: Square image, at least 200x200 pixels
            </p>
          </div>
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
            <Button 
              type="submit" 
              variant="subtle"
            >
              Update Profile
            </Button>
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
            
            <Button 
              onClick={handleUnlink} 
              variant="dangerSubtle"
              icon={<FaExclamationTriangle />}
            >
              Unlink Partner
            </Button>
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
                    <Button 
                      onClick={() => handleCancelRequest(request.id)} 
                      disabled={cancellingRequestId === request.id}
                      variant="ghost"
                      size="sm"
                    >
                      {cancellingRequestId === request.id ? 'Cancelling...' : 'Cancel Request'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
            <p className="mb-3">No partner linked.</p>
            <Link to="/add-partner">
              <Button variant="subtle">
                Add a partner
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );

  const renderChildrenTab = () => (
    <ChildrenManager />
  );

  const renderDocumentsTab = () => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center mb-4">
        <FaFileAlt className="text-primary mr-2" />
        <h3 className="text-xl font-semibold text-gray-700">Documents</h3>
      </div>
      
      <p className="text-gray-600 mb-6">
        This section will allow you to manage important documents related to your co-parenting arrangement.
      </p>
      
      <div className="p-8 bg-gray-50 border border-gray-200 rounded-md text-center">
        <p className="text-gray-500">Document management features coming soon.</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h2>
      
      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
          {message}
        </div>
      )}
      
      {/* Tabs Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`inline-flex items-center px-4 py-2 border-b-2 rounded-t-lg ${
                activeTab === 'profile'
                  ? 'border-primary text-primary'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              <FaUser className={`mr-2 ${activeTab === 'profile' ? 'text-primary' : 'text-gray-400'}`} />
              Your Profile & Linked Partner
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('children')}
              className={`inline-flex items-center px-4 py-2 border-b-2 rounded-t-lg ${
                activeTab === 'children'
                  ? 'border-primary text-primary'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              <FaChild className={`mr-2 ${activeTab === 'children' ? 'text-primary' : 'text-gray-400'}`} />
              Children
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('documents')}
              className={`inline-flex items-center px-4 py-2 border-b-2 rounded-t-lg ${
                activeTab === 'documents'
                  ? 'border-primary text-primary'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              <FaFileAlt className={`mr-2 ${activeTab === 'documents' ? 'text-primary' : 'text-gray-400'}`} />
              Documents
            </button>
          </li>
        </ul>
      </div>
      
      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'profile' && renderProfileAndPartnerTab()}
        {activeTab === 'children' && renderChildrenTab()}
        {activeTab === 'documents' && renderDocumentsTab()}
      </div>
    </div>
  );
}

export default Settings; 