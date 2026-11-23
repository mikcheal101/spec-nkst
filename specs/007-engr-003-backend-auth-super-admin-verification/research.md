# Research: ENGR-003 Backend Auth Verification & Super Admin Governance

**Branch**: `007-engr-003-backend-auth-super-admin-verification` | **Date**: 2026-11-21  
**Spec**: [spec.md](./spec.md) | **Checklist**: [checklists/release-gate.md](./checklists/release-gate.md)

## Purpose

Resolve technical unknowns, lock design decisions for Phase 1, and align implementation with the constitution and ENGR-003 clarifications. All decisions prioritize security, backward-compatible contract evolution, testability, and auditable evidence.

## Decisions

### D-001 - Standardized Error Contract (FR-006..FR-011, GAP-001/002/005/013)

- **Decision**: Introduce a shared `ApiErrorResponse` contract for auth and governed API services with fields: `timestamp` (ISO-8601), `status` (int), `error` (HTTP reason), `code` (machine-readable stable code), `message` (human-readable, non-enumerating), `path`, `correlationId` (from `X-Correlation-ID`/MDC, generated if absent), `details` (optional validation/retry metadata; no secrets). `429` includes `retryAfterSeconds` in `details` and `Retry-After` header. Validation `400` includes field-level details without echoing sensitive values.
- **Rationale**: Current auth service returns plain strings and `sendError`; api-service uses a different `ErrorResponse`. A single contract makes clients deterministic and satisfies SC-002.
- **Alternatives considered**: Keep per-service shapes with adapters only - rejected because it preserves drift and weak observability. RFC7807 Problem Details - viable alternative; selected contract is compatible with RFC7807 fields and can be mapped later, but we avoid a breaking format change by explicitly versioning the envelope.
- **Migration**: Additive/compatible response fields where possible; provide compatibility adapter in web `api.ts` for old/new shapes during rollout. Contract tests cover old client-critical fields (`token`/`accessToken`) through explicit versioned DTOs.

### D-002 - Auth Lifecycle, Refresh Rotation, and Logout Invalidation (FR-001..FR-005, GAP-003/004/014)

- **Decision**: Implement one-time-use rotating refresh tokens. `refresh_tokens` gains `jti`, `familyId`/`sessionId`, `rotatedAt`, `revokedAt`, `replacedByJti`, `revocationReason`, `createdIp`, `userAgent` (optional). Refresh flow: validate signature/expiry/type, lock token row, reject if revoked/rotated/expired, issue new access+refresh pair, mark old refresh revoked with replacement, persist atomically. Reuse of rotated/revoked token revokes the entire token family/session and emits security audit. Logout blacklists access JTI until expiry and revokes refresh token family; blacklist/revocation failure causes explicit failure per policy (503/409 policy-chosen internal code mapped to safe 401/403/500 boundary?) - plan chooses fail-closed for protected revocation: return 500 `AUTH_REVOCATION_FAILED` only for internal revocation storage failure after audit attempt, never silently succeed.
- **Rationale**: Current implementation reissues access token without rotation and ignores blacklist failures. Rotation and family revocation block replay.
- **Alternatives considered**: Stateless refresh JWT only - rejected because immediate cutoff/revocation is required. DB-only blacklist - acceptable but Redis blacklist already exists; keep Redis for access JTI blacklist and DB for refresh/session authority.

### D-003 - Immediate In-Session Cutoff via Permission Epoch / Token Version (FR-005, FR-018, GAP-014/021)

- **Decision**: Add `permission_epoch` (or `token_version`) integer on `users` (and optionally `roles`/global governance epoch). Embed `permEpoch` and `jti` in access/refresh tokens. On governance-critical changes (role assignment/removal, permission matrix change affecting role, account disable/suspend/delete, password/security change requiring invalidation, tenant suspension), increment affected users' epoch, revoke active refresh sessions, and blacklist active access JTIs where trackable; AuthTokenFilter/JwtAuthFilter validates token epoch against current user epoch on each request (cached with short TTL, max 5s, invalidated on epoch bump). Frontend receives 401/403 with `AUTH_SESSION_INVALIDATED`/`AUTHZ_PERMISSION_REVOKED` and forces re-auth/permission refresh; permission-aware UI polls or refetches effective permissions on focus and after governance mutation, but server enforcement is authoritative.
- **Rationale**: Spec requires immediate in-session cutoff and no stale authorization after revocation. Epoch check gives deterministic server-side cutoff even for already-issued access tokens.
- **Alternatives considered**: Only blacklist known JTIs - insufficient for unknown/distributed tokens and requires complete JTI tracking. Only next sign-in - violates clarification. Short-lived tokens alone - insufficient for immediate cutoff.
- **Risk**: Per-request epoch lookup adds latency; mitigate with Redis/cache keyed by userId+epoch, batched lookups, and latency budget assertions.

