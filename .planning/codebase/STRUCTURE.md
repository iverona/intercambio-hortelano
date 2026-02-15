# Codebase Structure

**Analysis Date:** 2025-02-23

## Directory Layout

```
/
├── frontend/               # Next.js Application
│   ├── src/
│   │   ├── app/            # App Router (Pages & Layouts)
│   │   ├── components/     # React Components
│   │   │   ├── shared/     # Application-specific components
│   │   │   └── ui/         # Generic UI kit (likely shadcn/ui)
│   │   ├── context/        # React Context Providers
│   │   ├── hooks/          # Custom React Hooks
│   │   ├── lib/            # Utilities & Config (Firebase, Utils)
│   │   ├── locales/        # i18n Translations
│   │   ├── services/       # API/Database Service Layer
│   │   └── types/          # TypeScript Definitions
│   └── public/             # Static Assets
│
├── functions/              # Firebase Cloud Functions
│   ├── src/
│   │   ├── lib/            # Shared logic for functions (optional)
│   │   └── types/          # Backend types
│   └── [files].ts          # Function definitions (notifications, etc.)
│
└── documentation/          # Project Documentation
```

## Directory Purposes

**frontend/src/app:**
- Purpose: Routing and Page definitions.
- Key files: `layout.tsx` (Root layout), `page.tsx` (Home), `[locale]/layout.tsx` (Localized layout).

**frontend/src/services:**
- Purpose: Encapsulate Firestore interaction.
- Key files: `user.service.ts`, `exchange.service.ts`, `product.service.ts`.

**frontend/src/components:**
- Purpose: UI implementation.
- `shared`: Business logic components (e.g., `ProductCard.tsx`, `Header.tsx`).
- `ui`: Atomic design components (e.g., `button.tsx`, `card.tsx`).

**functions/src:**
- Purpose: Server-side logic.
- Key files: `index.ts` (Exports), `notifications.ts` (Triggers), `contact.ts` (Callables).

## Key File Locations

**Entry Points:**
- Frontend: `frontend/src/app/layout.tsx`
- Backend: `functions/src/index.ts`

**Configuration:**
- Firebase (Frontend): `frontend/src/lib/firebase.ts`
- Firebase (Backend): `functions/src/config.ts`
- Next.js: `frontend/next.config.ts`
- Tailwind: `frontend/src/app/globals.css` (via Tailwind v4 CSS imports)

**Core Logic:**
- User Management: `frontend/src/services/user.service.ts`
- Auth State: `frontend/src/context/AuthContext.tsx`
- Notification Logic: `functions/src/notifications.ts`

**Testing:**
- E2E: `frontend/tests/login.spec.ts` (Playwright)

## Naming Conventions

**Files:**
- Components: PascalCase (e.g., `ProductCard.tsx`)
- Services: camelCase with suffix (e.g., `userService.ts` or `user.service.ts`) -> *Actual: `user.service.ts`*
- Hooks: camelCase with `use` prefix (e.g., `useUser.ts`)
- Utilities: camelCase (e.g., `utils.ts`)

**Directories:**
- General: kebab-case (e.g., `my-garden`, `api`)
- Next.js Dynamic Routes: `[param]` (e.g., `[locale]`)
- Route Groups: `(group)` (e.g., `(auth)`)

## Where to Add New Code

**New Feature (Frontend):**
1. **Page:** Add to `frontend/src/app/[locale]/[feature-name]/page.tsx`
2. **Service:** Add method to `frontend/src/services/[feature].service.ts`
3. **Components:** Create in `frontend/src/components/shared/`

**New Backend Function:**
1. **Implementation:** Create `functions/src/[feature].ts`
2. **Export:** Add export in `functions/src/index.ts`

**New Type/Interface:**
- Shared: `frontend/src/types/[feature].ts`
- Backend-specific: `functions/src/types/index.ts`

## Special Directories

**frontend/src/app/[locale]:**
- Purpose: Internationalized routes. All pages sit inside here to inherit the locale param.

**frontend/src/app/api:**
- Purpose: Next.js API Routes (Serverless functions provided by Vercel/Next).
- Note: Mostly unused in favor of Firebase Functions, but `health/` endpoint exists.

---
*Structure analysis: 2025-02-23*
