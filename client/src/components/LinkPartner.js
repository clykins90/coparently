import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function LinkPartner({ user }) {
  const [partnerEmail, setPartnerEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkExistingPartner = async () => {
      const response = await fetch(`/api/partner?userId=${user.id}`);
      const data = await response.json();
      if (data.success) navigate('/app');
    };
    checkExistingPartner();
  }, [user.id, navigate]);

  const handleLink = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/link-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, partnerEmail })
      });
      const data = await response.json();
      if (data.success) {
        setMessage(data.message);
        setTimeout(() => navigate('/app/communication'), 1500);
      }
    } catch (err) {
      setMessage('Linking failed');
    }
  };

  return (
    <div>
      <h2>Link with Your Partner</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleLink}>
        <input 
          type="email"
          placeholder="Partner's Email" 
          value={partnerEmail} 
          onChange={(e) => setPartnerEmail(e.target.value)}
          required
        />
        <button type="submit">Link Partner</button>
      </form>
    </div>
  );
}

export default LinkPartner; 