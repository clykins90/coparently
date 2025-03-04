import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { messageAPI } from '../services/api';
import { FaPaperPlane, FaCircle, FaRobot } from 'react-icons/fa';

function ChildCommunication() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bypassAiFilter, setBypassAiFilter] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected, joinConversation, leaveConversation } = useSocket();
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if user is a child
    if (user.role !== 'child') {
      return;
    }

    // Fetch conversations
    const fetchConversations = async () => {
      try {
        const response = await messageAPI.getConversations();
        if (response.success) {
          setConversations(response.conversations);
          
          // Select the first conversation by default
          if (response.conversations.length > 0) {
            setSelectedConversation(response.conversations[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
      }
    };

    fetchConversations();
  }, [user, navigate]);

  // Join conversation room when selected conversation changes
  useEffect(() => {
    if (selectedConversation && connected) {
      joinConversation(selectedConversation.id);
      
      // Fetch messages for the selected conversation
      const fetchMessages = async () => {
        try {
          const data = await messageAPI.getMessages(selectedConversation.id);
          console.log('Child component fetched initial messages:', data.messages);
          // Log timestamp information for the first message if available
          if (data.messages && data.messages.length > 0) {
            console.log('Child first message timestamp data:', {
              timestamp: data.messages[0].timestamp,
              createdAt: data.messages[0].createdAt,
              created_at: data.messages[0].created_at
            });
          }
          setChatHistory(data.messages);
        } catch (err) {
          console.error('Error fetching messages:', err);
        }
      };
      
      fetchMessages();
      
      // Clean up when component unmounts or conversation changes
      return () => {
        leaveConversation(selectedConversation.id);
      };
    }
  }, [selectedConversation, connected, joinConversation, leaveConversation]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (newMessage) => {
      console.log('Child component received new message:', newMessage);
      // Log timestamp information for debugging
      if (newMessage) {
        console.log('Child message timestamp data:', {
          timestamp: newMessage.timestamp,
          createdAt: newMessage.createdAt,
          created_at: newMessage.created_at
        });
      }
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
    if (isLoading || !selectedConversation) return;
    
    if (message.trim().length === 0) {
      alert('Cannot send empty message');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await messageAPI.sendMessage(
        selectedConversation.id, 
        user.id, 
        message,
        bypassAiFilter
      );
      
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
    if (!timestamp) return 'Invalid Date';
    
    try {
      // Try to parse the timestamp in different formats
      const date = new Date(timestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date format:', timestamp);
        return 'Invalid Date';
      }
      
      // Format the date
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Invalid Date';
    }
  };

  const getParentName = (conversation) => {
    if (!conversation || !conversation.members) return 'Parent';
    
    const parent = conversation.members.find(member => member.id !== user.id);
    return parent ? `${parent.first_name} ${parent.last_name}` : 'Parent';
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Messages</h2>
        <div className="flex items-center space-x-4">
          {/* AI Filter Toggle (only visible in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="flex items-center">
              <span className="text-sm mr-2">AI Filter:</span>
              <button
                onClick={() => setBypassAiFilter(!bypassAiFilter)}
                className={`flex items-center px-3 py-1 rounded-md text-sm ${
                  bypassAiFilter 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <FaRobot className="mr-1" />
                {bypassAiFilter ? 'Off' : 'On'}
              </button>
            </div>
          )}
          
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
        {conversations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            No conversations available. Ask your parent to set up your account.
          </div>
        ) : (
          <div className="flex h-full">
            {/* Conversation list */}
            <div className="w-1/4 border-r border-gray-200 overflow-y-auto">
              {conversations.map(conversation => (
                <div
                  key={conversation.id}
                  className={`p-3 cursor-pointer hover:bg-gray-100 ${
                    selectedConversation && selectedConversation.id === conversation.id
                      ? 'bg-gray-100'
                      : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="font-medium">{getParentName(conversation)}</div>
                  <div className="text-xs text-gray-500">
                    {conversation.conversation_type === 'linked_child' ? 'Parent' : 'Other'}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Chat area */}
            <div className="flex-grow flex flex-col">
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
                    disabled={isLoading || !connected || !selectedConversation}
                    rows={3}
                    className="flex-grow resize-none border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="Type your message here..."
                  />
                  <button 
                    onClick={handleSend} 
                    disabled={isLoading || !connected || !selectedConversation}
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
        )}
      </div>
    </div>
  );
}

export default ChildCommunication; 