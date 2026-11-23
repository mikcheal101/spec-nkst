# Feature Specification: Backend Auth Verification & Super Admin Governance

**Feature Branch**: `ENGR-003-backend-auth-super-admin-verification`  
**Created**: 2026-11-21  
**Status**: Draft  
**Input**: User description: "Create a new specification ENGR-003-backend-auth-super-admin-verification (creating and switching to its feature branch from gitspec, without modifying ENGR-002) by inspecting the existing backend controllers, services, security/RBAC guards, and frontend routes to cover: 1. Missed Backend Authentication Verification (closing the ENGR-002 gap): Credential validation, token/session issuance, token refresh rotation, and logout invalidation; Standardized HTTP error contracts (400, 401, 403, 429) for invalid credentials, expired/revoked tokens, and rate limiting. 2. Super Admin Capabilities (Full-Stack): Super admin login, privilege verification, and session persistence; Organization/tenant creation, updates, suspension, and lifecycle management; User management, role/permission assignment, and revocation; System configuration and audit log inspection; Strict RBAC boundary enforcement (denying non-super-admin roles at both the API and UI levels). 3. Super Admin Capability Gap Analysis: Audit existing backend endpoints and frontend routes against standard Super Admin governance (such as self-lockout/last-super-admin protection, audit logging on privilege changes, and unguarded routes); Document any missing or incomplete Super Admin abilities in a dedicated \"Identified Gaps & Recommendations\" section."

## Clarifications

### Session 2026-11-21

- Q: When a user has `CHURCH` permissions for a parent church, should those same permissions automatically apply to its sub-churches? (FR-021) → A: Explicit per scope - permissions apply only to the specific church/sub-church where assigned.
- Q: After a Super Admin changes a role or permission in the database/UI, how quickly must the new access rules take effect for users who are already signed in? (FR-018) → A: Immediate in-session - active sessions reflect changes right away, including already-open pages/actions.
- Q: If a Super Admin tries to remove, disable, or demote the last active Super Admin, what should the system do? (FR-029) → A: Option A (refined): Any active Super Admin may suspend/demote/remove a secondary Super Admin with step-up password confirmation and a security audit event. No one can delete/disable/demote the canonical Root Super Admin or reduce active Super Admin count below 1 via API/UI; attempts return 403 and log a security alert. Root Super Admin recovery is restricted to server/DB seeder bootstrap.
- Q: When a permission is revoked from a signed-in user, should their existing access token/session be cut off immediately, or only blocked on the next permission check? (FR-018, FR-029) → A: Immediate cutoff - revoke/expire active sessions or tokens so access stops right away.
- Q: How should the system capture the "exact current DB state" for users, roles, and the 5-action permission matrix as the canonical seeder baseline? (FR-012) → A: Hybrid - export the live DB snapshot once, then maintain future changes only through reviewed seed/migration updates.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Authentication Lifecycle Verification (Priority: P1)

As a platform operator, I need the backend authentication lifecycle to be verifiably correct and consistently enforced so that only valid credentials create sessions, tokens can be safely refreshed and revoked, and clients receive predictable error responses for every authentication failure mode.

**Why this priority**: Authentication is the trust boundary for all protected capabilities. ENGR-002 verified web behavior but left backend verification gaps; closing them prevents silent security and session regressions.

**Independent Test**: Can be fully tested by exercising sign-in, refresh, sign-out, and protected-resource access with valid, invalid, expired, revoked, and rate-limited scenarios, and verifying the resulting session state and HTTP error contracts without implementing super-admin governance features.

**Acceptance Scenarios**:

1. **Given** a registered active user with valid credentials, **When** they submit a sign-in request, **Then** the system validates credentials, issues an access token and refresh token/session artifact, and returns a success response with the contract required by clients.
2. **Given** a sign-in request with wrong password, unknown username, missing required fields, or malformed payload, **When** the request is processed, **Then** the system rejects it with the standardized error contract for the applicable condition (`400` for validation/malformed input, `401` for invalid credentials) and issues no usable session.
3. **Given** a valid refresh token/session, **When** the client requests token refresh, **Then** the system issues a new access token according to the rotation policy, invalidates or supersedes prior refresh state as defined, and rejects reuse of rotated/revoked refresh tokens.
4. **Given** an expired, revoked, malformed, or missing access token, **When** a client calls a protected endpoint, **Then** the system returns a standardized `401` error contract and does not expose protected data.
5. **Given** an authenticated user with valid tokens, **When** they sign out, **Then** the access token is invalidated for its remaining lifetime, the refresh token/session is invalidated, and subsequent protected or refresh attempts using those tokens fail with standardized `401`.
6. **Given** a client exceeds the allowed authentication attempt or sensitive-auth request threshold, **When** further attempts are made within the limit window, **Then** the system returns a standardized `429` error contract with retry guidance and does not reveal whether credentials were otherwise valid.

---

### User Story 2 - Dynamic DB-Driven Permission Enforcement (Priority: P1)

