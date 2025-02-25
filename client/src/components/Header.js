import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaHome } from 'react-icons/fa';

function Header() {
  const { user } = useAuth();
  
  return (
    <header className="bg-white shadow-md py-3 fixed top-0 left-0 right-0 z-20">
      <div className="flex justify-between items-center px-4">
        <div className="w-64 flex justify-center">
          <Link to="/app" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-dark to-primary hover:from-primary hover:to-primary-light transition-colors duration-300 flex items-center">
            <FaHome className="mr-2 text-primary" />
            Coparently
          </Link>
        </div>
        
        <div className="flex items-center">
          {user && (
            <div className="flex items-center space-x-3 bg-secondary rounded-full py-2 px-4 hover:bg-secondary-dark transition-colors">
              {user.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt={`${user.firstName} ${user.lastName}`} 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                  <FaUser className="text-sm" />
                </div>
              )}
              <span className="font-medium text-gray-800">
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