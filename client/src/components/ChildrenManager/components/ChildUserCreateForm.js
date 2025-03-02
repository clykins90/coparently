import React from 'react';
import Button from '../../common/Button';
import { FaTimes } from 'react-icons/fa';

/**
 * Child user create form component
 * Handles direct creation of child user accounts
 */
const ChildUserCreateForm = ({
  isVisible,
  onClose,
  formData,
  formErrors,
  isLoading,
  onInputChange,
  onSubmit
}) => {
  if (!isVisible) return null;

  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h5 className="font-medium">Create Child User</h5>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <FaTimes />
        </button>
      </div>
      
      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={onInputChange}
              className={`w-full p-2 border rounded-md ${formErrors.firstName ? 'border-red-500' : 'border-gray-300'}`}
            />
            {formErrors.firstName && (
              <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={onInputChange}
              className={`w-full p-2 border rounded-md ${formErrors.lastName ? 'border-red-500' : 'border-gray-300'}`}
            />
            {formErrors.lastName && (
              <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onInputChange}
            className={`w-full p-2 border rounded-md ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`}
          />
          {formErrors.email && (
            <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={onInputChange}
            className={`w-full p-2 border rounded-md ${formErrors.password ? 'border-red-500' : 'border-gray-300'}`}
          />
          {formErrors.password && (
            <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={onInputChange}
            className={`w-full p-2 border rounded-md ${formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
          />
          {formErrors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
          <select
            name="relationship"
            value={formData.relationship}
            onChange={onInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="child">Child</option>
            <option value="stepchild">Stepchild</option>
            <option value="other">Other</option>
          </select>
        </div>
        
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
            Create User
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChildUserCreateForm; 