import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { partnerAPI } from '../services/api';

function InvitePartner() {
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

  const handleSendInvitation = async () => {
    setStatus('loading');
    setMessage('');
    
    try {
      const data = await partnerAPI.requestPartner(user.id, partnerEmail);
      
      if (data.success) {
        setStatus('success');
        setMessage('Invitation sent! Your partner will receive an email to join.');
        setTimeout(() => navigate('/app/settings'), 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to send invitation');
      }
    } catch (err) {
      setStatus('error');
      if (err.message && (
        err.message.includes('already have a linked partner') || 
        err.message.includes('already have a pending partner request')
      )) {
        setMessage(err.message);
      } else {
        setMessage('Failed to send invitation. Please try again later.');
      }
      console.error('Error sending partner invitation:', err);
    }
  };

  const handleCancel = () => {
    navigate('/add-partner');
  };

  return (
    <div className="invite-partner-container">
      <h2>Invite New Partner</h2>
      
      <div className="partner-info">
        <p>We couldn't find an existing user with the email:</p>
        <p className="partner-email">{partnerEmail}</p>
        
        <p>Would you like to send an invitation email to this address?</p>
        
        {message && <p className={`message ${status === 'error' ? 'error' : 'success'}`}>{message}</p>}
        
        <div className="action-buttons">
          <button 
            onClick={handleSendInvitation} 
            className="primary-button"
            disabled={status === 'loading' || status === 'success'}
          >
            {status === 'loading' ? 'Sending...' : 'Send Invitation'}
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

export default InvitePartner; 