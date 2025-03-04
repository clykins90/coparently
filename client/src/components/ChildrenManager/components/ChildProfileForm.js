import React, { useEffect, useState } from 'react';
import Button from '../../common/Button';

/**
 * ChildProfileForm component
 * A single form that handles:
 *  - Child profile fields (name, DOB, color, notes)
 *  - Optionally enabling a user account (email, password, relationship)
 * 
 * If `editingChild` is provided, we load that child's data for editing.
 */
const ChildProfileForm = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editingChild
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    color: '#3B82F6',
    notes: '',
    // user account fields
    enableUserAccount: false,
    email: '',
    password: '',
    confirmPassword: '',
    relationship: 'mother'
  });

  // On mount or when editingChild changes, load data into form
  useEffect(() => {
    if (editingChild) {
      // If editing a "profile only" child or a "profile+user" child
      setFormData((prev) => ({
        ...prev,
        firstName: editingChild.first_name || editingChild.firstName || '',
        lastName: editingChild.last_name || editingChild.lastName || '',
        dateOfBirth: editingChild.date_of_birth 
          ? new Date(editingChild.date_of_birth).toISOString().split('T')[0]
          : '',
        color: editingChild.color || '#3B82F6',
        notes: editingChild.notes || '',
        enableUserAccount: editingChild.hasUserAccount || false,
        email: editingChild.userAccount?.email || '',
        password: '', // never show the actual password
        confirmPassword: '',
        relationship: editingChild.userAccount?.relationship || 'mother'
      }));
    } else {
      // brand new child
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        color: '#3B82F6',
        notes: '',
        enableUserAccount: false,
        email: '',
        password: '',
        confirmPassword: '',
        relationship: 'mother'
      });
    }
  }, [editingChild]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Submit form
  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic client-side validations
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert('First name and last name are required.');
      return;
    }
    if (formData.enableUserAccount && !formData.email) {
      alert('Email is required if enabling user account.');
      return;
    }
    if (formData.enableUserAccount && !editingChild) {
      // For brand-new child user, require password
      if (!formData.password) {
        alert('Please enter a password for the child user account, or disable "Enable user account."');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match.');
        return;
      }
    }
    // Fire the parent-level onSubmit with our entire formData
    onSubmit({ ...formData });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4">
          {editingChild ? 'Edit Child' : 'Add Child'}
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Row 1: Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          {/* Row 2: DOB and Color */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full p-1 border border-gray-300 rounded-md h-10"
              />
            </div>
          </div>

          {/* Row 3: Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows="3"
            ></textarea>
          </div>

          {/* Toggle: Enable user account */}
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              name="enableUserAccount"
              id="enableUserAccount"
              checked={formData.enableUserAccount}
              onChange={handleChange}
              className="mr-2"
            />
            <label htmlFor="enableUserAccount" className="block text-sm font-medium text-gray-700">
              Enable login account for this child
            </label>
          </div>

          {/* If enableUserAccount is checked, show fields for email, password, relationship */}
          {formData.enableUserAccount && (
            <div className="border border-gray-200 rounded-md p-4 mb-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required={formData.enableUserAccount}
                />
              </div>
              {/* Only require password if it's a brand-new child or user is specifically updating the password */}
              {!editingChild && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required={formData.enableUserAccount}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required={formData.enableUserAccount}
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Relationship to Child</label>
                <select
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="mother">Mom</option>
                  <option value="father">Dad</option>
                  <option value="stepmother">Stepmom</option>
                  <option value="stepfather">Stepdad</option>
                </select>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end">
            <Button 
              type="button"
              variant="secondary"
              onClick={onClose}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              isLoading={isLoading}
            >
              {editingChild ? 'Update Child' : 'Add Child'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChildProfileForm;