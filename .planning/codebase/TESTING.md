# Testing Patterns

**Analysis Date:** 2024-05-23

## Test Framework

**Runner:**
- **Frontend**: Playwright (`@playwright/test`)
  - Config: `frontend/playwright.config.ts`
- **Backend (Functions)**:
  - `firebase-functions-test` listed in `functions/package.json`, but no active test files found.

**Assertion Library:**
- **Frontend**: Playwright's `expect` (Jest-like).

**Run Commands:**
```bash
# Frontend
npm run test:e2e       # Run Playwright tests
npx playwright test    # Direct Playwright command

# Functions (if configured)
npm run lint           # Lints code (often part of CI checks)
```

## Test File Organization

**Location:**
- **Frontend**: `tests/` directory at the root of `frontend/`.
- **Backend**: Not detected (standard location would be `functions/test/` or alongside source).

**Naming:**
- `*.spec.ts` for Playwright tests (e.g., `frontend/tests/login.spec.ts`).

**Structure:**
```
frontend/
└── tests/
    └── login.spec.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { test, expect } from '@playwright/test';

test('should allow a user to log in', async ({ page }) => {
  // Test steps
});
```

**Patterns:**
- **Setup**: `test` block handles setup implicitly via fixtures (e.g., `{ page }`).
- **Teardown**: Handled by Playwright (browser context cleanup).
- **Assertion**: `await expect(locator).toHaveText(...)`.

## Mocking

**Framework:** Not extensively used in E2E tests (interaction is with live/deployed app or local dev server).

**Patterns:**
- Environment variables used for credentials instead of mocking auth flow entirely.
  ```typescript
  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
  ```

**What to Mock:**
- External services (e.g., Stripe, Email) should likely be mocked in integration tests, but current E2E tests seem to use real inputs.

**What NOT to Mock:**
- Core user flows (Login, Navigation) in E2E tests.

## Fixtures and Factories

**Test Data:**
- Environment variables: `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`.
- Hardcoded values in tests (e.g., `nouser@example.com`).

**Location:**
- `.env` files (not committed).

## Coverage

**Requirements:** None enforced.

**View Coverage:**
- Not configured.

## Test Types

**Unit Tests:**
- Not detected in `frontend` (no `jest` or `vitest` config found active).
- Not detected in `functions` (files absent).

**Integration Tests:**
- Implicitly covered by E2E tests.

**E2E Tests:**
- **Framework**: Playwright.
- **Scope**: Critical user flows (e.g., Login).
- **Approach**: Black-box testing via browser automation.

## Common Patterns

**Async Testing:**
```typescript
test('async test', async ({ page }) => {
  await page.goto('/url');
  await expect(page).toHaveURL('/url');
});
```

**Error Testing:**
```typescript
test('should show error', async ({ page }) => {
  // Trigger error condition
  await page.getByRole('button').click();
  // Assert error message
  const errorMessage = page.locator('.error-class');
  await expect(errorMessage).toBeVisible();
});
```

---

*Testing analysis: 2024-05-23*
