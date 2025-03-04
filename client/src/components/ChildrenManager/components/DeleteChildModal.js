import React, { useState } from 'react';
import { FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import Button from '../../common/Button';

/**
 * DeleteChildModal component
 * Modal for confirming deletion of a child profile with option to also delete user account
 */
const DeleteChildModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  childName, 
  hasUserAccount 
}) => {
  const [deleteUserAccount, setDeleteUserAccount] = useState(true);
  
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(deleteUserAccount);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="flex items-center text-red-600 mb-4">
          <FaExclamationTriangle className="text-2xl mr-2" />
          <h2 className="text-xl font-bold">Delete Child</h2>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete <strong>{childName}</strong>? This action cannot be undone.
          </p>
          
          {hasUserAccount && (
            <div className="bg-gray-100 p-3 rounded-md">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteUserAccount}
                  onChange={(e) => setDeleteUserAccount(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-red-600"
                />
                <span className="ml-2 text-gray-700">
                  Also delete the user account and all associated data
                </span>
              </label>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button
            onClick={onClose}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="danger"
            icon={<FaTrash />}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteChildModal; 