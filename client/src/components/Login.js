import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FaHeart } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import FormInput from './common/FormInput';
import { validateLoginForm, formatErrorMessages } from '../utils/validation';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState('');
  const { login } = useAuth();

  // Test account credentials
  const testAccount = {
    email: 'dev@example.com',
    password: 'deviscool123',
    firstName: 'Dev',
    lastName: 'User',
    phone: '555-1234'
  };

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear location state after reading
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // Test account bypass
    if (formData.email === testAccount.email && formData.password === testAccount.password) {
      const userData = { 
        id: 1, 
        email: formData.email,
        firstName: testAccount.firstName,
        lastName: testAccount.lastName,
        phone: testAccount.phone,
        requiresProfile: true // Force profile check for test account
      };
      localStorage.setItem('user', JSON.stringify(userData));
      
      navigate('/app', { 
        state: { 
          requiresPartner: true, 
          requiresProfile: true
        } 
      });
      return;
    }

    // Validate form
    const validation = validateLoginForm(formData.email, formData.password);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        navigate('/app');
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
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
      <h2>Login</h2>
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}
      {error && <p className="error">{error}</p>}
      <form className="login-form" onSubmit={handleLogin}>
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
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
}

export default Login; 