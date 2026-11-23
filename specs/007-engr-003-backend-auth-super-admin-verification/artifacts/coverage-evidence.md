# ENGR-003 Coverage Evidence

## Scope
- Spec: `specs/007-engr-003-backend-auth-super-admin-verification/spec.md`
- Tasks: `T062-T064, T065-T069, T071, T073-T077`
- Last updated: 2026-11-23 (doc/config alignment only for T073-T077; no new test/CI/browser execution evidence)

## Frontend (Vitest + RTL) - full suite

Command:
```bash
cd src/web && npm run -s test -- --coverage
```

Exact result (latest full run):
- **Test Files: 50 passed (50)**
- **Tests: 1028 passed (1028)**
- **Failures: 0**

Coverage summary (v8, global thresholds 95%):
- Statements: **88.29%** (2369/2683) — **FAIL**
- Branches: **84.60%** (1935/2287) — **FAIL**
- Functions: **86.50%** (923/1067) — **FAIL**
- Lines: **90.49%** (2152/2378) — **FAIL**

## High-impact file focus (targeted)

### `src/services/api.ts` (improved)
Added targeted tests:
- `src/web/src/services/api.request.test.ts`
- `src/web/src/services/api.wrappers.test.ts`
- `src/web/src/services/api.more.test.ts`
- `src/web/src/services/api.branch.test.ts`
- updated `src/web/src/services/api.test.ts`

Targeted coverage command:
```bash
cd src/web && npx vitest run src/services/api.request.test.ts src/services/api.wrappers.test.ts src/services/api.more.test.ts src/services/api.branch.test.ts src/services/api.test.ts --coverage --coverage.include='src/services/api.ts'
```

Exact targeted result:
- **Test Files: 5 passed (5)**
- **Tests: 26 passed (26)**
- `src/services/api.ts`: **Statements 97.11% (269/277), Branches 73.33% (187/255), Functions 100% (104/104), Lines 99.57% (237/238)**

**Exception/limitation (recorded, not approved by reviewer in this run):** Branch coverage remains below 95% in `api.ts` due exhaustive error/refresh/retry/queue permutations in the shared request transport. Statements/lines/functions were raised above 95%; remaining branch gaps are concentrated in refresh-queue and retry edge permutations. Reaching 95% branches requires additional transport-state matrix tests or refactoring request flow into smaller testable units.

### `src/pages/Settings.tsx`
- Existing `Settings.test.tsx` updated for ENGR-003 governance/audit visibility; full-suite file coverage remains below 95% (Statements 73.7%, Branches 71.56%, Functions 70.7%, Lines 77.81%).
- **Exception/limitation:** Not raised to >=95% in this run due size/complexity and time; requires additional scenario tests around config CRUD, role mutation error branches, direct-permission step-up/policy outcomes, and audit paging/filter states.

## Added/Updated ENGR-003 Frontend Tests

Vitest/RTL:
- `src/web/src/pages/auth/AuthLifecycle.test.tsx` (T062)
- `src/web/src/shared/utils/permissions.test.ts` (T063)
- `src/web/src/context/AuthContext.test.tsx` (T063 update)
- `src/web/src/shared/components/PermissionRoute.test.tsx` (T063 update)
- `src/web/src/services/api.test.ts` (T062/T063 update)
- `src/web/src/shared/api/apiClient.test.ts` (T063 update)
- `src/web/src/pages/Settings.test.tsx` (T064 update)
- `src/web/src/pages/Settings.governance-access.test.tsx` (T047 authorized-only governance/audit/config denial/visibility evidence)
- `src/web/src/pages/Members.scope.test.tsx` (T046 scope/permission denial UX evidence)
- `src/web/src/services/api.request.test.ts`, `api.wrappers.test.ts`, `api.more.test.ts`, `api.branch.test.ts` (T071 coverage push)

