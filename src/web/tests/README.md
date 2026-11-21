# ChurchMS E2E Tests (Playwright)

Automated end-to-end tests for the Church Management System, stored in this folder so they can be run anytime.

## Prerequisites
- App running at `http://localhost:3000` (frontend) with backend/API available.
- Dependencies installed in `src/web`: `npm install`
- Playwright browsers installed once: `npx playwright install chromium`

## Run tests
From `src/web`:

```bash
npm run test:e2e          # headless (CI-friendly)
npm run test:e2e:headed   # headed browser
npm run test:e2e:ui       # Playwright UI mode
```

## Coverage (as super admin)
- **Auth** (`tests/auth.spec.ts`): happy-path login/logout, wrong password, unknown user, empty submit, protected-route redirect, forgot-password page.
- **Auth lifecycle** (`e2e/auth-lifecycle.spec.ts`): no public registration on auth pages, admin-created account sign-in, login token storage, already-authenticated redirect, forgot/reset password flows (OTP stubbed), session persistence across reloads, transparent token refresh on 401, concurrent refresh serialisation, expired/missing token handling, protected-route and permission gating, logout localStorage clearing, post-logout token blacklist, invalidated refresh token, offline logout.
- **Auth UX/QA** (`e2e/auth-ux.spec.ts`): form focus indicators, hover/click states, accessible error messages, inline validation errors, loading states, keyboard navigation (Tab, Shift+Tab, Enter, Escape), WCAG AA color contrast (≥ 4.5:1), ARIA labels, password visibility toggle, mobile viewport rendering (375px). Covers Constitution Principle VII requirement for automated UX & QA tests on all web user-facing features.
- **Dashboard & navigation** (`dashboard.spec.ts`): welcome/sections, sidebar navigation to all modules, profile link.
- **Churches** (`churches.spec.ts`): list/search, create-church flow, required-field validation, view/edit actions.
- **Members** (`members.spec.ts`): list/filters, add member form, create **non-baptised** member, create **baptised** member with baptism details, required-field validation.
- **Announcements** (`announcements.spec.ts`): page render, new announcement flow.
- **Settings/Roles** (`settings.spec.ts`): roles & permissions listing and actions.

## Credentials
Super admin (seeded): username `super-admin`, password `super-admin` (see `helpers/auth.ts`).

## Notes
- Tests are designed to be resilient to minor UI text changes but assert key flows and validations.
- Some create/edit modals may surface product bugs if UI actions do not open forms; failures should be investigated as QA findings.
