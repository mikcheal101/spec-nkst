# ENGR-002 — Tasks

**Spec:** `ENGR-002-web-auth-e2e-verification.md`
**Plan:** `ENGR-002-web-auth-e2e-verification-plan.md`
**Constitution:** Principle VII requires automated UX & QA tests in Playwright for ALL web user-facing features
**Status:** Ready for implementation
**Last Updated:** 2026-11-20

---

## Task 1 — Create `src/web/e2e/auth-lifecycle.spec.ts`

**Owner:** Developer
**Estimate:** 1d
**Dependencies:** None
**Status:** to_do

Create Playwright E2E tests in `src/web/e2e/` covering the complete authentication lifecycle. Follow existing `e2e/login-debug.spec.ts` patterns.

### Subtasks

| ID | Task | Files |
|---|---|---|
| 1.1 | Import Playwright test, loginAsSuperAdmin, uniqueMixed, SUPER_ADMIN | `src/web/e2e/auth-lifecycle.spec.ts` |
| 1.2 | Write `test.describe('No Public Registration')` — REQ-NOREG-001 → 003 | `src/web/e2e/auth-lifecycle.spec.ts` |
| 1.3 | Write `test.describe('Admin-Created Account Sign-In')` — REQ-ADMIN-001, 002 | `src/web/e2e/auth-lifecycle.spec.ts` |
| 1.4 | Write `test.describe('Login')` — REQ-LOGIN-001 → 005 | `src/web/e2e/auth-lifecycle.spec.ts` |
| 1.5 | Write `test.describe('Password Recovery')` — REQ-PWD-001 → 006 | `src/web/e2e/auth-lifecycle.spec.ts` |
| 1.6 | Write `test.describe('Session Persistence')` — REQ-SESSION-001, 002 | `src/web/e2e/auth-lifecycle.spec.ts` |
| 1.7 | Write `test.describe('Token Refresh')` — REQ-REFRESH-001 → 004 | `src/web/e2e/auth-lifecycle.spec.ts` |
| 1.8 | Write `test.describe('Protected Route Enforcement')` — REQ-ROUTE-001 → 003 | `src/web/e2e/auth-lifecycle.spec.ts` |
| 1.9 | Write `test.describe('Logout and Session Invalidation')` — REQ-LOGOUT-001 → 004 | `src/web/e2e/auth-lifecycle.spec.ts` |
| 1.10 | Run `npm run test:e2e:e2e` and verify all 32+ cases pass | — |

---

## Task 2 — Create `src/web/e2e/auth-ux.spec.ts`

**Owner:** Developer
**Estimate:** 0.5d
**Dependencies:** Task 1 (tests may run independently)
**Status:** to_do

Create Playwright UX/QA tests in `src/web/e2e/` for all authentication UI workflows.

### Subtasks

| ID | Task | Files |
|---|---|---|
| 2.1 | Write `test.describe('UX: Form Focus & Keyboard Nav')` — REQ-UX-001, 002, 006 | `src/web/e2e/auth-ux.spec.ts` |
| 2.2 | Write `test.describe('UX: Error States & Loading')` — REQ-UX-003, 004, 005 | `src/web/e2e/auth-ux.spec.ts` |
| 2.3 | Write `test.describe('UX: Responsive Layouts')` — REQ-UX-007, 010 | `src/web/e2e/auth-ux.spec.ts` |
| 2.4 | Write `test.describe('UX: Accessibility')` — REQ-UX-008, 009 | `src/web/e2e/auth-ux.spec.ts` |
| 2.5 | Run `npm run test:e2e:e2e` and verify all UX cases pass | — |

**Coverage requirements (Constitution Principle VII):**
- All input fields have visible focus indicators
- All buttons/links have hover/click states
- Error messages are visually distinct and accessible
- Form validation errors appear inline next to fields
- Loading states appear during async operations
- Keyboard navigation works (Tab, Shift+Tab, Enter, Escape)
- Color contrast meets WCAG AA (≥ 4.5:1 for normal text)
- All interactive elements have descriptive aria-labels
- Password visibility toggle functions correctly
- Mobile viewport (375px) renders auth forms legibly

---

## Task 3 — Create unit tests (Vitest)

**Owner:** Developer
**Estimate:** 0.5d
**Dependencies:** None
**Status:** to_do

