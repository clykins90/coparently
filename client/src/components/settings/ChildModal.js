import React, { useState, useEffect } from 'react';
import childrenService from '../../services/childrenService';
import { FaChild, FaTimes, FaSpinner } from 'react-icons/fa';

function ChildModal({ child, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    notes: '',
    color: '#9E9E9E' // Default color
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const isEditMode = !!child;
  
  // Set up form data when component mounts or when child changes
  useEffect(() => {
    if (isEditMode && child) {
      setFormData({
        first_name: child.first_name || '',
        last_name: child.last_name || '',
        date_of_birth: child.date_of_birth || '',
        notes: child.notes || '',
        color: child.color || '#9E9E9E'
      });
    }
  }, [isEditMode, child]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (isEditMode) {
        // Update existing child
        await childrenService.updateChild(child.id, formData);
      } else {
        // Create new child
        await childrenService.createChild(formData);
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving child:', err);
      setError('Failed to save child. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Predefined color options
  const colorOptions = [
    { value: '#4285F4', label: 'Blue' },
    { value: '#EA4335', label: 'Red' },
    { value: '#34A853', label: 'Green' },
    { value: '#FBBC05', label: 'Yellow' },
    { value: '#9E9E9E', label: 'Grey' },
    { value: '#9C27B0', label: 'Purple' },
    { value: '#FF9800', label: 'Orange' },
    { value: '#00BCD4', label: 'Cyan' }
  ];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <FaChild className="mr-2 text-primary" />
            {isEditMode ? 'Edit Child' : 'Add Child'}
          </h3>
          <button 
            className="text-gray-500 hover:text-gray-700 transition-colors" 
            onClick={onClose}
          >
            <FaTimes className="text-xl" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(option => (
                  <div 
                    key={option.value}
                    className={`w-8 h-8 rounded-full cursor-pointer transition-all ${
                      formData.color === option.value 
                        ? 'ring-2 ring-offset-2 ring-primary' 
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: option.value }}
                    onClick={() => setFormData(prev => ({ ...prev, color: option.value }))}
                    title={option.label}
                  ></div>
                ))}
              </div>
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows="3"
              ></textarea>
            </div>
          </div>
          
          <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-2">
            <button 
              type="button" 
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                isEditMode ? 'Update' : 'Add'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChildModal; 