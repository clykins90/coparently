import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { partnerAPI } from '../services/api';

function LinkPartner() {
  const [partnerEmail, setPartnerEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [pendingRequests, setPendingRequests] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Fetch pending partner requests
    const fetchPendingRequests = async () => {
      if (!user) return;
      
      try {
        const data = await partnerAPI.getPendingRequests(user.id);
        if (data.success) {
          setPendingRequests(data.requests);
        }
      } catch (err) {
        console.error('Error fetching pending requests:', err);
      }
    };
    
    fetchPendingRequests();
  }, [user]);

  const handleRequestPartner = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    
    try {
      const data = await partnerAPI.requestPartner(user.id, partnerEmail);
      
      if (data.success) {
        setStatus('success');
        
        if (data.partnerExists) {
          if (data.autoAccepted) {
            // Partner had already sent a request to this user, auto-accepted
            setMessage('Partner linked successfully! Redirecting to communication...');
            setTimeout(() => navigate('/app/communication'), 1500);
          } else if (data.requestSent) {
            // Request sent to existing partner
            setMessage('Request sent! Your partner will need to accept the link request.');
          }
        } else {
          // Invitation sent to new partner
          setMessage('Invitation sent! Your partner will receive an email to join.');
        }
        
        // Clear the form
        setPartnerEmail('');
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to send request');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Failed to send request');
      console.error('Error sending partner request:', err);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const data = await partnerAPI.respondToRequest(requestId, user.id, true);
      
      if (data.success) {
        setMessage('Partner request accepted! Redirecting to communication...');
        
        // Remove the request from the list
        setPendingRequests(pendingRequests.filter(req => req.id !== requestId));
        
        // Redirect to communication page
        setTimeout(() => navigate('/app/communication'), 1500);
      } else {
        setMessage(data.message || 'Failed to accept request');
      }
    } catch (err) {
      setMessage('Failed to accept request');
      console.error('Error accepting partner request:', err);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const data = await partnerAPI.respondToRequest(requestId, user.id, false);
      
      if (data.success) {
        setMessage('Partner request rejected');
        
        // Remove the request from the list
        setPendingRequests(pendingRequests.filter(req => req.id !== requestId));
      } else {
        setMessage(data.message || 'Failed to reject request');
      }
    } catch (err) {
      setMessage('Failed to reject request');
      console.error('Error rejecting partner request:', err);
    }
  };

  return (
    <div className="link-partner-container">
      <h2>Link with Your Partner</h2>
      
      {pendingRequests.length > 0 && (
        <div className="pending-requests">
          <h3>Pending Partner Requests</h3>
          <ul className="request-list">
            {pendingRequests.map(request => (
              <li key={request.id} className="request-item">
                <div className="request-info">
                  <p>
                    <strong>{request.requester.first_name} {request.requester.last_name}</strong> ({request.requester.email}) 
                    wants to link with you as a co-parent.
                  </p>
                </div>
                <div className="request-actions">
                  <button 
                    className="accept-button" 
                    onClick={() => handleAcceptRequest(request.id)}
                  >
                    Accept
                  </button>
                  <button 
                    className="reject-button" 
                    onClick={() => handleRejectRequest(request.id)}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="send-request">
        <p>Enter your partner's email to send them an invitation to connect.</p>
        {message && <p className={`message ${status === 'error' ? 'error' : 'success'}`}>{message}</p>}
        <form onSubmit={handleRequestPartner}>
          <input 
            type="email"
            placeholder="Partner's Email" 
            value={partnerEmail} 
            onChange={(e) => setPartnerEmail(e.target.value)}
            required
            disabled={status === 'loading'}
          />
          <button 
            type="submit" 
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LinkPartner; 