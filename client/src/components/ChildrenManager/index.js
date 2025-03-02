import React, { useState, useEffect } from 'react';
import { FaPlus, FaUserPlus } from 'react-icons/fa';
import Button from '../common/Button';

// Custom hooks
import useChildProfiles from './hooks/useChildProfiles';
import useChildUsers from './hooks/useChildUsers';
import useCombinedChildren from './hooks/useCombinedChildren';

// Components
import ChildProfileForm from './components/ChildProfileForm';
import ChildUserInviteForm from './components/ChildUserInviteForm';
import ChildUserCreateForm from './components/ChildUserCreateForm';
import ChildrenTable from './components/ChildrenTable';

/**
 * ChildrenManager component
 * Main component for managing children profiles and user accounts
 */
const ChildrenManager = () => {
  // State for UI control
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showDirectCreateForm, setShowDirectCreateForm] = useState(false);

  // Initialize hooks
  const childProfiles = useChildProfiles();
  const childUsers = useChildUsers();
  const { combinedChildren } = useCombinedChildren(
    childProfiles.children,
    childUsers.childUsers
  );

  // Fetch data on component mount
  useEffect(() => {
    childProfiles.fetchChildren();
    childUsers.fetchChildUsers();
  }, []);

  // Child profile handlers
  const handleOpenAddChildModal = () => {
    childProfiles.resetFormForNewChild();
    setIsAddModalOpen(true);
  };

  const handleOpenEditChildModal = (child) => {
    if (child) {
      childProfiles.setFormForExistingChild(child);
      setIsEditModalOpen(true);
    } else {
      handleOpenAddChildModal();
    }
  };

  const handleCloseChildModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
  };

  const handleChildFormSubmit = async (e) => {
    e.preventDefault();
    const result = await childProfiles.submitChildForm();
    if (result.success) {
      handleCloseChildModal();
    }
  };

  const handleDeleteChild = async (childId) => {
    await childProfiles.deleteChild(childId);
  };

  // Child user handlers
  const handleToggleInviteForm = () => {
    setShowInviteForm(!showInviteForm);
    if (!showInviteForm) {
      setShowDirectCreateForm(false);
      childUsers.resetInviteForm();
    }
  };

  const handleToggleDirectCreateForm = () => {
    setShowDirectCreateForm(!showDirectCreateForm);
    if (!showDirectCreateForm) {
      setShowInviteForm(false);
      childUsers.resetDirectCreateForm();
    }
  };

  const handleInviteFormSubmit = async (e) => {
    e.preventDefault();
    const result = await childUsers.submitInviteForm();
    if (result.success) {
      setShowInviteForm(false);
    }
  };

  const handleDirectCreateFormSubmit = async (e) => {
    e.preventDefault();
    const result = await childUsers.submitDirectCreateForm();
    if (result.success) {
      setShowDirectCreateForm(false);
    }
  };

  const handleDeleteChildUser = async (userId) => {
    await childUsers.deleteChildUser(userId);
  };

  const handlePrefillCreateAccount = (firstName, lastName) => {
    childUsers.prefillDirectCreateForm(firstName, lastName);
    setShowDirectCreateForm(true);
    setShowInviteForm(false);
  };

  const handlePrefillInviteUser = (firstName, lastName) => {
    childUsers.resetInviteForm();
    childUsers.inviteFormData.firstName = firstName;
    childUsers.inviteFormData.lastName = lastName;
    setShowInviteForm(true);
    setShowDirectCreateForm(false);
  };

  // Determine if any loading is happening
  const isLoading = childProfiles.isLoading || childUsers.isLoading;

  // Display notification from either hook
  const notification = childProfiles.notification || childUsers.notification;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {notification && notification.type === 'error' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">{notification.title}</p>
          <p>{notification.message}</p>
        </div>
      )}
      
      {notification && notification.type === 'success' && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">{notification.title}</p>
          <p>{notification.message}</p>
        </div>
      )}
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Children Management</h2>
        <p className="text-gray-600">Manage your children's profiles and child user accounts</p>
      </div>
      
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-medium text-gray-700">Children</h4>
          <div className="flex space-x-2">
            <Button 
              onClick={handleOpenAddChildModal}
              className="flex items-center"
              icon={<FaPlus />}
            >
              Add Child
            </Button>
            <Button 
              onClick={handleToggleDirectCreateForm}
              className="flex items-center"
              icon={<FaPlus />}
            >
              Create Child User
            </Button>
            <Button 
              onClick={handleToggleInviteForm}
              className="flex items-center"
              icon={<FaUserPlus />}
            >
              Invite Child User
            </Button>
          </div>
        </div>
        
        <ChildUserInviteForm 
          isVisible={showInviteForm}
          onClose={handleToggleInviteForm}
          formData={childUsers.inviteFormData}
          formErrors={childUsers.inviteFormErrors}
          isLoading={childUsers.isLoading}
          onInputChange={childUsers.handleInviteInputChange}
          onSubmit={handleInviteFormSubmit}
        />
        
        <ChildUserCreateForm 
          isVisible={showDirectCreateForm}
          onClose={handleToggleDirectCreateForm}
          formData={childUsers.directCreateFormData}
          formErrors={childUsers.directCreateFormErrors}
          isLoading={childUsers.isLoading}
          onInputChange={childUsers.handleDirectCreateInputChange}
          onSubmit={handleDirectCreateFormSubmit}
        />
        
        <ChildrenTable 
          combinedChildren={combinedChildren}
          onEditChild={handleOpenEditChildModal}
          onDeleteChild={handleDeleteChild}
          onDeleteChildUser={handleDeleteChildUser}
          onCreateAccount={handlePrefillCreateAccount}
          onInviteUser={handlePrefillInviteUser}
        />
      </div>
      
      <ChildProfileForm 
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={handleCloseChildModal}
        isEditing={isEditModalOpen}
        formData={childProfiles.formData}
        formErrors={childProfiles.formErrors}
        isLoading={childProfiles.isLoading}
        onInputChange={childProfiles.handleInputChange}
        onSubmit={handleChildFormSubmit}
      />
    </div>
  );
};

export default ChildrenManager; 