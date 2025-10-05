# Account Linking Guide

## Overview

This document explains how the application handles the scenario where a user first registers with email/password and later attempts to sign in with Google using the same email address.

## The Problem

Without proper account linking, Firebase Authentication treats different sign-in methods as separate accounts, even if they use the same email address. This would result in:

- Two different user IDs (UIDs) for the same person
- Two separate user profiles in Firestore
- Data fragmentation (products, exchanges, chats tied to different accounts)
- Poor user experience

## The Solution

We've implemented automatic account linking and data merging that:

1. **Detects existing accounts** - When a user signs in with Google, we check if an account with that email already exists
2. **Merges user data** - Consolidates all data from the old account to the new one
3. **Preserves important information** - Keeps onboarding status, reputation, and other critical fields
4. **Updates all references** - Updates products, exchanges, chats, and notifications to point to the new UID
5. **Cleans up** - Removes the old user document after successful merge

## How It Works

### 1. Account Detection (`accountLinking.ts`)

When a user signs in with Google:

```typescript
// Check if an account with this email exists
const existingUser = await findUserByEmail(email);

// Check what sign-in methods are available
const signInMethods = await fetchSignInMethodsForEmail(auth, email);

// Determine if we need to merge accounts
if (signInMethods.includes("password")) {
  return { 
    needsMerge: true, 
    oldUid: existingUser.uid 
  };
}
```

### 2. Data Merging (`completeAccountMerge`)

The merge process:

1. **Retrieves both user documents** - Gets data from old and new accounts
2. **Merges user profile** - Combines important fields, preferring data from the original account
3. **Updates all related data**:
   - Products owned by the user
   - Exchanges (as requester or owner)
   - Chat participations
   - Notifications
4. **Deletes old account** - Removes the obsolete user document

### 3. Integration (`useGoogleAuth.ts`)

The Google authentication hook now:

```typescript
// Get Google credential
const credential = GoogleAuthProvider.credentialFromResult(result);

// Check for account linking needs
const linkingResult = await handleGoogleAccountLinking(credential, email);

// Create new user document if needed
if (!userDoc.exists()) {
  await setDoc(doc(db, "users", user.uid), {...});
}

// Merge accounts if necessary
if (linkingResult.needsMerge && linkingResult.oldUid) {
  await completeAccountMerge(linkingResult.oldUid, user.uid);
}
```

## Database Indexes

To enable efficient email lookups, we've added a Firestore index:

```json
{
  "fieldOverrides": [
    {
      "collectionGroup": "users",
      "fieldPath": "email",
      "indexes": [
        {
          "order": "ASCENDING",
          "queryScope": "COLLECTION"
        }
      ]
    }
  ]
}
```

This allows us to quickly query users by email address.

## User Experience

From the user's perspective:

1. **First time**: User registers with email/password
2. **Later**: User clicks "Sign in with Google" using the same email
3. **Behind the scenes**: 
   - System detects existing account
   - Merges all data automatically
   - User is signed in with Google
4. **Result**: User has access to all their previous data, now linked to their Google account

## Data Preserved During Merge

The following data is preserved from the original account:

- **User Profile**:
  - Name
  - Onboarding completion status
  - Reputation score
  - Points
  - Level
  - Badges

- **Related Data**:
  - All products
  - All exchanges (as requester or owner)
  - All chat conversations
  - All notifications

## Error Handling

The system handles various error scenarios:

- Missing email in Google account
- Failed credential retrieval
- Database operation failures
- Missing user documents

All errors are logged and displayed to the user with appropriate messages.

## Security Considerations

- Only the authenticated user can trigger account merging
- All database operations use batched writes for atomicity
- Firestore security rules prevent unauthorized access
- Old account data is completely removed after successful merge

## Testing

To test the account linking:

1. Create an account with email/password
2. Add some products or create exchanges
3. Sign out
4. Sign in with Google using the same email
5. Verify all previous data is accessible
6. Check that only one user document exists in Firestore

## Reverse Scenario: Google Account Exists, User Tries Email/Password Signup

The system also handles the opposite scenario where a user has already registered with Google and later attempts to sign up with email/password using the same email address.

### How It Works

1. **Error Detection**: When `createUserWithEmailAndPassword()` is called, Firebase returns an `auth/email-already-in-use` error
2. **Provider Check**: The system uses `fetchSignInMethodsForEmail()` to determine which providers are registered for that email
3. **User Dialog**: If Google is detected, a dialog appears informing the user:
   - "This email is already registered with a Google account"
   - "Please sign in with Google to access your account"
4. **Redirect to Google**: User can click "Sign in with Google" to access their existing account

### Implementation

In `signup/page.tsx`:

```typescript
catch (error: any) {
  if (error.code === "auth/email-already-in-use") {
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    
    if (signInMethods.includes(GoogleAuthProvider.PROVIDER_ID)) {
      setShowGoogleDialog(true); // Show dialog
      return;
    }
  }
  setError(error.message);
}
```

### User Experience

1. User fills out email/password signup form
2. Clicks "Sign Up"
3. System detects email is already registered with Google
4. Dialog appears with clear message and "Sign in with Google" button
5. User clicks button and is signed in with their existing Google account
6. All their previous data is immediately accessible

This provides a symmetric solution - whether users go Google→Email/Password or Email/Password→Google, the system handles both scenarios gracefully.

## Future Enhancements

Potential improvements:

- Support for other OAuth providers (Facebook, Apple, etc.)
- User notification when accounts are merged
- Option to unlink accounts
- Audit log of account linking events
- Password linking option (allowing users to add password auth to existing Google accounts)
