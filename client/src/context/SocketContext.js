import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Create the socket context
const SocketContext = createContext();

// Custom hook to use the socket context
export const useSocket = () => useContext(SocketContext);

// Provider component that wraps the app and makes socket object available to any child component that calls useSocket()
export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Only connect if user is logged in
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Create socket connection
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001');
    
    // Set up event listeners
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setConnected(true);
    });
    
    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });
    
    setSocket(newSocket);
    
    // Clean up on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user]);

  // Join a conversation room
  const joinConversation = (conversationId) => {
    if (socket && connected) {
      socket.emit('join_conversation', conversationId);
    }
  };
  
  // Leave a conversation room
  const leaveConversation = (conversationId) => {
    if (socket && connected) {
      socket.emit('leave_conversation', conversationId);
    }
  };

  // Value object that will be passed to any consumer components
  const value = {
    socket,
    connected,
    joinConversation,
    leaveConversation
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export default SocketContext; 