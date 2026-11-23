# Seed Baseline Capture / Review Runbook (T051)

## Purpose
FR-012/FR-013/FR-014/FR-029/CHK003/CHK004/CHK029/CHK051/CHK053: capture the current live DB state (Settings -> Roles & Permissions UI) as the canonical seed baseline, review it, and reconcile idempotently on startup.

## Preconditions
- Auth service DB accessible (read-only snapshot window preferred).
- Reviewer has Super Admin governance access.
- `specs/007-engr-003-backend-auth-super-admin-verification/` artifacts directory present.
- Current seeder manifest path: `src/api/auth/src/main/resources/seed/canonical-baseline.json` (or configured manifest path).

## Capture Steps
1. **Snapshot live DB state** from the environment updated via Settings -> Roles & Permissions UI:
   - Tables/entities: `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, root/protected metadata, account status, permission epoch.
   - Export command (example MySQL; adapt credentials/env):
     ```bash
     mysqldump --no-tablespaces --single-transaction \
       -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $AUTH_DB \
       users roles permissions role_permissions user_roles user_church_scopes \
       > specs/007-engr-003-backend-auth-super-admin-verification/artifacts/live-db-rbac-snapshot.sql
     ```
2. **Normalize into canonical manifest**:
   - Map to canonical `RESOURCE:ACTION` permission keys and include legacy aliases.
   - Ensure 5-action matrix resources include CREATE/READ/VIEW/UPDATE/DELETE where applicable.
   - Mark `SUPER_ADMIN` as `protected/system`; mark Root Super Admin user as `rootSuperAdmin=true`, `ACTIVE`.
   - Record `permissionEpoch`/account status as captured.
3. **Checksum & review**:
   ```bash
   shasum -a 256 src/api/auth/src/main/resources/seed/canonical-baseline.json \
     > specs/007-engr-003-backend-auth-super-admin-verification/artifacts/canonical-baseline.sha256
   ```
   - Reviewer confirms: no destructive role loss, no duplicate permission keys, Root Super Admin present, SUPER_ADMIN protected, all role-permission assignments match approved UI state.
4. **Commit manifest + checksum** in same PR as seeder reconciliation changes. Do not hand-edit drifted runtime DB as a substitute.
5. **Reconciliation verification**:
   ```bash
   cd src/api/auth
   ./mvnw -Dtest=SeederIntegrationTest test
   ```
   - Run service startup twice against same DB/profile; confirm reconciliation report shows no unintended drift/duplicates/destructive loss.

## Evidence Record
| Date | Environment | Snapshot artifact | Manifest checksum | Reviewer | Result | Notes |
|------|-------------|-------------------|-------------------|----------|--------|-------|
| 2026-11-22 | local/dev (pending live capture) | `artifacts/live-db-rbac-snapshot.sql` (to be captured from approved env) | `artifacts/canonical-baseline.sha256` (generate on capture) | TBD | PENDING REVIEW | Runbook created; live DB snapshot capture/review requires approved environment access and reviewer sign-off. Automated idempotent reconciliation verified by `SeederIntegrationTest`. |

## Automated Evidence
- `src/api/auth/src/test/java/com/mikkytrionze/auth/user/infrastructure/database/SeederIntegrationTest.java` - run twice, asserts no drift/duplicates/destructive loss, canonical 5-action matrix, SUPER_ADMIN protected, active Root Super Admin present.
- Latest targeted verification: `cd src/api/auth && ./mvnw -Dtest='...SeederIntegrationTest...' test` => **73 tests, 0 failures, 0 errors, 0 skipped** (includes SeederIntegrationTest).
