# Authentication Approach

## Overview

This application uses a **locked authentication method** approach. Once a user registers with a specific authentication method (email/password OR Google), they must continue using that same method for all future logins.

## Why This Approach?

This simplified approach offers several benefits:

1. **Simpler Logic** - No account merging, no data migration, no complex linking
2. **Clearer UX** - Users know exactly how to sign in (the way they registered)
3. **Fewer Edge Cases** - No need to handle account conflicts or data merging
4. **Better Security** - Reduces attack surface by preventing method switching
5. **Easier Maintenance** - Less code to maintain and test

## How It Works

### Scenario 1: User Registers with Email/Password

1. User creates account with email/password
2. User document is created with `authMethod: "password"`
3. Future login attempts:
   - ✅ Email/password login: Works normally
   - ❌ Google login with same email: Blocked with error message

### Scenario 2: User Registers with Google

1. User creates account with Google
2. User document is created with `authMethod: "google"`
3. Future login attempts:
   - ✅ Google login: Works normally
   - ❌ Email/password signup with same email: Blocked with error message

## Implementation Details

### Email/Password Registration
- File: `frontend/src/app/[locale]/(auth)/signup/page.tsx`
- Creates user with `authMethod: "password"`
- If email exists with Google, shows dialog directing user to sign in with Google

### Google Authentication
- File: `frontend/src/hooks/useGoogleAuth.ts`
- Creates user with `authMethod: "google"`
- Checks if email is registered with password method
- If yes, signs out the Google user and shows error message

### Error Messages

**English:**
- Login page: "This email is registered with email/password. Please sign in using your password." (Note: This message is currently hardcoded in `frontend/src/hooks/useGoogleAuth.ts` and does not use the localization files.)
- Signup page (Google exists): "This email is already registered with a Google account. Please sign in with Google to access your account."
- Signup page (Password exists): "This email address is already registered. Please go to the login page to sign in."

**Spanish:**
- Login page: "Este correo está registrado con email/contraseña. Por favor, inicia sesión usando tu contraseña."
- Signup page (Google exists): "Este correo electrónico ya está registrado con una cuenta de Google. Por favor, inicia sesión con Google para acceder a tu cuenta."
- Signup page (Password exists): "Este correo electrónico ya está registrado. Por favor, ve a la página de inicio de sesión para acceder."

## User Experience

### For Email/Password Users
1. Register with email/password
2. Receive verification email
3. Verify email and login
4. If they try to use Google later: Clear error message directing them to use password

### For Google Users
1. Click "Sign in with Google"
2. Authorize with Google
3. Account created automatically
4. If they try to register with email/password later: Dialog directing them to use Google

## Comparison with Other Platforms

Several major platforms use this approach:
- **Discord** - Locks to first authentication method
- **Reddit** - Similar locked approach
- **Banking Apps** - Lock authentication for security
- **Enterprise SaaS** - Many B2B platforms lock methods

## Files Modified

1. `frontend/src/hooks/useGoogleAuth.ts` - Removed account linking, added method checking
2. `frontend/src/app/[locale]/(auth)/signup/page.tsx` - Simplified error handling
3. `frontend/src/locales/en.ts` - Added new error messages
4. `frontend/src/locales/es.ts` - Added Spanish translations
5. Deleted `frontend/src/lib/accountLinking.ts` - No longer needed
6. Deleted `ACCOUNT_LINKING_GUIDE.md` - Replaced by this document

## Future Considerations

If you ever want to allow users to link accounts, you could:
1. Add a "Link Account" feature in user settings
2. Show linked methods in profile
3. Add unlinking option
4. Email notifications when accounts are linked

But for now, the locked method approach provides a simpler, cleaner user experience.