Recent targeted verification (2026-11-23):
- `cd src/web && npx vitest run src/pages/Settings.governance-access.test.tsx src/pages/Members.scope.test.tsx` → **2 files/3 tests PASS**.
- `cd src/web && npx vitest run src/pages/Settings.governance-access.test.tsx src/pages/Settings.test.tsx` → **2 files/14 tests PASS**.
- `cd src/web && npx vitest run src/pages/Members.scope.test.tsx src/pages/Members.test.tsx src/pages/Announcements.test.tsx src/pages/Churches.test.tsx src/pages/Profile.test.tsx` → **5 files/52 tests PASS**.

Code fixes supporting tests:
- `src/web/src/shared/utils/permissions.ts` - normalize required permissions for legacy/canonical matching.
- `src/web/src/shared/components/PermissionRoute.tsx` - use shared permission matcher.
- `src/web/src/services/api.ts` - retry-after-refresh responses now unwrap `{data}` envelope consistently (bug fix discovered by tests).

## Playwright (T065-T069)

Specs/config present:
- `src/web/e2e/super-admin-governance.spec.ts`
- `src/web/e2e/members-announcements-users-governance.spec.ts`
- `src/web/e2e/permission-propagation.spec.ts`
- `src/web/e2e/super-admin-safeguards.spec.ts`
- `src/web/e2e/accessibility-responsive.spec.ts`
- `src/web/playwright.config.ts` (chromium/firefox/webkit/edge projects configured; e2e+tests match)

Execution (2026-11-22, localhost:3000 up, Docker stack healthy):
- Command: `cd src/web && npx playwright test e2e/super-admin-governance.spec.ts e2e/members-announcements-users-governance.spec.ts e2e/permission-propagation.spec.ts e2e/super-admin-safeguards.spec.ts e2e/accessibility-responsive.spec.ts --project=chromium`
- **Chromium: 14 passed, 0 failed, 0 skipped (15.7s)**
  - T065 `super-admin-governance.spec.ts`: 3/3 passed
  - T066 `members-announcements-users-governance.spec.ts`: 3/3 passed
  - T067 `permission-propagation.spec.ts`: 2/2 passed
  - T068 `super-admin-safeguards.spec.ts`: 2/2 passed
  - T069 `accessibility-responsive.spec.ts`: 4/4 passed (desktop 1920, tablet 768, mobile 375, keyboard focus smoke)
- Artifacts: Playwright log `/tmp/engr003-pw-chromium-r2.log`; default Playwright output dirs `src/web/test-results/` and `src/web/playwright-report/` (trace/video/screenshot on failure per config; this run had no failures).

Execution/status update (2026-11-23, config alignment only; **no browser runs executed**):
- `src/web/playwright.config.ts` now includes Edge project mapping: `{ name: 'edge', use: { ...devices['Desktop Edge'], channel: 'msedge', baseURL: 'http://localhost:3000', headless: true } }`.
- **Firefox/WebKit/Edge still not executed**. Prior blocker: `npx playwright install chromium firefox webkit` failed with DNS `ENOTFOUND` for `cdn.playwright.dev` / `playwright.download.prss.microsoft.com`; no cached Firefox/WebKit/Edge runtime verified in this session. Cross-browser matrix remains incomplete; T065-T069/T077 remain `[ ]`.

## Backend coverage (T071 - incomplete)

