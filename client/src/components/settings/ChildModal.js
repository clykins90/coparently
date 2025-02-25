import React, { useState, useEffect } from 'react';
import childrenService from '../../services/childrenService';

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
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{isEditMode ? 'Edit Child' : 'Add Child'}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first_name">First Name *</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="last_name">Last Name *</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="date_of_birth">Date of Birth</label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="color">Color</label>
              <div className="color-options">
                {colorOptions.map(option => (
                  <div 
                    key={option.value}
                    className={`color-option ${formData.color === option.value ? 'selected' : ''}`}
                    style={{ backgroundColor: option.value }}
                    onClick={() => setFormData(prev => ({ ...prev, color: option.value }))}
                    title={option.label}
                  ></div>
                ))}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="form-control"
                rows="3"
              ></textarea>
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (isEditMode ? 'Update' : 'Add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChildModal; 