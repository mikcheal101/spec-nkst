# Implementation Plan: Profile Hydration & Save Persistence

**Branch**: `008-profile-hydration-persistence` | **Date**: 2026-11-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-profile-hydration-persistence/spec.md`

## Summary

Fix authenticated current-user profile read/update across `src/api/api-service` and `src/web` so `/profile` hydrates reliably, saves only intended editable fields (no clobber), handles standardized `400/401/403/404/429` errors, and immediately syncs saved values into profile UI and shared auth/session context. Implementation uses existing profile endpoint surface (`GET/POST /api/v1/profile`), strengthens DTO validation/mapping/service persistence rules, normalizes frontend response hydration and mutation state handling, and adds backend unit/integration + frontend Vitest/RTL + Playwright E2E coverage.

## Technical Context

**Language/Version**: Java 17, Spring Boot 3.x (api-service); TypeScript 5.x, React 18, Vite (web)  
**Primary Dependencies**: Spring Web/Security/Validation/JPA, Lombok, JUnit 5/Mockito/Spring Test; React Router, TanStack Query, i18next, Vitest/RTL, Playwright  
**Storage**: Existing MySQL-backed member/profile records via JPA repositories (no new store)  
**Testing**: Maven/JUnit/Mockito/Spring MockMvc/integration tests in api-service; Vitest + React Testing Library; Playwright E2E in `src/web/e2e`  
**Target Platform**: Linux/Docker-hosted Spring Boot services + modern desktop/mobile browsers for web app  
**Project Type**: Web application (separate backend `src/api/*` and frontend `src/web`)  
**Performance Goals**: Routine profile save receives confirmation within 10s under normal conditions (SC-005); profile load/save avoids duplicate in-flight submits and unnecessary refetch churn  
**Constraints**: Authenticated current-user only; editable fields limited to first/last/middle name, email, phone; username read-only; partial-safe/no-clobber updates; duplicate email/phone returns generic standardized error; last-save-wins concurrency; standardized ErrorResponse for 400/401/403/404/429; preserve existing auth/session behavior  
**Scale/Scope**: Single profile page + current-user profile endpoints; touches api-service profile controller/service/DTO/validation/exception paths, web profile page/hooks/api/context, and targeted automated tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| I. Architecture Boundaries & Stack Integrity | PASS | Changes stay within existing React/TS/Tailwind web app and Spring Boot api-service boundaries; no new cross-service coupling. |
| II. Contract-First Evolution & Backward Compatibility | PASS | Reuses existing `/api/v1/profile` contract; additive/behavior-correcting response/error consistency. Any shape normalization remains backward-compatible for existing clients. |
| III. Zero-Trust Security & RBAC Enforcement | PASS | Endpoints remain authenticated current-user scoped; no client-side-only security; standardized 401/403 handling; no sensitive data logging. |
| IV. Comprehensive Test Execution & 95% Coverage Mandate | PASS WITH PLAN | Feature spans web+API: requires backend unit/integration, frontend Vitest/RTL, and Playwright E2E cross-stack coverage. Coverage evidence will be collected for touched in-scope profile files/flows; any gap below 95% must be documented as exception or remediated before merge. |
| V. Observability, Operability & Data Platform Discipline | PASS | Reuse structured ErrorResponse/correlation ID; avoid PII/secrets in logs; no new data platform. |
| VI. Supply Chain Security, Vulnerability Management & Enforced Linting | PASS | No new dependencies planned; existing lint/SAST/SCA CI gates apply to touched code. |
| VII. Automated UX & QA Tests for All Web User-Facing Features | PASS WITH PLAN | `/profile` user-facing load/save flow will get/extend Playwright E2E coverage and Vitest/RTL coverage for states, validation, accessibility basics where affected. |

**Post-Design Re-check**: PASS. Phase 1 artifacts keep scope within existing stacks/contracts, define standardized error/validation behavior, and include explicit cross-stack test strategy. No constitution violations requiring Complexity Tracking exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/008-profile-hydration-persistence/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── profile-api.yaml
└── tasks.md             # /speckit.tasks output (not created here)
```

### Source Code (repository root)

```text
src/
├── api/
│   └── api-service/
│       ├── src/main/java/com/mikkytrionze/churchmanagement/
│       │   ├── profile/api/                 # ProfileController, request/response DTOs
│       │   ├── profile/application/service/  # ProfileServiceImpl
│       │   ├── profile/domain/service/      # ProfileService contract
│       │   ├── member/domain/model|repository/
│       │   └── shared/exception|dto|security/
│       └── src/test/java/com/mikkytrionze/churchmanagement/
│           ├── profile/api/
│           ├── profile/application/service/
│           └── integration/ (targeted profile integration coverage as needed)
└── web/
    ├── src/
    │   ├── pages/Profile.tsx
    │   ├── hooks/useAuth.ts
    │   ├── context/AuthContext.tsx
    │   ├── services/api.ts
    │   └── shared/utils/ (validation/error helpers if needed)
    └── e2e/
        └── profile*.spec.ts (new/updated Playwright coverage)
```

**Structure Decision**: Use existing web + api-service structure. No new service/project. Profile behavior changes are localized to api-service profile/member/shared error handling and web profile/auth/api layers, with tests adjacent to current test locations.

## Complexity Tracking

> No constitution violations requiring justification.
