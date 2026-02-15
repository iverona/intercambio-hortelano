# Architecture

**Analysis Date:** 2025-02-23

## Pattern Overview

**Overall:** Serverless Full-Stack Application (Next.js + Firebase)

**Key Characteristics:**
- **Client-Heavy Logic:** Frontend interacts directly with Firestore for most read/write operations via a Service Layer.
- **Event-Driven Backend:** Cloud Functions trigger on Firestore changes (e.g., new offer -> send email) rather than serving as a traditional CRUD API.
- **RPC-Style Operations:** Specific secure actions use Callable Functions (e.g., `submitContactForm`).
- **Component-Based UI:** React Server Components (RSC) and Client Components with Tailwind CSS.

## Layers

**Frontend (Next.js):**
- Purpose: User Interface and direct data interaction.
- Location: `frontend/src`
- Contains: Pages (`app`), Components (`components`), Services (`services`), Contexts (`context`).
- Depends on: Firebase Client SDK (`firebase/firestore`, `firebase/auth`).
- Used by: End users via browser.

**Service Layer:**
- Purpose: Abstraction over Firebase SDK to handle caching, batching, and error mapping.
- Location: `frontend/src/services`
- Contains: `UserService`, `ProductService`, etc.
- Pattern: Singleton objects with async methods returning Promises.

**State Management (Context):**
- Purpose: Global state for Auth, Filters, and Notifications.
- Location: `frontend/src/context`
- Examples: `AuthContext.tsx`, `FilterContext.tsx`.

**Backend (Cloud Functions):**
- Purpose: Business logic that requires admin privileges or async processing.
- Location: `functions/src`
- Contains: Triggers (`onDocumentCreated`), Callables (`onCall`).
- Depends on: Firebase Admin SDK (`firebase-admin`).

## Data Flow

**Standard Read/Write:**
1. **Component** calls a **Hook** (e.g., `useUser`).
2. **Hook** calls a **Service** (e.g., `UserService.getUserProfile`).
3. **Service** checks **Cache** (Map) or queries **Firestore**.
4. **Firestore** returns data to Service -> Hook -> Component.

**Async Business Logic (e.g., Notifications):**
1. User creates a document in Firestore (e.g., `exchanges/{id}`).
2. **Cloud Function** (`onNewOffer`) triggers on creation.
3. Function reads related data (Owner, User).
4. Function sends email via `nodemailer` or updates other Firestore docs.

**Secure Operations (e.g., Contact Form):**
1. **Component** calls a **Callable Function** via Firebase SDK.
2. **Function** (`submitContactForm`) executes with App Check validation.
3. Function returns result directly to Component.

## Key Abstractions

**Services:**
- Purpose: Centralize database logic and types.
- Examples: `frontend/src/services/user.service.ts`
- Pattern: Exported const object with async methods.

**Providers:**
- Purpose: Wrap the application with necessary context.
- Examples: `frontend/src/app/[locale]/layout.tsx` imports `AuthProvider`, `NotificationProvider`.

**Cloud Functions:**
- Purpose: Modular backend logic.
- Examples: `functions/src/notifications.ts`, `functions/src/contact.ts`
- Pattern: Named exports of `onDocumentCreated` or `onCall`.

## Entry Points

**Frontend Application:**
- Location: `frontend/src/app/layout.tsx` (Root)
- Triggers: Next.js Request
- Responsibilities: HTML structure, Global Providers.

**Backend Functions:**
- Location: `functions/src/index.ts`
- Triggers: Deployment (exports functions)
- Responsibilities: Exporting all function triggers.

## Error Handling

**Strategy:**
- **Frontend:** Services catch Firebase errors and throw standard errors. UI components (via Hooks) catch these and display toasts (`sonner`).
- **Backend:** Functions use `logger` to log errors and `HttpsError` for callable failures.

## Cross-Cutting Concerns

**Authentication:**
- Managed via `AuthContext` (`frontend/src/context/AuthContext.tsx`) using `firebase/auth`.
- Protected routes via Middleware (`frontend/src/middleware.ts`).

**Internationalization (i18n):**
- Handled by `next-international`.
- Config: `frontend/src/locales/` (`en.ts`, `es.ts`).
- Middleware: `frontend/src/middleware.ts` rewrites URLs.

**Logging:**
- Backend: `firebase-functions/logger`.
- Frontend: `console.error` (development) / standard console (production).

---
*Architecture analysis: 2025-02-23*
