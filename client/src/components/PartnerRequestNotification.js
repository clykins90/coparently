import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { partnerAPI } from '../services/api';

function PartnerRequestNotification() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPendingRequests = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await partnerAPI.getPendingRequests(user.id);
        
        // Handle response with different possible structures
        if (data && data.requests && Array.isArray(data.requests)) {
          // Standard format: { success: true, requests: [...] }
          setPendingRequests(data.requests);
        } else if (data && data.data && data.data.requests && Array.isArray(data.data.requests)) {
          // Nested format: { success: true, data: { success: true, requests: [...] }}
          setPendingRequests(data.data.requests);
        } else if (data && Array.isArray(data)) {
          // Direct array format
          setPendingRequests(data);
        } else {
          // If data format is unexpected, set to empty array
          setPendingRequests([]);
          console.error('Unexpected response format:', data);
        }
      } catch (err) {
        console.error('Error fetching pending requests:', err);
        setPendingRequests([]); // Ensure it's an empty array on error
      } finally {
        setLoading(false);
      }
    };
    
    fetchPendingRequests();
    
    // Set up polling to check for new requests every 30 seconds
    const interval = setInterval(fetchPendingRequests, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return null; // Don't show anything while loading
  }
  
  // Extra safety check to ensure pendingRequests is an array
  if (!pendingRequests || pendingRequests.length === 0) {
    return null; // Don't show anything if there are no pending requests
  }
  
  return (
    <div className="fixed top-20 right-4 z-30 bg-accent text-white p-4 rounded-lg shadow-lg max-w-xs">
      <div className="flex flex-col space-y-3">
        <p className="font-medium">
          You have {pendingRequests.length} pending partner {pendingRequests.length === 1 ? 'request' : 'requests'}
        </p>
        <Link to="/link-partner" className="bg-white text-accent font-medium py-2 px-4 rounded hover:bg-gray-100 transition-colors duration-200 text-center">
          View Requests
        </Link>
      </div>
    </div>
  );
}

export default PartnerRequestNotification; 