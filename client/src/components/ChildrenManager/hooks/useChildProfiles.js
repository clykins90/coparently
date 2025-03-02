import { useState } from 'react';
import axios from 'axios';

/**
 * Custom hook for managing child profiles
 * Handles state, API calls, and form validation for child profiles
 */
const useChildProfiles = () => {
  const [children, setChildren] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChild, setCurrentChild] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    color: '#3B82F6',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [notification, setNotification] = useState(null);

  // Show notification
  const showNotification = (title, message, type) => {
    setNotification({ title, message, type });
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Fetch child profiles
  const fetchChildren = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token'); // <-- GET TOKEN
      const response = await axios.get('/api/children', {
        headers: {
          Authorization: `Bearer ${token}` // <-- INCLUDE TOKEN
        }
      });
      setChildren(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching children:', err);
      
      let errorMessage = 'Failed to fetch children data';
      
      if (err.response) {
        console.error('Server error response:', err.response.data);
        errorMessage = err.response.data.message || `Server error: ${err.response.status}`;
        
        if (err.response.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
        }
      } else if (err.request) {
        console.error('No response received:', err.request);
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        console.error('Request setup error:', err.message);
        errorMessage = `Error setting up request: ${err.message}`;
      }
      
      showNotification('Error', errorMessage, 'error');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form data for adding a new child
  const resetFormForNewChild = () => {
    setCurrentChild(null);
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      color: '#3B82F6',
      notes: ''
    });
    setFormErrors({});
  };

  // Set form data for editing an existing child
  const setFormForExistingChild = (child) => {
    setCurrentChild(child);
    setFormData({
      firstName: child.first_name || '',
      lastName: child.last_name || '',
      dateOfBirth: child.date_of_birth ? new Date(child.date_of_birth).toISOString().split('T')[0] : '',
      color: child.color || '#3B82F6',
      notes: child.notes || ''
    });
    setFormErrors({});
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  // Validate form data
  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form data to create or update a child
  const submitChildForm = async () => {
    if (!validateForm()) {
      return { success: false };
    }
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token'); // <-- GET TOKEN
      const childData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth || null,
        color: formData.color,
        notes: formData.notes
      };
      
      if (currentChild) {
        // Update existing child
        await axios.put(`/api/children/${currentChild.id}`, childData, {
          headers: {
            Authorization: `Bearer ${token}` // <-- INCLUDE TOKEN
          }
        });
        showNotification('Success', 'Child updated successfully', 'success');
      } else {
        // Add new child
        await axios.post('/api/children', childData, {
          headers: {
            Authorization: `Bearer ${token}` // <-- INCLUDE TOKEN
          }
        });
        showNotification('Success', 'Child added successfully', 'success');
      }
      
      // Refetch children data
      const updatedChildren = await fetchChildren();
      return { success: true, data: updatedChildren };
    } catch (err) {
      console.error('Error saving child:', err);
      showNotification('Error', 'An error occurred while saving child', 'error');
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a child
  const deleteChild = async (childId) => {
    if (!window.confirm('Are you sure you want to delete this child?')) {
      return { success: false, canceled: true };
    }
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token'); // <-- GET TOKEN
      await axios.delete(`/api/children/${childId}`, {
        headers: {
          Authorization: `Bearer ${token}` // <-- INCLUDE TOKEN
        }
      });
      showNotification('Success', 'Child deleted successfully', 'success');
      
      // Refetch children data
      const updatedChildren = await fetchChildren();
      return { success: true, data: updatedChildren };
    } catch (err) {
      console.error('Error deleting child:', err);
      showNotification('Error', 'An error occurred while deleting child', 'error');
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    children,
    isLoading,
    currentChild,
    formData,
    formErrors,
    notification,
    fetchChildren,
    resetFormForNewChild,
    setFormForExistingChild,
    handleInputChange,
    validateForm,
    submitChildForm,
    deleteChild
  };
};

export default useChildProfiles;