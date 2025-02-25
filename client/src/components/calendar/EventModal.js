import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

function EventModal({ 
  mode, 
  event, 
  selectedDate, 
  children, 
  onClose, 
  onCreate, 
  onUpdate, 
  onDelete,
  currentUserId
}) {
  // Initialize form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    event_type: 'other',
    is_recurring: false,
    recurrence_pattern: null,
    is_all_day: false,
    responsible_parent_id: null,
    status: 'approved',
    color: '',
    notes: '',
    child_ids: []
  });
  
  // Set up form data when component mounts or when event/mode changes
  useEffect(() => {
    if (mode === 'edit' && event) {
      // Format dates for form inputs
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      setFormData({
        id: event.id,
        title: event.title || '',
        description: event.description || '',
        start_time: format(startDate, "yyyy-MM-dd'T'HH:mm"),
        end_time: format(endDate, "yyyy-MM-dd'T'HH:mm"),
        location: event.location || '',
        event_type: event.eventType || 'other',
        is_recurring: event.isRecurring || false,
        recurrence_pattern: event.recurrencePattern || null,
        is_all_day: event.allDay || false,
        responsible_parent_id: event.responsibleParentId || null,
        status: event.status || 'approved',
        color: event.color || '',
        notes: event.notes || '',
        child_ids: event.children?.map(child => child.id) || []
      });
    } else if (mode === 'create' && selectedDate) {
      // For new events, initialize with the selected date
      const startDate = new Date(selectedDate);
      const endDate = new Date(selectedDate);
      endDate.setHours(endDate.getHours() + 1); // Default to 1 hour duration
      
      setFormData({
        ...formData,
        start_time: format(startDate, "yyyy-MM-dd'T'HH:mm"),
        end_time: format(endDate, "yyyy-MM-dd'T'HH:mm")
      });
    }
  }, [mode, event, selectedDate]);
  
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
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert form data to the format expected by the API
    const eventData = {
      ...formData,
      // Convert string dates to ISO format
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString()
    };
    
    if (mode === 'create') {
      onCreate(eventData);
    } else {
      onUpdate(eventData);
    }
  };
  
  // Handle event deletion
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      onDelete(event.id);
    }
  };
  
  // Check if user can edit the event (creator or responsible parent)
  const canEdit = mode === 'create' || 
    (event && (event.createdById === currentUserId || event.responsibleParentId === currentUserId));
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{mode === 'create' ? 'Create New Event' : 'Edit Event'}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {!canEdit ? (
          <div className="modal-body">
            <p className="error-message">You don't have permission to edit this event.</p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="form-control"
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
                  rows="3"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="event_type">Event Type</label>
                  <select
                    id="event_type"
                    name="event_type"
                    value={formData.event_type}
                    onChange={handleChange}
                    className="form-control"
                  >
                    <option value="custody_transfer">Custody Transfer</option>
                    <option value="appointment">Appointment</option>
                    <option value="activity">Activity</option>
                    <option value="school">School</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_all_day"
                    checked={formData.is_all_day}
                    onChange={handleChange}
                  />
                  All Day Event
                </label>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start_time">Start Time *</label>
                  <input
                    type="datetime-local"
                    id="start_time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleChange}
                    required
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="end_time">End Time *</label>
                  <input
                    type="datetime-local"
                    id="end_time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleChange}
                    required
                    className="form-control"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="responsible_parent_id">Responsible Parent</label>
                <select
                  id="responsible_parent_id"
                  name="responsible_parent_id"
                  value={formData.responsible_parent_id || ''}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="">None</option>
                  {/* This would need to be populated with the co-parent's information */}
                  <option value={currentUserId}>Me</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Children Involved</label>
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
              
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="form-control"
                  rows="3"
                />
              </div>
              
              {/* Recurring event options - simplified for now */}
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_recurring"
                    checked={formData.is_recurring}
                    onChange={handleChange}
                  />
                  Recurring Event
                </label>
                {formData.is_recurring && (
                  <div className="recurring-options">
                    <p className="note">Recurring event options will be available in a future update.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              {mode === 'edit' && (
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleDelete}
                >
                  Delete
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">
                {mode === 'create' ? 'Create' : 'Update'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default EventModal; 