As a Super Admin, I need roles and permissions to be loaded from the canonical database state and enforced at runtime so that granting or revoking a permission through the Roles & Permissions UI immediately changes what I can do, without code changes or redeploys.

**Why this priority**: The permission model is the control plane for every governed module. If permissions are hardcoded, stale, or not immediately enforced, UI toggles become misleading and privileged operations become unsafe.

**Independent Test**: Can be fully tested by signing in as Super Admin, toggling a specific resource/action permission in Settings -> Roles & Permissions, then immediately retrying the corresponding API mutation and UI action; success/failure must match the current DB permission state.

**Acceptance Scenarios**:

1. **Given** the logged-in Super Admin has `CREATE` permission for a resource in the active DB role matrix, **When** they perform the corresponding create action via UI or API, **Then** the operation succeeds and the result reflects the authorized mutation.
2. **Given** the logged-in Super Admin has a permission removed/toggled off in DB or via the Roles & Permissions UI, **When** they attempt the corresponding API operation, **Then** the backend returns standardized `403 Forbidden` and no mutation occurs.
3. **Given** the same permission was removed, **When** the Super Admin views or interacts with the frontend, **Then** the affected action is hidden, disabled, or blocked with safe denial behavior immediately after permission refresh, without requiring code change or redeploy.
4. **Given** the system evaluates permissions for `CREATE`, `READ`, `VIEW`, `UPDATE`, and `DELETE` across governed resources, **When** authorization is resolved, **Then** decisions are based on active DB role/permission mappings and effective user assignments, not hardcoded role names or static frontend-only rules.

---

### User Story 3 - Super Admin Full-Stack Governance Across Modules (Priority: P1)

As a Super Admin, I need exclusive, permission-aware governance across churches/sub-churches, members, announcements, roles/permissions, and my profile/security controls so that I can operate the platform safely with auditable boundaries.

**Why this priority**: These are the core governance modules exposed by the platform. They must be verified against active DB permissions and Super Admin safeguards.

**Independent Test**: Can be fully tested by exercising each module as Super Admin with required permissions, then removing relevant permissions or using non-super-admin actors to confirm API/UI denial and audit behavior.

**Acceptance Scenarios**:

1. **Given** an active Super Admin account, **When** they sign in, **Then** the system issues a valid session, resolves effective DB permissions, and preserves the session across permitted reload/restart flows.
2. **Given** an authenticated Super Admin with active `CHURCH` permissions, **When** they create/update/suspend/reactivate/review a parent church or sub-church, **Then** the change is applied only when allowed, sub-church scope/inheritance rules are enforced, and an audit event is recorded.
3. **Given** an authenticated Super Admin with active `MEMBERS` permissions, **When** they manage baptised and non-baptised members, **Then** list/filter/status transitions and mutations are enforced against active DB permissions and member state rules.
4. **Given** an authenticated Super Admin with active `ANNOUNCEMENTS` permissions, **When** they create, view/read, update, or delete announcements, **Then** operations and church/sub-church visibility scoping follow active DB permissions.
5. **Given** an authenticated Super Admin with active `ROLES`/`PERMISSIONS`/`SETTINGS` permissions, **When** they edit role matrices, role protection controls, or system settings, **Then** changes propagate at runtime, are audited, and self-lockout/last-Super-Admin safeguards prevent unrecoverable governance states.
6. **Given** an authenticated Super Admin, **When** they view/update their profile and security controls (password change, session/token invalidation), **Then** the system enforces required permission/policy checks, invalidates affected sessions as specified, and records audit events.
7. **Given** a non-super-admin or unauthenticated user, **When** they attempt Super Admin/governed API endpoint or UI route/action, **Then** the API returns standardized `401`/`403` as appropriate, the UI prevents access safely, and no privileged mutation occurs.

---

### User Story 4 - Governance Gap Audit & Performance Verification (Priority: P2)

As a security and platform reviewer, I need a documented audit of dynamic permission enforcement, module coverage, and auth/permission latency so that missing protections and slow DB-driven authorization paths are visible and actionable.

**Why this priority**: Dynamic DB authorization can introduce unguarded endpoints, stale caches, or slow lookups. A gap and latency audit prevents false confidence.

**Independent Test**: Can be fully tested by reviewing the gap analysis against inspected code surfaces and by executing timed verification scenarios for auth endpoints, permission resolution, mutations, and UI transitions.

**Acceptance Scenarios**:

1. **Given** the current backend endpoints, DB seeders/migrations, permission services, and frontend routes, **When** they are audited against the dynamic 5-action model, **Then** the specification documents gaps with evidence, risk, severity, and recommendation.
2. **Given** auth and permission-sensitive operations, **When** timed verification runs, **Then** results are evaluated against explicit latency budgets and slow DB permission lookups/N+1 patterns are flagged.
3. **Given** an endpoint or route that appears protected, **When** audited, **Then** the result distinguishes true enforcement, partial enforcement, stale/hardcoded enforcement, and unguarded/overly permissive access.

---

### Edge Cases

