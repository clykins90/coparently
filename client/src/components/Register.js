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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light/10 to-secondary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="flex justify-center">
            <FaHeart className="text-primary text-4xl" />
          </div>
          <h1 className="mt-2 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-dark to-primary">
            CoParently
          </h1>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Create your account</h2>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            {error}
          </div>
        )}
        
        <form className="mt-8 space-y-4" onSubmit={handleRegister}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
          
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
          
          <div className="mt-6">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSubmitting ? 'Creating Account...' : 'Register'}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary-dark transition-colors duration-200">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register; 