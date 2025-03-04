import React, { useState } from 'react';
import { FaTimes, FaCalendarAlt, FaChild, FaInfoCircle } from 'react-icons/fa';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col my-8">
        <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <FaCalendarAlt className="mr-2 text-primary" /> Create Custody Schedule
          </h3>
          <button 
            className="text-gray-500 hover:text-gray-700 transition-colors" 
            onClick={onClose}
          >
            <FaTimes className="text-xl" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-grow overflow-y-auto p-6 space-y-4 max-h-[60vh]">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Schedule Name *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., Regular Custody Schedule"
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
                rows="2"
                placeholder="Optional details about this schedule"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date <span className="text-gray-500 text-xs">(leave empty for indefinite)</span>
                </label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="schedule_type" className="block text-sm font-medium text-gray-700 mb-1">
                Schedule Type
              </label>
              <select
                id="schedule_type"
                name="schedule_type"
                value={formData.schedule_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="weekly">Weekly (same schedule every week)</option>
                <option value="biweekly">Bi-weekly (alternating weeks)</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FaChild className="mr-1 text-gray-500" /> Children Included
              </label>
              <div className="border border-gray-200 rounded-md p-3 max-h-40 overflow-y-auto">
                {children.length > 0 ? (
                  <div className="space-y-2">
                    {children.map(child => (
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
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No children added yet. Add children in settings.</p>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h4 className="text-md font-medium text-gray-700 mb-2">Weekly Schedule</h4>
              <p className="text-sm text-gray-600 mb-4">
                Assign which parent has the children on each day of the week.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                {Object.keys(formData.schedule_pattern.days).map(day => (
                  <div key={day} className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="bg-gray-100 px-3 py-2 text-center font-medium text-gray-700">
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </div>
                    <div className="p-2 space-y-2">
                      <button
                        type="button"
                        className={`w-full py-1 px-2 rounded-md text-sm transition-colors ${
                          formData.schedule_pattern.days[day].parent === 'parent1' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => handleCustodyAssignment(day, 'parent1')}
                      >
                        Parent 1
                      </button>
                      <button
                        type="button"
                        className={`w-full py-1 px-2 rounded-md text-sm transition-colors ${
                          formData.schedule_pattern.days[day].parent === 'parent2' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => handleCustodyAssignment(day, 'parent2')}
                      >
                        Parent 2
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex items-start text-sm text-gray-600">
                <FaInfoCircle className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <p>
                  This is a simplified version. In the future, you'll be able to set specific times for transitions,
                  add special schedules for holidays, and create more complex custody arrangements.
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-2">
            <button 
              type="button" 
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            >
              Create Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustodyScheduleModal; 