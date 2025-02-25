import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser } from 'react-icons/fa';

function Header() {
  const { user } = useAuth();
  
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo">
          <Link to="/app">Coparently</Link>
        </div>
        
        <div className="user-info">
          {user && (
            <div className="user-profile">
              {user.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt={`${user.firstName} ${user.lastName}`} 
                  className="profile-picture"
                />
              ) : (
                <FaUser className="profile-icon" />
              )}
              <span className="user-name">
                {user.firstName} {user.lastName}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header; 