import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaLock, FaSpinner, FaExclamationTriangle, FaChild } from 'react-icons/fa';
import { authAPI } from '../services/api';

function ChildSignup() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitationData, setInvitationData] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    
    if (!token) {
      setError('Invalid invitation link. Please ask your parent to send a new invitation.');
      setLoading(false);
      return;
    }
    
    // Verify the invitation token
    const verifyToken = async () => {
      try {
        const response = await authAPI.verifyChildInvitation(token);
        
        if (response.success) {
          setInvitationData(response.invitationData);
        } else {
          setError(response.message || 'Invalid or expired invitation.');
        }
      } catch (err) {
        console.error('Error verifying invitation:', err);
        setError('An error occurred while verifying your invitation. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    verifyToken();
  }, [location.search]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const searchParams = new URLSearchParams(location.search);
      const token = searchParams.get('token');
      
      const response = await authAPI.completeChildSignup({
        token,
        password: formData.password
      });
      
      if (response.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.message || 'Failed to complete signup. Please try again.');
      }
    } catch (err) {
      console.error('Error completing signup:', err);
      setError('An error occurred while completing your signup. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
          <div className="flex justify-center mb-6">
            <h1 className="text-2xl font-bold text-primary">Coparently</h1>
          </div>
          <div className="flex justify-center">
            <FaSpinner className="text-primary text-3xl animate-spin" />
          </div>
          <p className="text-center mt-4 text-gray-600">Verifying your invitation...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
          <div className="flex justify-center mb-6">
            <h1 className="text-2xl font-bold text-primary">Coparently</h1>
          </div>
          <div className="flex justify-center text-red-500 mb-4">
            <FaExclamationTriangle className="text-3xl" />
          </div>
          <h2 className="text-xl font-semibold text-center mb-4">Invitation Error</h2>
          <p className="text-center text-gray-600 mb-6">{error}</p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/login')}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
          <div className="flex justify-center mb-6">
            <h1 className="text-2xl font-bold text-primary">Coparently</h1>
          </div>
          <h2 className="text-xl font-semibold text-center mb-4">Account Created Successfully!</h2>
          <p className="text-center text-gray-600 mb-6">
            Your account has been created. You will be redirected to the login page in a moment.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/login')}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="flex justify-center mb-6">
          <h1 className="text-2xl font-bold text-primary">Coparently</h1>
        </div>
        
        <h2 className="text-2xl font-semibold text-center mb-2">Complete Your Account</h2>
        <p className="text-center text-gray-600 mb-6">
          Hello {invitationData?.firstName}, please create a password to complete your account setup.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <div className="flex items-center border border-gray-300 rounded-md bg-gray-100 px-3 py-2">
              <FaUser className="text-gray-400 mr-2" />
              <input
                type="text"
                value={invitationData?.email || ''}
                disabled
                className="w-full bg-gray-100 outline-none text-gray-600"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Password</label>
            <div className={`flex items-center border rounded-md px-3 py-2 ${formErrors.password ? 'border-red-500' : 'border-gray-300'}`}>
              <FaLock className="text-gray-400 mr-2" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full outline-none"
                placeholder="Create a password"
              />
            </div>
            {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Confirm Password</label>
            <div className={`flex items-center border rounded-md px-3 py-2 ${formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}>
              <FaLock className="text-gray-400 mr-2" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full outline-none"
                placeholder="Confirm your password"
              />
            </div>
            {formErrors.confirmPassword && <p className="text-red-500 text-sm mt-1">{formErrors.confirmPassword}</p>}
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded-md flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChildSignup; 