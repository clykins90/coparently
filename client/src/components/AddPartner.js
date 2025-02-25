import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { partnerAPI } from '../services/api';

function AddPartner() {
  const [partnerEmail, setPartnerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasPartnerOrRequest, setHasPartnerOrRequest] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const checkExistingPartner = async () => {
      if (!user) return;
      
      try {
        // Check if user already has a partner
        const partnerData = await partnerAPI.getPartner(user.id).catch(() => ({ success: false }));
        
        if (partnerData.success) {
          setHasPartnerOrRequest(true);
          setError('You already have a linked partner. You can only have one partner at a time.');
          return;
        }
        
        // Check if user has any pending requests
        const outgoingData = await partnerAPI.getOutgoingRequests(user.id);
        if (outgoingData.success && outgoingData.requests.length > 0) {
          setHasPartnerOrRequest(true);
          setError('You already have a pending partner request. Please cancel it before sending a new one.');
          return;
        }
      } catch (err) {
        console.error('Error checking existing partner:', err);
      } finally {
        setInitialLoading(false);
      }
    };
    
    checkExistingPartner();
  }, [user]);

  const handleCheckPartner = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // First check if the partner exists
      const checkResult = await partnerAPI.checkPartner(partnerEmail);
      
      if (checkResult.success) {
        if (checkResult.exists) {
          // Partner exists, proceed to link
          navigate('/link-existing-partner', { 
            state: { 
              partnerEmail,
              isExistingUser: true 
            } 
          });
        } else {
          // Partner doesn't exist, proceed to invitation screen
          navigate('/invite-partner', { 
            state: { 
              partnerEmail,
              isExistingUser: false 
            } 
          });
        }
      } else {
        setError('Failed to check if partner exists');
      }
    } catch (err) {
      console.error('Error checking partner:', err);
      setError('An error occurred while checking partner');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="add-partner-container">Loading...</div>;
  }

  return (
    <div className="add-partner-container">
      <h2>Add Your Co-Parent</h2>
      <p>Enter your co-parent's email address to get started.</p>
      
      {error && <p className="error-message">{error}</p>}
      
      {!hasPartnerOrRequest && (
        <form onSubmit={handleCheckPartner}>
          <div className="form-group">
            <label htmlFor="partnerEmail">Co-Parent's Email:</label>
            <input
              id="partnerEmail"
              type="email"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              placeholder="Enter email address"
              required
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="primary-button"
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Continue'}
          </button>
        </form>
      )}
      
      {hasPartnerOrRequest && (
        <button 
          onClick={() => navigate('/app/settings')} 
          className="secondary-button"
        >
          Go to Settings
        </button>
      )}
    </div>
  );
}

export default AddPartner; 