import React from 'react';
import { FaChild, FaCog } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function ChildrenList({ children }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Children</h3>
        <Link 
          to="/app/settings" 
          className="text-gray-500 hover:text-primary transition-colors" 
          title="Manage Children in Settings"
        >
          <FaCog className="text-lg" />
        </Link>
      </div>
      
      {children.length > 0 ? (
        <ul className="space-y-2">
          {children.map(child => (
            <li key={child.id} className="flex items-center p-2 rounded-md hover:bg-gray-50">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: child.color || '#9E9E9E' }}
              ></div>
              <FaChild className="text-gray-500 mr-2" />
              <span className="text-sm text-gray-700">
                {child.first_name} {child.last_name}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-4 space-y-2">
          <p className="text-sm text-gray-500">No children added yet</p>
          <Link 
            to="/app/settings" 
            className="inline-block text-sm bg-white border border-primary text-primary hover:bg-primary hover:text-white px-3 py-1 rounded-md transition-colors"
          >
            Manage Children
          </Link>
        </div>
      )}
    </div>
  );
}

export default ChildrenList; 