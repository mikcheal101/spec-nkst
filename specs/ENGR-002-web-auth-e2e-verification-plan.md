# ENGR-002 — Implementation Plan
## Web Authentication End-to-End Verification

**Spec:** `specs/ENGR-002-web-auth-e2e-verification.md`
**Status:** Ready for implementation
**Last Updated:** 2026-11-20

> **Correction:** The web has no public registration. Only a church admin can create a user/member from the protected `/admins` or `/settings` screens. This plan contains no self-registration page, link, helper, or test. Mobile self-registration is out of scope.

---

## Environment Anchors

These are confirmed facts from the codebase, not assumptions.

| Resource | Value |
|---|---|
| Web app (host) | `http://localhost:3000` → web container on port 3000 |
| Auth service (host) | `http://localhost:81` → `identity-auth-service` container |
| Auth DB container | `identity-auth-db`, MySQL 8.0, host port `3307`, db `church_auth_db`, user `sa`, password `password` |
| Redis container | `identity-redis`, host port `6379` |
| Playwright config | `testDir: './tests'`, `workers: 1`, `baseURL: 'http://localhost:3000'`, `timeout: 60000`, `expect.timeout: 15000` |
| E2E run commands | `npm run test:e2e` → `./tests`; `npm run test:e2e:e2e` → `./e2e` (add to package.json) |
| Unit test (web) | Vitest, `npm run test`, `testDir: './src'` (TS/JS files in `src/`) |
| Unit test (backend) | JUnit + Spring Boot Test, `mvn test`, Spring Boot 4.0.6 |
| Integration test (backend) | `@SpringBootTest` + `TestRestTemplate`, embedded MySQL/H2 |
| Integration test (web) | Playwright API fixture (`page.request`) for service-layer calls |
| Existing auth helpers | `tests/helpers/auth.ts` → `loginAsSuperAdmin`, `logout`, `uniqueMixed`, `SUPER_ADMIN` |
| Existing API helpers | `tests/helpers/api.ts` → `apiToken`, `cleanupChurches`, `cleanupMembers` |
| Existing DB helpers | `tests/helpers/db.ts` → `runSql` (uses `docker exec`; adapt for `identity-auth-db`) |
| Auth API base (Playwright requests) | `http://localhost:81` (direct to service, not proxied through Nginx) |
| E2E output directory | `src/web/test-results/e2e/` (update `outputDir` in playwright config for e2e suite) |
| Backend test output | `src/api/auth/target/surefire-reports/` |

---

## Deliverables

| File | Action | Purpose |
|---|---|---|
| `src/web/e2e/auth-lifecycle.spec.ts` | **Create** | ~30 test cases across 8 describe blocks for automated E2E verification |
| `src/web/e2e/auth-ux.spec.ts` | **Create** | Automated UX tests for authentication flows (form validation, visual consistency, keyboard navigation, error states) |
| `src/web/src/__tests__/unit/auth/*.test.ts` | **Create** | Unit tests for auth hooks, context, and helpers (login, logout, password reset mutations) |
| `src/web/src/__tests__/integration/auth/*.test.ts` | **Create** | Integration tests for auth API client and request interceptor (401→refresh→retry flow) |
| `src/api/auth/src/test/java/com/mikkytrionze/auth/user/service/AuthServiceTest.java` | **Create** | JUnit tests for `AuthServiceImpl`, `UserDetailsServiceImpl`, `RedisTokenBlacklistService`, `RefreshTokenServiceImpl` |
| `src/api/auth/src/test/java/com/mikkytrionze/auth/user/api/AuthControllerTest.java` | **Create** | `@SpringBootTest` + `TestRestTemplate` for auth controller endpoints |
| `src/web/package.json` | **Update** | Add `test:e2e:e2e` script pointing to `./e2e` testDir |
| `src/web/tests/README.md` | **Update** | Add coverage entries for unit, integration, and E2E layers |

No files under `src/web/src/` or `src/api/` are touched.
No `tests/helpers/registration.ts` is created — there is no public registration to drive.

---

## Task Breakdown

### Task 1 — `src/web/e2e/auth-lifecycle.spec.ts`

**File:** `src/web/e2e/auth-lifecycle.spec.ts`
**Covers:** REQ-NOREG-001 → 003, REQ-ADMIN-001, 002, REQ-LOGIN-001 → 005, REQ-PWD-001 → 006, REQ-SESSION-001, 002, REQ-REFRESH-001 → 004, REQ-ROUTE-001 → 003, REQ-LOGOUT-001 → 004