- What happens when a refresh token is presented after logout, after access-token revocation, after expiry, or after rotation has already replaced it?
- How does the system handle concurrent refresh requests using the same refresh token during rotation?
- What happens when a sign-in attempt targets a disabled, locked, suspended, or deleted account?
- How does the system respond when authentication rate limits are exceeded from the same user, IP, device, or distributed source?
- What happens when a Super Admin attempts to remove their own Super Admin role, disable their own account, demote/suspend a secondary Super Admin, or target the canonical Root Super Admin/last remaining Super Admin? Secondary Super Admin incident-response changes require step-up confirmation and audit logging; Root Super Admin or last-Super-Admin removal attempts are blocked with `403` and a security alert.
- How does the system handle privilege changes for a user with an active session?
- What happens when an organization/tenant is suspended while users belonging to it are signed in or attempting sign-in?
- How does the system handle audit log inspection requests when audit storage is unavailable or incomplete?
- What happens when a frontend route is hidden but the corresponding API endpoint is directly called by a non-super-admin user?
- How does the system handle malformed tokens, missing claims, unsupported token type, or tokens signed with unexpected keys?
- What happens when a permission is toggled off in the DB/UI while a Super Admin is mid-session or has stale frontend permission state? The system must apply the change immediately in-session, cut off affected active access immediately, and block any subsequent action/UI operation.
- How does the system handle sub-church permission scoping when a user has `CHURCH` permission at parent scope but not for a specific sub-church context (or vice versa)? The system must deny the sub-church action unless the user has explicit permission assigned for that sub-church scope.
- What happens when a role is locked/protected but an admin attempts to edit/delete it, or when role matrix edits would remove required governance permissions?
- How does the system handle baptised vs. non-baptised member status transitions when the actor lacks `UPDATE` or specific workflow permission?
- What happens when DB permission lookup latency spikes or an N+1 query occurs during authorization for high-frequency endpoints?

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication, Session, and Error Contracts

- **FR-001**: The system MUST validate sign-in credentials against authoritative user identity state and reject invalid, missing, or malformed credential submissions without creating a session.
- **FR-002**: The system MUST issue an access token and refresh token/session artifact only after successful authentication and authorization-context resolution for an eligible active account.
- **FR-003**: The system MUST define and enforce token/session lifetimes, including access-token expiry and refresh-token/session expiry. Defaults: access token TTL = 15 minutes, refresh token/session TTL = 7 days (configurable per environment); expired tokens MUST be rejected with standardized `401` and never extended silently.
- **FR-004**: The system MUST support refresh-token rotation or equivalent one-time-use refresh protection so that a refresh token cannot be reused indefinitely after rotation, logout, or revocation.
- **FR-005**: The system MUST invalidate refresh tokens/sessions on logout and MUST invalidate or reject access tokens for their remaining lifetime according to the revocation strategy. The same immediate-cutoff revocation strategy MUST apply to governance-critical permission/role revocations and account-state changes.
- **FR-006**: The system MUST protect all non-public endpoints with authentication checks and return a standardized `401` response for missing, expired, malformed, revoked, or otherwise invalid authentication.
- **FR-007**: The system MUST enforce authorization checks for privileged endpoints and return a standardized `403` response when an authenticated actor lacks required privilege.
- **FR-008**: The system MUST return a standardized `400` response for invalid request syntax, missing required fields, or request validation failures on authentication and governance endpoints.
- **FR-009**: The system MUST apply rate limiting or equivalent abuse protection to sensitive authentication endpoints and return a standardized `429` response when limits are exceeded. Default configurable thresholds: sign-in = 5 attempts / username+IP / 15 min; refresh = 30 requests / IP / 15 min; password-reset/request-OTP = 3 requests / IP / 15 min; step-up/sensitive governance mutations = 10 requests / user+IP / 15 min. Limits MUST be externalized via config, enforced via Redis token bucket/counter with in-memory fail-safe fallback for local/test only, and responses MUST include `Retry-After` and `details.retryAfterSeconds`.
- **FR-010**: The standardized error contract for `400`, `401`, `403`, and `429` MUST include machine-readable error identity, human-readable message, timestamp, request/correlation identifier where available, and relevant retry/validation details without leaking secrets or sensitive internal state.
- **FR-011**: The system MUST ensure authentication and governance responses do not disclose whether a username, phone number, account state, or token identifier exists beyond what is necessary for the standardized contract.

#### Canonical Seeder & DB Role/Permission Baseline

- **FR-012**: The system MUST inspect existing user, role, and permission seeders/migrations and the current database state updated via Settings -> Roles & Permissions UI, export that live DB snapshot once as the authoritative baseline, and codify it into idempotent seed/migration definitions. After baseline capture, future role/permission/user baseline changes MUST be maintained only through reviewed seed/migration updates so the canonical seed baseline remains reproducible.
- **FR-013**: The canonical seed baseline MUST include the current role set (including `SUPER ADMIN`, `CHURCH ADMIN`, `PASTOR`, `ELDER`, and any other active DB roles) and their 5-action permission mappings (`CREATE`, `READ`, `VIEW`, `UPDATE`, `DELETE`) across all governed resources.
- **FR-014**: The seeder MUST be idempotent so subsequent startups and test runs reliably initialize or reconcile to the exact updated role and permission matrix without duplicate records, unintended privilege drift, or destructive loss of required governance roles.

