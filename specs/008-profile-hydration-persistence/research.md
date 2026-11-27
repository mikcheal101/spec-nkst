# Research: Profile Hydration & Save Persistence

## Decision 1: Profile API ownership and endpoint surface
- **Decision**: Use the existing authenticated current-user profile endpoints in `src/api/api-service` (`GET /api/v1/profile`, `POST /api/v1/profile`) as the canonical profile read/update contract for `/profile`.
- **Rationale**: The web profile page already calls `profileApi.getProfile/updateProfile` against `/api/v1/profile`; existing `ProfileController`, `ProfileServiceImpl`, DTOs, and tests live in api-service. Extending this surface minimizes contract churn and aligns with current frontend routing.
- **Alternatives considered**:
  - Move profile read/update to auth service `/api/v1/profile` or `/api/v1/me`: rejected because it would split identity/profile ownership and require larger frontend/API migration.
  - Add new `PUT /api/v1/profile`: rejected for now; current client and tests use `POST`, and changing verb is unnecessary for the fix.

## Decision 2: Editable field scope and no-clobber semantics
- **Decision**: Editable fields are `firstName`, `lastName`, `middleName`, `emailAddress`, and `tel/phoneNumber`; `username` is read-only display. Updates must be partial-safe: only supported editable fields are mutated; omitted/untouched fields retain persisted values.
- **Rationale**: Matches clarification and current Profile form. Existing service currently sets all fields directly; plan requires explicit mapping/merge behavior to prevent unintended null/default overwrite and to preserve non-editable identity/security fields.
- **Alternatives considered**:
  - Full replacement semantics: rejected due to clobber risk and clarification.
  - Allow username/role/security field updates: rejected as security-sensitive and out of scope.

## Decision 3: Standardized error contract and status coverage
- **Decision**: Profile endpoints will return the platform-standard error payload used by api-service (`ErrorResponse` with timestamp/status/error/code/message/path/correlationId/details) and cover `400/401/403/404/429` scenarios relevant to profile read/update. Duplicate email/phone conflicts will return a generic standardized error with no conflicting field disclosure and no persistence.
- **Rationale**: Spec requires standardized ApiErrorResponse/400/401/403/404/429 handling. Api-service already has `ErrorResponse` + `GlobalExceptionHandler` patterns and rate-limit handling; using the same contract avoids cross-service inconsistency in this service. Generic duplicate-contact response follows clarification and avoids account enumeration.
- **Alternatives considered**:
  - Field-specific 409 conflict: rejected by clarification (generic error, no field identification).
  - Silent success/no-op on duplicate: rejected; violates validation/integrity expectations.

## Decision 4: Frontend hydration, save, and session synchronization
- **Decision**: `/profile` will load through React Query profile hook, normalize/unpack supported response shapes, and hydrate form state deterministically on load/navigation. Save will validate editable inputs, call profile update API, handle auth/retry through existing request layer, then immediately update profile query cache and shared AuthContext session/profile display fields; other views update on next normal fetch/render.
- **Rationale**: Current page only partially hydrates and resets form on cancel to empty defaults; it does not sync AuthContext after save. Clarification requires immediate `/profile` + shared session/profile context update.
- **Alternatives considered**:
  - Full page reload after save: rejected by UX and clarification.
  - App-wide forced refetch of all views: rejected as unnecessary scope/cost.

## Decision 5: Concurrent save behavior
- **Decision**: Last-save-wins for concurrent valid profile saves. Latest valid persisted state is returned and refreshed in UI/session context; no silent corruption.
- **Rationale**: Clarification explicitly selected last-save-wins. Existing member persistence model can support this with normal transactional save; tests must assert final persisted/returned state.
- **Alternatives considered**:
  - Optimistic locking conflict 409: rejected by clarification.
  - Field-level auto merge: rejected by clarification.

## Decision 6: Test strategy
- **Decision**: Add/adjust backend unit tests for ProfileController/ProfileServiceImpl validation and no-clobber behavior; add integration coverage for authenticated read/update, standardized error statuses, duplicate-contact generic error, and persistence. Add frontend Vitest/RTL tests for hydration, validation, save success/error states, and AuthContext/profile cache sync. Add Playwright E2E for end-to-end load, edit subset, save persistence, reload verification.
- **Rationale**: Required by spec and constitution (risk-appropriate tests; E2E for web user-facing flow; cross-stack flow spans web+API).
- **Alternatives considered**:
  - Only unit tests: rejected; feature crosses UI/API/persistence boundaries.
  - Manual QA only: rejected by spec and constitution.
