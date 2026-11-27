# church-management-system Constitution

## Project

| Field | Value |
|---|---|
| **Name** | church-management-system |
| **Constitution Version** | 1.2.0 |
| **Ratified** | TODO(RATIFICATION_DATE): confirm original adoption date |
| **Last Amended** | 2026-11-23 |

---

## Core Principles

### I. Architecture Boundaries & Stack Integrity (NON-NEGOTIABLE)

The platform MUST maintain explicit architectural boundaries across its stack:

- **Web frontend (`src/web/`)**: The web application MUST be built with React using TypeScript and Tailwind CSS, following established project conventions and producing a maintainable, component-driven UI.
- **Mobile cross-platform app (`src/mobile/`)**: The mobile application MUST be built with React Native (Expo) using TypeScript and Tailwind CSS to deliver cross-platform iOS and Android experiences from a shared codebase in `src/mobile/`. Mobile implementations MUST follow established Expo/React Native project conventions, maintain platform-specific handling only where necessary, and preserve consistent behavior across supported platforms unless a platform difference is explicitly required and documented.
- **Backend (`src/api/`)**: Java Spring Boot 3 microservices exclusively. Each microservice MUST own its domain logic, runtime configuration, and data access behavior within its bounded context.

Each application/service MUST have clear ownership of its domain, persistence interactions, and published contracts. Cross-service coupling MUST occur only through documented interfaces (HTTP/gRPC APIs, approved shared contract modules, or asynchronous events).

Shared modules/libraries (e.g. security/JWT starters, proto/contract libraries) MUST be versioned, independently testable, and free of application-specific business rules.

New frameworks, runtimes, storage engines, or cross-cutting platform dependencies MUST align with the owning component's stack and include documented rationale; governance-impacting changes require a constitution amendment.

**Rationale**: Clear boundaries and stack discipline reduce coupling, enable independent evolution of web, mobile, and Spring Boot microservice components, and make failures diagnosable in a distributed system.

---

### II. Contract-First Evolution & Backward Compatibility (NON-NEGOTIABLE)

All external/internal APIs, service contracts, Kafka topics/event schemas, shared DTOs/protobufs, and consumer-affecting database schemas MUST be treated as versioned contracts.

Backward compatibility on all breaking schema/API migrations is mandatory by default. No breaking API, event, schema, persistence contract, or client-visible behavior change may be merged without:

1. a written compatibility/impact analysis;
2. an explicit migration plan (e.g. expand/contract, dual-read/dual-write, versioned endpoint/topic/schema, or equivalent safe strategy);
3. rollout sequencing, verification steps, and a tested rollback plan;
4. consumer/stakeholder communication and migration timeline; and
5. automated contract/integration coverage validating old and new behavior during any compatibility window.

HTTP/gRPC APIs MUST remain compatible for existing clients unless a new major version is introduced and affected consumers are migrated or explicitly supported.

Database schema changes MUST be forward-compatible across rolling deployments. Destructive operations (drop/rename/type narrowing/constraint tightening with data risk) MUST follow expand-contract and include safe data migration/backfill steps where needed.

Kafka producers and consumers MUST handle schema evolution safely. Event changes MUST be additive or versioned; consumers MUST tolerate unknown fields/versioned payloads per contract; producers MUST NOT silently change message semantics.

**Rationale**: Contract discipline prevents deployment-order failures, consumer breakage, and data loss across microservices and asynchronous integrations.

---

### III. Zero-Trust Security & RBAC Enforcement (NON-NEGOTIABLE)

Zero-trust MUST be enforced at every trust boundary. Network location, cluster placement, service-to-service locality, or internal origin MUST NOT be treated as sufficient authorization.

Every protected UI action invoking protected behavior, API/service endpoint, event handler, and administrative operation MUST enforce authentication and authorization appropriate to its risk and trust boundary.

RBAC MUST be explicit, least-privilege, deny-by-default for protected resources, and auditable. Authorization decisions MUST be enforced server-side; client-side checks are UX aids only and MUST NOT be relied upon for security.

Secrets, credentials, private keys, tokens, and sensitive connection strings MUST NEVER be hardcoded, committed to source control, written to logs, or exposed in client bundles/responses. Use environment variables, secret stores, or approved runtime injection.

Sensitive data in transit MUST use TLS. Sensitive data at rest MUST be protected according to data classification and platform capabilities.

Input validation, output encoding/serialization safety, secure defaults, and dependency vulnerability management MUST be applied to all exposed surfaces. Security review is mandatory for auth/RBAC, data access, cryptography, file handling, external integrations, and infrastructure-facing changes.

