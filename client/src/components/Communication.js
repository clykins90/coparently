import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Communication() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [user] = useState(JSON.parse(localStorage.getItem('user')));
  const [partnerId] = useState(localStorage.getItem('partnerId'));
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/messages?userId=${user.id}`);
        const data = await response.json();
        setChatHistory(data.messages);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };
    
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval);
  }, [user, navigate]);

  const handleSend = async () => {
    try {
      // Get current partner ID from server
      const partnerRes = await fetch(`/api/partner?userId=${user.id}`);
      const partnerData = await partnerRes.json();
      
      if (!partnerData.success) {
        alert('No partner linked!');
        return;
      }
      const currentPartnerId = partnerData.partnerId;

      const response = await fetch('/api/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message,
          senderId: user.id,
          receiverId: currentPartnerId 
        })
      });
      const data = await response.json();
      setChatHistory([...chatHistory, {
        senderId: user.id,
        content: data.filteredMessage,
        timestamp: new Date().toISOString()
      }]);
      setMessage('');
    } catch (err) {
      console.error('Error filtering message:', err);
    }
  };

  return (
    <div>
      <h3>Communication</h3>
      <div
        style={{ border: '1px solid #ccc', padding: '1rem', height: '300px', overflowY: 'scroll' }}
      >
        {chatHistory.map((msg, index) => (
          <div key={index}>
            <p style={{ textAlign: msg.senderId === user.id ? 'right' : 'left' }}>
              <strong>{msg.senderId === user.id ? 'You' : 'Partner'}:</strong> {msg.content}
            </p>
          </div>
        ))}
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        style={{ width: '100%', marginTop: '1rem' }}
      />
      <button onClick={handleSend} style={{ marginTop: '0.5rem' }}>
        Send
      </button>
    </div>
  );
}

export default Communication; 