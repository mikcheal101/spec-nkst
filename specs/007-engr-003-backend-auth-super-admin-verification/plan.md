# Implementation Plan: Backend Auth Verification & Super Admin Governance

**Branch**: `007-engr-003-backend-auth-super-admin-verification` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/007-engr-003-backend-auth-super-admin-verification/spec.md`

## Summary

Implement and verify ENGR-003 as a full-stack security/governance hardening slice: standardize auth and governance error contracts (`400/401/403/429`), complete auth lifecycle verification (credential validation, token/session lifetimes, refresh rotation, logout/revocation, immediate cutoff), and enforce dynamic DB-driven 5-action RBAC across Super Admin modules. The design uses a canonical idempotent seeder manifest (Option C hybrid: one-time live DB snapshot, then reviewed seed/migration updates), runtime `RESOURCE:ACTION` permission evaluation with legacy alias compatibility, permission-epoch/token-version session cutoff, Root Super Admin immutability with step-up confirmation for secondary Super Admin incident response, explicit sub-church scope authorization, audit logging, and latency/N+1 verification. Delivery is gated by constitution-mandated 95% in-scope coverage across required test layers and Playwright UX/QA, and aligned to the 60 release-gate requirements-quality checks.

## Domain & Contract Mapping (A1/A2)

| Requirement | Domain Entity | Backend Surface | Frontend Surface | Notes |
|---|---|---|---|---|
| FR-021/FR-026 | `Church`/tenant (`churches`, `user_church_scopes`) | `src/api/api-service/.../church/api/*Controller` + service/repo; `/api/v1/churches*` | `src/web/src/pages/Churches.tsx`, `ChurchDetail.tsx` | Status enum `ACTIVE,SUSPENDED,INACTIVE,ARCHIVED`; transitions `ACTIVE<->SUSPENDED`, `ACTIVE->INACTIVE`, `SUSPENDED->ACTIVE|INACTIVE`, `INACTIVE->ARCHIVED`; `ARCHIVED` read-only unless approved restore. Suspension blocks tenant sign-in and triggers FR-005 cutoff. |
| FR-027 | `UserAccount` (`users`, `user_roles`, `user_permissions`) | `src/api/auth/.../user/api/*UserGovernanceController*` (or equivalent), `/api/v1/users*` | `src/web/src/pages/Admins.tsx` or Settings Admin Users section | List/view/provision/assign/revoke roles-perms/disable/enable/reactivate with safeguards, audit, cutoff. |
| FR-028 | `SystemConfiguration`, `AuditLog` | `/api/v1/system-configurations*`, `/api/v1/audit-logs*` | `src/web/src/pages/Settings.tsx` config section, `AuditLogs` view/section | Config changes audited; audit log read-only, paginated, RBAC-enforced, redacted. |
| FR-003 | Token/session lifecycle config | `src/api/auth` JWT/refresh config | `src/web/src/services/api.ts` token handling | Access TTL 15m, refresh/session TTL 7d defaults; env-configurable; expired rejected 401. |

## Technical Context

**Language/Version**: Java 21 (Spring Boot 3.x services in `src/api/auth`, `src/api/api-service`, `src/api/announcement` as impacted), TypeScript 5.x / React 18 (Vite) in `src/web`  
**Primary Dependencies**: Spring Boot Web/Security/Data JPA/Validation, Lombok, MapStruct, Liquibase/Flyway as applicable, Redis (token blacklist/rate limit/cache), MySQL (system of record), JWT starter (`mikkytrionze-jwt-security-starter`) with wrapper/extensions as needed, JUnit 5, Mockito, Spring Boot Test, Testcontainers, datasource-proxy/Hibernate stats for query-count assertions, React Testing Library/Vitest, Playwright  
**Storage**: MySQL for users/roles/permissions/scopes/sessions/audit/domain records; Redis for access-token blacklist, rate-limit buckets, and short-TTL permission epoch cache; append-only audit log table (MySQL) with redaction rules  
**Testing**: Maven Surefire/Failsafe + JUnit 5 + Mockito + SpringBootTest/Testcontainers for backend; Vitest + React Testing Library for frontend; Playwright for E2E UX/QA; coverage via JaCoCo and frontend coverage tooling; latency/query-count assertions in integration/E2E harness; Semgrep SAST + SCA (npm audit/Snyk, OWASP Dependency-Check/Snyk) + lint/typecheck gates with CI artifacts 
**Target Platform**: Linux/CI runners for backend services; modern browsers for web (Chrome/Firefox/Safari/Edge latest); local/CI Dockerized integration environment  
**Project Type**: Web application (React frontend + Java Spring Boot microservices backend)  
**Performance Goals**: SC-007 budgets - p95 <= 500 ms sign-in/refresh/sign-out in test baseline; p95 <= 300 ms permission-gated API mutation/read excluding external dependencies; <= 2 s immediate in-session UI permission propagation/action-visibility update after role/permission change. N+1/query-count thresholds defined per endpoint in verification matrix.  
**Constraints**: Zero-trust server-side RBAC; no hardcoded permissions; immediate cutoff on governance-critical changes; Root Super Admin immutable via API/UI; last active Super Admin count >= 1; explicit sub-church scope (no inheritance); standardized non-enumerating error contracts; backward-compatible contract evolution for existing clients; 95% in-scope coverage per required test layer; Playwright E2E for in-scope web journeys; Semgrep/SCA/lint gates blocking per constitution. Rate limits default: sign-in 5/username+IP/15m, refresh 30/IP/15m, password-reset/OTP 3/IP/15m, step-up/sensitive governance 10/user+IP/15m; Redis bucket primary, in-memory fallback only for local/test. Latency harness: 1 warmup excluded, >=20 samples (or >=10 CI runs) per flow, report p50/p95/max; datasource-proxy/Hibernate stats for N+1/max-query thresholds. 
**Scale/Scope**: Initial scope covers auth service, api-service governance/domain endpoints, announcement module security/scoping alignment, and web auth/settings/church/member/announcement/profile flows. Designed for current platform scale with bounded caching, paginated audit/log queries, and indexed authorization lookups.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Evidence / Plan |
|---|---|---|---|
| I. Architecture Boundaries & Stack Integrity | Changes stay within `src/web` React/TS/Tailwind and `src/api/*` Spring Boot services; no new runtime/platform without amendment | **PASS** | Plan limits work to existing web and API modules; shared JWT/security extensions remain versioned modules. |
| II. Contract-First Evolution & Backward Compatibility | All auth/RBAC/endpoint/error contract changes include impact analysis, migration, rollback, compatibility window, and contract tests | **PASS** | D-001/D-002 define additive/compatible error/auth contracts, alias mapping, dual-shape adapter in web client, and contract tests. |
| III. Zero-Trust Security & RBAC Enforcement | Every protected endpoint/action server-enforced; deny-by-default; no client-only authz; no secrets leakage | **PASS** | D-003/D-004/D-006/D-007 require server-side permission epoch checks, DB-driven evaluator, Root/last-admin safeguards, explicit scopes, audit logging, standardized non-enumerating errors. |
| IV. Comprehensive Test Execution & 95% Coverage Mandate | Required in-scope unit/integration/contract/E2E layers executed with >=95% coverage or approved exception | **PASS WITH EVIDENCE REQUIRED** | Verification plan defines Layer 0-4, coverage artifacts, traceable E2E matrix, and CI gates; execution evidence required during implementation. |
| V. Observability, Operability & Data Platform Discipline | Structured logs/correlation IDs, auditable governance events, MySQL/Redis discipline, timeouts/retries/idempotency considerations | **PASS** | D-001/D-009 add correlation IDs and append-only audit log; Redis used for blacklist/rate-limit/cache only; epoch cache fallback to DB truth. |
| VI. Supply Chain Security, Vulnerability Management & Enforced Linting | SAST/SCA/lint gates considered; no new deps without review | **PASS WITH IMPLEMENTATION DUTY** | Any new dependency (rate-limit/query-count tooling) requires vulnerability/license review and pinned version; existing lint/SCA/Semgrep CI gates remain blocking. |
| VII. Automated UX & QA Tests for All Web User-Facing Features | Playwright E2E for all in-scope web workflows across supported browsers/viewports/accessibility where applicable | **PASS WITH EVIDENCE REQUIRED** | Layer 4 includes Super Admin journeys, negative privilege checks, accessibility/keyboard/focus/responsive checks for impacted flows, visual/regression evidence where appropriate. |

**Gate Result (Pre-Phase 0)**: PASS - no unjustified violations. Coverage/E2E evidence is an execution obligation, not a design exception.

**Gate Result (Post-Phase 1 Design)**: PASS. Design artifacts resolve all clarifications, define compatibility migration (error contracts, permission aliases, epoch cutoff), preserve stack boundaries, and include auditable verification gates. Remaining risk is implementation evidence (95% coverage, Playwright runs, latency/query artifacts), tracked as execution gates in quickstart and tasks phase.

## Project Structure

### Documentation (this feature)

```text
specs/007-engr-003-backend-auth-super-admin-verification/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── auth-governance-api.yaml
├── checklists/
│   ├── requirements.md
│   └── release-gate.md
└── spec.md
```

### Source Code (repository root)

```text
src/api/
├── auth/
│   ├── src/main/java/com/mikkytrionze/auth/
│   │   ├── common/application/exception/          # standardized ApiErrorResponse/handlers
│   │   ├── roles/                                 # role/permission APIs, services, mappers
│   │   ├── user/api/                              # auth endpoints, step-up endpoint
│   │   ├── user/application/service/              # auth, refresh rotation, revocation, audit hooks
│   │   ├── user/domain/model/                     # User, RefreshToken/session, epoch fields
│   │   ├── user/domain/repository/
│   │   └── user/infrastructure/
│   │       ├── config/                            # WebSecurityConfig, rate limit config
│   │       ├── database/                          # canonical seeder manifest loader/reconciler
│   │       └── security/                          # AuthEntryPoint, AuthTokenFilter, epoch validation
│   └── src/test/java/com/mikkytrionze/auth/       # unit, integration, contract/security tests
├── api-service/
│   ├── src/main/java/com/mikkytrionze/churchmanagement/
│   │   ├── church/ member/ pastor/ elder/ deacon/ profile/ dashboard/
│   │   ├── shared/config/                         # SecurityConfig, error handlers
│   │   ├── shared/security/                       # JwtAuthFilter, permission evaluator, scope checks
│   │   └── shared/audit/                          # audit entity/service (new)
│   └── src/test/java/com/mikkytrionze/churchmanagement/
└── announcement/
    └── src/main/java/com/mikkytrionze/announcement/ # announcement RBAC/scope alignment

src/web/
├── src/
│   ├── context/                                   # AuthContext, permission refresh/cutoff handling
│   ├── services/                                  # api.ts contract adapters, permission endpoints
│   ├── shared/components/                         # ProtectedRoute/PermissionRoute/denial UX
│   ├── pages/                                     # Settings, Churches, Members, Announcements, Profile
│   └── hooks/                                     # role/permission/church/member/announcement hooks
├── e2e/                                           # Playwright UX/QA specs
└── src/**/*.test.tsx                              # Vitest/RTL unit & integration tests
```

**Structure Decision**: Use the existing web + multi-service API structure. ENGR-003 is cross-cutting but implemented in-place: `auth` owns identity/session/role-permission source of truth; `api-service` and `announcement` enforce resource authorization and domain rules; `web` consumes effective permissions and standardized error contracts.

## Phase 0: Research Output

See [research.md](./research.md). All technical unknowns resolved with decisions, rationale, alternatives, and migration/risk notes. No `NEEDS CLARIFICATION` items remain.

## Phase 1: Design & Contracts

### 1. Data Model

See [data-model.md](./data-model.md). Key design elements:
- `UserAccount.permission_epoch` + `is_root_super_admin` for immediate cutoff and immutable root governance.
- Canonical `Permission.key=RESOURCE:ACTION` with legacy alias mapping.
- `RefreshSession` rotation family fields for one-time-use/reuse detection.
- `user_church_scopes` for explicit per-scope sub-church authorization.
- Append-only `audit_log` for governance/security traceability.
- Enumerated governance-critical changes triggering cutoff.

### 2. API Contracts

See [contracts/auth-governance-api.yaml](./contracts/auth-governance-api.yaml). Contracts cover:
- Standardized `ApiErrorResponse` for 400/401/403/429.
- Sign-in/refresh/sign-out/step-up endpoints with rotation/cutoff semantics.
- Effective-permissions endpoint for DB-driven UI.
- Role matrix update with step-up token for protected changes.
- Audit log query endpoint for governance inspection.

### 3. Verification Guide

See [quickstart.md](./quickstart.md). Includes Layer 0-4 commands, scenarios, and evidence expectations.

## Key Technical Designs

### A. Declarative, Idempotent Seeder Baseline

- **Source**: one-time export from live DB state updated via Settings -> Roles & Permissions UI (FR-012). Export is normalized into a versioned seed manifest (JSON/YAML) with checksum.
- **Contents**: users (including Root Super Admin marker), roles, permissions (5 actions x governed resources), role-permission assignments, protected/system role metadata, and required scope/bootstrap records.
- **Reconciler**: startup/test bootstrap reads manifest and performs idempotent upsert/reconcile. Rules: create missing records; update managed role-permission mappings to manifest; do not duplicate; do not destructively delete non-manifest business data; fail loudly on conflicting immutable identities unless migration rule exists.
- **Idempotency proof**: Layer 0 runs seeder twice and compares canonical counts/hash snapshots; repeated runs produce no drift.
- **Evolution**: after initial capture, changes only through reviewed seed/migration updates.

### B. Runtime DB-Backed Permission Evaluation + Immediate Cutoff

- **Canonical model**: `RESOURCE:ACTION` permissions in DB. Compatibility aliases map legacy `CAN_*` and `can_*` authorities during migration window.
- **Backend evaluation**: request authentication establishes principal; authorization resolves effective permissions from DB/short-TTL cache keyed by `userId + permissionEpoch`; endpoint guards use canonical checks (`hasPermission`/policy evaluator) and explicit church scope checks where applicable.
- **Immediate cutoff**: access token contains `jti`, `sub`, `permEpoch`. On every protected request, filter validates signature/expiry/blacklist and epoch freshness (cache then DB). Governance-critical change increments user `permission_epoch`, revokes refresh sessions/families, blacklists active access JTIs where known, and writes audit event. Old tokens fail next request with standardized 401/403 cutoff code.
- **Frontend behavior**: UI fetches effective permissions on login/focus/interval and after governance mutations; on 401 cutoff/invalid session clears tokens and redirects to login; on 403 shows safe denial and hides/disables unauthorized action. No frontend-only authorization is trusted.

### C. Root Super Admin Immutability & Step-Up Confirmation

- **Root Super Admin**: canonical seeded account flagged `is_root_super_admin=true`, system/protected Super Admin role. API/UI mutations that delete/disable/demote/remove required role or reduce active Super Admin count below 1 return 403, no state mutation, security alert audit. Recovery only by server/DB seeder/bootstrap.
- **Secondary Super Admin incident response**: active Super Admin may suspend/demote/remove a secondary Super Admin only with step-up password confirmation (or short-lived step-up token obtained by re-auth). Success requires audit event with actor, target, reason, correlation ID.
- **Safeguards**: transactionally enforce last-admin invariant; protect against concurrent demotions with row locking/conditional update.

### D. Latency Instrumentation & N+1 Prevention

- **API latency**: Micrometer timers around auth endpoints, permission resolution, and governed mutations; integration tests assert p95/threshold budgets in controlled profile. Harness rule: 1 warmup excluded, >=20 measured samples per endpoint/flow (>=10 in constrained CI with documented baseline), report p50/p95/max; fail or gap-log on p95 budget exceedance.
- **Query-count/N+1**: datasource-proxy or Hibernate statistics in integration profile; assert max query counts for permission lookup, role matrix fetch, church/member/announcement list endpoints. Fix patterns via fetch joins/entity graphs/batch sizing/caching; any exceedance records query count, endpoint, and remediation.
- **UI latency**: Playwright captures time from permission mutation confirmation to visible action disable/hide or denied response; asserts <=2s p95 budget across >=10 CI runs or >=20 local runs.
- **Evidence**: store timing/query reports as CI artifacts; exceedances become gap-analysis entries with severity and remediation.

### E. Rate Limiting & Abuse Protection (U1)

- Redis token-bucket/counter primary storage keyed by IP+username hash (sign-in), IP (refresh/reset/OTP), and user+IP (step-up/sensitive governance). Defaults below; all externalized by config.
- In-memory fallback allowed only for local/test when Redis unavailable; production must fail closed or degrade by documented policy with alerting, never silently unlimited.
- 429 responses include `ApiErrorResponse` + `Retry-After` header + `details.retryAfterSeconds`.

#### Canonical Config Keys / Defaults / Env Overrides (A1)

| Area | Config Key | Default | Env Override | Notes |
|---|---|---:|---|---|
| Auth lifetime | `auth.access-token.ttl-minutes` | `15` | `AUTH_ACCESS_TOKEN_TTL_MINUTES` | FR-003; expired access token => 401 |
| Auth lifetime | `auth.refresh-token.ttl-days` | `7` | `AUTH_REFRESH_TOKEN_TTL_DAYS` | FR-003; refresh/session expiry |
| Rate limit | `auth.ratelimit.signin.max-attempts` | `5` | `AUTH_RATELIMIT_SIGNIN_MAX_ATTEMPTS` | per username+IP / window |
| Rate limit | `auth.ratelimit.signin.window-minutes` | `15` | `AUTH_RATELIMIT_SIGNIN_WINDOW_MINUTES` | sign-in window |
| Rate limit | `auth.ratelimit.refresh.max-requests` | `30` | `AUTH_RATELIMIT_REFRESH_MAX_REQUESTS` | per IP / window |
| Rate limit | `auth.ratelimit.refresh.window-minutes` | `15` | `AUTH_RATELIMIT_REFRESH_WINDOW_MINUTES` | refresh window |
| Rate limit | `auth.ratelimit.reset-otp.max-requests` | `3` | `AUTH_RATELIMIT_RESET_OTP_MAX_REQUESTS` | per IP / window |
| Rate limit | `auth.ratelimit.reset-otp.window-minutes` | `15` | `AUTH_RATELIMIT_RESET_OTP_WINDOW_MINUTES` | reset/OTP window |
| Rate limit | `auth.ratelimit.stepup-governance.max-requests` | `10` | `AUTH_RATELIMIT_STEPUP_GOV_MAX_REQUESTS` | per user+IP / window |
| Rate limit | `auth.ratelimit.stepup-governance.window-minutes` | `15` | `AUTH_RATELIMIT_STEPUP_GOV_WINDOW_MINUTES` | step-up/governance window |
| Rate limit storage | `auth.ratelimit.store` | `redis` | `AUTH_RATELIMIT_STORE` | `redis` primary; `memory` local/test only |
| Permission cutoff | `auth.permission.epoch-cache-ttl-seconds` | `5` | `AUTH_PERMISSION_EPOCH_CACHE_TTL_SECONDS` | short TTL; DB authoritative |
| Performance harness | `perf.harness.warmup-runs` | `1` | `PERF_HARNESS_WARMUP_RUNS` | excluded from p95 |
| Performance harness | `perf.harness.measured-samples` | `20` | `PERF_HARNESS_MEASURED_SAMPLES` | >=10 allowed in constrained CI with baseline note |

### F. Constitution Quality Gates (C6/C7)

- **C6**: CI must run and retain artifacts for lint/typecheck, Semgrep SAST, and SCA (npm audit/Snyk for web, OWASP Dependency-Check/Snyk for Java) for touched components; critical/high findings block or require approved time-bound exception.
- **C7**: Playwright E2E for in-scope web flows must cover supported browser matrix (Chromium/Firefox/WebKit as configured), responsive viewports (375/768/1920), keyboard navigation/focus, and accessibility assertions (WCAG AA-oriented checks/axe where applicable), with visual/regression artifacts retained.

## 4-Layer Verification Plan (+ Seeder)

| Layer | Scope | Tools | Key Scenarios | Exit Criteria |
|---|---|---|---|---|
| 0. Seeder & Schema | Manifest capture, schema migration, idempotent bootstrap | Maven, Liquibase/Flyway, JUnit bootstrap tests | Canonical roles/users/5-action matrix loaded twice without drift; Root Super Admin flag/protected role metadata present; legacy alias compatibility seeded | SC-004 pass; no duplicate/drift/destructive loss; migration reversible/compatible |
| 1. Backend Unit | AuthService, refresh rotation, blacklist/cutoff, permission evaluator, safeguards, domain rules | JUnit 5, Mockito, JaCoCo | Credential validation; 400/401 mapping; refresh rotation/reuse family revocation; logout blacklist failure policy; epoch mismatch cutoff; `RESOURCE:ACTION` + alias resolution; Root/last-admin/step-up rules; church explicit scope; member baptism transitions; announcement scope checks | >=95% in-scope line/branch coverage; all unit cases pass |
| 2. Backend Integration | Controllers/filters/repos/security/config/Redis/DB/contracts | SpringBootTest, Testcontainers, MockMvc/WebTestClient, datasource-proxy | 400/401/403/429 contract; rotation concurrency/reuse; live DB permission toggle => next request 403/401 cutoff; explicit sub-church scope; member/announcement/profile persistence and authz; audit log records; p95 latency and query-count assertions | >=95% in-scope integration surface coverage; contract scenarios pass; latency/query budgets met or documented gaps |
| 3. Frontend Unit & Integration | Auth context, API adapters, permission routes/components, settings/profile/module pages | Vitest, React Testing Library | Effective-permission fetch/refresh; action visibility for CREATE/READ/VIEW/UPDATE/DELETE; 401 session expiry; 403 safe denial; immediate UI update on permission revocation; step-up UI flow; error contract rendering without leakage | >=95% in-scope coverage; no client-only authz assumptions |
| 4. Playwright E2E UX/QA | End-to-end Super Admin journeys across web + API | Playwright (CI, multi-browser as configured) | Sign-in/session persistence; Churches/Sub-Churches explicit scope CRUD/lifecycle; Baptised/Non-Baptised member workflows; Announcements CRUD/scope; Settings Roles & Permissions live edit immediate cutoff; Profile password/session invalidation; negative privilege/direct URL access; UI latency and accessibility checks | >=95% in-scope critical journeys or traceable matrix; all in-scope Playwright specs pass; artifacts retained |

## Release-Gate Alignment (60 Checks)

| Release-Gate Group | Plan Sections | Primary Artifacts |
|---|---|---|
| CHK001-CHK013 Requirement Completeness | Summary, Technical Designs A-D, Phase 1 contracts/data model, Layer 0-4 | spec FR mapping, data-model.md, contracts/auth-governance-api.yaml |
| CHK014-CHK021 Requirement Clarity | D-001/D-003/D-006/D-007, error contract schema, glossary/invariants | research.md, contracts, data-model invariants |
| CHK022-CHK027 Requirement Consistency | Canonical permission model, cutoff semantics, scope rules, 5-action matrix | data-model.md, plan consistency rules, tests |
| CHK028-CHK032 Acceptance Criteria Quality | SC mapping, measurable latency/query thresholds, audit assertions | quickstart.md, verification matrix |
| CHK033-CHK040 Scenario Coverage | Layer 2/4 scenario matrix by module/action | quickstart.md, tasks (next phase) |
| CHK041-CHK046 Edge Case Coverage | Token reuse/concurrency/account states/root-last-admin/stale-permission/audit unavailability | research.md, Layer 1/2/4 cases |
| CHK047-CHK051 NFRs | Latency/query instrumentation, security/rate-limit/audit/recovery | Technical Design D, constitution gates |
| CHK052-CHK055 Dependencies & Assumptions | Dependencies, baseline capture process, env calibration, naming reconciliation | quickstart.md, assumptions/risk register |
| CHK056-CHK060 Ambiguities & Conflicts | Governance-critical change enum, alias mapping, protected-role conflict rules, cutoff fallback, traceability IDs | data-model.md, research.md, tasks phase will assign IDs |

## Complexity Tracking

No constitution violations requiring justification. Complexity is inherent to security/governance scope and mitigated by phased delivery, compatibility aliases, and explicit verification gates.

| Area | Complexity | Mitigation | Simpler Alternative Rejected Because |
|---|---|---|---|
| Immediate cutoff | Epoch/version + blacklist + cache invalidation | Short TTL cache, authoritative DB fallback, integration tests | Short token TTL alone cannot guarantee immediate cutoff required by spec |
| Permission model migration | Canonical `RESOURCE:ACTION` + legacy aliases | Dual-read/alias mapping, contract tests, phased UI migration | Big-bang rename risks breaking existing clients and tests |
| Root/last-admin safeguards | Transactional invariants + step-up | DB constraints/locking, audited 403 responses | UI-only checks are insecure; blanket prohibition breaks incident response |
