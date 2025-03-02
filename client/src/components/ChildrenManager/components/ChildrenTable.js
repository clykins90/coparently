import React from 'react';
import { FaChild, FaEdit, FaTrash } from 'react-icons/fa';
import Button from '../../common/Button';
import Avatar from '../../common/Avatar';

/**
 * Children table component
 * Displays a table of all children (profiles and users)
 */
const ChildrenTable = ({
  combinedChildren,
  onEditChild,
  onDeleteChild,
  onDeleteChildUser,
  onCreateAccount,
  onInviteUser
}) => {
  if (combinedChildren.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
        <p className="text-gray-500 mb-4">No children added yet</p>
        <Button onClick={() => onEditChild(null)}>
          Add Child
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-md">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Birth</th>
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Account</th>
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {combinedChildren.map(child => (
            <tr key={child.id} className="hover:bg-gray-50">
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
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    child.userAccount?.status === 'active' ? 'bg-green-100 text-green-800' : 
                    child.userAccount?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {child.userAccount?.status === 'active' ? 'Active' : 
                     child.userAccount?.status === 'pending' ? 'Pending' : 
                     'Inactive'}
                  </span>
                ) : (
                  <div className="flex">
                    <Button 
                      size="xs"
                      variant="subtle"
                      onClick={() => onCreateAccount(child.first_name, child.last_name)}
                      className="mr-2"
                    >
                      Create Account
                    </Button>
                    <Button 
                      size="xs"
                      variant="subtle"
                      onClick={() => onInviteUser(child.first_name, child.last_name)}
                    >
                      Invite
                    </Button>
                  </div>
                )}
              </td>
              <td className="py-3 px-3">
                <div className="flex space-x-2">
                  {!child.isUserOnly && (
                    <>
                      <button 
                        onClick={() => onEditChild(child)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => onDeleteChild(child.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </>
                  )}
                  {child.hasUserAccount && (
                    <button 
                      onClick={() => onDeleteChildUser(child.userAccount.id)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <FaTrash />
                      <span className="sr-only">Remove User</span>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ChildrenTable; 