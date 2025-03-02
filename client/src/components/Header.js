// client/src/components/Header.js

import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSignOutAlt, FaCog, FaChevronDown } from 'react-icons/fa';
import Avatar from './common/Avatar';

function Header({ handleLogout, collapsed }) {
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Debug user object
  useEffect(() => {
    if (user) {
      console.log('User object in Header:', user);
    }
  }, [user]);
  
  return (
    <header className="bg-white shadow-sm py-2 fixed top-0 right-0 z-20 w-full h-16">
      <div className="flex justify-end items-center px-4 h-full">
        <div className="flex items-center">
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 bg-secondary rounded-full py-1 px-3 hover:bg-secondary-dark transition-colors"
              >
                <Avatar 
                  src={user.profilePicture}
                  firstName={user.firstName}
                  lastName={user.lastName}
                  size="xs"
                />
                <span className="font-medium text-gray-900 text-sm">
                  {user.firstName} {user.lastName}
                </span>
                <FaChevronDown className={`text-gray-700 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-30">
                  <Link 
                    to="/app/settings" 
                    className="block px-4 py-2 text-sm text-gray-800 font-medium hover:bg-gray-100 flex items-center"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <FaCog className="mr-2 text-primary-dark" />
                    Settings
                  </Link>
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }} 
                    className="block w-full text-left px-4 py-2 text-sm text-gray-800 font-medium hover:bg-gray-100 flex items-center"
                  >
                    <FaSignOutAlt className="mr-2 text-red-600" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;