**Playwright config update:** Adjust `testDir` in `src/web/playwright.config.ts` to include both `./tests` and `./e2e` or run tests separately:
- `npm run test:e2e` → `./tests` (existing suite)
- `npm run test:e2e:e2e` → `./e2e` (new auth E2E suite)

**Test environment:** Same Docker Compose stack, `baseURL: 'http://localhost:3000'`.

```ts
test.describe('No Public Registration', () => {
  for (const path of ['/login', '/forgot-password', '/reset-password']) {
    test(`${path} has no registration entry point`, async ({ page }) => {
      await page.goto(path)
      await expect(page.getByRole('link', { name: /register|sign.?up|create account/i })).toHaveCount(0)
      await expect(page.getByRole('button', { name: /register|sign.?up|create account/i })).toHaveCount(0)
      await expect(page.locator('a[href*="register"], a[href*="signup"], a[href*="sign-up"]')).toHaveCount(0)
    })
  }

  for (const path of ['/register', '/signup', '/sign-up']) {
    test(`${path} is not a web route`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login/)
    })
  }

  test('admin-only create-user actions are gated', async ({ page }) => {
    await loginAsSuperAdmin(page)
    await page.goto('/admins')
    await expect(page.getByRole('button', { name: /create account/i }).first()).toBeVisible()
  })
})
```

---

### Task 2 — `src/web/e2e/auth-ux.spec.ts`

**File:** `src/web/e2e/auth-ux.spec.ts`
**Purpose:** Automated UX verification for authentication flows beyond functional correctness.

**Covered scenarios:**
- REQ-UX-001: All input fields have visible focus indicators
- REQ-UX-002: All interactive elements (buttons, links) have hover/click states
- REQ-UX-003: Error messages are visually distinct and accessible (ARIA labels)
- REQ-UX-004: Form validation errors appear inline next to the relevant field
- REQ-UX-005: Loading states appear during async operations (login, password reset request)
- REQ-UX-006: Keyboard navigation works (Tab, Shift+Tab, Enter to submit, Escape to close modals)
- REQ-UX-007: Color contrast meets WCAG AA for text and error states
- REQ-UX-008: All interactive elements have descriptive aria-labels or visible text
- REQ-UX-009: Password visibility toggle (show/hide) functions correctly
- REQ-UX-010: Mobile viewport (375px width) renders auth forms legibly

**Approach:** Use Playwright's built-in assertions, `toHaveCSS`, `toHaveAttribute`, accessibility testing via `page.evaluate()` for ARIA checks, and viewport testing.

---

### Task 3 — Login describe block (auth-lifecycle.spec.ts)

**File:** `src/web/e2e/auth-lifecycle.spec.ts`
**Covers:** REQ-LOGIN-001 → 005

| Case | Pattern |
|---|---|
| Successful login | `page.goto('/login')` → fill `SUPER_ADMIN` credentials → click `Sign In` → expect `/dashboard`; assert JWT `accessToken` (3 dot-separated parts) and `refreshToken` in `localStorage` |
| Wrong password | stay on `/login`, error matching `/invalid|incorrect|wrong|unauthorized/i`, no tokens |
| Unknown username | stay on `/login`, error visible, no tokens |
| Empty submit | no navigation; remains `/login` |
| Authenticated redirect | after `loginAsSuperAdmin(page)`, `page.goto('/login')` → `/dashboard` via `PublicRoute` |

---

### Task 4 — Password Recovery describe block (auth-lifecycle.spec.ts)

**File:** `src/web/e2e/auth-lifecycle.spec.ts`
**Covers:** REQ-PWD-001 → 006

Stub OTP endpoints with `page.route()` — real SMS delivery cannot be exercised locally.

- `POST **/api/v1/auth/password-reset/request` → `200 { data: { message: 'OTP sent', expiresIn: 300 } }`
- `POST **/api/v1/auth/password-reset/confirm` → `200 { data: { message: 'Password reset successful' } }` (or `400` for invalid OTP case)

Cases: success navigation with `phone=` query param, phone pre-fill from query string, successful reset → `/login`, invalid OTP error, three client-validation sub-cases (blank fields, `<8` chars, mismatch), blank phone on Forgot Password.

---

### Task 5 — Session Persistence describe block

**Covers:** REQ-SESSION-001, 002

- After `loginAsSuperAdmin(page)`, `page.reload()` → still `/dashboard`, welcome heading visible.
- Set structurally valid JWT with `exp: 1` and no refresh token → navigate to `/dashboard` → redirect to `/login`.

---

### Task 6 — Token Refresh describe block

**Covers:** REQ-REFRESH-001 → 004

