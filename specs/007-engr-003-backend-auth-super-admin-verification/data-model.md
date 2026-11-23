# Data Model: ENGR-003 Backend Auth Verification & Super Admin Governance

**Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

## Design Principles

- DB is the runtime source of truth for roles/permissions (FR-015).
- Canonical permission keys are `RESOURCE:ACTION`; legacy `CAN_*` authorities are compatibility aliases.
- Governance-critical changes trigger immediate session/permission cutoff (FR-005, FR-018).
- Root Super Admin is immutable through API/UI; recovery is bootstrap/seeder only (FR-029).
- Sub-church access is explicit per scope; no parent inheritance (clarification).

## Entities

### UserAccount (`users`)

| Field | Type | Rules |
|---|---|---|
| `id` | PK | Existing identity |
| `username` | string, unique, not null | Login identifier |
| `password_hash` | string, not null | BCrypt/approved hash; never exposed |
| `account_status` | enum `ACTIVE,DISABLED,LOCKED,SUSPENDED,DELETED` | Disabled/locked/suspended/deleted cannot authenticate |
| `is_root_super_admin` | boolean, default false | Immutable governance flag; only seeder/bootstrap may set true for canonical root account |
| `permission_epoch` | bigint/int, default 0 | Increment on governance-critical changes; token epoch mismatch => 401/403 cutoff |
| `last_security_change_at` | timestamp | Password/credential/security invalidation marker |
| `created_at/updated_at` | timestamp | Auditable |

**Relationships**: many-to-many roles (`user_roles`), many-to-many direct permissions optional (`user_permissions`, discouraged; prefer roles), one-to-many refresh sessions, one-to-many church scopes.

### Role (`roles`)

| Field | Type | Rules |
|---|---|---|
| `id` | PK | |
| `name` | enum/string, unique | Includes `SUPER_ADMIN`, `CHURCH_ADMIN`, `PASTOR`, `ELDER`, active DB roles |
| `display_name` | string | UI label |
| `is_system` | boolean | System roles cannot be deleted casually |
| `is_protected` | boolean | Protected roles require safeguard checks before mutation |
| `description` | string | Optional |
| `active` | boolean | Inactive roles not granted |

**Relationships**: many-to-many permissions (`role_permissions`), many-to-many users.

### Permission (`permissions`)

| Field | Type | Rules |
|---|---|---|
| `id` | PK | |
| `key` | string, unique, not null | Canonical `RESOURCE:ACTION`, e.g. `CHURCH:CREATE` |
| `resource` | enum/string | `CHURCH,MEMBERS,ANNOUNCEMENTS,ROLES,PERMISSIONS,SETTINGS,PASTORS,DEACONS,ELDERS,PROJECTS` |
| `action` | enum | `CREATE,READ,VIEW,UPDATE,DELETE` |
| `legacy_alias` | string, nullable, unique | e.g. `CAN_CREATE_CHURCH` for compatibility |
| `active` | boolean | |

**Validation**: `(resource, action)` unique; `key` must match canonical format.

### RolePermissionMatrix (`role_permissions`)

| Field | Type | Rules |
|---|---|---|
| `role_id` | FK | |
| `permission_id` | FK | |
| `granted_at` | timestamp | |
| `granted_by` | actor id | Audit |

**Uniqueness**: `(role_id, permission_id)`.

### RefreshSession (`refresh_tokens` / `auth_sessions`)

| Field | Type | Rules |
|---|---|---|
| `id` | PK | |
| `user_id` | FK, not null | |
| `token_jti` | string, unique, not null | Refresh token identifier |
| `family_id` | string, not null | Rotation/reuse detection group |
| `token_hash` | string, not null | Store hash, never raw token if feasible |
| `expires_at` | timestamp, not null | |
| `issued_at` | timestamp, not null | |
| `rotated_at` | timestamp, nullable | Set when replaced |
| `revoked_at` | timestamp, nullable | Set on logout/reuse/cutoff |
| `replaced_by_jti` | string, nullable | Rotation chain |
| `revocation_reason` | enum/string | `LOGOUT,ROTATED,REUSE_DETECTED,PERMISSION_REVOKED,ACCOUNT_STATE_CHANGE,ADMIN_ACTION,PASSWORD_CHANGE` |
| `ip_address`/`user_agent` | string, nullable | Security audit context |

**State transitions**: `ACTIVE -> ROTATED` (normal refresh), `ACTIVE -> REVOKED` (logout/cutoff), `ROTATED/REVOKED reuse attempt -> FAMILY_REVOKED + security alert`.

### AccessTokenBlacklist / Revocation Record (Redis + optional DB audit)

| Field | Type | Rules |
|---|---|---|
| `jti` | string | Access token id |
| `expires_at` | timestamp | TTL |
| `reason` | enum | logout/cutoff/security |
| `user_id` | id | optional lookup |

Redis key TTL matches remaining token lifetime. Epoch check is authoritative even if blacklist record missing.

### ChurchScope (`user_church_scopes`)

| Field | Type | Rules |
|---|---|---|
| `id` | PK | |
| `user_id` | FK | |
| `church_id` | FK | Parent or sub-church |
| `scope_role` | optional string | future extension |
| `created_at` | timestamp | |