#### Dynamic Content-Driven Permission Evaluation

- **FR-015**: The system MUST load roles and 5-action permission dimensions (`CREATE`, `READ`, `VIEW`, `UPDATE`, `DELETE`) from the active DB state at runtime for authorization decisions; permission evaluation MUST NOT be hardcoded in backend business logic or frontend-only guards.
- **FR-016**: When a permission is granted in DB/UI for the logged-in Super Admin, the corresponding operation MUST succeed if otherwise valid; when a permission is removed/toggled off in DB or via the Roles & Permissions UI, the backend MUST immediately enforce `403 Forbidden` and the frontend MUST immediately restrict/hide/disable the action without requiring code change or redeploy.
- **FR-017**: The permission model MUST cover governed resources including `CHURCH`, `MEMBERS`, `ANNOUNCEMENTS`, `ROLES`, `PERMISSIONS`, `SETTINGS`, `PASTORS`, `DEACONS`, `ELDERS`, and `PROJECTS`, and MUST define how resource/action aliases used by API/UI map to canonical DB permissions.
- **FR-018**: The system MUST define a permission-refresh/propagation behavior so active sessions receive updated effective permissions immediately in-session, including already-open pages/actions. When permissions/roles are revoked or governance-critical account state changes, the system MUST immediately cut off active access by revoking/expiring affected sessions or tokens; stale permission caches MUST NOT authorize any request after revocation.

#### Domain Modules Evaluated Against Active DB Permissions

- **FR-019**: The system MUST allow Super Admin users to authenticate through the same secure sign-in lifecycle while receiving Super Admin authorization context and effective DB permissions required for governance actions.
- **FR-020**: The system MUST persist Super Admin sessions according to secure token/session rules while preserving Super Admin authorization boundaries and effective permission checks on every protected request.
- **FR-021**: Churches & Sub-Churches (organization/tenant lifecycle mapping): The system MUST enforce active `CHURCH` permissions for parent church and sub-church create/read/view/update/delete/lifecycle operations. **Domain mapping**: `Church`/tenant entity (`churches`) with `id` PK, `parent_church_id` FK nullable, `name` string, `status` enum `ACTIVE,SUSPENDED,INACTIVE,ARCHIVED`, `type` `PARENT,SUB_CHURCH`. APIs: `/api/v1/churches`, `/api/v1/churches/{id}`, `/api/v1/churches/{id}/status`, `/api/v1/churches/{id}/sub-churches` (or equivalent) in `src/api/api-service`. UI: `src/web/src/pages/Churches.tsx`, `src/web/src/pages/ChurchDetail.tsx`. Allowed status transitions: `ACTIVE<->SUSPENDED`, `ACTIVE->INACTIVE`, `SUSPENDED->ACTIVE|INACTIVE`, `INACTIVE->ARCHIVED`; `ARCHIVED` is read-only unless explicit restore policy is approved. Tenant suspension MUST block new sign-ins for tenant-scoped users and trigger immediate session/token cutoff for active tenant-scoped sessions (FR-005). Sub-church permissions are explicit per scope: permissions apply only to the specific church/sub-church where assigned and do not automatically inherit from a parent church.
- **FR-022**: Members (Baptised & Non-Baptised): The system MUST enforce active `MEMBERS` permissions for member workflows, including baptised vs. non-baptised filtering/status transitions and mutations, and MUST prevent unauthorized state transitions.
- **FR-023**: Announcements: The system MUST enforce active `ANNOUNCEMENTS` permissions for creation, viewing/reading, updating, deleting, and church/sub-church visibility scoping.
- **FR-024**: Roles & Permissions Management: The system MUST enforce active `ROLES`/`PERMISSIONS`/`SETTINGS` permissions for editing role matrices across `CREATE`, `READ`, `VIEW`, `UPDATE`, `DELETE`, role lock/protection controls, and runtime propagation of permission changes.
- **FR-025**: Super Admin Profile Page: The system MUST enforce permission/policy checks for viewing/updating personal info and security controls (password change, session/token invalidation), and MUST invalidate affected sessions/tokens when security-sensitive profile changes require it.
- **FR-026**: The system MUST provide Super Admin-only organization/tenant lifecycle management capabilities, including creation, update, suspension, reactivation, status visibility, and lifecycle governance. **Explicit mapped alias**: in the current platform, FR-026 is fulfilled by FR-021 Church/Sub-Church tenant lifecycle (same `churches`/`user_church_scopes` domain, `CHURCH:*` permissions, lifecycle transitions, audit events, and suspension cutoff behavior). No separate tenant entity/endpoint set is introduced unless approved; any future non-church tenant type MUST reuse this lifecycle contract and be mapped by an approved follow-up spec.
- **FR-027**: The system MUST provide Super Admin-only user management capabilities, including listing/viewing users, provisioning authorized accounts, assigning/revoking roles and direct permissions as policy allows, disabling/enabling/reactivating accounts, and safeguard checks. **Domain mapping**: `UserAccount` (`users`/roles/user_permissions) in `src/api/auth`; APIs `/api/v1/users`, `/api/v1/users/{id}`, `/api/v1/users/{id}/status`, `/api/v1/users/{id}/roles` (or equivalent) in auth/governance service; UI `src/web/src/pages/Admins.tsx` or Settings Admin Users section. All mutations require server-side RBAC, audit logging, and immediate cutoff when governance-critical (FR-005/FR-018).
- **FR-028**: The system MUST provide Super Admin-only system configuration management and audit log inspection capabilities, with read access scoped to authorized governance actors. **Domain mapping**: `SystemConfiguration` (`system_configurations`: `id`, `key`, `value`, `scope`, `description`, `updated_by`, `updated_at`, version/optimistic lock as needed) and `AuditLog` (`audit_log`) in governed backend service; APIs `/api/v1/system-configurations`, `/api/v1/system-configurations/{key}` (or id), `/api/v1/audit-logs`; UI `src/web/src/pages/Settings.tsx` configuration section and `AuditLogs` view/section. Configuration changes and audit-log access MUST be RBAC-enforced, audited, redacted where sensitive, and paginated.

