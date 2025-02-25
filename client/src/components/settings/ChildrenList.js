import React from 'react';
import { FaChild, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

function ChildrenList({ children, onAddChild, onEditChild, onDeleteChild }) {
  const handleDelete = (childId, childName) => {
    if (window.confirm(`Are you sure you want to delete ${childName}?`)) {
      onDeleteChild(childId);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-medium text-gray-700">Children</h4>
        <button 
          className="flex items-center px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors" 
          onClick={onAddChild}
          title="Add Child"
        >
          <FaPlus className="mr-1" /> Add Child
        </button>
      </div>
      
      {children.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-md">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Birth</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {children.map(child => (
                <tr key={child.id} className="hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <div 
                      className="w-5 h-5 rounded-full" 
                      style={{ backgroundColor: child.color || '#9E9E9E' }}
                    ></div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center">
                      <FaChild className="text-gray-500 mr-2" />
                      <span className="text-gray-700">{child.first_name} {child.last_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-gray-600">
                    {child.date_of_birth ? new Date(child.date_of_birth).toLocaleDateString() : 'Not set'}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex space-x-2">
                      <button 
                        className="p-1 text-blue-500 hover:text-blue-700 transition-colors" 
                        onClick={() => onEditChild(child)}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="p-1 text-red-500 hover:text-red-700 transition-colors" 
                        onClick={() => handleDelete(child.id, `${child.first_name} ${child.last_name}`)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-gray-500 mb-4">No children added yet</p>
          <button 
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors" 
            onClick={onAddChild}
          >
            Add Child
          </button>
        </div>
      )}
    </div>
  );
}

export default ChildrenList; 