- **Auth full suite**: `cd src/api/auth && ./mvnw -q test` — **199 tests, 0 failures, 0 errors, 0 skipped, PASS** (2026-11-22 prior verified run).
- **API-service full suite**: `cd src/api/api-service && ./mvnw -q test` — **285 tests, 0 failures, 0 errors, 0 skipped, PASS** (2026-11-22 prior verified run).
- **Announcement full suite**: `cd src/api/announcement && ./mvnw -q test` — **6 tests, 0 failures, 0 errors, 0 skipped, PASS**.
- **T041 perf/query-budget evidence (2026-11-23)**:
  - `cd src/api/auth && ./mvnw -q -Dtest=performance.AuthPerformanceBudgetTest test` → **2/0/0/0 PASS**. Hibernate stats query budgets + p95 assertions. Metrics include `auth.signIn p50=111ms p95=118.5ms max=128ms avgQueries=8 maxQueries=8`; governed mutation targeted run: **1/0/0/0 PASS**, `auth.governedMutation p50=20ms p95=22.6ms max=24ms avgQueries=5 maxQueries=5`.
  - `cd src/api/api-service && ./mvnw -q -Dtest=performance.ApiServicePerformanceBudgetTest test` → **2/0/0/0 PASS**. Metrics include `api.governedMutation p50=17ms p95=21ms max=21ms avgQueries=5 maxQueries=5` and governed read within configured budgets.
- **JaCoCo instruction coverage (existing reports, 2026-11-22 inspection)**:
  - `src/api/auth/target/site/jacoco/jacoco.xml` — **83.53% instructions (5205/6231)**. HTML: `src/api/auth/target/site/jacoco/index.html`.
  - `src/api/api-service/target/site/jacoco/jacoco.xml` — **88.50% instructions (4409/4982)**. HTML: `src/api/api-service/target/site/jacoco/index.html`.
  - `src/api/announcement/target/site/jacoco/jacoco.xml` — **MISSING**.
- **Gap**: Existing JaCoCo artifacts below 95% and announcement report missing; no approved exceptions. T071 remains `[ ]`.

## Status / Exceptions (T071 - keep unchecked)

T071 is **NOT fully verified** and remains **[ ]** in `tasks.md`.

**Status convention:** `[X]` = verified with execution evidence and no known blocking gate for task scope. `[ ]` = incomplete or `PARTIAL` with blockers; partial results must be explicitly labeled.

**Verified evidence:**
- T062-T064 Vitest/RTL: **[X]** in `tasks.md` (targeted ENGR-003 + full Vitest suite 50 files/1028 tests PASS).
- Frontend full suite PASS: 50 files / 1028 tests / 0 failures.
- Playwright T065-T069: **PARTIAL (Chromium-only)** — Chromium 14/14 PASS on localhost:3000 (Docker stack healthy). Artifacts: `/tmp/engr003-pw-chromium-r2.log`, `src/web/test-results/`, `src/web/playwright-report/`. **Tasks remain [ ]** due blocked Firefox/WebKit/Edge matrix.
- Backend full suites PASS: auth 199/0/0/0, api-service 285/0/0/0, announcement 6/0/0/0.

### Structured Exception Register (pending reviewer approval)

