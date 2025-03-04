# Coparently Todo List

## Navigation Bar Improvements

- [x] Reduce the size of the navigation sidebar to make it more compact
- [x] Remove the sign out button from the sidebar
- [x] Add sign out functionality to the profile dropdown in the top right corner
- [x] Add ability to collapse the sidebar to only show icons
- [x] Add expand/collapse toggle button for the sidebar
- [x] Make the top navbar more narrow
- [x] Move the logo to the sidebar and remove it from the top navbar
- [x] Fix z-index issues to ensure sidebar displays properly

## UI Fixes

- [x] Fix profile picture display in the header
- [x] Update blue buttons across the app to be more subtle
- [x] Create a consistent Button component for the application

## Message Handling

- [x] Update message handling to send non-harmful messages without modifications
- [x] Only filter/translate messages that contain negative or harmful content

## Profile Management

- [x] Add ability to upload and manage profile picture from settings
- [x] Import profile picture from OAuth providers automatically
- [x] Add ability to remove or reset profile picture

## Children as Users
- [x] Add ability for children to login to the app
- [x] Children can send messages to partners that they are linked to
- [x] Partners can have access to all messages that children send in the app
- [x] Add tabs to the communication tab to cycle between messages with partners and children
- [x] Children can only see communications tab
- [x] The same AI filtering rules apply for messages to and from children
- [x] Integrate child user management into the Settings page
- [x] Add email invitation functionality for child users
- [x] Create child signup page for completing account setup from email invitations

## Settings Page Children 
- [x] Linked parents should show the list of all parents actually linked to a child 
- [x] Linked siblings should show siblings that are linked to the same parents

## Calendar enhancements
- [x] Remove all event types
- [x] Fix bug on event creation where I can't see the entire modal and scrolling doesn't work
- [x] Fix bug on manage custody schedule where I can't see the entire modal and scrolling doesn't work
- [x] Implement 2-way Google Calendar Sync in settings and allow me to set which calendars sync 
- [] Implement ability to create events from communications tab (if detected in messages - evaluate whether we need to use an LLM or not)
- [] Create a visual on the calendar that indicates whether the logged in parent has a child or not based on the custody schedule
- [] allow creation of custody schedule based on parent plan document that is uploaded (evlauate whether we need to use an LLM or not)
- [] remove notes from calendar event since description is enough

# bugs
- [x] parent to parent conversations show up with children
- [x] duplicated delete buttons on linked children
- []  double clicking on partner/children shows 'no messages yet. Start a conversation!'

## security and data export
- [] need to be able to export messages as csv for legal purposes
- [] need to store unfiltered messages in backend
- [] need robust history tracking for events

## documents
- [] dr visit (after visit summaries)
- [] receipts, bills, expenses
- [] parent plan, divorce decree
- [] addl legal docs
- [] photos 


## Code Refactoring
- [x] Refactor ChildrenManager component into smaller, more focused components
- [x] Extract data fetching logic into custom hooks for ChildrenManager
- [x] Improve separation of concerns in ChildrenManager
- [ ] Apply similar refactoring patterns to other complex components

## How to use this todo list

- Mark items as complete by changing `[ ]` to `[x]` or using strikethrough
- Add new items as needed
- Group related items under appropriate headings 