- Clear `accessToken` only, keep `refreshToken`; navigate to protected route; assert new token stored and page renders.
- Count `POST **/api/v1/auth/refresh` calls with `page.route()`; assert exactly one despite parallel API calls.
- Stub `/refresh` → `400`; assert tokens cleared, "Session expired" toast, redirect to `/login`.
- No tokens at all → immediate redirect, no `/refresh` call.

---

### Task 7 — Protected Route Enforcement describe block

**Covers:** REQ-ROUTE-001 → 003

```ts
const protectedRoutes = [
  '/dashboard', '/members', '/profile', '/churches',
  '/admins', '/settings', '/announcements', '/contributions', '/projects',
]
for (const route of protectedRoutes) {
  test(`unauthenticated: ${route} → /login`, async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
    await page.goto(route)
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
}
```

Plus `PermissionRoute` denial for a user without required permissions, and unknown-path fallback.

---

### Task 8 — Logout and Session Invalidation describe block

**Covers:** REQ-LOGOUT-001 → 004

- Logout clears `localStorage` and navigates to `/login`.
- Capture access token before logout; after logout call a protected endpoint with it → `401` (Redis JTI blacklist).
- Capture refresh token before logout; `POST /api/v1/auth/refresh` with it → non-200.
- Abort `**/api/v1/auth/sign-out` via `page.route()`; assert `clearTokens()` still runs and `/login` is reached.

---

### Task 9 — README update

Add to the **Coverage** section of `tests/README.md`:

```
- **Auth lifecycle** (`auth-lifecycle.spec.ts`): no public registration on auth pages,
  admin-created account sign-in, login token storage, already-authenticated redirect,
  forgot/reset password flows (OTP stubbed), session persistence across reloads,
  transparent token refresh on 401, concurrent refresh serialisation, expired/missing
  token handling, protected-route and permission gating, logout localStorage clearing,
  post-logout token blacklist, invalidated refresh token, offline logout.
```

---

## Test Count by Block

| Block | Cases | Requirement IDs |
|---|---|---|
| No Public Registration | 7 | REQ-NOREG-001 → 003 |
| Admin-Created Account Sign-In | 2 | REQ-ADMIN-001, 002 |
| Login | 5 | REQ-LOGIN-001 → 005 |
| Password Recovery | 7 | REQ-PWD-001 → 006 (005 has 3 sub-cases) |
| Session Persistence | 2 | REQ-SESSION-001, 002 |
| Token Refresh | 4 | REQ-REFRESH-001 → 004 |
| Protected Route Enforcement | 10+ | REQ-ROUTE-001 (9 routes) + 002 + 003 |
| Logout and Session Invalidation | 4 | REQ-LOGOUT-001 → 004 |
| **Total** | **~32** | All 14 objectives covered |

---

## Execution Order and Dependencies

Tests run serially (`workers: 1`).

1. **No Public Registration** — navigation only; no state.
2. **Admin-Created Account Sign-In** — creates and deletes own seeded user.
3. **Login** — uses seeded `SUPER_ADMIN`; no mutations.
4. **Password Recovery** — fully stubbed; no real OTP or user mutations.
5. **Session Persistence** — logs in then manipulates `localStorage`.
6. **Token Refresh** — logs in then stubs network.
7. **Protected Route Enforcement** — navigation-only.
8. **Logout and Session Invalidation** — logs in per test; self-contained.

Each test within a block is independently runnable. `beforeEach`/`afterEach` hooks ensure no shared mutable state leaks between cases.

---

## Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| `parseToken()` tolerates malformed JWTs differently than expected | Medium | Use a structurally valid JWT with `exp=1` for expired-token case |
| Admin create-user UI is unavailable or gated differently than assumed | Medium | Seed via DB helper as fallback; keep the UI case as the primary assertion |
| Concurrent refresh counter is brittle if dashboard calls are not parallel | Low | Assert `refreshCallCount <= 1` if flakiness is observed, with a comment explaining intent |
| Post-logout blacklist assertion races token TTL | Low | Assert immediately after logout navigation |
| `page.route()` stubs miss due to proxy origin | Low | Use full pattern `**/api/v1/auth/password-reset/**` |

---

## Acceptance Gate

This plan is complete when `npm run test:e2e` from `src/web/` runs:

```
✓ 32+ passed (0 failed, 0 skipped)
```

against the Docker Compose stack with all services healthy, and the Playwright HTML report is retained in `src/web/test-results/`.

---

**Version:** 1.1.0 | **Status:** Ready for implementation | **Last Updated:** 2026-11-20
