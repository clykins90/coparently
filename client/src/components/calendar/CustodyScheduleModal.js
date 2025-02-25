import React, { useState } from 'react';

function CustodyScheduleModal({ children, onClose, onCreate }) {
  // Initialize form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    end_date: '', // Empty means indefinite
    schedule_type: 'weekly',
    schedule_pattern: {
      days: {
        monday: { parent: null },
        tuesday: { parent: null },
        wednesday: { parent: null },
        thursday: { parent: null },
        friday: { parent: null },
        saturday: { parent: null },
        sunday: { parent: null }
      }
    },
    is_active: true,
    child_ids: [],
    parent_ids: [] // This would include the current user and their co-parent
  });
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Handle child selection changes
  const handleChildSelection = (childId) => {
    setFormData(prev => {
      const currentChildIds = [...prev.child_ids];
      
      if (currentChildIds.includes(childId)) {
        // Remove child if already selected
        return {
          ...prev,
          child_ids: currentChildIds.filter(id => id !== childId)
        };
      } else {
        // Add child if not selected
        return {
          ...prev,
          child_ids: [...currentChildIds, childId]
        };
      }
    });
  };
  
  // Handle custody assignment for a specific day
  const handleCustodyAssignment = (day, parentId) => {
    setFormData(prev => {
      const updatedPattern = { ...prev.schedule_pattern };
      updatedPattern.days[day].parent = parentId;
      
      return {
        ...prev,
        schedule_pattern: updatedPattern
      };
    });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate the schedule pattern to ensure all days have a parent assigned
    const allDaysAssigned = Object.values(formData.schedule_pattern.days).every(day => day.parent !== null);
    
    if (!allDaysAssigned) {
      alert('Please assign a parent for each day of the week.');
      return;
    }
    
    // Convert form data to the format expected by the API
    const scheduleData = {
      ...formData,
      // Convert empty end_date to null for indefinite schedules
      end_date: formData.end_date || null
    };
    
    onCreate(scheduleData);
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-content custody-modal">
        <div className="modal-header">
          <h3>Create Custody Schedule</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="title">Schedule Name *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="e.g., Regular Custody Schedule"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-control"
                rows="2"
                placeholder="Optional details about this schedule"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start_date">Start Date *</label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="end_date">End Date (leave empty for indefinite)</label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="schedule_type">Schedule Type</label>
              <select
                id="schedule_type"
                name="schedule_type"
                value={formData.schedule_type}
                onChange={handleChange}
                className="form-control"
              >
                <option value="weekly">Weekly (same schedule every week)</option>
                <option value="biweekly">Bi-weekly (alternating weeks)</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Children Included</label>
              <div className="checkbox-list">
                {children.length > 0 ? (
                  children.map(child => (
                    <label key={child.id} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.child_ids.includes(child.id)}
                        onChange={() => handleChildSelection(child.id)}
                      />
                      {child.first_name} {child.last_name}
                    </label>
                  ))
                ) : (
                  <p className="no-children-message">No children added yet. Add children in settings.</p>
                )}
              </div>
            </div>
            
            <div className="custody-schedule-builder">
              <h4>Weekly Schedule</h4>
              <p className="note">Assign which parent has the children on each day of the week.</p>
              
              <div className="custody-days">
                {Object.keys(formData.schedule_pattern.days).map(day => (
                  <div key={day} className="custody-day">
                    <div className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</div>
                    <div className="parent-options">
                      <button
                        type="button"
                        className={`parent-option ${formData.schedule_pattern.days[day].parent === 'parent1' ? 'selected' : ''}`}
                        onClick={() => handleCustodyAssignment(day, 'parent1')}
                      >
                        Parent 1
                      </button>
                      <button
                        type="button"
                        className={`parent-option ${formData.schedule_pattern.days[day].parent === 'parent2' ? 'selected' : ''}`}
                        onClick={() => handleCustodyAssignment(day, 'parent2')}
                      >
                        Parent 2
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="note">
                Note: This is a simplified version. In the future, you'll be able to set specific times for transitions,
                add special schedules for holidays, and create more complex custody arrangements.
              </p>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Schedule</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustodyScheduleModal; 