**Rationale**: A distributed platform increases attack surface; zero-trust RBAC and secure-by-default controls are required to protect users, data, and system integrity.

---

### IV. Comprehensive Test Execution & 95% Coverage Mandate (NON-NEGOTIABLE)

All production changes MUST include a risk-appropriate automated test strategy and all required test layers MUST be properly executed (not skipped, not disabled, not pending) for the in-scope change before merge. Test-first/TDD is REQUIRED for new behavior and bug fixes whenever practical: define/update tests, verify failure for the intended reason, implement, then refactor while keeping tests green.

**Quality gate: minimum 95% test coverage for in-scope production code in every component touched by a change**, enforced per required test layer with auditable evidence in CI/review:

- **Unit tests**: MUST be executed and MUST achieve >=95% line/statement coverage and >=95% branch coverage for in-scope units/modules where tooling supports branch metrics (otherwise >=95% line/statement coverage plus explicit branch-risk review). Unit tests MUST cover business logic, validation, mapping, state transitions, and error/edge handling.

- **Integration tests**: MUST be executed and MUST achieve >=95% coverage of in-scope integration surfaces (routes/controllers/endpoints, repositories/data access, service wiring, messaging adapters, configuration boundaries, external dependency adapters, MySQL/MongoDB/Redis/Kafka interactions where in scope). Integration tests MUST exercise real or production-representative dependencies where feasible (e.g. Testcontainers, local emulators, or approved harnesses).

- **Contract tests**: MUST be executed and MUST achieve >=95% coverage of in-scope public contract paths, including success, validation/error, authorization, idempotency (where relevant), and backward-compatibility scenarios for changed APIs/events/schemas/protobufs.

- **End-to-end (E2E) tests**: MUST be executed and MUST achieve >=95% coverage of in-scope critical user journeys, business workflows, and cross-component scenarios affected by the change, run against an integrated environment representative of production behavior for the changed flow.
  - For the **web application (`src/web/`)**: E2E coverage MUST include in-scope user journeys across supported browsers/environments as applicable.
  - For the **cross-platform mobile application (`src/mobile/`)**: E2E coverage MUST include in-scope user journeys on supported iOS and Android targets (simulators/emulators and/or devices as appropriate) with platform-specific behavior validated where applicable.
  - **Cross-stack E2E (frontend-to-API and mobile-to-API)**: For any feature that spans the web or mobile client and one or more backend API services, E2E tests MUST exercise the full request/response flow from the client layer through to the API (`src/api/`) and back. These tests MUST run against a representative integrated environment (e.g. real or Testcontainers-backed services, approved staging harness) — mocking at the network boundary is insufficient for cross-stack E2E coverage. Cross-stack E2E scenarios MUST cover the critical happy paths, key error/failure paths, and any authorization-sensitive flows introduced or modified by the feature. Where a feature touches both web and mobile clients, cross-stack E2E coverage MUST be provided for both.
  - Where quantitative E2E instrumentation is not technically reliable, teams MUST provide a traceable E2E coverage matrix demonstrating >=95% coverage of in-scope acceptance criteria/journeys (including browser/platform coverage for affected web/mobile flows and cross-stack flows where applicable) and MUST NOT claim compliance without that evidence.

**Coverage tooling by component:**

| Component | Unit / Integration | Contract / E2E |
|---|---|---|
| Web (`src/web/`) | Vitest, React Testing Library | Playwright |
| Mobile (`src/mobile/`) | Jest/Vitest, React Native Testing Library | Detox, Maestro, or Appium (or equivalent) |
| Backend (`src/api/`) | JUnit, Mockito, JaCoCo, Spring Boot test slices, Testcontainers | Contract tooling + integrated E2E harnesses as applicable |

Coverage reports for each required layer MUST be retained and reviewable in CI/PR.

Exclusions MUST be narrow, documented, and justified (generated code or truly unreachable defensive branches only when justified) and MUST NOT be used to bypass meaningful coverage. Disabled/skipped tests are prohibited unless covered by a time-bound, approved exception.

Bug fixes MUST include executed regression tests. Contract/schema changes MUST include executed compatibility tests. Security-sensitive changes MUST include executed negative and authorization tests.

CI and local verification gates MUST fail on any test failure, missing required test layer execution, or coverage below 95% for any required in-scope test layer. A result below 95% MUST block merge unless a time-bound, approved exception is documented with owner, rationale, risk assessment, and remediation date.

**Rationale**: Failures occur at unit, integration, contract, and workflow boundaries; executing and evidencing high coverage across all layers provides confidence in correctness, compatibility, and regression control.

