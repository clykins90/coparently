import React, { useState, useEffect } from 'react';
import childrenService from '../../services/childrenService';
import ChildrenList from './ChildrenList';
import ChildModal from './ChildModal';

function ChildrenManager() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showChildModal, setShowChildModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  // Fetch children when component mounts
  useEffect(() => {
    fetchChildren();
  }, []);

  // Fetch children from API
  const fetchChildren = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedChildren = await childrenService.getChildren();
      setChildren(fetchedChildren);
    } catch (err) {
      console.error('Error fetching children:', err);
      setError('Failed to load children. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle opening the add child modal
  const handleOpenAddChildModal = () => {
    setSelectedChild(null);
    setShowChildModal(true);
  };

  // Handle opening the edit child modal
  const handleOpenEditChildModal = (child) => {
    setSelectedChild(child);
    setShowChildModal(true);
  };

  // Handle child creation/update success
  const handleChildSuccess = async () => {
    await fetchChildren();
    setMessage('Child saved successfully');
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setMessage('');
    }, 3000);
  };

  // Handle child deletion
  const handleDeleteChild = async (childId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await childrenService.deleteChild(childId);
      await fetchChildren();
      setMessage('Child deleted successfully');
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error deleting child:', err);
      setError('Failed to delete child. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-section children-manager">
      <h4>Manage Children</h4>
      <p className="section-description">
        Add and manage your children's information. This information will be used in the calendar and other features.
      </p>
      
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      
      {isLoading && !showChildModal ? (
        <div className="loading">Loading children...</div>
      ) : (
        <ChildrenList 
          children={children}
          onAddChild={handleOpenAddChildModal}
          onEditChild={handleOpenEditChildModal}
          onDeleteChild={handleDeleteChild}
        />
      )}
      
      {showChildModal && (
        <ChildModal
          child={selectedChild}
          onClose={() => setShowChildModal(false)}
          onSuccess={handleChildSuccess}
        />
      )}
    </div>
  );
}

export default ChildrenManager; 