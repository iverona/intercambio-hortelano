# Coding Conventions

**Analysis Date:** 2024-05-23

## Naming Patterns

**Files:**
- React Components: PascalCase (e.g., `Header.tsx`, `ProductCard.tsx`)
- Logic/Services/Hooks: camelCase (e.g., `user.service.ts`, `useUser.ts`, `utils.ts`)
- Pages: `page.tsx`, `layout.tsx` (Next.js App Router convention)
- Directories: 
  - Routes: kebab-case (e.g., `my-garden`, `como-participar`)
  - Utilities: camelCase (e.g., `components`, `hooks`, `lib`)

**Functions:**
- camelCase (e.g., `getUserProfile`, `handleLogout`)
- React Components: PascalCase (e.g., `Header`)

**Variables:**
- camelCase (e.g., `userCache`, `fetchPromise`)
- Constants: UPPER_CASE (e.g., `BASE_URL`)
- Booleans: often prefixed with `is`, `has`, `should` (e.g., `emailEnabled`)

**Types:**
- Interfaces/Types: PascalCase (e.g., `UserData`, `Producer`)

## Code Style

**Formatting:**
- **Frontend**: 
  - Double quotes for imports and strings (e.g., `import { ... } from "@/lib/firebase";`)
  - Semicolons used
  - 2-space indentation (observed in `Header.tsx`)
- **Functions**:
  - Enforced by `eslint-config-google`
  - Double quotes
  - Semicolons used

**Linting:**
- **Frontend**: `eslint` with `eslint-config-next`, `eslint-plugin-react`, `@typescript-eslint/eslint-plugin`.
  - Config: `frontend/eslint.config.js`
  - Rules: strict on Hooks (`react-hooks/rules-of-hooks`), warns on `no-console`, no unused vars (handled by TS).
- **Functions**: `eslint` with `eslint-config-google`.
  - Config: `functions/.eslintrc.js`
  - Rules: `prefer-arrow-callback`, `double` quotes.

## Import Organization

**Order:**
1.  External libraries (e.g., `react`, `firebase/auth`, `lucide-react`)
2.  Internal aliases (e.g., `@/components/...`, `@/lib/...`)
3.  Relative imports (e.g., `./Filter`)

**Path Aliases:**
- `@/*` maps to `src/*` in frontend (e.g., `@/components/ui/button`)
- No aliases observed in `functions` (relative paths used, e.g., `./firebase`)

## Error Handling

**Patterns:**
- **Services**: `try/catch` blocks around async operations.
  - Errors are often re-thrown or returned as `null` depending on context.
  - Example:
    ```typescript
    try {
        const userRef = doc(db, "users", uid);
        // ...
    } catch (error) {
        console.error("Error batch fetching user profiles:", error);
        throw error;
    }
    ```
- **Backend (Functions)**:
  - `try/catch` blocks.
  - Logging via `firebase-functions/logger` (e.g., `logger.error(...)`).
  - Validation checks return early (e.g., `if (!exchangeData) return;`).

## Logging

**Framework:**
- **Frontend**: `console.log` / `console.error` (warned by linter but allowed).
- **Functions**: `firebase-functions/logger`.

**Patterns:**
- Log errors in catch blocks.
- Log warnings for missing data/conditions (e.g., `logger.warn(...)`).

## Comments

**When to Comment:**
- **Frontend**: Sparse comments. Used for complex logic sections or separators (e.g., `/* Logo Section */`).
- **Functions**: JSDoc used for exported functions and modules.

**JSDoc/TSDoc:**
- Used in `functions` to describe Cloud Functions.
  ```typescript
  /**
   * Cloud Function: Send email notification on new offer (Exchange created)
   */
  export const onNewOffer = ...
  ```

## Function Design

**Size:**
- Components can be large if they contain UI logic (e.g., `Header.tsx` is ~120 lines).
- Service functions are focused on single responsibility (e.g., `getUserProfile`).

**Parameters:**
- Typed arguments.
- Context/Hook objects often destructured (e.g., `const { user, loading } = useAuth();`).

**Return Values:**
- **Services**: Promises with explicit return types (e.g., `Promise<UserData | null>`).
- **Components**: JSX Elements.

## Module Design

**Exports:**
- Named exports preferred for services/utils (e.g., `export const UserService = ...`).
- Default exports for React components (e.g., `export default Header;`).

**Barrel Files:**
- Used in `functions/src/index.ts` to export all functions.
- Not extensively used in `frontend/components` (imports are direct to file).

---

*Convention analysis: 2024-05-23*