---

### V. Observability, Operability & Data Platform Discipline (NON-NEGOTIABLE)

Services and apps MUST be operable in production with structured logs, actionable metrics, and correlation/trace identifiers enabling end-to-end diagnosis across UI/API/service/Kafka/database flows.

Logs MUST be structured and privacy-aware: include sufficient debug context (correlation ID, operation, status, latency/error category) while excluding secrets and minimizing sensitive personal data.

**Data platform rules:**

- **MySQL** MUST be the system of record for all durable relational data. Schema changes MUST be managed through reviewed, versioned migrations (e.g. Flyway or Liquibase). MySQL MUST NOT be replaced with another relational engine without a constitution amendment.
- **MongoDB** MUST be used as the system of record for non-relational/document data. Each collection's schema expectations and indexing strategy MUST be documented. MongoDB MUST NOT be used for data that naturally belongs in a relational model.
- Both MySQL and MongoDB MUST be accessed exclusively through private, authenticated admin UIs (e.g. phpMyAdmin/MySQL Workbench for MySQL; Mongo Express/MongoDB Compass for MongoDB, or equivalent internally approved tooling). Direct production database access via ad-hoc CLI or unapproved tooling is prohibited outside of a documented, approved incident response procedure. Admin UIs MUST be deployed on private/internal network segments, protected by authentication and RBAC, and MUST NOT be exposed to the public internet.
- **Redis** MUST be used only for caching, ephemeral coordination, rate limiting, or similarly non-authoritative state unless a specific design is explicitly approved. TTL/eviction/fallback behavior MUST be considered; Redis outages MUST NOT corrupt durable truth in MySQL or MongoDB.
- **Apache Kafka** MUST be used for asynchronous integration/event streaming with clear topic ownership, delivery/idempotency expectations, schema governance, retention, consumer group behavior, and replay considerations.

Integrations MUST define timeouts, retries with backoff/jitter where appropriate, idempotency for retriable operations, dead-letter/error handling strategy where applicable, and health/readiness checks.

Performance-sensitive changes MUST be measured. Designs MUST avoid N+1 queries, unbounded retries, unbounded queues/streams, uncontrolled memory growth, and missing pagination/limits on large datasets.

**Rationale**: Observability and disciplined use of MySQL/MongoDB/Redis/Kafka are essential for reliability, diagnosability, and safe evolution.

---

### VI. Supply Chain Security, Vulnerability Management & Enforced Linting (NON-NEGOTIABLE)

All first-party code and all third-party dependencies introduced or updated in church-management-system MUST be continuously vetted for known vulnerabilities and must meet enforced quality and security standards before reaching production.

**Vulnerability scanning:**

- **Wiz** MUST be used for cloud/infrastructure-layer security scanning, covering container images, infrastructure-as-code, cloud configuration posture, and runtime workload risk across the platform. Wiz findings at critical or high severity MUST block deployment or be formally risk-accepted with owner, rationale, and remediation date before proceeding.
- **Semgrep** MUST be used for static application security testing (SAST) across all components (`src/web/`, `src/mobile/`, `src/api/`). Semgrep rulesets MUST include OWASP Top 10 patterns, secrets detection, injection risks, insecure deserialization, and component-appropriate security rules. Semgrep MUST run in CI on every PR and block merge on any finding at the configured severity threshold unless a formal, time-bound exception is approved.
- Additional SCA (Software Composition Analysis) tooling MUST be applied to detect vulnerable third-party dependencies:
  - `src/web/` and `src/mobile/`: npm audit or equivalent (e.g. Snyk, Socket) MUST run in CI and flag/block on critical/high CVEs in direct and transitive dependencies.
  - `src/api/`: OWASP Dependency-Check, Snyk, or equivalent MUST run in CI and flag/block on critical/high CVEs in Java dependencies (Maven/Gradle).
- Scan results for Wiz, Semgrep, and SCA tooling MUST be retained as CI artifacts and reviewable per PR/deployment.

**Third-party dependency governance:**

- All new third-party libraries and packages MUST be reviewed for: known CVEs, maintenance health (last release, open issues, abandonment signals), license compatibility, and necessity (prefer existing approved dependencies over introducing new ones).
- Dependencies MUST be pinned to exact or tightly bounded versions in all component manifests. Open/wildcard version ranges are prohibited.
- Dependencies flagged with critical/high CVEs MUST be remediated (upgrade, patch, or replacement) within the resolution window defined by severity:
  - Critical: MUST be remediated before next production deployment or risk-accepted with documented owner/rationale/deadline.
  - High: MUST be remediated within 7 days or risk-accepted with documented owner/rationale/deadline.
  - Medium/Low: MUST be tracked and remediated in the next scheduled maintenance window.

