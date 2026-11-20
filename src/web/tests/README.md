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
- **Auth** (`auth.spec.ts`): happy-path login/logout, wrong password, unknown user, empty submit, protected-route redirect, forgot-password page, no registration entry point on public auth pages, no legacy Tiv slogan on auth pages. Web has no self-service registration — accounts are created only by church admins from the protected `/admins` / `/settings` screens.
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
