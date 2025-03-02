# Authentication in Coparently (Technical Overview & Requirements)

This document provides **technical** details of Coparently’s authentication flows—covering both **session-based** (Passport + Express Session) and **JWT-based** (token-based) approaches. By following these requirements and guidelines, the authentication system remains stable, consistent, and secure.

---

## 1. Primary Auth Methods

### 1.1 Local Email/Password (JWT-based)

- **Flow**  
  1. **Login Form**: User enters email + password on the React front end.  
  2. **Server Verification**: Server (in `/auth/login`) checks `User.hashed_password` via `bcrypt.compare()`.  
  3. **JWT Issuance**: If valid:
     - Create a JWT (e.g. `jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' })`).
     - Return the token to the frontend.  
  4. **Token Storage**: Frontend stores token in `localStorage` under `token`, plus stores user data in `localStorage.user`.  
  5. **Subsequent API Requests**: The React app includes `Authorization: Bearer <token>` for all protected endpoints.  
  6. **Auth Middleware**: On each request, the server’s `authenticateUser` (in `server/middleware/auth.js`) verifies the token and sets `req.user = user`.

- **Technical Requirements**  
  - **Environment**: Must have `JWT_SECRET` in `.env`.  
  - **Hashed Passwords**: DB must store only `hashed_password` using a salt (e.g. 10 rounds with bcrypt).  
  - **Response**: Return the newly minted JWT + user data in JSON on success.  
  - **Frontend**: Must store `token` and `user` in localStorage (or sessionStorage if you prefer) so you can add `Authorization: Bearer` in subsequent fetch calls.  
  - **Logout**: Involves removing `token` + `user` in localStorage. The server calls `/logout` to try to also clear any server session/cookies, though it’s mostly a “client-based logout” for JWT.

---

### 1.2 Google OAuth (Session + JWT Hybrid)

- **Flow**  
  1. **User Chooses “Sign in with Google”**: The app redirects to the Google OAuth page using Passport’s Google Strategy.  
  2. **Passport + Session**: On successful Google callback, Passport creates (or updates) the user in the database, storing a session for that user.  
  3. **JWT Issuance**: Coparently then generates a **JWT** to pass to the React client, just like local auth does.  
  4. **Redirect to Frontend**: The server builds a redirect URL with the user’s data and token appended (e.g. `?data=...`) so the React side can parse it and store the token in `localStorage`.  
  5. **Subsequent API Requests**: Exactly the same as local email/password—React includes `Authorization: Bearer <token>`.

- **Technical Requirements**  
  - **Environment**: Must have:
    - `GOOGLE_CLIENT_ID`
    - `GOOGLE_CLIENT_SECRET`
    - `GOOGLE_CALLBACK_URL` (often `http://localhost:3001/auth/google/callback` in dev)  
  - **Session Secret**: Must have `SESSION_SECRET` in `.env`.  
  - **Server**: Must use `passport.initialize()` and `passport.session()`, plus the GoogleStrategy in `server/config/passport.js`.  
  - **Callback**: Must handle the user creation or lookup in `GoogleStrategy` and then call `done(null, user)`.  
  - **Token Return**: **After** Google logs the user in, generate a JWT and attach it to the redirect so the front end can store it.

---

## 2. Session vs. JWT Distinctions

Coparently uses **sessions** primarily for **Google OAuth** (due to Passport’s approach) but uses **JWT** for the **client’s main API authentication**. That means:

- A user might have a server session from Google, but the front end also must have a JWT to authenticate REST endpoints (e.g. `/api/children`).  
- The session is short-lived if user never hits server endpoints that rely on Passport session.  
- The JWT is the single source of truth for all protected routes (`authenticateUser` in `auth.js`).

**Important**: If the user only logs in with Google, we still store a JWT locally in the browser for all subsequent calls. The session is mostly a leftover from the OAuth handshake.

---

## 3. Roles: Child vs. Parent

- **Role Column**: The database `users` table has a `role` field with either `parent` or `child`.  
- **Parent**: Can link with partners, see advanced features, etc.  
- **Child**: Minimal features, typically sees only the child-facing dashboards.  
- **Front End**: After login, we store `user.role`.  
  - If `role === 'child'`, we redirect to `child-dashboard`.  
  - If `role === 'parent'`, we redirect to `/app`.

