import React, { useState, useEffect } from 'react';
import childrenService from '../../services/childrenService';
import ChildrenList from './ChildrenList';
import ChildModal from './ChildModal';
import { FaChild, FaSpinner } from 'react-icons/fa';

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
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center mb-4">
        <FaChild className="text-primary mr-2" />
        <h3 className="text-xl font-semibold text-gray-700">Manage Children</h3>
      </div>
      
      <p className="text-gray-600 mb-6">
        Add and manage your children's information. This information will be used in the calendar and other features.
      </p>
      
      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
          {message}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {isLoading && !showChildModal ? (
        <div className="flex items-center justify-center p-8 text-gray-500">
          <FaSpinner className="animate-spin mr-2" />
          <span>Loading children...</span>
        </div>
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