#### Governance Safeguards & Auditability

- **FR-029**: The system MUST prevent governance actions that would create an unrecoverable platform state. Any active Super Admin MAY suspend, demote, or remove a secondary Super Admin for incident response only after step-up password confirmation, and the action MUST record a security audit event. No actor (including the Root Super Admin or any peer Super Admin) may delete, disable, or demote the canonical/seeded Root Super Admin, or reduce the active Super Admin count below 1, through API/UI; such attempts MUST return standardized `403 Forbidden`, MUST NOT mutate state, and MUST log a security alert. Root Super Admin recovery is restricted to server/DB seeder/bootstrap procedures.
- **FR-030**: The system MUST record audit events for privileged governance actions, including authentication/session security events where applicable, organization/tenant lifecycle changes, user governance changes, role/permission changes, system configuration changes, and security-sensitive profile/session changes.
- **FR-031**: The system MUST enforce RBAC boundaries server-side for every governed capability; UI route hiding or client-side checks MUST NOT be treated as sufficient authorization.
- **FR-032**: The frontend MUST restrict governed routes/actions to authorized users based on effective DB permissions and provide safe denial behavior for unauthorized authenticated users.

#### Latency & Performance Verification

- **FR-033**: Verification MUST include explicit response-time/latency assertions for backend auth endpoints (sign-in, refresh, sign-out, password/session-sensitive operations), dynamic permission resolution, and permission-gated API mutations. Measurement: controlled CI/local baseline, 1 warmup run excluded, >=20 measured samples per endpoint/flow, report p50/p95/max; p95 budgets per SC-007.
- **FR-034**: Verification MUST include explicit latency/assertions for frontend UI transitions affected by permission checks (route guard resolution, action visibility/disablement after permission change, and module page load for governed views). Measurement: Playwright timing/assertion over >=20 runs or >=10 CI runs with documented baseline; propagation/action-visibility <=2s p95.
- **FR-035**: Verification MUST detect or flag slow DB permission lookups and N+1 query patterns in permission resolution and governed list/mutation flows; findings MUST be recorded in gap analysis when thresholds are exceeded or query patterns are inefficient. Harness: datasource-proxy/Hibernate statistics in integration profile with max-query-count thresholds per endpoint (defined in plan/tests), fail or gap-log on exceedance.

#### Gap Analysis Deliverable

- **FR-036**: The specification MUST include an "Identified Gaps & Recommendations" section that documents missing or incomplete dynamic 5-action permission checks, unguarded endpoints, sub-church permission scoping gaps, stale-permission propagation gaps, missing Super Admin safeguards, and latency/performance risks, with evidence, risk, severity, and recommendation.

### Key Entities *(include if feature involves data)*

