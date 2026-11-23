# Quickstart / Verification Guide: ENGR-003

**Branch**: `007-engr-003-backend-auth-super-admin-verification` | **Date**: 2026-11-21  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Goal

Run and verify ENGR-003 implementation across 4 test layers plus seeder bootstrap. This guide is a validation/runbook; implementation details live in `tasks.md` during implementation.

## Prerequisites

- Java 21, Maven wrapper for `src/api/auth` and `src/api/api-service` (and announcement module as impacted).
- Node 20+, npm in `src/web`.
- Docker (for Testcontainers/MySQL/Redis/Kafka integration harness if used by CI profile).
- Playwright browsers installed: `cd src/web && npx playwright install`.
- Environment/config values for auth secrets, DB, Redis, rate-limit settings, and seed manifest path.
- Access to current DB snapshot or approved exported baseline for one-time canonical seeder capture.

## Baseline Capture (FR-012)

1. Export current DB state updated via Settings -> Roles & Permissions UI (users, roles, permissions, role-permission assignments, Root Super Admin marker).
2. Store normalized export as seed manifest artifact (versioned, reviewed).
3. Commit manifest/checksum and seeder reconciliation logic. Do not hand-edit drifted runtime DB as substitute for manifest update.

Detailed runbook and evidence record: `specs/007-engr-003-backend-auth-super-admin-verification/artifacts/seed-baseline-capture.md`.


## Layer 0 - Seeder & Schema

**Intent**: canonical, idempotent baseline.

Run:
```bash
cd src/api/auth
./mvnw test -Dtest='*Seeder*Test'
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
# restart once to verify idempotency
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

Expected:
- Roles/permissions/users match manifest; no duplicates; no required-role loss.
- Root Super Admin present and flagged immutable.
- Repeated startup produces no drift.

## Layer 1 - Backend Unit (JUnit 5 + Mockito)

**Intent**: fast logic confidence, >=95% in-scope coverage.

Run:
```bash
cd src/api/auth
./mvnw clean verify
cd ../api-service
./mvnw clean verify
```

Expected focus:
- AuthService credential validation, token issue/refresh rotation/reuse detection, logout revocation failure behavior.
- Token epoch/permission version validation and immediate cutoff decisions.
- Permission evaluator maps canonical `RESOURCE:ACTION` and legacy aliases.
- Root Super Admin/last-admin/step-up safeguards.
- Domain rules for church scope, member baptism/status transitions, announcement scope.

## Layer 2 - Backend Integration (SpringBootTest/Testcontainers)

**Intent**: real wiring, DB/Redis/security filters, contracts, latency/query assertions.

Run:
```bash
cd src/api/auth
./mvnw verify -Pintegration
cd ../api-service
./mvnw verify -Pintegration
```

Expected scenarios:
- `400/401/403/429` standardized error contract on auth/governance endpoints.
- Refresh rotation: old refresh rejected after rotation; reuse revokes family.
- Logout invalidates refresh and access JTI.
- Live DB permission mutation causes immediate 200 -> 403/401 cutoff on next protected request and no stale authorization.
- Sub-church explicit scope denies cross-scope access.
- Baptised/non-baptised member transitions enforced.
- Announcement church/sub-church visibility scoped.
- Profile password/security change invalidates sessions as specified.
- p95 latency budgets and query-count/N+1 assertions recorded.

## Layer 3 - Frontend Unit & Integration

**Intent**: permission-driven rendering and error/session handling.

Run:
```bash
cd src/web
npm test -- --run
npm run lint
npm run build
```

Expected scenarios:
- `CREATE/READ/VIEW/UPDATE/DELETE` action visibility/disablement follows effective DB permissions.
- 401 triggers session-expiry flow; 403 triggers safe denial (no privileged mutation).
- Permission refresh after governance change updates already-open page/action state.
- Settings Roles & Permissions UI uses API-driven matrix, not hardcoded permission groups.

## Layer 4 - Playwright E2E UX/QA

**Intent**: full-stack Super Admin journeys and regression coverage.

Run:
```bash
cd src/web
npm run test:e2e:e2e -- --reporter=list
```

Required journeys:
- Super Admin sign-in/session persistence/reload.
- Churches/Sub-Churches CRUD/lifecycle with explicit scope checks.
- Members baptised/non-baptised filtering/status transitions and mutations.
- Announcements CRUD and church/sub-church visibility scoping.
- Settings -> Roles & Permissions live edit: grant allows action; revoke causes immediate UI restriction and backend 403/cutoff.
- Profile security: password change/session invalidation behavior.
- Negative privilege checks: unauthenticated/non-super-admin/direct URL access denied safely.
- UI latency assertions for permission propagation/action visibility (<=2s target, env calibrated).

## Evidence Checklist

- Unit/integration/contract/E2E reports retained in CI artifacts.
- Coverage >=95% for in-scope production code per constitution, or approved time-bound exception.
- Latency/query-count results attached; any exceedance logged in gap analysis with evidence.
- Audit log entries verified for privileged mutations and safeguard denials.
- Release-gate checklist reviewed; requirement-quality items marked only by reviewer.
