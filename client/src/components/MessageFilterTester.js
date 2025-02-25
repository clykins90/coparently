import React, { useState } from 'react';
import { messageAPI } from '../services/api';

/**
 * Component for testing the message filtering functionality
 */
function MessageFilterTester() {
  const [message, setMessage] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTest = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setIsLoading(true);

    try {
      const response = await messageAPI.testFilter(message, context || null);
      setResult(response);
    } catch (err) {
      console.error('Error testing filter:', err);
      setError('Failed to test message filter. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-section">
      <h3>Message Filter Tester</h3>
      <p>Use this tool to test how the AI message filter will process different messages.</p>
      
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleTest}>
        <div className="form-group">
          <label htmlFor="message">Message to Test:</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Enter a message to test the filter..."
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="context">Conversation Context (optional):</label>
          <textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={4}
            placeholder="Enter previous messages for context (one per line)..."
          />
          <small>Format: "Name: Message" (one per line)</small>
        </div>
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Testing...' : 'Test Filter'}
        </button>
      </form>
      
      {result && (
        <div className="filter-results" style={{ marginTop: '20px' }}>
          <h4>Filter Results:</h4>
          
          <div className="result-section">
            <h5>Original Message:</h5>
            <div className="message-box">{result.original}</div>
          </div>
          
          <div className="result-section">
            <h5>Filtered Message:</h5>
            <div className={`message-box ${result.wasBlocked ? 'blocked-message' : result.wasModified ? 'modified-message' : 'unchanged-message'}`}>
              {typeof result.filtered === 'string' 
                ? result.filtered 
                : result.filtered.message}
            </div>
          </div>
          
          <div className="result-status">
            Status: {result.wasBlocked 
              ? '🚫 Blocked' 
              : result.wasModified 
                ? '✏️ Modified' 
                : '✅ Unchanged'}
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageFilterTester; 