- **User Account**: Identity record used for authentication; includes credential verifier, account status, organization/tenant association, assigned roles/permissions, and governance flags such as canonical Root Super Admin where applicable.
- **Authentication Session / Refresh Token**: Server-tracked refresh/session artifact tied to a user and token identifier; includes issuance time, expiry, rotation/revocation state, and invalidation reason.
- **Access Token**: Short-lived authorization credential presented to protected endpoints; includes subject, authorization claims, expiry, and token identifier used for revocation checks.
- **Role**: Named governance role (e.g., `SUPER ADMIN`, `CHURCH ADMIN`, `PASTOR`, `ELDER`) with active/inactive state, protection/lock metadata, and assigned permission set.
- **Permission**: Canonical action-resource capability using 5-action model (`CREATE`, `READ`, `VIEW`, `UPDATE`, `DELETE`) scoped to governed resources (`CHURCH`, `MEMBERS`, `ANNOUNCEMENTS`, `ROLES`, `PERMISSIONS`, `SETTINGS`, `PASTORS`, `DEACONS`, `ELDERS`, `PROJECTS`).
- **Role-Permission Matrix**: Effective mapping of roles to permission actions/resources; canonical seed baseline and runtime authorization source.
- **Organization / Tenant (Church / Sub-Church)**: Managed organizational unit with lifecycle state (active, suspended, inactive/archived as defined), parent/sub-church relationship, and scoped visibility/governance rules.
- **Member Record**: Person record with membership/baptism state (baptised/non-baptised), church/sub-church association, and governed mutation history.
- **Announcement**: Communication record with content, publication/update state, author/actor metadata, and church/sub-church visibility scope.
- **System Configuration**: Governance-controlled setting affecting platform behavior; includes key, value, scope, last changed metadata, and audit trace.
- **Audit Log Entry**: Immutable or append-only governance record capturing actor, action, target, outcome, timestamp, correlation/request context, and relevant before/after metadata where safe.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of defined authentication lifecycle scenarios (valid sign-in, invalid credentials, refresh, refresh reuse/revocation, logout invalidation, expired/invalid token access) pass automated verification with the expected outcome.
- **SC-002**: 100% of authentication and governance error scenarios covered by this spec return the standardized contract for `400`, `401`, `403`, or `429` as applicable, with no secret leakage.
- **SC-003**: 100% of in-scope governed endpoints and UI actions enforce active DB permissions for `CREATE`, `READ`, `VIEW`, `UPDATE`, `DELETE`; permission revocation causes backend `403` and frontend restriction without redeploy.
- **SC-004**: The canonical seeder is idempotent and reproducibly initializes the exact current DB role/permission/user baseline across repeated startup/test runs with no drift.
- **SC-005**: 100% of privileged governance mutations covered by this spec produce an audit log record containing actor, action, target, timestamp, and outcome.
- **SC-006**: 100% of identified Super Admin-only/gov-guarded endpoints and UI routes deny access to unauthenticated and unauthorized actors in verification tests.
- **SC-007**: Auth and permission-sensitive verification scenarios meet explicit latency budgets: p95 <= 500 ms for sign-in/refresh/sign-out in test environment baseline, p95 <= 300 ms for permission-gated API mutations/reads excluding external dependencies, and <= 2 s for immediate in-session UI permission propagation/action-visibility updates after a role/permission change; any exceedance is documented as a gap with evidence.
- **SC-008**: Reviewers can trace every identified governance/permission/latency gap in this specification to a concrete inspected code surface and a recommended remediation action.

## Assumptions

- ENGR-002 remains unchanged; this specification closes backend verification and governance gaps and may reference ENGR-002 behavior but does not modify its scope.
- "Super Admin" corresponds to the existing highest-privilege governance role concept in the platform (`SUPER_ADMIN` / `SUPER ADMIN`) unless product governance defines an equivalent replacement.
- The current web client is the primary UI in scope; mobile-specific behavior is out of scope except where shared backend contracts are affected.
- Organization/tenant lifecycle management maps to church/sub-church governance in the current domain; where entities/endpoints are incomplete, the gap analysis must document the missing capability and implementation plan must resolve it.
- Audit log inspection means authorized read access to security/governance audit records; immutable external audit storage is desirable but not assumed unless already present.
- Rate limiting may be implemented at service or edge layer, but externally observable `429` contract and enforcement behavior are in scope.
- The "current DB state updated via Settings -> Roles & Permissions UI" is the authoritative source for the initial canonical baseline capture; after that one-time export/codification, reviewed seed/migration updates are the authoritative mechanism for future baseline evolution.
- Latency budgets are verification baselines for local/CI test environments and should be calibrated during implementation if environment characteristics differ; regressions beyond budget require gap/remediation tracking.

## Identified Gaps & Recommendations *(mandatory)*

