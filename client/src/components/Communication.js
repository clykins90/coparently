import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PartnerRequired from './PartnerRequired';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { partnerAPI, messageAPI } from '../services/api';
import { FaPaperPlane, FaCircle } from 'react-icons/fa';

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
  const chatEndRef = useRef(null);

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

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

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
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Communication</h2>
        <div className="flex items-center">
          {connected ? (
            <div className="flex items-center text-green-500">
              <FaCircle className="w-2 h-2 mr-2" />
              <span className="text-sm">Connected</span>
            </div>
          ) : (
            <div className="flex items-center text-red-500">
              <FaCircle className="w-2 h-2 mr-2" />
              <span className="text-sm">Disconnected</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md flex-grow overflow-hidden flex flex-col">
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {chatHistory.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              No messages yet. Start a conversation!
            </div>
          ) : (
            chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                    msg.sender_id === user.id 
                      ? 'bg-primary text-white rounded-br-none' 
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <div>{msg.content}</div>
                  <div className={`text-xs mt-1 ${msg.sender_id === user.id ? 'text-blue-100' : 'text-gray-500'}`}>
                    {formatTimestamp(msg.createdAt || msg.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
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
              rows={3}
              className="flex-grow resize-none border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="Type your message here..."
            />
            <button 
              onClick={handleSend} 
              disabled={isLoading || !connected}
              className="bg-primary hover:bg-primary-dark text-white rounded-md px-4 py-2 self-end transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <FaPaperPlane className="mr-2" /> Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Communication;