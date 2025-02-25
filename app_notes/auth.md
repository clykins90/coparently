# Authentication in Coparently

## Current Authentication Approach

The application currently uses two different authentication methods:

1. **Session-based authentication with Passport.js**
   - Primarily used for Google OAuth authentication
   - Uses express-session and passport.js to manage user sessions
   - Configured in server/config/passport.js
   - Handles user serialization/deserialization for session storage

2. **Token-based authentication with JWT**
   - Used for API endpoints that require authentication
   - JWT tokens are generated during login and Google OAuth callback
   - Tokens are stored in localStorage on the client side
   - The authenticateUser middleware validates tokens for protected routes

## Authentication Flow

### Local Authentication (Email/Password)
1. User submits login credentials
2. Server validates credentials and generates a JWT token
3. Token is returned to the client and stored in localStorage
4. Client includes the token in the Authorization header for subsequent requests
5. Protected routes use the authenticateUser middleware to validate the token

### Google OAuth Authentication
1. User clicks "Sign in with Google" button
2. User is redirected to Google's authentication page
3. After successful authentication, Google redirects back to our callback URL
4. Server creates or updates the user record and generates a JWT token
5. User is redirected to the frontend with user data and token
6. Frontend stores the token in localStorage
7. Protected routes use the same authenticateUser middleware

## Implementation Details

### Server-side
- JWT tokens are generated in auth.js routes
- The authenticateUser middleware in middleware/auth.js validates tokens
- Passport.js is configured for Google OAuth in config/passport.js

### Client-side
- The AuthContext provides authentication state and methods
- The api.js service handles token storage and includes tokens in requests
- Protected routes check authentication status via the useAuth hook

## Why Separate Authentication Methods?

The current hybrid approach (using both session-based and token-based authentication) likely evolved for the following reasons:

1. **OAuth Integration**: Passport.js is a popular and well-established library for implementing OAuth authentication. It uses sessions by default to maintain user state after OAuth redirection.

2. **API Security**: JWT tokens provide a stateless way to secure API endpoints, which is beneficial for scalability and works well with modern frontend frameworks.

3. **Gradual Evolution**: The application may have started with session-based authentication and later added JWT support for API endpoints as the application grew.

4. **Different Use Cases**: Sessions work well for browser-based authentication flows (like OAuth), while JWTs are better suited for API authentication, especially for mobile apps or third-party integrations.

This separation isn't necessarily a problem, but it does add complexity to the codebase and can lead to confusion about which authentication method is being used where.

## Considerations for Improvement

Having two authentication methods (session-based and token-based) can lead to confusion and potential security issues. Consider standardizing on one approach:

1. **Fully JWT-based approach**:
   - Remove session-based authentication
   - Use JWT for all authentication, including OAuth
   - Simplifies the authentication flow and reduces server-side state

2. **Fully session-based approach**:
   - Use sessions for all authentication
   - Store session IDs in cookies with appropriate security settings
   - May provide better security for web applications

The current hybrid approach works but may be more complex to maintain and understand. 