| ID | Surface | Current Behavior (Evidence) | Risk | Severity | Recommendation |
|---|---|---|---|---|---|
| GAP-001 | Auth error contracts | `AuthEntryPoint.commence` returns `sendError(401, "Error: Unauthorized!")`; auth `GlobalExceptionHandler` only handles `MethodArgumentNotValidException` and returns plain `String` body; api-service uses `ErrorResponse` but auth service does not consistently use a structured contract. | Clients receive inconsistent error shapes; 401/403/429 cannot be reliably handled; security observability is weak. | Critical | Define a single structured error contract for auth and governance services, map 400/401/403/429 consistently, include correlation/timestamp/error code, and add contract tests. |
| GAP-002 | Invalid credential handling | `AuthController.authenticateUser` delegates to `AuthenticationManager`; no explicit mapping for `BadCredentialsException`/disabled/locked cases in auth exception handler. | Invalid credentials may surface as generic 500/undescribed failures; error contract and security semantics are ambiguous. | Critical | Map authentication failures to standardized `401` (or policy-defined account-state code) without credential enumeration; add negative integration tests. |
| GAP-003 | Refresh rotation/reuse protection | `RefreshTokenServiceImpl.getRefreshToken` finds token, checks expiry, issues new access token via `jwtUtil.generateToken(username)` but does not rotate refresh token, persist rotated state, detect reuse, or revoke old token; response returns only `refreshToken` field name while carrying access token. | Refresh token reuse and stolen-token replay risk; contract mismatch breaks clients and verification. | Critical | Implement rotation with one-time-use refresh tokens, persist replacement/revocation metadata, reject reuse, and align response contract with client expectations; add concurrency/replay tests. |
| GAP-004 | Logout invalidation completeness | `AuthServiceImpl.logOutUser` blacklists access token JTI best-effort and deletes refresh token row; on blacklist failure it logs warning and continues. | Logout may appear successful while access token remains usable until expiry. | High | Make revocation failures explicit per policy, return auditable failure or retry-safe compensation, and verify post-logout token rejection in integration/E2E tests. |
| GAP-005 | Rate limiting / 429 | No rate limiting/filter/interceptor for auth endpoints found in `src/api/auth` or `src/api/api-service`; no `429` handling. | Credential stuffing, OTP abuse, and brute-force attempts are not consistently throttled. | Critical | Add rate limiting for sign-in, refresh, password reset request/confirm, and sensitive governance endpoints; return standardized `429` with retry metadata. |
| GAP-006 | Role endpoint exposure | `WebSecurityConfig` in auth service permits `/api/v1/roles/**` (`permitAll`) while `RoleController` also has method-level `@PreAuthorize`. | Misconfiguration can expose role-management endpoints if method security is bypassed/misconfigured; defense-in-depth is weak. | Critical | Remove overly permissive route match, require authentication by default, and enforce explicit Super Admin/governance authorities server-side. |
| GAP-007 | Auth service authorization model | `RoleController` uses `can_view_roles`/`can_read_roles`/`can_update_roles`/`can_delete_role`; no `SUPER_ADMIN` authority checks. | Fine-grained permissions may be granted to unintended roles; no explicit Super Admin governance boundary. | High | Define Super Admin governance policy: either require `SUPER_ADMIN` for governance endpoints or formally document and test delegated permission model with least privilege. |
| GAP-008 | Super Admin lifecycle governance endpoints | No tenant/organization lifecycle, suspension, system configuration, audit-log inspection, or Super Admin user-management controllers found in inspected API modules. | Spec-required Super Admin capabilities are missing/incomplete; governance cannot be operated end-to-end. | Critical | Add dedicated governance APIs with RBAC, audit logging, pagination/filtering, and contract tests; document migration/compatibility impacts. |
| GAP-009 | Self-lockout / last Super Admin protection | No checks found preventing removal/disablement/demotion of last active Super Admin. | Platform can become irrecoverable, requiring manual database intervention. | High | Add domain invariant checks before role revocation, suspension, deletion, or privilege downgrade; cover with unit/integration tests. |
| GAP-010 | Audit logging for privilege/governance changes | `Auditable` base classes exist, but no audit-log inspection endpoint and no evidence of comprehensive security/governance audit events for role/permission/config changes. | Privileged actions lack traceability and incident response evidence. | High | Implement audit event model/store, emit events for auth and governance mutations, provide authorized read/query API, and redact sensitive fields. |
| GAP-011 | Frontend Super Admin boundary | Web routes are guarded by `ProtectedRoute`/`PermissionRoute` permission strings; there is no explicit Super Admin route guard or dedicated governance area. `PermissionRoute` redirects unauthorized users to dashboard with toast but does not model 401 vs 403 consistently. | Unauthorized users may discover route existence; privileged governance UX may be inconsistently protected. | Medium | Add explicit Super Admin route guard, align UI denial behavior with API 401/403 semantics, and add E2E tests for direct URL access and hidden-action protection. |
| GAP-012 | Dashboard/ungoverned endpoints | `DashboardController.getCounters` has no `@PreAuthorize` and class has no explicit authority guard; security config requires authentication but not fine-grained authorization. | Authenticated low-privilege users may access data beyond intended scope. | Medium | Review all controllers for least-privilege authorization, add explicit authority/role guards, and maintain an endpoint authorization matrix. |
| GAP-013 | Auth endpoint response contract mismatch | `AuthController` returns `SignInResponse {token, refreshToken}`, `register` returns `Boolean`, `sign-out` returns `Boolean`; web `api.ts` expects different shapes (`accessToken`, `refreshToken`, `tokenType`, `expiresIn`, `data.message`). | Client/server contract drift causes fragile auth flows and complicates verification. | High | Publish versioned auth contracts, add contract tests against web/mobile consumers, and provide compatibility adapters during migration. |
| GAP-014 | Session revocation on privilege change | No evidence that role/permission revocation, account suspension, or tenant suspension invalidates active sessions/tokens. | Demoted or suspended users may retain access until token expiry. | High | Define revocation policy (immediate blacklist, token versioning, or session invalidation) and enforce on governance changes with tests. |
| GAP-015 | Seeder drift from current DB role/permission state | `Seeder.java` seeds roles/permissions/users, but it is not verified to mirror the exact current DB state updated through Settings -> Roles & Permissions UI; no evidence of idempotent reconciliation to a canonical exported matrix. | Environments/tests may initialize with stale or incorrect permissions, causing false positives/negatives and privilege drift. | Critical | Inspect current DB state and seeder/migrations; generate canonical idempotent seed baseline for users/roles/5-action permission mappings; add startup/test idempotency verification. |
| GAP-016 | Hardcoded/static permission evaluation | Frontend `Settings.tsx` contains hardcoded `permissionGroups` and action model; backend authorization uses mixed `@PreAuthorize` authority strings and role-name checks in places. | Permission toggles may not reflect true runtime enforcement; code changes/redeploys may be required for policy updates. | Critical | Move permission definitions and effective-permission resolution to DB-driven runtime model; map UI/API actions to canonical permission keys; add tests proving no-redeploy runtime enforcement. |
| GAP-017 | Sub-church permission scoping | Church endpoints enforce coarse `can_*_church` authorities; no explicit evidence of parent/sub-church scope inheritance rules in `ChurchController`/service contracts. | Users may gain or be denied access incorrectly across parent/sub-church boundaries. | High | Define and enforce sub-church scope model (inherit, explicit, or hybrid) in domain/service/API; add tests for parent/sub-church create/read/update/delete/suspend visibility. |
| GAP-018 | Baptised/non-baptised member workflow enforcement | Member endpoints use coarse `can_*_members` authorities; no explicit evidence in controller layer for baptised/non-baptised filtering/status-transition authorization rules. | Unauthorized member state transitions or visibility leaks may occur. | High | Model member baptism/status transitions as governed operations; enforce active `MEMBERS` action permissions and state rules server-side; add API/UI tests for baptised and non-baptised flows. |
| GAP-019 | Announcement visibility scoping | Announcement module not fully inspected in this pass; governance requires church/sub-church visibility scoping against active `ANNOUNCEMENTS` permissions. | Announcements may leak across church boundaries or allow unauthorized mutations. | High | Audit announcement endpoints/services/UI for 5-action checks and church/sub-church scope; add contract/integration/E2E coverage. |
| GAP-020 | Role lock/protection & self-lockout safeguards | No evidence of role lock/protection controls or last-Super-Admin/self-lockout invariant checks in role/user management paths. | Admins may lock system by deleting/demoting last Super Admin or editing protected roles. | Critical | Add protected-role metadata, invariant checks, and audited denial responses for unsafe governance mutations; cover with unit/integration tests. |
| GAP-021 | Permission propagation latency/staleness | No explicit permission versioning/cache invalidation/refresh contract observed; frontend may hold stale permission state until reload/token refresh. | Revoked permissions may remain effective in UI or active sessions beyond acceptable window. | High | Define propagation SLA and mechanism (token claims version, permission fetch, cache invalidation); add timed tests for revocation propagation. |
| GAP-022 | Auth/permission latency & N+1 risk | No explicit latency budgets or query-count assertions for auth endpoints, permission resolution, or governed mutations; dynamic DB permission checks can introduce N+1 lookups. | Slow authorization paths degrade UX and can cause timeouts under load; regressions go unnoticed. | Medium | Add latency budgets, query-count/performance assertions, and profiling in CI for auth/permission-critical flows; optimize with bounded caching/batching where safe. |