**Enforced linting and static analysis:**

- Strict linting MUST be enforced for all components and MUST run in CI on every PR, blocking merge on violations:
  - `src/web/`: ESLint with security-focused plugins (e.g. `eslint-plugin-security`, `eslint-plugin-react`, `@typescript-eslint`) configured to enforce type safety, secure coding patterns, and project conventions. TypeScript strict mode MUST be enabled.
  - `src/mobile/`: Same ESLint configuration as `src/web/`, adapted for React Native/Expo. TypeScript strict mode MUST be enabled.
  - `src/api/`: Checkstyle and/or SpotBugs (or equivalent, e.g. PMD) MUST enforce Java coding standards and flag common security anti-patterns. SpotBugs security plugin SHOULD be enabled.
- Linting configuration MUST be committed to source control, version-controlled, and MUST NOT be suppressible globally without a constitution amendment. Per-line/per-rule suppressions are permitted only when accompanied by an inline comment justifying the exception.
- Semgrep rules and linting configurations MUST be reviewed and updated at least quarterly or when a significant new vulnerability class is disclosed.

**Rationale**: First-party code defects and vulnerable third-party dependencies are a primary attack vector in modern platforms. Wiz, Semgrep, SCA tooling, and strict linting working in combination provide layered defense across infrastructure, application code, and the dependency supply chain — catching issues before they reach production.

---

### VII. Automated UX & QA Tests for All Web User-Facing Features (NON-NEGOTIABLE)

Every user-facing feature, UI workflow, and public-facing interaction in the web application (`src/web/`) MUST have automated end-to-end UX and QA verification written in Playwright. This requirement applies to all features regardless of complexity, scope, or deployment tier.

**Scope and coverage:**

- **All public-facing workflows** (login, registration, password reset, profile management, navigation, form submissions) MUST have dedicated UX test coverage.
- **All interactive components** (buttons, links, forms, modals, dropdowns, tabs, accordions, toast notifications) MUST be verified for:
  - Correct rendering across supported browsers (Chrome, Firefox, Safari, Edge latest versions)
  - Responsive behavior on common viewport sizes (1920px desktop, 768px tablet, 375px mobile)
  - Keyboard navigation (Tab, Shift+Tab, Enter, Space, Escape)
  - Accessibility (ARIA labels, semantic HTML, color contrast ≥ WCAG AA)
  - Focus management and visible focus indicators
  - Hover/active states and transitions
- **All error and edge states** MUST be verified:
  - Form validation errors display inline with field
  - Loading states appear during async operations
  - Empty states display appropriate messaging
  - Timeout and failure states show user-friendly messages
  - Network errors are handled gracefully
- **All navigation flows** MUST be verified:
  - Route protection and redirects function correctly
  - Back/forward browser navigation preserves state
  - Deep-linking to protected routes redirects to login
  - URL query parameters and fragments are handled correctly

**Tooling and execution:**

- Playwright MUST be used for all web UX/QA E2E tests. No alternative E2E tool may be introduced without a constitution amendment.
- Tests MUST be written in TypeScript and stored in `src/web/e2e/` alongside existing test files.
- Tests MUST run in CI on every PR and block merge on any failure.
- Tests MUST produce HTML and JUnit reports retained as CI artifacts.
- Tests MUST include visual regression checks for critical workflows using Playwright's `expect(page).toMatchSnapshot()` or equivalent.

**Compliance and verification:**

- PRs MUST include:
  - Links to Playwright test files covering all user-facing workflows introduced or modified
  - Evidence of test execution in CI (test output logs or screenshots)
  - A brief UX/QA coverage summary listing verified scenarios
- Exceptions to this requirement MUST be documented with owner, rationale, risk assessment, and remediation date. Exceptions are temporary and MUST be time-bound.

**Rationale**: Automated UX/QA tests provide continuous confidence that user-facing features work correctly across browsers, devices, and interaction modes. They catch visual regressions, accessibility issues, and workflow breakage before users encounter them in production — protecting user experience and reducing support burden.

---

## Technology & Platform Constraints

