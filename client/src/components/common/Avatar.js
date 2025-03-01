import React from 'react';
import { FaUser } from 'react-icons/fa';
import PropTypes from 'prop-types';

/**
 * Avatar component for displaying user profile pictures
 * Falls back to initials or default icon if no image is provided
 */
const Avatar = ({ 
  src, 
  alt, 
  size = 'md', 
  firstName = '', 
  lastName = '', 
  className = '',
  onClick = null
}) => {
  // Define size classes
  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32'
  };
  
  // Define icon sizes
  const iconSizes = {
    xs: 'text-lg',
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
    '2xl': 'text-5xl'
  };
  
  // Get initials from name
  const getInitials = () => {
    const firstInitial = firstName ? firstName.charAt(0) : '';
    const lastInitial = lastName ? lastName.charAt(0) : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };
  
  // Handle image error (fallback to UI Avatars API)
  const handleImageError = (e) => {
    e.target.onerror = null; // Prevent infinite loop
    if (firstName || lastName) {
      e.target.src = `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=0D8ABC&color=fff`;
    } else {
      // If we don't have a name, replace with null to show the icon
      e.target.src = null;
    }
  };
  
  return (
    <div 
      className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 flex items-center justify-center ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {src ? (
        <img 
          src={src} 
          alt={alt || `${firstName} ${lastName}`} 
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      ) : firstName || lastName ? (
        <div className="w-full h-full bg-primary text-white flex items-center justify-center font-medium">
          {getInitials()}
        </div>
      ) : (
        <FaUser className={`text-gray-400 ${iconSizes[size]}`} />
      )}
    </div>
  );
};

Avatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
  firstName: PropTypes.string,
  lastName: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func
};

export default Avatar; 