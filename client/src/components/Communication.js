import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PartnerRequired from './PartnerRequired';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { partnerAPI, messageAPI } from '../services/api';
import { FaPaperPlane, FaCircle, FaChild, FaUserFriends, FaRobot } from 'react-icons/fa';

function Communication() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [partnerId, setPartnerId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPartner, setHasPartner] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [activeTab, setActiveTab] = useState('partner'); // 'partner' or 'children'
  const [childConversations, setChildConversations] = useState([]);
  const [selectedChildConversation, setSelectedChildConversation] = useState(null);
  const [bypassAiFilter, setBypassAiFilter] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected, joinConversation, leaveConversation } = useSocket();
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchPartnerAndConversation();
      fetchChildConversations();
    }
  }, [user, activeTab]);

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
  
  // Fetch child conversations
  const fetchChildConversations = async () => {
    try {
      const response = await messageAPI.getConversations();
      if (response.success && response.conversations) {
        // Filter for parent-child conversations
        const childConvs = response.conversations.filter(
          conv => conv.conversation_type === 'linked_child'
        );
        setChildConversations(childConvs);
        
        // Select the first child conversation by default if there are any
        if (childConvs.length > 0 && activeTab === 'children') {
          setSelectedChildConversation(childConvs[0]);
        }
      } else {
        // Handle case where conversations array is missing
        console.log('No conversations data returned from API:', response);
        setChildConversations([]);
      }
    } catch (err) {
      console.error('Error fetching child conversations:', err);
      setChildConversations([]);
    }
  };

  // Join conversation room when conversation ID is available
  useEffect(() => {
    // Leave any previous conversation
    if (conversationId) {
      leaveConversation(conversationId);
    }
    if (selectedChildConversation) {
      leaveConversation(selectedChildConversation.id);
    }
    
    // Join the appropriate conversation based on active tab
    const currentConversationId = activeTab === 'partner' 
      ? conversationId 
      : (selectedChildConversation ? selectedChildConversation.id : null);
    
    if (currentConversationId && connected) {
      joinConversation(currentConversationId);
      
      // Fetch initial messages
      const fetchMessages = async () => {
        try {
          const data = await messageAPI.getMessages(currentConversationId);
          console.log('Fetched initial messages:', data.messages);
          // Log timestamp information for the first message if available
          if (data.messages && data.messages.length > 0) {
            console.log('First message timestamp data:', {
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
      
      // Clean up when component unmounts
      return () => {
        leaveConversation(currentConversationId);
      };
    } else {
      // Clear chat history if no conversation is selected
      setChatHistory([]);
    }
  }, [
    conversationId, 
    selectedChildConversation, 
    activeTab, 
    connected, 
    joinConversation, 
    leaveConversation
  ]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (newMessage) => {
      console.log('Received new message:', newMessage);
      // Log timestamp information for debugging
      if (newMessage) {
        console.log('Message timestamp data:', {
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
    if (isLoading) return;
    
    const currentConversationId = activeTab === 'partner' 
      ? conversationId 
      : (selectedChildConversation ? selectedChildConversation.id : null);
    
    if (!currentConversationId) {
      alert('No conversation selected');
      return;
    }
    
    if (message.trim().length === 0) {
      alert('Cannot send empty message');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await messageAPI.sendMessage(
        currentConversationId, 
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

  const getChildName = (conversation) => {
    if (!conversation || !conversation.members) return 'Child';
    
    // Find the member who is not the current user (should be the child)
    const child = conversation.members.find(member => member.id !== user.id);
    return child ? `${child.first_name} ${child.last_name}` : 'Child';
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Clear chat history when switching tabs
    setChatHistory([]);
  };

  const handleChildConversationSelect = (conversation) => {
    setSelectedChildConversation(conversation);
  };

  if (activeTab === 'partner' && !hasPartner) {
    return <PartnerRequired />;
  }

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Communication</h2>
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
      
      {/* Tabs */}
      <div className="flex mb-4">
        <button
          className={`inline-flex items-center px-4 py-2 rounded-md transition-colors hover:bg-primary hover:text-white mr-2 ${
            activeTab === 'partner'
              ? 'bg-primary-dark text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
          onClick={() => handleTabChange('partner')}
        >
          <FaUserFriends className="mr-2" /> Partner
        </button>
        <button
          className={`inline-flex items-center px-4 py-2 rounded-md transition-colors hover:bg-primary hover:text-white ${
            activeTab === 'children'
              ? 'bg-primary-dark text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
          onClick={() => handleTabChange('children')}
        >
          <FaChild className="mr-2" /> Children
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md flex-grow overflow-hidden flex flex-col">
        {activeTab === 'children' && (
          <div className="flex h-full">
            {/* Child conversation list */}
            <div className="w-1/4 border-r border-gray-200 overflow-y-auto">
              {childConversations.length === 0 ? (
                <div className="p-4 text-gray-500 text-center">
                  No children added yet
                </div>
              ) : (
                childConversations.map(conversation => (
                  <div
                    key={conversation.id}
                    className={`p-3 cursor-pointer hover:bg-gray-100 ${
                      selectedChildConversation && selectedChildConversation.id === conversation.id
                        ? 'bg-gray-100'
                        : ''
                    }`}
                    onClick={() => handleChildConversationSelect(conversation)}
                  >
                    <div className="font-medium">{getChildName(conversation)}</div>
                    <div className="text-xs text-gray-500">Child</div>
                  </div>
                ))
              )}
            </div>
            
            {/* Chat area */}
            <div className="flex-grow flex flex-col">
              {!selectedChildConversation ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Select a child to start messaging
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'partner' && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}

export default Communication;