Create unit tests for auth hooks, context, and helpers using Vitest.

### Subtasks

| ID | Task | Files |
|---|---|---|
| 3.1 | Write `src/web/src/__tests__/unit/auth/AuthContext.test.tsx` | `src/web/src/__tests__/unit/auth/AuthContext.test.tsx` |
| 3.2 | Write `src/web/src/__tests__/unit/auth/useAuth.test.ts` | `src/web/src/__tests__/unit/auth/useAuth.test.ts` |
| 3.3 | Write `src/web/src/__tests__/unit/auth/apiClient.test.ts` | `src/web/src/__tests__/unit/auth/apiClient.test.ts` |

---

## Task 4 — Create integration tests (Playwright API fixture)

**Owner:** Developer
**Estimate:** 0.3d
**Dependencies:** Task 1
**Status:** to_do

Create integration tests for auth API client using Playwright's `page.request` fixture.

### Subtasks

| ID | Task | Files |
|---|---|---|
| 4.1 | Write `src/web/e2e/auth-api-integration.spec.ts` — 401→refresh→retry flow, blacklist, token refresh | `src/web/e2e/auth-api-integration.spec.ts` |

---

## Task 5 — Update `src/web/package.json`

**Owner:** Developer
**Estimate:** 0.1d
**Dependencies:** Tasks 1-4
**Status:** to_do

- [ ] Add `test:e2e:e2e` script: `"test:e2e:e2e": "playwright test e2e"`
- [ ] Optionally create `test:e2e:unit` script for Vitest tests
- [ ] Add `test:all` script: `"test:all": "npm run test && npm run test:e2e:e2e"`

---

## Task 6 — Update `src/web/tests/README.md`

**Owner:** Developer
**Estimate:** 0.1d
**Dependencies:** Task 1-5
**Status:** to_do

Add to the **Coverage** section:

```
- **Auth lifecycle** (`e2e/auth-lifecycle.spec.ts`): no public registration on auth pages,
  admin-created account sign-in, login token storage, already-authenticated redirect,
  forgot/reset password flows (OTP stubbed), session persistence across reloads,
  transparent token refresh on 401, concurrent refresh serialisation, expired/missing
  token handling, protected-route and permission gating, logout localStorage clearing,
  post-logout token blacklist, invalidated refresh token, offline logout.

- **Auth UX/QA** (`e2e/auth-ux.spec.ts`): form focus indicators, hover/click states,
  accessible error messages, inline validation errors, loading states, keyboard
  navigation, WCAG AA color contrast, ARIA labels, password visibility toggle,
  mobile viewport rendering (375px). Covers Principle VII requirement for automated
  UX & QA tests on all web user-facing features.

- **Auth unit tests** (`src/__tests__/unit/auth/*.test.ts`): AuthContext, useAuth hook,
  API client request/response normalization.

- **Auth API integration** (`e2e/auth-api-integration.spec.ts`): 401→refresh→retry,
  blacklist enforcement, concurrent refresh serialization.
```

---

## Task 7 — CI Integration Verification

**Owner:** Developer
**Estimate:** 0.2d
**Dependencies:** Tasks 1-6
**Status:** to_do

- [ ] Confirm `npm run test:e2e:e2e` picks up `e2e/*.spec.ts` automatically
- [ ] Verify Playwright HTML report is generated at `src/web/test-results/e2e/`
- [ ] Confirm existing `tests/auth.spec.ts` suite still passes
- [ ] Confirm `npm run test` (Vitest) picks up `src/__tests__/unit/` files

---

## Acceptance Criteria

- [ ] All 32+ E2E lifecycle cases pass with 0 failures and 0 skipped
- [ ] All 10+ UX/QA cases pass with 0 failures and 0 skipped
- [ ] All 14 objectives from Section 3 of spec.md are traceable to at least one passing test case
- [ ] Constitution Principle VII compliance verified: all web auth workflows have automated UX/QA tests
- [ ] No test asserts existence of web registration page, link, or self-serve flow
- [ ] `e2e/auth-lifecycle.spec.ts` and `e2e/auth-ux.spec.ts` exist and run successfully
- [ ] `src/web/tests/README.md` reflects the new coverage area
- [ ] No changes to `src/web/src/` source files (unit tests only in `src/__tests__/`)
- [ ] No changes to `src/api/` source files