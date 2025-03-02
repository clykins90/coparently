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
- **Child user management and email invitations (unified “Add Child” flow)**

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
- **Single-form child user creation** (optional)
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