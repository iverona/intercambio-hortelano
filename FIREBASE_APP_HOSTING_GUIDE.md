# Firebase App Hosting Setup Guide

## Overview
Your Next.js app is now configured to work with Firebase App Hosting, including local emulator support.

## Configuration Files Created/Modified

1. **`frontend/apphosting.yaml`** - App Hosting configuration for Next.js
   - Runtime: Node.js 20
   - Build command: `npm run build`
   - Health check endpoint: `/api/health`
   - Resource limits and scaling configuration

2. **`firebase.json`** - Updated with:
   - Hosting configuration pointing to frontend directory
   - Emulator ports configuration
   - Web frameworks support

3. **`frontend/src/app/api/health/route.ts`** - Health check endpoint for App Hosting

## Running the Emulators

Start all Firebase emulators (including App Hosting):
```bash
firebase emulators:start
```

## Access Points

- **Emulator UI**: http://127.0.0.1:4040/
  - View all emulator statuses
  - Inspect Firestore data
  - Monitor Functions logs
  - Check Authentication users

- **Next.js App (via Firebase Hosting)**: http://127.0.0.1:5002
  - Your app served through Firebase's hosting emulator
  - Integrated with other Firebase services

- **Individual Services**:
  - Authentication: `127.0.0.1:9099`
  - Functions: `127.0.0.1:5001`
  - Firestore: `127.0.0.1:8080`

## Environment Configuration

The emulator automatically:
- Builds your Next.js app
- Serves it through Firebase Functions (ssrportalintercambiohor)
- Connects to local Firestore and Auth emulators
- Provides hot-reload capabilities

## Deploying to Production

When ready to deploy to production:

1. Ensure all environment variables are set in Firebase:
   ```bash
   firebase apphosting:secrets:set YOUR_SECRET_NAME
   ```

2. Deploy to Firebase App Hosting:
   ```bash
   firebase deploy --only hosting
   ```

3. For a complete deployment (hosting, functions, firestore rules):
   ```bash
   firebase deploy
   ```

## Troubleshooting

### Port Conflicts
If you encounter port conflicts, modify the ports in `firebase.json` under the `emulators` section.

### Node Version Warning
The warning about Node version 24 vs 20 can be safely ignored for local development. For production deployment, ensure you're using Node 20.

### Build Issues
If the Next.js build fails, check:
- All dependencies are installed: `cd frontend && npm install`
- The build command works: `cd frontend && npm run build`

## Next Steps

1. Test your app at http://127.0.0.1:5002
2. Use the Emulator UI at http://127.0.0.1:4040/ to manage test data
3. When ready, deploy to production using `firebase deploy --only hosting`

## Notes

- The emulator uses Firebase Functions to serve the Next.js app (function name: `ssrportalintercambiohor`)
- All API routes and server-side rendering work through the emulator
- Changes to your Next.js code will require restarting the emulator to see updates
