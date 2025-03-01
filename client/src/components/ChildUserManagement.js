import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { childUserAPI } from '../services/api';
import { FaPlus, FaTrash, FaEdit, FaChild } from 'react-icons/fa';

function ChildUserManagement() {
  const [childUsers, setChildUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    fetchChildUsers();
  }, []);

  const fetchChildUsers = async () => {
    setIsLoading(true);
    try {
      const response = await childUserAPI.getChildUsers();
      if (response.success) {
        setChildUsers(response.childUsers);
      } else {
        setError(response.message || 'Failed to fetch child users');
      }
    } catch (err) {
      console.error('Error fetching child users:', err);
      setError('An error occurred while fetching child users');
    } finally {
      setIsLoading(false);
    }
  };

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

  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const childData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        parentId: user.id
      };
      
      const response = await childUserAPI.createChildUser(childData);
      
      if (response.success) {
        // Reset form and fetch updated list
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        setShowAddForm(false);
        fetchChildUsers();
      } else {
        setError(response.message || 'Failed to create child user');
      }
    } catch (err) {
      console.error('Error creating child user:', err);
      setError('An error occurred while creating child user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChild = async (childId) => {
    if (!window.confirm('Are you sure you want to remove this child user?')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await childUserAPI.deleteChildUser(childId);
      
      if (response.success) {
        fetchChildUsers();
      } else {
        setError(response.message || 'Failed to delete child user');
      }
    } catch (err) {
      console.error('Error deleting child user:', err);
      setError('An error occurred while deleting child user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Child Users</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md flex items-center"
        >
          {showAddForm ? 'Cancel' : <><FaPlus className="mr-2" /> Add Child User</>}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button 
            className="float-right font-bold"
            onClick={() => setError(null)}
          >
            &times;
          </button>
        </div>
      )}
      
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Add New Child User</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${formErrors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                />
                {formErrors.firstName && <p className="text-red-500 text-sm mt-1">{formErrors.firstName}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${formErrors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                />
                {formErrors.lastName && <p className="text-red-500 text-sm mt-1">{formErrors.lastName}</p>}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                />
                {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${formErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                />
                {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                />
                {formErrors.confirmPassword && <p className="text-red-500 text-sm mt-1">{formErrors.confirmPassword}</p>}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md flex items-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <FaPlus className="mr-2" />
                )}
                Add Child User
              </button>
            </div>
          </form>
        </div>
      )}
      
      {isLoading && !showAddForm ? (
        <div className="flex justify-center my-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {childUsers.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <FaChild className="mx-auto text-4xl mb-2 text-gray-400" />
              <p>No child users found. Add a child user to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {childUsers.map(child => (
                  <tr key={child.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary text-white rounded-full flex items-center justify-center">
                          {child.firstName.charAt(0)}{child.lastName.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{child.firstName} {child.lastName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{child.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteChild(child.id)}
                        className="text-red-600 hover:text-red-900 ml-2"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default ChildUserManagement; 