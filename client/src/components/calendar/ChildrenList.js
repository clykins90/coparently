import React from 'react';
import { FaChild, FaPlus } from 'react-icons/fa';

function ChildrenList({ children, onAddChild }) {
  return (
    <div className="children-list">
      <div className="children-header">
        <h4>Children</h4>
        <button 
          className="add-child-btn" 
          onClick={onAddChild}
          title="Add Child"
        >
          <FaPlus />
        </button>
      </div>
      
      {children.length > 0 ? (
        <ul className="children-items">
          {children.map(child => (
            <li key={child.id} className="child-item">
              <div 
                className="child-color-indicator" 
                style={{ backgroundColor: child.color || '#9E9E9E' }}
              ></div>
              <FaChild className="child-icon" />
              <span className="child-name">
                {child.first_name} {child.last_name}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="no-children">
          <p>No children added yet</p>
          <button 
            className="btn btn-sm btn-outline-primary" 
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