| Component | Stack |
|---|---|
| Web frontend (`src/web/`) | React, TypeScript, Tailwind CSS; build/test via Vite/Vitest/Playwright as configured |
| Mobile app (`src/mobile/`) | React Native (Expo), TypeScript, Tailwind CSS; cross-platform iOS + Android from shared codebase; documented platform-specific adaptations only when necessary |
| Backend (`src/api/`) | Java Spring Boot 3 microservices; Spring Boot conventions for configuration, dependency management, Actuator/health/operability, security, test slices, and integration testing |
| Storage (relational) | MySQL — primary durable relational store; schema changes via reviewed versioned migrations (Flyway/Liquibase); accessed via private authenticated admin UI only |
| Storage (non-relational) | MongoDB — document/non-relational data store; collection schemas and indexing documented; accessed via private authenticated admin UI only |
| Cache/Ephemeral | Redis — non-authoritative cache/ephemeral state only; TTL/eviction/fallback required; outages MUST NOT corrupt MySQL or MongoDB truth |
| Messaging | Apache Kafka — async events/streaming with documented contracts and compatibility |
| Security scanning | Wiz (infra/cloud/container posture) + Semgrep (SAST, all components) + SCA tooling (npm audit/Snyk for web+mobile; OWASP Dependency-Check/Snyk for Java) |
| Linting & static analysis | ESLint + TypeScript strict mode (`src/web/`, `src/mobile/`); Checkstyle + SpotBugs (`src/api/`) — all enforced in CI, blocking on violations |

**Configuration**: Runtime configuration MUST be externalized (no hardcoded environment-specific values). Component-specific build, lint, typecheck, and test commands MUST be documented or discoverable and enforced in CI for `src/web/`, `src/mobile/`, and each service/module under `src/api/`.

---

## Development Workflow & Quality Gates

Work SHOULD follow spec-driven flow where applicable (spec → plan → tasks → implement → verify) with constitution compliance checked during planning and review.

**Feature branching & spec creation (NON-NEGOTIABLE for `/speckit.specify`)**:

- Every spec created using `/speckit.specify` MUST be created on a new feature branch; the command MUST NOT create or update feature specs directly on long-lived shared branches (`main`, `master`, `staging`, `develop`, or equivalent protected integration branches) unless an explicitly approved, documented exception is recorded.
- The new feature branch MUST be created from the current branch by default. If the user explicitly requests a different base, the base MUST be `staging` or another explicitly named branch; the selected base MUST be recorded in the command/spec context.
- Before writing spec artifacts, `/speckit.specify` MUST ensure the working tree is on the correct new feature branch (or create/switch to it through the approved `before_specify` hook/script flow). If branch creation/switching cannot be completed safely, the command MUST stop and report the blocker instead of writing spec files on an unintended branch.
- The spec directory/feature metadata MAY follow the active Spec Kit feature-directory conventions, but branch isolation is mandatory regardless of directory naming.

PRs MUST include:
- change summary and risk assessment;
- test evidence for required layers (unit/integration/contract/E2E as applicable); and
- rollout/rollback notes for operationally significant or contract/schema changes.

**Required gates before merge for touched components:**

1. lint/static analysis (ESLint/Checkstyle/SpotBugs as applicable) and type checks — blocking on violations;
2. Semgrep SAST scan — blocking on findings at or above the configured severity threshold;
3. SCA dependency vulnerability scan (npm audit/Snyk or OWASP Dependency-Check as applicable) — blocking on critical/high CVEs unless formally risk-accepted;
4. execution and pass of all required in-scope automated test layers (unit, integration, contract, E2E as applicable);
5. >=95% coverage evidence for each required in-scope test layer (unit, integration, contract, E2E or traceable journey matrix) or an approved time-bound exception;
6. security/RBAC verification for protected surfaces; and
7. backward-compatibility review and migration verification for any API/event/schema/persistence contract change.

Code review MUST explicitly confirm constitution compliance. Non-compliance MUST be remediated before merge unless formally approved as a temporary exception (documented with owner, rationale, risk, and remediation deadline).

---

## Governance

This constitution supersedes conflicting local practices for church-management-system engineering decisions. Narrower guidance documents MUST align with it.

Amendments require documented rationale, impact assessment, review of affected workflows/templates, migration/communication plan when needed, and a semantic version bump:

| Bump | When |
|---|---|
| **MAJOR** | Incompatible governance change, principle removal/redefinition, or material weakening of non-negotiable controls (security, compatibility, 95% test mandates) |
| **MINOR** | New principle/section or material expansion |
| **PATCH** | Clarification, wording, or non-semantic refinement |

Compliance MUST be reviewed in planning and PR review. Exceptions MUST be rare, explicit, time-bound, approved, recorded with owner/rationale/risk/remediation date, and tracked to closure.

---

**Version**: 1.2.0 | **Ratified**: TODO(RATIFICATION_DATE): confirm original adoption date | **Last Amended**: 2026-11-23
