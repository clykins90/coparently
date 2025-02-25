import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PartnerRequired from './PartnerRequired';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { partnerAPI, messageAPI } from '../services/api';

function Communication() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [partnerId, setPartnerId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPartner, setHasPartner] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected, joinConversation, leaveConversation } = useSocket();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Fetch partner ID and conversation ID from server
    const fetchPartnerAndConversation = async () => {
      try {
        const data = await partnerAPI.getPartner(user.id);
        setHasPartner(data.success);
        if (data.success) {
          setPartnerId(data.partnerId);
          setConversationId(data.conversationId);
        }
      } catch (err) {
        console.error('Error fetching partner:', err);
      }
    };
    
    fetchPartnerAndConversation();
  }, [user, navigate]);

  // Join conversation room when conversation ID is available
  useEffect(() => {
    if (conversationId && connected) {
      joinConversation(conversationId);
      
      // Fetch initial messages
      const fetchMessages = async () => {
        try {
          const data = await messageAPI.getMessages(conversationId);
          setChatHistory(data.messages);
        } catch (err) {
          console.error('Error fetching messages:', err);
        }
      };
      
      fetchMessages();
      
      // Clean up when component unmounts
      return () => {
        leaveConversation(conversationId);
      };
    }
  }, [conversationId, connected, joinConversation, leaveConversation]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (newMessage) => {
      setChatHistory(prevMessages => [...prevMessages, newMessage]);
    };
    
    socket.on('new_message', handleNewMessage);
    
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket]);

  const handleSend = async () => {
    if (isLoading || !conversationId) return;
    
    if (message.trim().length === 0) {
      alert('Cannot send empty message');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await messageAPI.sendMessage(conversationId, user.id, message);
      
      if (!response.success) {
        alert(response.error || 'Failed to send message');
        setIsLoading(false);
        return;
      }

      // Clear the input field (the message will be added to the chat via socket)
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!hasPartner) {
    return <PartnerRequired />;
  }

  return (
    <div className="communication-container">
      <h3>Communication</h3>
      <div className="connection-status">
        {connected ? (
          <span className="status-connected">Connected</span>
        ) : (
          <span className="status-disconnected">Disconnected</span>
        )}
      </div>
      <div className="chat-window">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`message-bubble ${msg.sender_id === user.id ? 'sender' : 'receiver'}`}
          >
            <div className="message-text">{msg.content}</div>
            <div className="message-timestamp">{formatTimestamp(msg.createdAt || msg.timestamp)}</div>
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
        disabled={isLoading || !connected}
        rows={4}
        style={{ width: '100%', marginTop: '1rem' }}
      />
      <button 
        onClick={handleSend} 
        style={{ marginTop: '0.5rem' }}
        disabled={isLoading || !connected}
      >
        {isLoading ? (
          <div className="spinner"></div>
        ) : 'Send'}
      </button>
    </div>
  );
}

export default Communication;