# Google OAuth Setup Guide

The OAuth error `Error 401: invalid_client` occurs because Google OAuth client IDs are placeholders. Here's how to fix it:

## Quick Fix for Testing

### Option 1: Use Firebase Auth UI (Recommended for quick testing)

1. **Update Firebase Console:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project → Authentication → Sign-in method
   - Enable Google Sign-in
   - Add your domain: `mapcoords.preview.emergentagent.com`

2. **Get OAuth Client IDs from Firebase:**
   - In Firebase console → Project Settings → General
   - Scroll to "Your apps" section
   - The Web Client ID will be shown automatically

### Option 2: Full Google Cloud Setup

## Step 1: Google Cloud Console Setup

1. **Create Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project: "Location Tracker"

2. **Enable APIs:**
   - APIs & Services → Library
   - Enable: "Google+ API" and "Google Sign-In API"

3. **OAuth Consent Screen:**
   - APIs & Services → OAuth consent screen
   - External → Configure
   - App name: "Location Tracker"
   - User support email: Your email
   - Scopes: email, profile, openid
   - Test users: Add your email

4. **Create Credentials:**
   - APIs & Services → Credentials
   - "+ CREATE CREDENTIALS" → OAuth 2.0 Client IDs

## Step 2: Create 3 Client IDs

### Web Application:
```
Type: Web application
Name: Location Tracker Web
Authorized origins: 
  - http://localhost:3000
  - https://mapcoords.preview.emergentagent.com
Authorized redirect URIs:
  - http://localhost:3000
  - https://mapcoords.preview.emergentagent.com
```

### iOS Application:
```
Type: iOS
Name: Location Tracker iOS  
Bundle ID: com.yourcompany.locationtracker
```

### Android Application:
```
Type: Android
Name: Location Tracker Android
Package name: com.yourcompany.locationtracker
SHA-1: (Get from: expo credentials:manager)
```

## Step 3: Update Environment Variables

Update `frontend/.env`:

```env
# Replace with your actual client IDs from Google Cloud Console
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=987654321-def456.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=456789123-ghi789.apps.googleusercontent.com
```

## Step 4: Test the Fix

1. Restart Expo: `expo start -c`
2. Try Google Sign-in
3. Should work without "invalid_client" error

## Alternative: Mock Authentication (for development)

If you want to skip OAuth setup temporarily, you can create a mock auth button:

```typescript
// For testing purposes only
const mockSignIn = () => {
  // Simulate successful authentication
  const mockUser = {
    uid: 'mock-user-123',
    displayName: 'Test User',
    email: 'test@example.com'
  };
  // Set user state directly
};
```

## Troubleshooting

### Common Issues:

1. **"invalid_client"**: Client ID not configured or wrong
2. **"unauthorized_client"**: Redirect URI not added to Google Console  
3. **"access_denied"**: OAuth consent screen not published or user not in test users

### Debug Steps:

1. Check console logs for detailed error messages
2. Verify client IDs match exactly (no extra spaces)
3. Ensure redirect URIs are added to Google Console
4. Check OAuth consent screen is configured

## Production Deployment

For production:
1. Publish OAuth consent screen (Google review required)
2. Add production domains to authorized origins
3. Use proper bundle IDs for iOS/Android
4. Set up proper SHA-1 certificates for Android

---

**Quick Start**: For immediate testing, just set up Firebase Authentication with Google Sign-in enabled and use the Firebase-provided client IDs.