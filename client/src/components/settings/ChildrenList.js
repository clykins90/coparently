import React from 'react';
import { FaChild, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

function ChildrenList({ children, onAddChild, onEditChild, onDeleteChild }) {
  const handleDelete = (childId, childName) => {
    if (window.confirm(`Are you sure you want to delete ${childName}?`)) {
      onDeleteChild(childId);
    }
  };

  return (
    <div className="children-list-container">
      <div className="children-header">
        <h4>Children</h4>
        <button 
          className="add-child-btn" 
          onClick={onAddChild}
          title="Add Child"
        >
          <FaPlus /> Add Child
        </button>
      </div>
      
      {children.length > 0 ? (
        <div className="children-table-container">
          <table className="children-table">
            <thead>
              <tr>
                <th>Color</th>
                <th>Name</th>
                <th>Date of Birth</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {children.map(child => (
                <tr key={child.id} className="child-row">
                  <td>
                    <div 
                      className="child-color-indicator" 
                      style={{ backgroundColor: child.color || '#9E9E9E' }}
                    ></div>
                  </td>
                  <td>
                    <div className="child-name">
                      <FaChild className="child-icon" />
                      <span>{child.first_name} {child.last_name}</span>
                    </div>
                  </td>
                  <td>
                    {child.date_of_birth ? new Date(child.date_of_birth).toLocaleDateString() : 'Not set'}
                  </td>
                  <td>
                    <div className="child-actions">
                      <button 
                        className="edit-btn" 
                        onClick={() => onEditChild(child)}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="delete-btn" 
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
        <div className="no-children">
          <p>No children added yet</p>
          <button 
            className="btn btn-primary" 
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