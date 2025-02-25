import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { partnerAPI } from '../services/api';

function LinkPartner() {
  const [partnerEmail, setPartnerEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLink = async (e) => {
    e.preventDefault();
    try {
      const data = await partnerAPI.invitePartner(user.id, partnerEmail);
      
      if (data.success) {
        setMessage(data.message);
        if (data.partnerExists) {
          // Partner exists and was linked
          setTimeout(() => navigate('/app/communication'), 1500);
        } else {
          // Invitation sent to new partner
          setMessage('Invitation sent! Your partner will receive an email to join.');
        }
      } else {
        setMessage(data.message);
      }
    } catch (err) {
      setMessage('Failed to send invitation');
    }
  };

  return (
    <div className="link-partner-container">
      <h2>Link with Your Partner</h2>
      <p>Enter your partner's email to send them an invitation to connect.</p>
      {message && <p className="message">{message}</p>}
      <form onSubmit={handleLink}>
        <input 
          type="email"
          placeholder="Partner's Email" 
          value={partnerEmail} 
          onChange={(e) => setPartnerEmail(e.target.value)}
          required
        />
        <button type="submit">Send Invitation</button>
      </form>
    </div>
  );
}

export default LinkPartner; 