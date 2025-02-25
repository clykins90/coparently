import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { partnerAPI } from '../services/api';

function LinkExistingPartner() {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get the partner email from location state
  const partnerEmail = location.state?.partnerEmail || '';
  
  useEffect(() => {
    // If no partner email was provided, redirect back to add partner
    if (!partnerEmail) {
      navigate('/add-partner');
    }
  }, [partnerEmail, navigate]);

  const handleLinkPartner = async () => {
    setStatus('loading');
    setMessage('');
    
    try {
      const data = await partnerAPI.requestPartner(user.id, partnerEmail);
      
      if (data.success) {
        setStatus('success');
        
        if (data.autoAccepted) {
          // Partner had already sent a request to this user, auto-accepted
          setMessage('Partner linked successfully! Redirecting to settings...');
          setTimeout(() => navigate('/app/settings'), 1500);
        } else if (data.requestSent) {
          // Request sent to existing partner
          setMessage('Request sent! Your partner will need to accept the link request.');
          setTimeout(() => navigate('/app/settings'), 3000);
        } else {
          setMessage('Partner link request sent.');
          setTimeout(() => navigate('/app/settings'), 3000);
        }
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to send request');
      }
    } catch (err) {
      setStatus('error');
      if (err.message && (
        err.message.includes('already have a linked partner') || 
        err.message.includes('already have a pending partner request')
      )) {
        setMessage(err.message);
      } else {
        setMessage('Failed to send request. Please try again later.');
      }
      console.error('Error sending partner request:', err);
    }
  };

  const handleCancel = () => {
    navigate('/add-partner');
  };

  return (
    <div className="link-existing-partner-container">
      <h2>Link with Existing User</h2>
      
      <div className="partner-info">
        <p>We found an existing user with the email:</p>
        <p className="partner-email">{partnerEmail}</p>
        
        <p>Would you like to send a link request to this user?</p>
        
        {message && <p className={`message ${status === 'error' ? 'error' : 'success'}`}>{message}</p>}
        
        <div className="action-buttons">
          <button 
            onClick={handleLinkPartner} 
            className="primary-button"
            disabled={status === 'loading' || status === 'success'}
          >
            {status === 'loading' ? 'Sending...' : 'Send Link Request'}
          </button>
          
          <button 
            onClick={handleCancel} 
            className="secondary-button"
            disabled={status === 'loading' || status === 'success'}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default LinkExistingPartner; 