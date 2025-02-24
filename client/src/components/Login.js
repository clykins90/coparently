import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaHeart } from 'react-icons/fa';

function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');

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

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Test account bypass
    if (email === testAccount.email && password === testAccount.password) {
      const user = { 
        id: 1, 
        email,
        firstName: testAccount.firstName,
        lastName: testAccount.lastName,
        phone: testAccount.phone
      };
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      
      navigate('/app', { 
        state: { 
          requiresPartner: true, 
          requiresProfile: true // Force profile check for test account
        } 
      });
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.success) {
        const user = {
          id: data.userId,
          email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone
        };
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        
        navigate('/app', { 
          state: { 
            requiresPartner: data.requiresPartner,
            requiresProfile: data.requiresProfile 
          }
        });
      }
    } catch (err) {
      setError('Login failed');
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
        <input 
          type="email" 
          placeholder="Email"
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required
        />
        <input 
          type="password"
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
}

export default Login; 