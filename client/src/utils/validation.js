/**
 * Form validation utility functions
 */

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation (at least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character)
export const isValidPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Phone number validation (simple format check)
export const isValidPhone = (phone) => {
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return phoneRegex.test(phone);
};

/**
 * Format a phone number with dashes (e.g., 555-123-4567)
 * @param {string} phone - The phone number to format
 * @returns {string} - The formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limitedDigits = digitsOnly.substring(0, 10);
  
  // Format with dashes
  if (limitedDigits.length <= 3) {
    return limitedDigits;
  } else if (limitedDigits.length <= 6) {
    return `${limitedDigits.substring(0, 3)}-${limitedDigits.substring(3)}`;
  } else {
    return `${limitedDigits.substring(0, 3)}-${limitedDigits.substring(3, 6)}-${limitedDigits.substring(6)}`;
  }
};

/**
 * Handle phone number input change with automatic formatting
 * @param {Object} e - The input change event
 * @param {Function} setFormData - Function to update form data
 * @param {Object} formData - The current form data
 */
export const handlePhoneChange = (e, setFormData, formData) => {
  const formattedPhone = formatPhoneNumber(e.target.value);
  setFormData({
    ...formData,
    phone: formattedPhone
  });
};

// Name validation (at least 2 characters, letters only)
export const isValidName = (name) => {
  return name.trim().length >= 2 && /^[A-Za-z\s-']+$/.test(name);
};

// Validate login form
export const validateLoginForm = (formData) => {
  const errors = {};
  
  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!formData.password) {
    errors.password = 'Password is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate registration form
export const validateRegistrationForm = (formData) => {
  const { firstName, lastName, email, phone, password } = formData;
  const errors = {};
  
  if (!firstName) {
    errors.firstName = 'First name is required';
  } else if (!isValidName(firstName)) {
    errors.firstName = 'Please enter a valid first name';
  }
  
  if (!lastName) {
    errors.lastName = 'Last name is required';
  } else if (!isValidName(lastName)) {
    errors.lastName = 'Please enter a valid last name';
  }
  
  if (!email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!phone) {
    errors.phone = 'Phone number is required';
  } else if (!isValidPhone(phone)) {
    errors.phone = 'Please enter a valid phone number (e.g., 555-123-4567)';
  }
  
  if (!password) {
    errors.password = 'Password is required';
  } else if (!isValidPassword(password)) {
    errors.password = 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Format error messages for display
export const formatErrorMessages = (errors) => {
  return Object.values(errors).join('. ');
}; 