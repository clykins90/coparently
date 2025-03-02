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

### User Management
- User registration and profile management
- Partner linking and invitation system
- Partner request notifications
- Profile picture upload and management
- Child user management and email invitations

### Communication
- Real-time messaging using Socket.io
- Conversation management

### Calendar
- Shared calendar for co-parents
- Custody schedule management
- Event creation and management
- Child-specific events

### Settings
- User profile settings
- Application preferences
- Child information management
- Child user management and invitations
- Profile picture management

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

## Project Structure

```
coparently/
├── client/                 # Frontend React application
│   ├── public/             # Static files
│   ├── src/                # Source code
│   │   ├── components/     # React components
│   │   │   ├── ChildrenManager/  # Refactored ChildrenManager component
│   │   │   │   ├── components/   # Child components
│   │   │   │   ├── hooks/        # Custom hooks for data fetching
│   │   │   │   └── index.js      # Main component export
│   │   ├── context/        # React context providers
│   │   ├── services/       # API service functions
│   │   ├── utils/          # Utility functions
│   │   ├── App.js          # Main application component
│   │   └── index.js        # Entry point
│   ├── package.json        # Frontend dependencies
│   └── tailwind.config.js  # Tailwind CSS configuration
│
├── server/                 # Backend Node.js/Express application
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── migrations/         # Database migrations
│   ├── models/             # Sequelize models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   ├── .env                # Environment variables
│   ├── index.js            # Server entry point
│   └── package.json        # Backend dependencies
│
└── app_notes/              # Application documentation
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/coparently.git
cd coparently
```

2. Install backend dependencies:
```bash
cd server
npm install
```

3. Configure environment variables:
   - Create a `.env` file in the server directory based on the provided example
   - Set up database connection details
   - Configure authentication secrets

4. Run database migrations:
```bash
npm run migrate
```

5. Install frontend dependencies:
```bash
cd ../client
npm install
```

6. Configure frontend environment:
   - Create a `.env` file in the client directory if needed

## Development

### Running the application locally

1. Start the backend server:
```bash
cd server
npm start
```

2. Start the frontend development server:
```bash
cd client
npm start
```

3. Access the application at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login with username/password
- `GET /auth/google` - Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback
- `POST /api/logout` - Logout user

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/profile/picture` - Upload profile picture
- `DELETE /api/users/profile/picture` - Remove profile picture

### Partners
- `POST /api/partners/request` - Send partner request
- `GET /api/partners/requests` - Get partner requests
- `PUT /api/partners/requests/:id` - Accept/reject partner request
- `GET /api/partners` - Get user's partners

### Messages
- `GET /api/conversations` - Get user conversations
- `POST /api/conversations` - Create a new conversation
- `GET /api/conversations/:id/messages` - Get messages for a conversation
- `POST /api/conversations/:id/messages` - Send a message

### Calendar
- `GET /api/calendar/events` - Get calendar events
- `POST /api/calendar/events` - Create a calendar event
- `PUT /api/calendar/events/:id` - Update a calendar event
- `DELETE /api/calendar/events/:id` - Delete a calendar event

### Children
- `GET /api/children` - Get user's children
- `POST /api/children` - Add a child
- `PUT /api/children/:id` - Update child information
- `DELETE /api/children/:id` - Remove a child

### Child Users
- `GET /api/children-users` - Get child users linked to parent
- `POST /api/children-users` - Create a child user
- `POST /api/children-users/invite` - Invite a child user via email
- `PUT /api/children-users/:id` - Update child-parent link
- `DELETE /api/children-users/:id` - Remove child user link

### Child Authentication
- `GET /api/auth/verify-child-invitation` - Verify child invitation token
- `POST /api/auth/complete-child-signup` - Complete child signup process

## Database Models

### User
- Basic user information (name, email, etc.)
- Authentication details
- Partner relationships
- Profile picture URL

### Child
- Child information
- Parent relationships

### CalendarEvent
- Event details
- Event type
- Associated parents and children

### CustodySchedule
- Schedule details
- Associated parents and children

### Conversation
- Conversation participants
- Conversation metadata

### Message
- Message content
- Sender information
- Timestamp

### PartnerRequest
- Request status
- Requester and recipient information

## Recent Refactorings

### ChildrenManager Component
The ChildrenManager component has been refactored to follow a more modular structure:
- Split into smaller, focused components
- Extracted data fetching logic into custom hooks
- Improved separation of concerns
- Enhanced maintainability and readability

The new structure includes:
- `components/` - UI components for different parts of the children management interface
- `hooks/` - Custom hooks for data fetching and state management
- `index.js` - Main component that composes the UI from smaller components 