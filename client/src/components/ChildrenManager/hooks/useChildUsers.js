import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';

/**
 * Custom hook for managing child users
 * - We unify "create account" and "invite" steps in one: "submitUnifiedChildUserForm"
 */
export default function useChildUsers() {
  const [childUsers, setChildUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // For leftover old forms, though we don't show them, we still keep these to avoid breakage
  const [inviteFormData, setInviteFormData] = useState({});
  const [inviteFormErrors, setInviteFormErrors] = useState({});
  const [directCreateFormData, setDirectCreateFormData] = useState({});
  const [directCreateFormErrors, setDirectCreateFormErrors] = useState({});

  const { user } = useAuth();

  function showNotification(title, message, type) {
    setNotification({ title, message, type });
    setTimeout(() => setNotification(null), 5000);
  }

  // Fetch all child-user accounts
  async function fetchChildUsers() {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users/children', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChildUsers(response.data.children);
    } catch (error) {
      console.error('Error fetching child users:', error);
      showNotification('Error', 'An error occurred while fetching child users', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  // We unify the logic for creating a child user account in a single method:
  // If the child is brand-new, we already created the child profile. Now we create the child user link
  async function submitUnifiedChildUserForm(formData, childId, editingChild = null) {
    setIsLoading(true);
    try {
      // Parent must be logged in
      const token = localStorage.getItem('token');
      const parentId = user ? user.id : null;
      if (!parentId) {
        showNotification('Error', 'No parent user found in context', 'error');
        return { success: false };
      }

      // If the child already had a user account (editingChild.hasUserAccount = true),
      // we typically wouldn't "create" a new user. The child user might exist already.
      // For simplicity, this code is mostly for brand-new creation.

      // We do a direct create if no user account existed:
      if (!editingChild || !editingChild.hasUserAccount) {
        // We create a brand-new child user
        // For brand-new user creation, we must have password
        const createPayload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          relationship: formData.relationship
        };
        await axios.post('/api/users/children', createPayload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showNotification('Success', 'Child user account created successfully', 'success');
      } else {
        // If we do want to handle "update" child user logic, you might do that here
        // For now, do nothing if the user account already existed
        console.log('Child user account already exists, skipping creation...');
      }

      // Refresh data
      await fetchChildUsers();
      return { success: true };
    } catch (error) {
      console.error('Error creating/updating child user account:', error);
      showNotification('Error', 'Failed to create or update child user account', 'error');
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }

  // Delete a child user link
  async function deleteChildUser(userId) {
    if (!window.confirm('Are you sure you want to remove the child user link?')) {
      return { success: false, canceled: true };
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/users/children/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Success', 'Child user link removed successfully', 'success');
      await fetchChildUsers();
      return { success: true };
    } catch (error) {
      console.error('Error removing child user:', error);
      showNotification('Error', 'An error occurred while removing child user link', 'error');
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }

  // Minimal stubs to keep old code safe:
  function resetInviteForm() {
    setInviteFormData({});
    setInviteFormErrors({});
  }
  function resetDirectCreateForm() {
    setDirectCreateFormData({});
    setDirectCreateFormErrors({});
  }

  return {
    childUsers,
    isLoading,
    notification,
    fetchChildUsers,
    deleteChildUser,

    // Unified create/update user
    submitUnifiedChildUserForm,

    // Old stubs
    inviteFormData,
    inviteFormErrors,
    directCreateFormData,
    directCreateFormErrors,
    resetInviteForm,
    resetDirectCreateForm
  };
}