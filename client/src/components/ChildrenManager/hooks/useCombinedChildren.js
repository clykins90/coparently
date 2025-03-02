import { useState, useEffect } from 'react';

/**
 * Custom hook for combining child profiles and child users
 * Creates a unified view of all children
 */
const useCombinedChildren = (children, childUsers) => {
  const [combinedChildren, setCombinedChildren] = useState([]);

  useEffect(() => {
    if (children.length === 0 && childUsers.length === 0) {
      setCombinedChildren([]);
      return;
    }

    // Build a map so we can figure out if a child has a user account
    const childUserMap = {};
    childUsers.forEach(u => {
      childUserMap[u.id] = u; // keyed by user account's ID
    });

    // Start with all "profile children"
    const combined = children.map(child => {
      // Attempt to match child profile with a child user
      // We'll match by first/last name if there's no better DB link
      const match = childUsers.find(
        user =>
          user.firstName.toLowerCase() === child.first_name.toLowerCase() &&
          user.lastName.toLowerCase() === child.last_name.toLowerCase()
      );

      return {
        ...child,
        hasUserAccount: !!match,
        userAccount: match || null,
        isUserOnly: false
      };
    });

    // Add child users who *do not* have a matching profile
    childUsers.forEach(u => {
      const alreadyInCombined = combined.some(
        c =>
          c.first_name.toLowerCase() === u.firstName.toLowerCase() &&
          c.last_name.toLowerCase() === u.lastName.toLowerCase()
      );
      if (!alreadyInCombined) {
        combined.push({
          id: `user-${u.id}`,
          first_name: u.firstName,
          last_name: u.lastName,
          date_of_birth: null,
          color: null,
          notes: null,
          hasUserAccount: true,
          userAccount: u,
          isUserOnly: true
        });
      }
    });

    setCombinedChildren(combined);
  }, [children, childUsers]);

  return { combinedChildren };
};

export default useCombinedChildren;