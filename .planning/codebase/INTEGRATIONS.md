# External Integrations

**Analysis Date:** 2024-05-23

## APIs & External Services

**Google Maps Platform:**
- Maps JavaScript API - Interactive maps (`@react-google-maps/api`).
- Places API - Location search and autocomplete.
- Auth: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (Secret Manager).

**Google Recaptcha:**
- Recaptcha V3 - Used for Firebase App Check.
- Auth: `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`.

**Firebase Services:**
- **Authentication:** `firebase/auth`
- **Firestore:** `firebase/firestore`
- **Storage:** `firebase/storage`
- **Functions:** `firebase/functions`
- **App Check:** `firebase/app-check`

## Data Storage

**Databases:**
- **Firestore (NoSQL):** Primary database.
  - Connection: Initialized in `frontend/src/lib/firebase.ts`.
  - Rules: `firestore.rules`.
  - Indexes: `firestore.indexes.json`.

**File Storage:**
- **Firebase Cloud Storage:** User uploads (images).
  - Bucket: `ecoanuncios` (defined in `frontend/apphosting.yaml`).
  - Rules: `storage.rules`.

**Caching:**
- **Next.js Cache:** Built-in caching for server components and static assets.

## Authentication & Identity

**Auth Provider:**
- **Firebase Auth:**
  - **Google Provider:** `GoogleAuthProvider`.
  - **Email/Password:** Custom forms using SDK methods.
  - Implementation: `frontend/src/services/auth.service.ts`.

## Monitoring & Observability

**Error Tracking:**
- **Console/Logs:** Firebase Cloud Functions logs (viewable in GCP Console).
- **Firebase Console:** Usage and health monitoring.

**Logs:**
- `firebase-functions/logger` used in backend (`functions/src/utils.ts`).

## CI/CD & Deployment

**Hosting:**
- **Firebase App Hosting:** Next-generation hosting built on Cloud Run.
- Config: `frontend/apphosting.yaml`.

**CI Pipeline:**
- Firebase App Hosting automatically builds and deploys from GitHub source (implied by "alwaysDeployFromSource: true").

## Environment Configuration

**Required Environment Variables (Frontend):**
- `NEXT_PUBLIC_FIREBASE_API_KEY` (Secret)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (Secret)
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`

**Secrets Location:**
- Google Cloud Secret Manager (accessed via Firebase App Hosting or Functions secrets).

## Webhooks & Callbacks

**Outgoing (Email):**
- **Nodemailer:** Sends emails via SMTP.
  - Config: `EMAIL_USER` and `EMAIL_PASS` secrets.
  - Triggers:
    - New Offer (`functions/src/notifications.ts`)
    - New Message (`functions/src/notifications.ts`)
    - Contact Form (`functions/src/contact.ts`)

---

*Integration audit: 2024-05-23*
