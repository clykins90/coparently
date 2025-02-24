import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Communication() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [user] = useState(JSON.parse(localStorage.getItem('user')));
  const [partnerId, setPartnerId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Fetch partner ID from server
    const fetchPartner = async () => {
      const response = await fetch(`/api/partner?userId=${user.id}`);
      const data = await response.json();
      if (data.success) setPartnerId(data.partnerId);
    };
    
    fetchPartner();

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
    if (isLoading) return;
    
    if (!partnerId) {
      alert('No partner linked!');
      return;
    }
    
    if (message.trim().length === 0) {
      alert('Cannot send empty message');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          senderId: user.id,
          receiverId: partnerId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      if (data.filteredMessage.includes('[BLOCKED]')) {
        throw new Error('Invalid message passed through filter');
      }
      
      setChatHistory([...chatHistory, {
        senderId: user.id,
        content: data.filteredMessage,
        timestamp: new Date().toISOString()
      }]);
      setMessage('');
    } catch (err) {
      console.error('Error filtering message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <h3>Communication</h3>
      <div className="chat-window">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`message-bubble ${msg.senderId === user.id ? 'sender' : 'receiver'}`}
          >
            <div className="message-text">{msg.content}</div>
            <div className="message-timestamp">{formatTimestamp(msg.timestamp)}</div>
          </div>
        ))}
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (isLoading) return;
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        disabled={isLoading}
        rows={4}
        style={{ width: '100%', marginTop: '1rem' }}
      />
      <button 
        onClick={handleSend} 
        style={{ marginTop: '0.5rem' }}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="spinner"></div>
        ) : 'Send'}
      </button>
    </div>
  );
}

export default Communication;