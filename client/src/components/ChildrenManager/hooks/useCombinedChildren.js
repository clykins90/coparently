import { useState, useEffect } from 'react';

/**
 * Custom hook for combining child profiles and child users
 * Creates a unified view of all children
 */
const useCombinedChildren = (children, childUsers) => {
  const [combinedChildren, setCombinedChildren] = useState([]);

  // Combine children and childUsers data
  useEffect(() => {
    if (children.length === 0 && childUsers.length === 0) {
      setCombinedChildren([]);
      return;
    }

    // Create a map of child users by ID for quick lookup
    const childUserMap = {};
    childUsers.forEach(user => {
      childUserMap[user.id] = user;
    });

    // Start with all children profiles
    const combined = children.map(child => {
      // Find if this child has a user account
      const matchingUser = childUsers.find(
        user => 
          user.firstName.toLowerCase() === child.first_name.toLowerCase() && 
          user.lastName.toLowerCase() === child.last_name.toLowerCase()
      );

      return {
        ...child,
        hasUserAccount: !!matchingUser,
        userAccount: matchingUser,
        isUserOnly: false
      };
    });

    // Add child users that don't have a profile
    childUsers.forEach(user => {
      const hasProfile = combined.some(
        child => 
          child.first_name.toLowerCase() === user.firstName.toLowerCase() && 
          child.last_name.toLowerCase() === user.lastName.toLowerCase()
      );

      if (!hasProfile) {
        combined.push({
          id: `user-${user.id}`,
          first_name: user.firstName,
          last_name: user.lastName,
          date_of_birth: null,
          color: null,
          hasUserAccount: true,
          userAccount: user,
          isUserOnly: true
        });
      }
    });

    setCombinedChildren(combined);
  }, [children, childUsers]);

  return {
    combinedChildren
  };
};

export default useCombinedChildren; 