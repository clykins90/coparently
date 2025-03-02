# ChildrenManager Refactoring Plan

## Current Issues
- The ChildrenManager.js file is too large (1044 lines)
- It handles multiple responsibilities (child profiles, child users, UI rendering, form validation, API calls)
- Difficult to maintain and understand
- Logic and UI are tightly coupled

## Refactoring Approach
We will use a combination of:
1. Custom hooks for business logic and API calls
2. Smaller, focused components for UI elements
3. Feature folder structure for organization

## New File Structure
```
/components
  /ChildrenManager
    /index.js                  (main component, ~100-150 lines)
    /components
      /ChildProfileForm.js     (~150 lines)
      /ChildUserInviteForm.js  (~150 lines)
      /ChildUserCreateForm.js  (~150 lines)
      /ChildrenTable.js        (~200 lines)
    /hooks
      /useChildProfiles.js     (~150 lines)
      /useChildUsers.js        (~150 lines)
      /useCombinedChildren.js  (~100 lines)
```

## Todo List

### Phase 1: Create Directory Structure
- [ ] Create `/components/ChildrenManager` directory
- [ ] Create `/components/ChildrenManager/components` directory
- [ ] Create `/components/ChildrenManager/hooks` directory

### Phase 2: Extract Custom Hooks
- [ ] Create `useChildProfiles.js` hook
  - [ ] Extract child profile state management
  - [ ] Extract API calls for fetching, creating, updating, and deleting child profiles
  - [ ] Extract form validation logic for child profiles
- [ ] Create `useChildUsers.js` hook
  - [ ] Extract child user state management
  - [ ] Extract API calls for fetching, inviting, creating, and deleting child users
  - [ ] Extract form validation logic for child users
- [ ] Create `useCombinedChildren.js` hook
  - [ ] Extract logic for combining child profiles and child users
  - [ ] Extract state for the combined view

### Phase 3: Create UI Components
- [ ] Create `ChildProfileForm.js` component
  - [ ] Extract child profile form UI
  - [ ] Connect to `useChildProfiles` hook
- [ ] Create `ChildUserInviteForm.js` component
  - [ ] Extract child user invite form UI
  - [ ] Connect to `useChildUsers` hook
- [ ] Create `ChildUserCreateForm.js` component
  - [ ] Extract child user create form UI
  - [ ] Connect to `useChildUsers` hook
- [ ] Create `ChildrenTable.js` component
  - [ ] Extract children table UI
  - [ ] Connect to combined data from hooks

### Phase 4: Refactor Main Component
- [ ] Create new `index.js` as the main component
  - [ ] Import and use custom hooks
  - [ ] Import and compose UI components
  - [ ] Manage high-level state and UI flow

### Phase 5: Testing and Cleanup
- [ ] Test each component and hook individually
- [ ] Test the integrated solution
- [ ] Remove the original ChildrenManager.js file
- [ ] Update imports in other files if necessary

## Implementation Notes
- Each hook should return all necessary state and functions for its domain
- Components should be focused on UI rendering and user interactions
- Maintain consistent prop interfaces between components
- Use proper error handling and loading states
- Add appropriate comments and documentation

## Benefits of This Approach
1. **Maintainability**: Each file has a clear, single responsibility
2. **Reusability**: Custom hooks can be reused across the application
3. **Testability**: Smaller, focused components and hooks are easier to test
4. **Readability**: Easier to understand the codebase
5. **Scalability**: Easy to add new features or modify existing ones 