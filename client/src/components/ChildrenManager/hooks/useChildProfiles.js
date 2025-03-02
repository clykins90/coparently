import { useState } from 'react';
import axios from 'axios';

/**
 * Custom hook for managing child profiles
 * Now includes a new method "submitUnifiedChildForm" for an all-in-one creation or update
 */
const useChildProfiles = () => {
  const [children, setChildren] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChild, setCurrentChild] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [notification, setNotification] = useState(null);

  // Show a notification
  const showNotification = (title, message, type) => {
    setNotification({ title, message, type });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Fetch children from backend
  const fetchChildren = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/children', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChildren(response.data);
    } catch (err) {
      console.error('Error fetching children:', err);
      let errorMessage = 'Failed to fetch children data';
      if (err.response) {
        errorMessage = err.response.data.message || `Server error: ${err.response.status}`;
      }
      showNotification('Error', errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset for new child
  const resetFormForNewChild = () => {
    setCurrentChild(null);
    setFormErrors({});
  };

  // Delete a child
  const deleteChild = async (childId) => {
    if (!window.confirm('Are you sure you want to delete this child profile?')) {
      return { success: false, canceled: true };
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/children/${childId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Success', 'Child deleted successfully', 'success');
      await fetchChildren();
      return { success: true };
    } catch (err) {
      console.error('Error deleting child:', err);
      showNotification('Error', 'An error occurred while deleting child', 'error');
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Combined create/update method: "submitUnifiedChildForm"
   * If editingChild is null, create a new child. Otherwise, update the existing.
   */
  const submitUnifiedChildForm = async (formData, editingChild = null) => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const childPayload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth || null,
        color: formData.color,
        notes: formData.notes
      };

      let resultChildId = null;

      if (editingChild) {
        // Update existing child profile
        await axios.put(`/api/children/${editingChild.id}`, childPayload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showNotification('Success', 'Child updated successfully', 'success');
        resultChildId = editingChild.id;
      } else {
        // Create new child profile
        const createRes = await axios.post('/api/children', childPayload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showNotification('Success', 'Child added successfully', 'success');
        resultChildId = createRes.data.id; // new child's id
      }

      // Refresh list
      await fetchChildren();

      return { success: true, data: { newChildId: resultChildId } };
    } catch (err) {
      console.error('Error saving child profile:', err);
      showNotification('Error', 'An error occurred while saving child profile', 'error');
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    children,
    isLoading,
    currentChild,
    formErrors,
    notification,
    fetchChildren,
    resetFormForNewChild,
    deleteChild,
    submitUnifiedChildForm
  };
};

export default useChildProfiles;