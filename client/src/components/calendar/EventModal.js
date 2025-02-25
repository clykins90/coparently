import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FaTimes, FaTrash, FaMapMarkerAlt, FaCalendarAlt, FaClock, FaUser, FaChild, FaStickyNote } from 'react-icons/fa';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {mode === 'create' ? 'Create New Event' : 'Edit Event'}
          </h3>
          <button 
            className="text-gray-500 hover:text-gray-700 transition-colors" 
            onClick={onClose}
          >
            <FaTimes className="text-xl" />
          </button>
        </div>
        
        {!canEdit ? (
          <div className="p-6">
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
              <p>You don't have permission to edit this event.</p>
            </div>
            <div className="flex justify-end">
              <button 
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows="3"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="event_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Event Type
                  </label>
                  <select
                    id="event_type"
                    name="event_type"
                    value={formData.event_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="custody_transfer">Custody Transfer</option>
                    <option value="appointment">Appointment</option>
                    <option value="activity">Activity</option>
                    <option value="school">School</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FaMapMarkerAlt className="mr-1 text-gray-500" /> Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_all_day"
                  name="is_all_day"
                  checked={formData.is_all_day}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="is_all_day" className="ml-2 block text-sm text-gray-700">
                  All Day Event
                </label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FaCalendarAlt className="mr-1 text-gray-500" /> Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="start_time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FaClock className="mr-1 text-gray-500" /> End Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="end_time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="responsible_parent_id" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FaUser className="mr-1 text-gray-500" /> Responsible Parent
                </label>
                <select
                  id="responsible_parent_id"
                  name="responsible_parent_id"
                  value={formData.responsible_parent_id || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">None</option>
                  {/* This would need to be populated with the co-parent's information */}
                  <option value={currentUserId}>Me</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FaChild className="mr-1 text-gray-500" /> Children Involved
                </label>
                <div className="space-y-2 border border-gray-200 rounded-md p-3 max-h-40 overflow-y-auto">
                  {children.length > 0 ? (
                    children.map(child => (
                      <label key={child.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.child_ids.includes(child.id)}
                          onChange={() => handleChildSelection(child.id)}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {child.first_name} {child.last_name}
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">No children added yet. Add children in settings.</p>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FaStickyNote className="mr-1 text-gray-500" /> Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows="3"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_recurring"
                  name="is_recurring"
                  checked={formData.is_recurring}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="is_recurring" className="ml-2 block text-sm text-gray-700">
                  Recurring Event
                </label>
              </div>
              
              {formData.is_recurring && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-700">Recurring event options will be available in a future update.</p>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 px-6 py-4 flex justify-between">
              <div>
                {mode === 'edit' && (
                  <button 
                    type="button" 
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors flex items-center" 
                    onClick={handleDelete}
                  >
                    <FaTrash className="mr-2" /> Delete
                  </button>
                )}
              </div>
              <div className="flex space-x-2">
                <button 
                  type="button" 
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors" 
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition-colors"
                >
                  {mode === 'create' ? 'Create' : 'Update'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default EventModal; 