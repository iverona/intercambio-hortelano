# Firebase App Hosting Setup Guide

## Overview
Your Next.js app is now configured to work with Firebase App Hosting, including local emulator support.

## Configuration Files Created/Modified

1. **`frontend/apphosting.yaml`** - App Hosting configuration for Next.js.
   - Specifies the build command: `next build --no-lint`.
   - Defines environment variables and secrets required for the build and runtime environments.

2. **`firebase.json`** - Updated with:
   - An `apphosting` block that points to your `frontend/` directory as the source root.
   - Emulator configuration for Auth, Functions, Firestore, and App Hosting.

3. **`frontend/src/app/api/health/route.ts`** - A health check endpoint for App Hosting to monitor the application's status.

## Running the Emulators

To start all Firebase emulators, including the App Hosting emulator for your Next.js app, run:
```bash
firebase emulators:start
```

## Access Points

- **Emulator UI**: [http://127.0.0.1:4040/](http://127.0.0.1:4040/)
  - View all emulator statuses.
  - Inspect Firestore data.
  - Monitor Functions logs.
  - Check Authentication users.

- **Next.js App (via App Hosting Emulator)**: [http://127.0.0.1:5003/](http://127.0.0.1:5003/)
  - This is the primary URL for testing your app locally. It serves your Next.js application through the App Hosting emulator, fully integrated with the other backend emulators.

- **Individual Service Endpoints**:
  - Authentication: `127.0.0.1:9099`
  - Functions: `127.0.0.1:5001`
  - Firestore: `127.0.0.1:8080`

## Environment Configuration

The emulator automatically:
- Uses the `npm run dev` command (as defined in `firebase.json`) to start your Next.js app in development mode.
- Connects to the local Firestore and Auth emulators.
- Provides hot-reload capabilities for frontend changes.

## Deploying to Production

When you are ready to deploy your application to a live environment:

1.  **Set Production Secrets:** Ensure all necessary environment variables (like API keys) are configured as secrets in App Hosting. You can set a secret using the CLI:
    ```bash
    firebase apphosting:secrets:set YOUR_SECRET_NAME
    ```

2.  **Deploy:** Deploy the App Hosting backend by running:
    ```bash
    firebase deploy --only apphosting
    ```

3.  For a complete deployment of all Firebase resources (hosting, functions, firestore rules, etc.), run the standard deploy command:
    ```bash
    firebase deploy
    ```

## Troubleshooting

### Port Conflicts
If you encounter port conflicts (e.g., port `5003` is already in use), you can modify the ports in the `emulators` section of your `firebase.json` file.

### Build Issues
If the Next.js application fails to build or run in the emulator, check the following:
- All dependencies are installed: `cd frontend && npm install`
- The development server runs correctly on its own: `cd frontend && npm run dev`

## Next Steps

1.  Test your app at **http://127.0.0.1:5003**.
2.  Use the Emulator UI at [http://127.0.0.1:4040/](http://127.0.0.1:4040/) to manage test data.
3.  When ready, deploy to production using `firebase deploy --only apphosting`.