import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState(location.state?.message);

  // Test account credentials
  const testAccount = {
    email: 'dev@example.com',
    password: 'deviscool123'
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Temporary bypass for test account
    if (email === testAccount.email && password === testAccount.password) {
      const user = { id: 1, email };
      setUser(user);
      
      // Check if already linked
      const partnerResponse = await fetch(`/api/partner?userId=1`);
      const partnerData = await partnerResponse.json();
      partnerData.success ? navigate('/app') : navigate('/link-partner');
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
        const user = { id: data.userId, email };
        setUser(user);
        
        // Check for existing partner
        const partnerResponse = await fetch(`/api/partner?userId=${data.userId}`);
        const partnerData = await partnerResponse.json();
        partnerData.success ? navigate('/app') : navigate('/link-partner');
      }
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      {successMessage && <p className="success-message">{successMessage}</p>}
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