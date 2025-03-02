import React, { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import Button from '../common/Button';

// Custom hooks
import useChildProfiles from './hooks/useChildProfiles';
import useChildUsers from './hooks/useChildUsers';
import useCombinedChildren from './hooks/useCombinedChildren';

// Components
import ChildProfileForm from './components/ChildProfileForm';
import ChildrenTable from './components/ChildrenTable';

/**
 * ChildrenManager component
 * Main component for managing children profiles and (optionally) child user accounts
 */
const ChildrenManager = () => {
  // State to control the open/closed status of our ChildProfileForm
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  // If editing an existing child, store that child object here (otherwise null)
  const [editingChild, setEditingChild] = useState(null);

  // Hooks for managing child data
  const childProfiles = useChildProfiles();
  const childUsers = useChildUsers();

  // Combine data for display
  const { combinedChildren } = useCombinedChildren(
    childProfiles.children,
    childUsers.childUsers
  );

  // Fetch data on component mount
  useEffect(() => {
    childProfiles.fetchChildren();
    childUsers.fetchChildUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open modal for creating a *new* child (with or without user account)
  const handleOpenAddChildModal = () => {
    setEditingChild(null);
    setIsChildModalOpen(true);
  };

  // Open modal for editing an *existing* child
  const handleOpenEditChildModal = (child) => {
    setEditingChild(child);
    setIsChildModalOpen(true);
  };

  // Close the modal
  const handleCloseChildModal = () => {
    setIsChildModalOpen(false);
    setEditingChild(null);
    // We also reset forms in the custom hooks
    childProfiles.resetFormForNewChild();
    childUsers.resetInviteForm();
    childUsers.resetDirectCreateForm();
  };

  // Combined submission logic: either create or update the child profile,
  // and if "enable user account" is checked, create or update child user.
  const handleSubmitChild = async (childData) => {
    // childData includes: first/last name, dateOfBirth, color, notes, plus user stuff (email, password, relationship, etc.)
    // Decide if this is create vs. update
    const isEditing = !!editingChild; 

    // 1) If editing, we first update the "child profile" if it is not purely a user-only row
    //    If creating, we create the "child profile"
    //    childProfiles.submitChildForm has logic for create/update
    const result = await childProfiles.submitUnifiedChildForm(childData, editingChild);

    if (!result.success) {
      return; // we assume the custom hook already displayed error notifications
    }

    // 2) If the user toggled "enableUserAccount", we handle child user creation or update
    if (childData.enableUserAccount) {
      // If we *just* created the child, we have the new child's data in result.data
      // That has a newly assigned ID if it's a brand-new child
      const actualChildId = result.data?.newChildId 
        ? result.data.newChildId 
        : (editingChild ? editingChild.id : null);

      if (actualChildId) {
        // Call user creation or update from childUsers
        await childUsers.submitUnifiedChildUserForm(childData, actualChildId, editingChild);
      }
    } else {
      // If they do NOT want to enable the user account
      // and the child had an account previously, we might remove it if desired
      // For simplicity, let's not auto-remove user accounts here unless you want that logic
    }

    // Finally, re-fetch data
    await childProfiles.fetchChildren();
    await childUsers.fetchChildUsers();

    // Close the modal
    handleCloseChildModal();
  };

  // Deletion logic
  const handleDeleteChild = async (childId) => {
    await childProfiles.deleteChild(childId);
    // No separate hook call for user side, because the child profile removal is enough
  };

  // Deletion logic for child user link only
  const handleDeleteChildUser = async (userId) => {
    await childUsers.deleteChildUser(userId);
  };

  // Display any loading or notification from the hooks
  const isLoading = childProfiles.isLoading || childUsers.isLoading;
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
        <p className="text-gray-600">Manage your children's profiles and optional child user accounts</p>
      </div>

      <div className="flex justify-end mb-4">
        <Button 
          onClick={handleOpenAddChildModal}
          className="flex items-center"
          icon={<FaPlus />}
        >
          Add Child
        </Button>
      </div>

      <ChildrenTable
        combinedChildren={combinedChildren}
        onEditChild={handleOpenEditChildModal}
        onDeleteChild={handleDeleteChild}
        onDeleteChildUser={handleDeleteChildUser}
      />

      {/* Unified Child Modal */}
      {isChildModalOpen && (
        <ChildProfileForm
          isOpen={isChildModalOpen}
          onClose={handleCloseChildModal}
          onSubmit={handleSubmitChild}
          isLoading={isLoading}
          // If editing an existing child, pass that along
          editingChild={editingChild}
        />
      )}
    </div>
  );
};

export default ChildrenManager;