| Exception ID | Applies To | Owner | Approver | Scope | Compensating Controls | Expiry | Approval Status |
|---|---|---|---|---|---|---|---|
| EX-T071-COV-GLOBAL | T071 frontend global coverage <95% | ENGR-003 Frontend Lead (TBD assignee) | Release Reviewer / Tech Lead (TBD) | `src/web` global coverage: 88.29% stmts, 84.60% branches, 86.50% funcs, 90.49% lines; threshold 95% | Full Vitest suite green (50 files/1028 tests); targeted ENGR-003 RTL suites pass; critical auth/governance flows covered by T062-T064/T065-T069 Chromium evidence; coverage gap tracked as release blocker until closed | 2026-12-06 (or before ENGR-003 release sign-off, whichever is earlier) | **PENDING - not approved** |
| EX-T071-COV-API | T071 `src/services/api.ts` branch coverage <95% | ENGR-003 Frontend Lead (TBD assignee) | Release Reviewer / Tech Lead (TBD) | `src/web/src/services/api.ts`: 97.11/73.33/100/99.57; uncovered branches limited to defensive/network edge branches | 5 targeted api test files/26 tests pass; statements/funcs/lines >=95%; runtime contract/error handling covered by T062/T063 and backend contract tests | 2026-12-06 (or before ENGR-003 release sign-off, whichever is earlier) | **PENDING - not approved** |
| EX-T071-COV-SETTINGS | T071 `src/pages/Settings.tsx` coverage <95% | ENGR-003 Frontend Lead (TBD assignee) | Release Reviewer / Tech Lead (TBD) | `src/web/src/pages/Settings.tsx`: 73.7/71.56/70.7/77.81 | `Settings.test.tsx` passes in full suite; governance UI exercised in Chromium E2E T065-T068; high-risk safeguards (step-up, direct-permission policy denial, audit/config visibility) have targeted tests | 2026-12-06 (or before ENGR-003 release sign-off, whichever is earlier) | **PENDING - not approved** |
| EX-T065-069-BROWSER-MATRIX | T065-T069/T074/T077 Chromium-only Playwright execution | ENGR-003 QA Lead (TBD assignee) | Release Reviewer / QA Lead (TBD) | T065-T069: Chromium 14/14 PASS on `localhost:3000` (2026-11-22). Edge project mapping added in `src/web/playwright.config.ts` on 2026-11-23; **Firefox/WebKit/Edge not executed** (DNS ENOTFOUND / no verified runtime). | Docker stack healthy at prior run; Chromium E2E covers sign-in/governance/users/members/announcements/permission propagation/safeguards/accessibility-responsive smoke (375/768/1920) with retained log/artifacts; tasks remain `[ ]` until full matrix or approved exception | 2026-12-06 (or before ENGR-003 release sign-off, whichever is earlier) | **PENDING - not approved** |
| EX-T073-SEED-BASELINE-APPROVAL | T073 live DB seed-baseline snapshot/checksum reviewer sign-off | ENGR-003 Backend/Data Lead (TBD assignee) | Release Reviewer / Data Owner (TBD) | Live DB snapshot/checksum reviewer sign-off not captured in workspace; `artifacts/seed-baseline-capture.md` remains a runbook/evidence template pending external access. | Automated `SeederIntegrationTest` idempotent reconciliation evidence exists (T050); manifest/checksum artifacts present in repo; no destructive reconciliation. | 2026-12-06 (or before ENGR-003 release sign-off, whichever is earlier) | **PENDING - not approved** |

**Gaps / blockers (block [X] for T071/T073-T077):**
- **T073 blocked**: live DB seed-baseline snapshot/checksum reviewer sign-off or approved exception missing (EX-T073-SEED-BASELINE-APPROVAL, pending).
- **T074 partial**: Edge project mapping added to `src/web/playwright.config.ts`; execution evidence not captured.
- **T075 blocked**: no frontend lint script/gate evidence; npm audit 13 vulns (7H/4M/2L/0C, fixAvailable=true) unremediated; Semgrep/backend SCA/secret scan CI artifacts unavailable.
- **T076 blocked**: frontend global coverage below 95% (EX-T071-COV-GLOBAL), `src/services/api.ts` branches 73.33% (EX-T071-COV-API), `Settings.tsx` below 95% (EX-T071-COV-SETTINGS); JaCoCo auth 83.53%, api-service 88.50%, announcement missing; no approved exceptions.
- **T077 blocked**: Playwright cross-browser matrix incomplete (EX-T065-069-BROWSER-MATRIX). Chromium-only prior evidence; Firefox/WebKit/Edge not executed.

**Required for closure:** obtain reviewer-approved T073 sign-off or approved exception; run full Playwright matrix (Chromium/Firefox/WebKit/Edge) with retained artifacts; add lint+SAST+SCA+secret-scan CI gates and remediate/re-scan npm audit; raise in-scope coverage to >=95% per required layer or obtain approved time-bound exceptions; generate/attach JaCoCo for auth/api-service/announcement. Keep T065-T069/T070/T071/T073-T077 `[ ]` until evidence/approvals are complete.