### D-004 - Dynamic DB-Driven 5-Action Permission Model (FR-015..FR-018, FR-024, GAP-016)

- **Decision**: Canonical permission key format: `RESOURCE:ACTION` (e.g., `CHURCH:CREATE`) stored in DB. Keep legacy `CAN_CREATE_CHURCH` authorities as aliases during migration; runtime evaluator resolves both. Resources: `CHURCH,MEMBERS,ANNOUNCEMENTS,ROLES,PERMISSIONS,SETTINGS,PASTORS,DEACONS,ELDERS,PROJECTS`. Actions: `CREATE,READ,VIEW,UPDATE,DELETE`. Backend uses `PermissionEvaluator`/`@PreAuthorize("@perm.has('CHURCH','UPDATE')")` or authority mapping; frontend permission service fetches effective permissions from `/api/v1/me/permissions` and caches briefly. Settings UI reads/writes role-permission matrix through API, not hardcoded `permissionGroups`.
- **Rationale**: Current seeder and UI hardcode permission names; runtime changes are not guaranteed. Canonical model supports 5-action matrix and alias mapping.
- **Alternatives considered**: Keep `CAN_*` only - workable but less explicit for 5-action matrix; retained as compatibility alias. OPA/external policy engine - overkill for current scope.

### D-005 - Canonical Idempotent Seeder Baseline (FR-012..FR-014, GAP-015)

- **Decision**: Create a declarative seed manifest (JSON/YAML in classpath, versioned) representing the one-time exported live DB snapshot for users, roles, permissions, and role-permission assignments. Seeder runs idempotent upsert/reconcile: create missing permissions/roles/users, update role-permission mappings to exact baseline for managed roles, preserve immutable identifiers where possible, never delete unexpected user data destructively; report drift in logs/metrics. Root Super Admin is flagged `is_root_super_admin=true` and seeded with protected credentials/bootstrap flow externalized via env/secret. Test bootstrap uses same manifest.
- **Rationale**: Current `Seeder.java` is imperative and drifts from UI-updated DB. Declarative manifest is reviewable and reproducible.
- **Alternatives considered**: Manual Java updates - rejected by FR-012. Flyway SQL only - possible, but harder for idempotent reconciliation across environments; use Flyway for schema and Java/manifest reconciler for data baseline with checksum.

### D-006 - Root Super Admin & Secondary Super Admin Safeguards (FR-029, GAP-009/020)

- **Decision**: Add `users.is_root_super_admin`, `roles.is_protected`, `roles.is_system`. Root Super Admin cannot be deleted/disabled/demoted/role-removed through API/UI; attempts return 403 `GOV_ROOT_SUPER_ADMIN_IMMUTABLE` and create security alert audit. Secondary Super Admin governance mutations (suspend/demote/remove role) require step-up password confirmation: request includes `stepUpPassword` (or short-lived step-up token from `/auth/step-up` endpoint). Step-up validated against current password and recent auth window; failure returns 401/403 per policy without enumeration. Any mutation that would reduce active Super Admin count below 1 is blocked. All actions audited.
- **Rationale**: Clarification requires incident response for secondary Super Admins but immutable Root Super Admin and last-admin protection.
- **Alternatives considered**: Block all Super Admin removals - rejected; conflicts with incident response clarification. Recovery via API - rejected; recovery restricted to seeder/bootstrap.

### D-007 - Sub-Church Explicit Scope (FR-021, GAP-017)

