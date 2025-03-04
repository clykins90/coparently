import React, { useState } from 'react';
import { FaChild, FaEdit, FaTrash, FaUserFriends, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Button from '../../common/Button';
import Avatar from '../../common/Avatar';
import DeleteChildModal from './DeleteChildModal';

/**
 * Children table component
 * Displays a table of all children (profiles and user accounts)
 */
const ChildrenTable = ({
  combinedChildren,
  onEditChild,
  onDeleteChildWithOptions
}) => {
  // State to track which child rows are expanded to show linked parents
  const [expandedRows, setExpandedRows] = useState({});
  // State for delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [childToDelete, setChildToDelete] = useState(null);

  // Toggle expanded state for a child row
  const toggleRowExpand = (childId) => {
    setExpandedRows(prev => ({
      ...prev,
      [childId]: !prev[childId]
    }));
  };

  // Open delete confirmation modal
  const handleOpenDeleteModal = (child) => {
    setChildToDelete(child);
    setDeleteModalOpen(true);
  };

  // Handle delete confirmation
  const handleConfirmDelete = (deleteUserAccount) => {
    if (!childToDelete) return;
    
    const childId = !childToDelete.isUserOnly ? childToDelete.id : null;
    const userId = deleteUserAccount && childToDelete.hasUserAccount ? childToDelete.userAccount.id : null;
    
    // Call the combined delete function
    onDeleteChildWithOptions(childId, userId);
    
    // Reset state
    setChildToDelete(null);
  };

  if (combinedChildren.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
        <p className="text-gray-500 mb-4">No children added yet</p>
        <p>You can click "Add Child" to create one.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-md">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
              <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
              <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Account</th>
              <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linked Parents</th>
              <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {combinedChildren.map(child => (
              <React.Fragment key={child.id}>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: child.color || '#9E9E9E' }}
                    ></div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center">
                      {child.hasUserAccount ? (
                        <Avatar
                          src={child.userAccount?.profilePicture}
                          name={`${child.first_name} ${child.last_name}`}
                          size="sm"
                          className="mr-2"
                        />
                      ) : (
                        <FaChild className="text-gray-500 mr-2" />
                      )}
                      <span className="text-gray-700">{child.first_name} {child.last_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-gray-600">
                    {child.date_of_birth ? new Date(child.date_of_birth).toLocaleDateString() : 'Not set'}
                  </td>
                  <td className="py-3 px-3">
                    {child.hasUserAccount ? (
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        {child.userAccount?.status === 'pending' ? 'Pending' : 'Active'}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">No account</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {child.hasUserAccount && (
                      <button
                        onClick={() => toggleRowExpand(child.id)}
                        className="flex items-center bg-primary-dark text-white px-2 py-1 rounded-md hover:bg-primary transition-colors"
                      >
                        <FaUserFriends className="mr-1" />
                        <span>
                          {child.linkedParents?.length || 0} Parents
                        </span>
                        {expandedRows[child.id] ? (
                          <FaChevronUp className="ml-1" />
                        ) : (
                          <FaChevronDown className="ml-1" />
                        )}
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEditChild(child)}
                        className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors"
                        aria-label="Edit child"
                      >
                        <FaEdit />
                      </button>
                      {/* Single delete button that opens confirmation modal */}
                      <button
                        onClick={() => handleOpenDeleteModal(child)}
                        className="bg-red-600 text-white p-2 rounded-md hover:bg-red-700 transition-colors"
                        aria-label="Delete child"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
                
                {/* Expanded row to show linked parents */}
                {expandedRows[child.id] && child.hasUserAccount && (
                  <tr className="bg-gray-50">
                    <td colSpan="6" className="py-3 px-3">
                      {child.linkedParents && child.linkedParents.length > 0 ? (
                        <div className="pl-8">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Linked Parents:</h4>
                          <ul className="space-y-2">
                            {child.linkedParents.map(parent => (
                              <li key={parent.id} className="flex items-center">
                                <Avatar
                                  src={parent.profilePicture}
                                  firstName={parent.firstName}
                                  lastName={parent.lastName}
                                  size="xs"
                                  className="mr-2"
                                />
                                <span className="text-sm text-gray-600">
                                  {parent.firstName} {parent.lastName} 
                                  {parent.relationship && ` (${
                                    parent.relationship === 'mother' ? 'Mom' : 
                                    parent.relationship === 'father' ? 'Dad' : 
                                    parent.relationship === 'stepmother' ? 'Stepmom' : 
                                    parent.relationship === 'stepfather' ? 'Stepdad' : 
                                    parent.relationship
                                  })`}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="pl-8 text-sm text-gray-500">
                          No linked parents found for this child.
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      <DeleteChildModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        childName={childToDelete ? `${childToDelete.first_name} ${childToDelete.last_name}` : ''}
        hasUserAccount={childToDelete?.hasUserAccount || false}
      />
    </>
  );
};

export default ChildrenTable;