---

## 4. Detailed Logout Requirements

**Logout** must handle:
1. **Client**: Remove `localStorage.token`, `localStorage.user`, plus any custom keys (`coparently_*`).  
2. **Cookies**: Attempt to delete cookies for `connect.sid`, `session`, `jwt`, etc.  
3. **Server**:  
   - If `req.logout` exists (Passport session), call it.  
   - Destroy `req.session` if it exists.  
   - Clear session cookies.

**Why**: Even though the JWT is purely client-based, the server tries to kill any sessions from Google OAuth. That ensures a full logout.

---

## 5. Environment Variable Checklist

These **must** be set correctly (for dev or production) in your `.env`:

1. **JWT_SECRET**: Any random secure string, e.g. `JWT_SECRET=some_long_random_key`.
2. **SESSION_SECRET**: Another random secure string for the Express session, e.g. `SESSION_SECRET=another_random_secure_string`.
3. **GOOGLE_CLIENT_ID**: Provided by Google.
4. **GOOGLE_CLIENT_SECRET**: Provided by Google.
5. **GOOGLE_CALLBACK_URL**: The callback route, e.g. `http://localhost:3001/auth/google/callback`.
6. **CLIENT_URL**: Typically `http://localhost:3000` in dev, used to redirect after Google OAuth.

---

## 6. Common Failure Points & How to Avoid Them

1. **Missing / Wrong JWT_SECRET**  
   - **Symptom**: All token verifications fail with “Invalid token.”  
   - **Fix**: Double-check `.env` has `JWT_SECRET`.  
2. **User Has No “role”**  
   - **Symptom**: The front end can’t decide child vs. parent. Possibly breaks routing.  
   - **Fix**: Ensure DB migrations are up to date, default user role to `parent` if not specified.  
3. **Google OAuth Callback Hard-Coded**  
   - **Symptom**: In dev, you see a “redirect_uri_mismatch.”  
   - **Fix**: Put the correct domain in `GOOGLE_CALLBACK_URL` and in the Google Cloud console.  
4. **Cookies Not Clearing**  
   - **Symptom**: After logout, you’re still recognized as logged in.  
   - **Fix**: Ensure the logout route calls `req.session.destroy()` and calls `res.clearCookie('connect.sid')` (or similar).  
5. **React Not Sending JWT**  
   - **Symptom**: Protected endpoints always respond with “401 Unauthorized” or “No token provided.”  
   - **Fix**: Check that your fetch calls in React have `Authorization: Bearer ${token}` set in the headers.

---

## 7. Testing Steps to Confirm It Won’t Break

1. **Local Auth**  
   1. Register a new user.  
   2. Login with that user.  
   3. Check `localStorage.token` is set, confirm you can call a protected endpoint.  
   4. Hit `Logout` -> confirm `token` is removed, session is destroyed.  
2. **Google Auth**  
   1. Click “Sign in with Google.”  
   2. Accept Google’s prompt if not done before.  
   3. On success, ensure you’re redirected to the React app with a `?data=...` param.  
   4. Confirm `token` is now in `localStorage`.  
   5. `Logout`, ensure no stale session remains.  
3. **Check Child vs. Parent**  
   1. Mark a user in DB as `role='child'`.  
   2. Login. Confirm the front end goes to child dashboard.  
   3. Mark a user in DB as `role='parent'`.  
   4. Login. Confirm you have standard parent routes.  

---

## 8. Summary

1. **Any** user—child or parent—**MUST** have a valid JWT for all `/api` routes.  
2. Google sign-in still uses a session for the handshake, but we quickly generate a JWT and hand it to the front end.  
3. The environment must have consistent, correct secrets for `JWT_SECRET`, `SESSION_SECRET`, and Google credentials.  
4. A robust **logout** procedure ensures all session data, cookies, and local browser state are purged.  

By adhering strictly to these **technical** details, Coparently’s auth flow stays consistent and stable, preventing partial logouts, missing tokens, or broken Google callbacks.