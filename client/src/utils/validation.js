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

// Name validation (at least 2 characters, letters only)
export const isValidName = (name) => {
  return name.trim().length >= 2 && /^[A-Za-z\s-']+$/.test(name);
};

// Validate login form
export const validateLoginForm = (email, password) => {
  const errors = {};
  
  if (!email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!password) {
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