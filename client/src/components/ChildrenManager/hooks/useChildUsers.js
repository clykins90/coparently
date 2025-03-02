import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';

/**
 * Custom hook for managing child users
 * - Fetching all child accounts
 * - Inviting child accounts
 * - Direct creation of child accounts
 * - Deleting child links
 */
export default function useChildUsers() {
  const [childUsers, setChildUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Invite form state
  const [inviteFormData, setInviteFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    relationship: 'child'
  });
  const [inviteFormErrors, setInviteFormErrors] = useState({});

  // Direct create form state
  const [directCreateFormData, setDirectCreateFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    relationship: 'child'
  });
  const [directCreateFormErrors, setDirectCreateFormErrors] = useState({});

  const { user } = useAuth();

  function showNotification(title, message, type) {
    setNotification({ title, message, type });
    setTimeout(() => setNotification(null), 5000);
  }

  /**
   * Fetch all child-user accounts
   */
  async function fetchChildUsers() {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users/children', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setChildUsers(response.data.children);
      return response.data.children;
    } catch (error) {
      console.error('Error fetching child users:', error);
      showNotification('Error', 'An error occurred while fetching child users', 'error');
      return [];
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Validate the invite form
   */
  function validateInviteForm() {
    const errors = {};
    if (!inviteFormData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!inviteFormData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!inviteFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(inviteFormData.email)) {
      errors.email = 'Email is invalid';
    }
    setInviteFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  /**
   * Submit invitation form
   */
  async function submitInviteForm() {
    if (!validateInviteForm()) {
      return { success: false };
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = {
        firstName: inviteFormData.firstName,
        lastName: inviteFormData.lastName,
        email: inviteFormData.email,
        relationship: inviteFormData.relationship,
        parentId: user ? user.id : null
      };
      await axios.post('/api/users/children/invite', data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      showNotification('Success', 'Invitation sent successfully', 'success');
      resetInviteForm();
      const updated = await fetchChildUsers();
      return { success: true, data: updated };
    } catch (error) {
      console.error('Error inviting child user:', error);
      showNotification('Error', error.response?.data?.message || 'Error sending invitation', 'error');
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Reset the invite form
   */
  function resetInviteForm() {
    setInviteFormData({
      firstName: '',
      lastName: '',
      email: '',
      relationship: 'child'
    });
    setInviteFormErrors({});
  }

  /**
   * Handle invite form input change
   */
  function handleInviteInputChange(e) {
    const { name, value } = e.target;
    setInviteFormData((prev) => ({ ...prev, [name]: value }));
    if (inviteFormErrors[name]) {
      setInviteFormErrors((errs) => ({ ...errs, [name]: null }));
    }
  }

  /**
   * Validate direct create form
   */
  function validateDirectCreateForm() {
    const errors = {};
    if (!directCreateFormData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!directCreateFormData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!directCreateFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(directCreateFormData.email)) {
      errors.email = 'Email is invalid';
    }
    if (!directCreateFormData.password) {
      errors.password = 'Password is required';
    } else if (directCreateFormData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (directCreateFormData.password !== directCreateFormData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setDirectCreateFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  /**
   * Submit direct create form
   */
  async function submitDirectCreateForm() {
    if (!validateDirectCreateForm()) {
      return { success: false };
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = {
        firstName: directCreateFormData.firstName,
        lastName: directCreateFormData.lastName,
        email: directCreateFormData.email,
        password: directCreateFormData.password,
        relationship: directCreateFormData.relationship,
        parentId: user ? user.id : null
      };
      await axios.post('/api/users/children', data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      showNotification('Success', 'Child user created successfully', 'success');
      resetDirectCreateForm();
      const updated = await fetchChildUsers();
      return { success: true, data: updated };
    } catch (error) {
      console.error('Error creating child user:', error);
      showNotification('Error', error.response?.data?.message || 'Error creating child user', 'error');
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Reset direct create form
   */
  function resetDirectCreateForm() {
    setDirectCreateFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      relationship: 'child'
    });
    setDirectCreateFormErrors({});
  }

  /**
   * Handle direct create form input changes
   */
  function handleDirectCreateInputChange(e) {
    const { name, value } = e.target;
    setDirectCreateFormData((prev) => ({ ...prev, [name]: value }));
    if (directCreateFormErrors[name]) {
      setDirectCreateFormErrors((errs) => ({ ...errs, [name]: null }));
    }
  }

  /**
   * Delete a child user link
   */
  async function deleteChildUser(userId) {
    if (!window.confirm('Are you sure you want to remove this child user link?')) {
      return { success: false, canceled: true };
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/users/children/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      showNotification('Success', 'Child user link removed successfully', 'success');
      const updated = await fetchChildUsers();
      return { success: true, data: updated };
    } catch (error) {
      console.error('Error removing child user:', error);
      showNotification('Error', 'An error occurred while removing child user', 'error');
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Prefill direct create form (optional convenience)
   */
  function prefillDirectCreateForm(firstName, lastName) {
    setDirectCreateFormData((prev) => ({
      ...prev,
      firstName,
      lastName
    }));
  }

  return {
    childUsers,
    isLoading,
    notification,

    // Hooks for the invite flow
    inviteFormData,
    inviteFormErrors,
    handleInviteInputChange,
    submitInviteForm,
    resetInviteForm,

    // Hooks for direct create flow
    directCreateFormData,
    directCreateFormErrors,
    handleDirectCreateInputChange,
    submitDirectCreateForm,
    resetDirectCreateForm,
    prefillDirectCreateForm,

    // Main fetch & delete
    fetchChildUsers,
    deleteChildUser
  };
}