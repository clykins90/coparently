import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaUserFriends, FaPhone, FaEnvelope, FaCamera, FaTrash, FaUpload, FaChild } from 'react-icons/fa';
import Avatar from './common/Avatar';
import Button from './common/Button';
import { childUserAPI } from '../services/api';

function ChildSettings() {
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile'); // Default to profile tab
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [linkedParents, setLinkedParents] = useState([]);
  const [linkedSiblings, setLinkedSiblings] = useState([]);
  const [isLoadingParents, setIsLoadingParents] = useState(false);
  const [isLoadingSiblings, setIsLoadingSiblings] = useState(false);
  const [parentsError, setParentsError] = useState('');
  const [siblingsError, setSiblingsError] = useState('');
  const fileInputRef = useRef(null);
  const { user, updateProfile, updateProfilePicture, removeProfilePicture } = useAuth();

  // Load user profile data
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        email: user.email || ''
      });
      
      // Fetch linked parents
      fetchLinkedParents();
      
      // Fetch linked siblings
      fetchLinkedSiblings();
    }
  }, [user]);
  
  // Fetch linked parents from the API
  const fetchLinkedParents = async () => {
    setIsLoadingParents(true);
    setParentsError('');
    try {
      const response = await childUserAPI.getLinkedParents();
      if (response.success) {
        setLinkedParents(response.parents);
      } else {
        setParentsError(response.message || 'Failed to fetch linked parents');
      }
    } catch (error) {
      console.error('Error fetching linked parents:', error);
      setParentsError('An error occurred while fetching linked parents');
    } finally {
      setIsLoadingParents(false);
    }
  };
  
  // Fetch linked siblings from the API
  const fetchLinkedSiblings = async () => {
    setIsLoadingSiblings(true);
    setSiblingsError('');
    try {
      const response = await childUserAPI.getLinkedSiblings();
      if (response.success) {
        setLinkedSiblings(response.siblings);
      } else {
        setSiblingsError(response.message || 'Failed to fetch linked siblings');
      }
    } catch (error) {
      console.error('Error fetching linked siblings:', error);
      setSiblingsError('An error occurred while fetching linked siblings');
    } finally {
      setIsLoadingSiblings(false);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const result = await updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone
      });
      
      if (result.success) {
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  // Handle phone number formatting
  const handlePhoneChange = (e) => {
    const formattedPhone = e.target.value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    setProfileData({...profileData, phone: formattedPhone});
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File is too large. Maximum size is 5MB.');
      return;
    }
    
    // Check file type
    if (!file.type.match('image.*')) {
      setUploadError('Only image files are allowed.');
      return;
    }
    
    setIsUploading(true);
    setUploadError('');
    
    try {
      const result = await updateProfilePicture(file);
      if (!result.success) {
        setUploadError(result.message || 'Failed to upload profile picture.');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setUploadError('An error occurred while uploading your profile picture.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle profile picture removal
  const handleRemoveProfilePicture = async () => {
    try {
      const result = await removeProfilePicture();
      if (!result.success) {
        setUploadError(result.message || 'Failed to remove profile picture.');
      }
    } catch (error) {
      console.error('Error removing profile picture:', error);
      setUploadError('An error occurred while removing your profile picture.');
    }
  };

  // Tab rendering functions
  const renderProfileTab = () => (
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
  );

  const renderLinkedParentsTab = () => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center mb-4">
        <FaUserFriends className="text-primary mr-2" />
        <h3 className="text-xl font-semibold text-gray-700">Linked Parents</h3>
      </div>
      
      {isLoadingParents ? (
        <div className="text-center py-4">
          <p className="text-gray-500">Loading parents...</p>
        </div>
      ) : parentsError ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          <p>{parentsError}</p>
        </div>
      ) : linkedParents.length === 0 ? (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
          <p>No linked parents found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-md">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relationship</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {linkedParents.map(parent => (
                <tr key={parent.id}>
                  <td className="py-3 px-3">
                    <div className="flex items-center">
                      <Avatar 
                        src={parent.profilePicture}
                        firstName={parent.firstName}
                        lastName={parent.lastName}
                        size="sm"
                        className="mr-2"
                      />
                      {parent.firstName} {parent.lastName}
                    </div>
                  </td>
                  <td className="py-3 px-3">{parent.email}</td>
                  <td className="py-3 px-3">
                    {parent.relationship === 'mother' ? 'Mom' : 
                     parent.relationship === 'father' ? 'Dad' : 
                     parent.relationship === 'stepmother' ? 'Stepmom' : 
                     parent.relationship === 'stepfather' ? 'Stepdad' : 
                     parent.relationship || 'Parent'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderLinkedSiblingsTab = () => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center mb-4">
        <FaChild className="text-primary mr-2" />
        <h3 className="text-xl font-semibold text-gray-700">Linked Siblings</h3>
      </div>
      
      {isLoadingSiblings ? (
        <div className="text-center py-4">
          <p className="text-gray-500">Loading siblings...</p>
        </div>
      ) : siblingsError ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          <p>{siblingsError}</p>
        </div>
      ) : linkedSiblings.length === 0 ? (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
          <p>No linked siblings found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-md">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {linkedSiblings.map(sibling => {
                // Calculate age if dateOfBirth is available
                let age = '';
                if (sibling.dateOfBirth) {
                  const birthDate = new Date(sibling.dateOfBirth);
                  const today = new Date();
                  age = today.getFullYear() - birthDate.getFullYear();
                  const m = today.getMonth() - birthDate.getMonth();
                  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                  }
                }
                
                return (
                  <tr key={sibling.id}>
                    <td className="py-3 px-3">
                      <div className="flex items-center">
                        <Avatar 
                          src={sibling.profilePicture}
                          firstName={sibling.firstName}
                          lastName={sibling.lastName}
                          size="sm"
                          className="mr-2"
                        />
                        {sibling.firstName} {sibling.lastName}
                      </div>
                    </td>
                    <td className="py-3 px-3">{sibling.email}</td>
                    <td className="py-3 px-3">{age ? `${age} years` : 'Unknown'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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
              Your Profile
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('parents')}
              className={`inline-flex items-center px-4 py-2 border-b-2 rounded-t-lg ${
                activeTab === 'parents'
                  ? 'border-primary text-primary'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              <FaUserFriends className={`mr-2 ${activeTab === 'parents' ? 'text-primary' : 'text-gray-400'}`} />
              Linked Parents
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('siblings')}
              className={`inline-flex items-center px-4 py-2 border-b-2 rounded-t-lg ${
                activeTab === 'siblings'
                  ? 'border-primary text-primary'
                  : 'border-transparent hover:text-gray-600 hover:border-gray-300'
              }`}
            >
              <FaChild className={`mr-2 ${activeTab === 'siblings' ? 'text-primary' : 'text-gray-400'}`} />
              Linked Siblings
            </button>
          </li>
        </ul>
      </div>
      
      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'parents' && renderLinkedParentsTab()}
        {activeTab === 'siblings' && renderLinkedSiblingsTab()}
      </div>
    </div>
  );
}

export default ChildSettings; 