**Uniqueness**: `(user_id, church_id)`. **Rule**: no implicit parent->sub-church inheritance.

### Church / Sub-Church (`churches`)

| Field | Type | Rules |
|---|---|---|
| `id` | PK | |
| `parent_church_id` | FK nullable | Null for parent church |
| `name` | string | |
| `status` | enum `ACTIVE,SUSPENDED,INACTIVE,ARCHIVED` | Lifecycle governed |
| `type` | enum `PARENT,SUB_CHURCH` or derived | |

### Member (`members`)

| Field | Type | Rules |
|---|---|---|
| `id` | PK | |
| `church_id` | FK | Scoped access |
| `baptism_status` | enum `BAPTISED,NON_BAPTISED` | Drives filtering/workflow |
| `membership_status` | enum/domain | Status transitions governed |
| `profile fields` | ... | Existing |

**Transition rule**: status/baptism transitions require active `MEMBERS:UPDATE` and domain-valid transition; unauthorized transitions rejected with 403.

### Announcement (`announcements`)

| Field | Type | Rules |
|---|---|---|
| `id` | PK | |
| `church_id` | FK | Visibility scope |
| `scope_type` | enum `CHURCH,SUB_CHURCH,GLOBAL` as defined | Must align with explicit church scope checks |
| `title/content/status` | ... | Existing |
| `created_by` | actor | |

### AuditLog (`audit_log`)

| Field | Type | Rules |
|---|---|---|
| `id` | PK/UUID | |
| `occurred_at` | timestamp, not null | |
| `actor_user_id` | FK nullable | system actions nullable |
| `actor_username` | string | denormalized for traceability |
| `action` | string enum/code | e.g. `AUTH_SIGN_IN`, `ROLE_PERMISSION_REVOKED` |
| `resource_type` | string | USER/ROLE/PERMISSION/CHURCH/... |
| `resource_id` | string | |
| `outcome` | enum `SUCCESS,DENIED,FAILURE` | |
| `reason_code` | string | standardized |
| `correlation_id` | string | request correlation |
| `ip_address` | string nullable | |
| `user_agent` | string nullable | redacted/truncated |
| `before_json` | json/text nullable | redacted |
| `after_json` | json/text nullable | redacted |

Append-only; no destructive updates from normal API.

### SystemConfiguration (`system_configurations`)

| Field | Type | Rules |
|---|---|---|
| `id` | PK/UUID | |
| `config_key` | string, unique, not null | Stable key, e.g. `auth.access_ttl_minutes`; immutable after create unless explicit migration |
| `config_value` | text/json, not null | Stored value; sensitive values encrypted-at-rest or secret-ref only, never plaintext secrets in logs/responses |
| `value_type` | enum `STRING,INTEGER,BOOLEAN,JSON,SECRET_REF` | Drives validation/rendering |
| `scope` | enum `GLOBAL,TENANT,ENVIRONMENT` | Default `GLOBAL`; tenant scope requires `church_id`/tenant scope key |
| `description` | string, nullable | Human-readable purpose |
| `is_sensitive` | boolean, default false | Sensitive values redacted in API/audit; write-only where applicable |
| `version` | integer/bigint, not null | Optimistic concurrency lock; increment on update |
| `updated_by` | FK nullable | Actor user id |
| `updated_at` | timestamp, not null | |
| `created_at` | timestamp, not null | |

**Rules**: RBAC-enforced (`SETTINGS:*`/`SYSTEM_CONFIGURATION:*` as mapped); all mutations audited with before/after redaction; paginated read API; no secret values returned to unauthorized clients.

### GovernanceCriticalChange (domain event / enumeration)

Changes requiring immediate cutoff (FR-005/FR-018):
- role assignment/removal for user
- role-permission matrix change affecting assigned users
- user disable/lock/suspend/delete/reactivation state change affecting access
- password/security credential change
- step-up confirmed secondary Super Admin demotion/suspension/removal
- tenant/church suspension affecting user access
- explicit session/token revocation

## Invariants

- **INV-001 Root Immutability**: `is_root_super_admin=true` user cannot be deleted, disabled, demoted, or stripped of required Super Admin governance role through API/UI.
- **INV-002 Last Super Admin**: active Super Admin count must remain >= 1 after any mutation.
- **INV-003 Explicit Church Scope**: church/sub-church authorization requires explicit scope assignment for target church id.
- **INV-004 Immediate Cutoff**: governance-critical changes increment epoch and invalidate active sessions/tokens before operation completes successfully.
- **INV-005 Canonical Permission Key**: every governed action maps to exactly one canonical `RESOURCE:ACTION` key and zero-or-more legacy aliases.
- **INV-006 Audit Completeness**: privileged governance mutations and blocked safeguard attempts emit audit records.

## Migration Notes

- Add nullable/new columns with defaults first (expand). Backfill epochs, root flag, permission keys/aliases. Deploy code that reads old+new. Contract tests run during compatibility window. Remove legacy-only paths only in later major/versioned change.
- Seeder manifest becomes canonical baseline after one-time live DB snapshot export; subsequent changes via reviewed seed/migration updates.