## Dependencies

- Existing auth service endpoints in `src/api/auth/` and security filters/configuration.
- Existing JWT/security starter and token blacklist/repository infrastructure.
- Existing user/role/permission seeders, migrations, and DB state managed through Settings -> Roles & Permissions.
- Existing web authentication routes, guards, auth context, and governed module pages in `src/web/`.
- ENGR-002 web auth E2E verification baseline for non-overlapping coverage alignment.
- Audit/event storage capability for governance and security event traceability.
- Rate-limiting capability at service or edge layer with observable response metadata.
- Test environment capable of measuring API latency, UI transition timing, and query/query-count behavior.

## Scope Boundaries

### In Scope

- Backend authentication lifecycle verification for sign-in, refresh, logout, invalidation, protected access, and `400/401/403/429` error contracts.
- Canonical idempotent seeder synchronization for the exact current DB users/roles/5-action permission matrix.
- Dynamic DB-driven runtime permission evaluation and immediate propagation across API and web UI.
- Super Admin governance across churches/sub-churches, members (baptised/non-baptised), announcements, roles/permissions management, and Super Admin profile/security controls.
- Explicit latency/performance verification for auth endpoints, permission resolution, permission-gated mutations, and permission-driven UI transitions.
- Codebase audit and documented governance/permission/latency gaps and recommendations.

### Out of Scope

- Mobile-specific UX implementation details beyond shared backend contract impact.
- Redesign of unrelated business domains not required for Super Admin governance.
- Replacing the existing identity stack unless required by an approved follow-up decision.
- Production load/stress testing beyond targeted latency/regression verification for in-scope flows.

