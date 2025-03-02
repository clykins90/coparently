import React from 'react';
import PropTypes from 'prop-types';

/**
 * Button component with consistent styling across the app
 */
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  type = 'button',
  onClick,
  icon,
  ...props 
}) => {
  // Define base styles
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  // Define variant styles
  const variantStyles = {
    primary: "bg-primary-dark text-white hover:bg-primary focus:ring-primary font-semibold",
    secondary: "bg-secondary text-gray-800 hover:bg-secondary-dark focus:ring-secondary font-medium",
    subtle: "bg-primary-dark bg-opacity-90 text-white hover:bg-primary focus:ring-primary font-medium",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 font-medium",
    dangerSubtle: "bg-red-500 bg-opacity-20 text-red-700 hover:bg-opacity-30 focus:ring-red-500 font-medium",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500 font-medium",
  };
  
  // Define size styles
  const sizeStyles = {
    sm: "text-xs px-2.5 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-6 py-3",
  };
  
  // Combine all styles
  const buttonStyles = `
    ${baseStyles} 
    ${variantStyles[variant]} 
    ${sizeStyles[size]} 
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''} 
    ${className}
  `;
  
  return (
    <button
      type={type}
      className={buttonStyles}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'subtle', 'danger', 'dangerSubtle', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
  icon: PropTypes.node,
};

export default Button; 