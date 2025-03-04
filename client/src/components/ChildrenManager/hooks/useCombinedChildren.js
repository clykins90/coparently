import { useState, useEffect } from 'react';
import { childUserAPI } from '../../../services/api';

/**
 * Custom hook for combining child profiles and child users
 * Creates a unified view of all children
 */
const useCombinedChildren = (children, childUsers) => {
  const [combinedChildren, setCombinedChildren] = useState([]);
  const [linkedParentsMap, setLinkedParentsMap] = useState({});
  const [isLoadingParents, setIsLoadingParents] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  // Fetch linked parents for a child user
  const fetchLinkedParentsForChild = async (childUserId) => {
    try {
      // Use the specific API endpoint to get linked parents for this child
      const response = await childUserAPI.getLinkedParentsForChild(childUserId);
      
      if (response.success) {
        // Fix: Check both response.parents and response.data.parents to handle different API response structures
        const parents = response.parents || (response.data && response.data.parents) || [];
        return {
          success: true,
          parents: parents
        };
      } else {
        console.error('Error in API response:', response.message);
        return { success: false, parents: [] };
      }
    } catch (error) {
      console.error('Error fetching linked parents for child:', error);
      return { success: false, parents: [] };
    }
  };

  // Fetch linked parents for all child users
  useEffect(() => {
    const fetchLinkedParents = async () => {
      // Prevent multiple fetch attempts if we're already loading or have tried before
      if (isLoadingParents || (hasAttemptedFetch && Object.keys(linkedParentsMap).length > 0)) {
        return;
      }
      
      setIsLoadingParents(true);
      setHasAttemptedFetch(true);
      
      try {
        const parentsMap = {};
        
        // For each child user, fetch their linked parents
        for (const childUser of childUsers) {
          try {
            const response = await fetchLinkedParentsForChild(childUser.id);
            if (response.success) {
              parentsMap[childUser.id] = response.parents;
            }
          } catch (error) {
            // Continue with other children even if one fails
            console.error(`Failed to fetch parents for child ${childUser.id}:`, error);
            parentsMap[childUser.id] = [];
          }
        }
        
        setLinkedParentsMap(parentsMap);
      } catch (error) {
        console.error('Error in fetchLinkedParents:', error);
      } finally {
        setIsLoadingParents(false);
      }
    };
    
    if (childUsers.length > 0) {
      fetchLinkedParents();
    }
  }, [childUsers, isLoadingParents, hasAttemptedFetch]);

  // Combine child profiles and child users
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
        isUserOnly: false,
        linkedParents: match ? linkedParentsMap[match.id] || [] : []
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
          isUserOnly: true,
          linkedParents: linkedParentsMap[u.id] || []
        });
      }
    });

    setCombinedChildren(combined);
  }, [children, childUsers, linkedParentsMap]);

  return { combinedChildren, isLoadingParents };
};

export default useCombinedChildren;