- **Decision**: Model church access as explicit scope assignments: `user_church_scopes(user_id, church_id, granted_by, granted_at)` or equivalent permission scope. Parent church permission does not imply sub-church access; sub-church access does not imply parent access. Authorization checks require `CHURCH:<ACTION>` and scope match for target church/sub-church. APIs accept explicit `churchId`; list endpoints filter by authorized scopes.
- **Rationale**: Clarification selected explicit per scope. Prevents accidental over-access across hierarchy.
- **Alternatives considered**: Inherit/Hybrid - rejected by clarification.

### D-008 - Rate Limiting & 429 Contract (FR-009, GAP-005)

- **Decision**: Apply rate limiting at auth service filter/interceptor layer (Bucket4j/Redis token bucket or equivalent already-compatible dependency) keyed by IP + username hash for sign-in, IP for refresh/reset/request-OTP endpoints, and user+IP for sensitive governance mutations. Return 429 with `code=RATE_LIMITED`, `retryAfterSeconds`, and `Retry-After` header. Limits configurable per environment.
- **Rationale**: No 429 handling exists; brute-force protection required.
- **Alternatives considered**: Gateway-only - acceptable in prod but service must still enforce/return contract in testable way; implement service-level guard with pluggable limiter.

### D-009 - Audit Logging (FR-030, GAP-010)

- **Decision**: Add append-only `audit_log` table/entity with actorUserId, actorUsername, action, resourceType, resourceId, outcome, reasonCode, correlationId, ip, userAgent, before/after JSON (redacted), createdAt. Emit audit for auth events, permission/role changes, governance mutations, profile/security changes, and denied high-risk actions (Root Super Admin mutation attempt, last-admin protection). Provide read-only paginated audit endpoint guarded by `SETTINGS:READ`/`AUDIT:READ` governance permission.
- **Rationale**: Auditable governance is required by spec and constitution. Existing `Auditable` base is insufficient.
- **Alternatives considered**: Log-only - insufficient for inspection endpoint and structured evidence.

### D-010 - Latency & N+1 Verification (FR-033..FR-035, SC-007, GAP-022)

- **Decision**: Define verification harness: Spring Boot integration tests capture request latency with `StopWatch`/Micrometer timers and assert p95 budgets in controlled CI profile; use datasource-proxy or Hibernate statistics to assert max query count for permission resolution and governed list endpoints. Frontend Playwright measures permission-propagation UI update using `performance.now()`/navigation timing and visible-state assertions with <=2s budget after mutation. Exceedances logged as gap evidence; CI marks performance suite as required but environment-calibrated.
- **Rationale**: Spec requires explicit latency budgets and N+1 detection. Quantitative checks make regressions visible.
- **Alternatives considered**: Manual profiling only - rejected; non-repeatable.

## Release-Gate Alignment

| Checklist Area | Plan Coverage |
|---|---|
| CHK001-CHK013 Completeness | D-001..D-010, data model, contracts, 4-layer verification |
| CHK014-CHK021 Clarity | Explicit contracts, observable cutoff/denial semantics, glossary in data model |
| CHK022-CHK027 Consistency | Canonical permission model, alias mapping, unified error contract |
| CHK028-CHK032 Acceptance | Measurable SC mapping in quickstart and verification matrix |
| CHK033-CHK040 Scenario coverage | Layer 2/4 scenarios by module and action |
| CHK041-CHK046 Edge cases | Token reuse, concurrency, account states, Root/last admin, stale permission, audit unavailability |
| CHK047-CHK051 NFRs | Latency/query-count instrumentation, security/audit/reliability gates |
| CHK052-CHK055 Dependencies/assumptions | External deps, baseline capture process, env calibration, naming reconciliation |
| CHK056-CHK060 Ambiguities/conflicts | Governance-critical changes enumerated, alias mapping contract, protected-role conflict rules, cutoff fallback semantics, traceability IDs |

## Open Items (Non-blocking, tracked)

- Exact live DB snapshot capture requires access to the current environment updated via Settings UI; implementation must export snapshot and commit manifest/checksum. Plan includes capture procedure.
- Existing JWT starter capabilities (`mikkytrionze-jwt-security-starter`) must be inspected during implementation; if it cannot support epoch/JTI claims, extend via wrapper in auth/api-service.
- Announcement service is a separate module (`src/api/announcement`); include in cross-service contract and security alignment.
