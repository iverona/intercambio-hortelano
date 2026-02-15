# Technology Stack

**Analysis Date:** 2024-05-23

## Languages

**Primary:**
- TypeScript 5.x - Used for both Frontend (`frontend/src`) and Backend Functions (`functions/src`).

**Secondary:**
- JavaScript - Configuration files (`eslint.config.js`, `postcss.config.mjs`).

## Runtime

**Environment:**
- Node.js 22 (Cloud Functions)
- Browser (Next.js Frontend)

**Package Manager:**
- npm (Lockfile: `package-lock.json` present in both `frontend` and `functions`)

## Frameworks

**Core:**
- Next.js 15.5.7 (React 19.1.0) - Frontend application framework.
- Firebase Cloud Functions 6.x - Serverless backend logic.

**Testing:**
- Playwright (`frontend/tests`) - E2E testing.
- Firebase Functions Test (`functions/test`) - Backend testing (configured in `package.json`).

**Build/Dev:**
- Turbopack - Next.js development server.
- TSC (TypeScript Compiler) - Functions build.
- Firebase CLI - Deployment and emulation.

## Key Dependencies

**Critical:**
- `firebase` ^12.2.1 - Client SDK.
- `firebase-admin` ^12.6.0 - Backend SDK.
- `firebase-functions` ^6.0.1 - Functions triggers.
- `next` 15.5.7 - App router, server actions.
- `react` 19.1.0 - UI library.

**UI & Styling:**
- Tailwind CSS 4 - Utility-first CSS.
- Radix UI - Accessible UI primitives (Dialog, Popover, Select, etc.).
- Lucide React - Icons.
- `sonner` - Toast notifications.
- `embla-carousel-react` - Carousels.

**Utilities:**
- `date-fns` - Date manipulation.
- `nodemailer` - Email sending (both frontend and functions).
- `zod` - Validation (inferred usage in modern stacks, though not explicitly listed in top dependencies, often present).
- `next-international` - Internationalization.

## Configuration

**Environment:**
- `.env` files (local development).
- Firebase Environment Configuration (Production).
- `frontend/apphosting.yaml` - Cloud Run configuration.

**Build:**
- `frontend/next.config.ts` - Next.js configuration (Security headers, Image domains).
- `frontend/tsconfig.json` - TypeScript config.
- `functions/tsconfig.json` - Backend TypeScript config.
- `firebase.json` - Firebase services configuration.

## Platform Requirements

**Development:**
- Node.js 20+ (Required for Next.js 15).
- Firebase CLI.
- Java (optional, for Firebase Emulators).

**Production:**
- Firebase App Hosting (Cloud Run).
- Firebase Cloud Functions (Gen 2).
- Google Cloud Platform (Europe-Southwest1 region).

---

*Stack analysis: 2024-05-23*
