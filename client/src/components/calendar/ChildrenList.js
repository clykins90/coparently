import React from 'react';
import { FaChild, FaCog } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function ChildrenList({ children }) {
  return (
    <div className="children-list">
      <div className="children-header">
        <h4>Children</h4>
        <Link 
          to="/app/settings" 
          className="settings-link" 
          title="Manage Children in Settings"
        >
          <FaCog />
        </Link>
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
          <Link 
            to="/app/settings" 
            className="btn btn-sm btn-outline-primary"
          >
            Manage Children
          </Link>
        </div>
      )}
    </div>
  );
}

export default ChildrenList; 