import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormInput from './common/FormInput';
import { validateRegistrationForm, formatErrorMessages, handlePhoneChange } from '../utils/validation';
import { FaHeart } from 'react-icons/fa';

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for phone number
    if (name === 'phone') {
      handlePhoneChange(e, setFormData, formData);
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    const validation = validateRegistrationForm(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await register(formData);
      
      if (result.success) {
        navigate('/login', { state: { message: 'Registration successful! Please login' } });
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="app-logo">
        <FaHeart className="logo-icon" />
        <h1>CoParently</h1>
      </div>
      <h2>Create Account</h2>
      {error && <p className="error">{error}</p>}
      <form className="login-form" onSubmit={handleRegister}>
        <FormInput
          type="text"
          name="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleChange}
          error={formErrors.firstName}
          required
        />
        <FormInput
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleChange}
          error={formErrors.lastName}
          required
        />
        <FormInput
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          error={formErrors.email}
          required
        />
        <FormInput
          type="tel"
          name="phone"
          placeholder="Phone Number (e.g., 555-123-4567)"
          value={formData.phone}
          onChange={handleChange}
          error={formErrors.phone}
          required
        />
        <FormInput
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          error={formErrors.password}
          required
        />
        <button 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Account...' : 'Register'}
        </button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
}

export default Register; 