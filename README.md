# Coparently

Coparently is a comprehensive co-parenting application designed to help separated parents manage their shared parenting responsibilities efficiently. The application provides tools for communication, calendar management, and child-related information sharing.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Development](#development)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Recent Refactorings](#recent-refactorings)

## Overview

Coparently facilitates co-parenting by providing a centralized platform where separated parents can:
- Communicate securely
- Manage shared calendars and custody schedules
- Track child-related events and activities
- Manage partner relationships

The application uses a client-server architecture with a React frontend and Node.js/Express backend.

## Features

### Authentication
- Local authentication with username/password
- Google OAuth integration
- Session management
- Role-based access control (parent vs. child accounts)

### User Management
- User registration and profile management
- Partner linking and invitation system
- Partner request notifications
- Profile picture upload and management
- **Child user management and email invitations (unified "Add Child" flow)**

### Communication
- Real-time messaging using Socket.io
- Conversation management
- Parent-child messaging

### Calendar
- Shared calendar for co-parents
- Custody schedule management
- Event creation and management
- Child-specific events
- **Two-way Google Calendar integration**
- **View events from multiple Google Calendars**
- **Automatic sync of Coparently events to Google Calendar**

### Settings
- User profile settings
- Application preferences
- Child information management
- **Single-form child user creation** (optional)
- Profile picture management
- Role-specific settings views (parent vs. child)
- **Google Calendar connection management**

### User Interface
- Responsive design
- Role-based UI adaptation (parent vs. child views)
- Unified application shell with role-specific navigation and features

## Tech Stack

### Frontend
- React.js
- React Router for navigation
- Socket.io client for real-time communication
- Tailwind CSS for styling
- FullCalendar for calendar functionality
- React Icons

### Backend
- Node.js
- Express.js
- Sequelize ORM
- PostgreSQL database
- Socket.io for real-time communication
- Passport.js for authentication
- JSON Web Tokens (JWT)
- Bcrypt for password hashing
- SendGrid for email notifications
- **Google Calendar API integration**

## Project Structure

## API Endpoints

### Authentication Endpoints
- `POST /api/login` - Authenticate a user with email/password
- `POST /api/register` - Register a new user account
- `POST /api/google` - Authenticate with Google OAuth
- `POST /api/logout` - Logout and clear user session
- `POST /auth/logout` - Alternative logout endpoint for OAuth
- `GET /api/me` - Get current authenticated user information
- `GET /api/check` - Check if user is authenticated
- `GET /api/verify-child-invitation` - Verify a child invitation token
- `POST /api/complete-child-signup` - Complete a child user registration

### User Endpoints
- `PUT /api/profile` - Update user profile information
- `POST /api/profile/picture` - Upload a profile picture (multipart/form-data)
- `DELETE /api/profile/picture` - Remove user's profile picture

### Partner Endpoints
- `GET /api/partner` - Get partner information for a user
- `GET /api/check-partner` - Check if a user exists by email
- `POST /api/request-partner` - Send a partner request
- `GET /api/pending-requests` - Get pending partner requests for a user
- `GET /api/outgoing-requests` - Get outgoing partner requests for a user
- `POST /api/respond-request` - Accept or reject a partner request
- `DELETE /api/cancel-request/:requestId` - Cancel a sent partner request
- `POST /api/link-partner` - Link with an existing user as partner
- `POST /api/invite-partner` - Invite a new user to be a partner
- `DELETE /api/partner/:userId` - Unlink from current partner

### Message Endpoints
- `GET /api/conversations` - Get all conversations for authenticated user
- `POST /api/conversations/:id/messages` - Send a message in a conversation
- `GET /api/conversations/:id/messages` - Get messages for a conversation
- `POST /api/test-filter` - Test message content filtering

### Child User Endpoints
- `GET /api/users/children` - Get child users for parent
- `POST /api/users/children` - Create a new child user
- `PUT /api/users/children/:childId` - Update a child user
- `DELETE /api/users/children/:childId` - Delete a child user
- `POST /api/users/children/invite` - Invite a child via email
- `GET /api/users/children/linked-parents` - Get parents linked to a child user
- `GET /api/users/children/:childId/linked-parents` - Get linked parents for specific child
- `GET /api/users/children/linked-siblings` - Get siblings linked to a child user

### Calendar Endpoints
- `GET /api/calendar` - Get calendar events
- `POST /api/calendar` - Create a new calendar event
- `PUT /api/calendar/:id` - Update a calendar event
- `DELETE /api/calendar/:id` - Delete a calendar event
- `GET /api/calendar/:id` - Get a specific calendar event

### Google Calendar Endpoints
- `GET /api/google-calendar/status` - Get Google Calendar connection status
- `POST /api/google-calendar/tokens` - Save Google Calendar tokens
- `POST /api/google-calendar/toggle-sync` - Toggle Google Calendar sync
- `GET /api/google-calendar/calendars` - Get user's Google Calendars
- `POST /api/google-calendar/calendars` - Save selected Google Calendars
- `DELETE /api/google-calendar/disconnect` - Disconnect Google Calendar
- `POST /api/google-calendar/sync-all` - Manually sync all events to Google Calendar
- `POST /api/google-calendar/authorize-redirect` - Redirect to Google authorization page
- `GET /api/google-calendar/connect` - Connect to Google Calendar
- `GET /auth/google-calendar/callback` - Callback endpoint for Google Calendar OAuth

## Database Models

### User Model
- Represents all users in the system (both parents and children)
- Contains authentication information, profile details, and role
- Key fields: id, username, email, first_name, last_name, role ('parent' or 'child')
- Relationships:
  - A parent user can be linked to multiple child profiles (through parent_children)
  - A parent user can be linked to multiple child users (through ChildParentLink)
  - A child user can be linked to multiple parent users (through ChildParentLink)
  - A child user can be linked to a child profile (one-to-one)

### Child Model
- Represents a child profile with personal information
- Not all children have user accounts
- Key fields: id, first_name, last_name, date_of_birth, notes, color, user_id
- Relationships:
  - A child profile can be linked to multiple parent users (through parent_children)
  - A child profile can optionally be linked to a user account (one-to-one)

### ChildParentLink Model
- Represents the relationship between child users and parent users
- Key fields: id, child_user_id, parent_user_id, relationship, can_view_messages
- Relationships:
  - Links a child user to a parent user
  - Contains relationship information and permissions

## Recent Refactorings

### Unified Dashboard for All Users
- Refactored the application to use a single MainApp component for both parent and child users
- Implemented role-based conditional rendering of navigation items and routes
- Created role-specific components for communication and settings
- Simplified routing logic in App.js

### Google Calendar Integration
- Added two-way Google Calendar synchronization
- Implemented OAuth 2.0 authentication with Google
- Created database models for storing Google Calendar tokens and settings
- Added API endpoints for managing Google Calendar integration
- Updated calendar controller to include Google Calendar events
- Implemented automatic syncing of Coparently events to Google Calendar

### Routing Improvements
- Fixed issue with empty screen at /app route after login
- Added explicit redirect from /app to /app/communication
- Ensured proper route ordering for specific paths before wildcard routes
- Added default route in MainApp component to handle root path navigation
- Updated all login redirects to go directly to /app/communication instead of /app
- Fixed authentication flow to ensure users are properly redirected after login