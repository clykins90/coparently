# Setting Up Google OAuth for Coparently

This guide will walk you through the process of setting up Google OAuth credentials for the Coparently application.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click on "New Project"
4. Enter a name for your project (e.g., "Coparently")
5. Click "Create"

## Step 2: Enable the Google+ API

1. In your new project, go to "APIs & Services" > "Library"
2. Search for "Google+ API" or "Google Identity"
3. Click on "Google+ API" or "Google Identity Services"
4. Click "Enable"

## Step 3: Configure the OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" as the user type (unless you have a Google Workspace)
3. Click "Create"
4. Fill in the required information:
   - App name: "Coparently"
   - User support email: Your email address
   - Developer contact information: Your email address
5. Click "Save and Continue"
6. Add the following scopes:
   - `email`
   - `profile`
   - `openid`
7. Click "Save and Continue"
8. Add test users if you're in testing mode
9. Click "Save and Continue"
10. Review your settings and click "Back to Dashboard"

## Step 4: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Name: "Coparently Web Client"
5. Add the following authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - Your production URL (if applicable)
6. Add the following authorized redirect URIs:
   - `http://localhost:3001/auth/google/callback` (for development)
   - Your production callback URL (if applicable)
7. Click "Create"

## Step 5: Get Your Credentials

After creating the OAuth client ID, you'll see a modal with your client ID and client secret. Copy these values and add them to your `.env` file:

```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
SESSION_SECRET=random_secure_string_here
```

## Step 6: Restart Your Server

After updating your `.env` file, restart your server for the changes to take effect.

## Testing

1. Start your application
2. Go to the login page
3. Click "Sign in with Google"
4. You should be redirected to Google's login page
5. After logging in, you should be redirected back to your application

## Troubleshooting

- If you get a "redirect_uri_mismatch" error, make sure the redirect URI in your Google Cloud Console matches exactly with the one your application is using.
- If you get a "invalid_client" error, make sure your client ID and client secret are correct.
- If you get a "access_denied" error, make sure you've enabled the Google+ API and configured the OAuth consent screen correctly. 