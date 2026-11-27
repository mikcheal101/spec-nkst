# Feature Specification: Profile Hydration & Save Persistence

**Feature Branch**: `008-profile-hydration-persistence`  
**Created**: 2026-11-23  
**Status**: Draft  
**Input**: User description: "Fix full-stack (frontend src/web and backend src/api) profile hydration and save persistence for http://localhost:3000/profile: (1) Backend (src/api): audit and fix the authenticated current-user profile read and update endpoints/services, DTOs, validation constraints, persistence mappings, and standardized ApiErrorResponse/400/401/403/404/429 handling so profile fields are returned accurately and updates persist cleanly in the database without clobbering unset fields; (2) Frontend (src/web): fix /profile page data fetching, response envelope unwrapping, and form hydration so fields populate reliably on load and navigation, and wire the Save action to validate inputs, call the backend update API with proper auth/retry handling, sync updated profile state into the UI and auth/session context, and surface clear validation, success, and error states; (3) Add backend unit/integration tests and frontend Vitest/RTL + E2E coverage verifying end-to-end load and save persistence."

## Clarifications

### Session 2026-11-23

- Q: When two profile save requests conflict for the same user, how should the system resolve the conflict? → A: Last save wins - accept the latest valid save, persist it, and return/refresh the latest saved profile.
- Q: Which profile fields should users be able to edit and save on the profile page? → A: Name + contact fields - first name, last name, middle name, email address (optional, format-validated when provided), phone number; username read-only.
- Q: If a user tries to save an email address or phone number that already belongs to another account, how should the system respond? → A: Reject with generic conflict - return standardized HTTP 409 with code `PROFILE_CONTACT_CONFLICT` and a generic message that does not identify the conflicting field; no profile data is changed.
- Q: After a profile save succeeds, where should the updated profile values be reflected immediately in the app? → A: Profile page + session context - update `/profile` and shared authenticated session/profile context immediately; other views update on normal next fetch/render.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reliable Profile Load (Priority: P1)

As an authenticated user, I want my profile page to load my current profile information accurately every time I open or return to it, so I can confidently review my account details before making changes.

**Why this priority**: Loading accurate profile data is the foundation for any profile update. If hydration is unreliable, users cannot trust the form and may submit incorrect changes.

**Independent Test**: Can be fully tested by signing in, navigating to the profile page, and verifying all profile fields populate from the current-user profile data; repeating after navigation away and back confirms reliable hydration.

**Acceptance Scenarios**:

1. **Given** an authenticated user with stored profile data, **When** they open the profile page, **Then** the page displays the current persisted values for all supported profile fields.
2. **Given** an authenticated user on another page, **When** they navigate to the profile page, **Then** the profile form hydrates with current profile data without requiring a manual refresh.
3. **Given** the profile read request fails due to an authorization, not-found, rate-limit, or transient/server error, **When** the page loads, **Then** the user sees a clear error state and no stale or misleading profile values are presented as current.
4. **Given** an unauthenticated or expired session, **When** the user attempts to access profile data, **Then** the system denies access using the standard authentication error behavior and does not expose profile data.

---

### User Story 2 - Persist Profile Changes Safely (Priority: P1)

As an authenticated user, I want to edit and save my profile so that my changes are validated, persisted accurately, and immediately reflected in my current session without losing unrelated profile information.

**Why this priority**: Saving profile changes is the core user outcome. Incorrect persistence or clobbered fields creates data integrity and trust issues.

**Independent Test**: Can be fully tested by loading a profile, changing a subset of supported fields, saving, and confirming the success state, persisted database values, and updated UI/session context; reloading confirms persistence.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the profile page with valid edits, **When** they click Save, **Then** the system validates input, persists the changes, and shows a clear success confirmation.
2. **Given** a user updates only some profile fields, **When** the save completes, **Then** only the intended fields change and all unset/untouched fields remain unchanged in persisted data.
3. **Given** a save succeeds, **When** the user remains in the app or revisits the profile page, **Then** the UI and current authenticated session/profile context reflect the updated profile values.
4. **Given** a user submits invalid profile input, **When** they click Save, **Then** the system blocks persistence, shows clear field-level or form-level validation feedback, and preserves user-entered values for correction.
5. **Given** a save request fails with a standardized error (validation, unauthorized, forbidden, not found, rate limited, or server failure), **When** the response is received, **Then** the UI shows a clear actionable error state and does not falsely indicate success.

---

### User Story 3 - Verified End-to-End Confidence (Priority: P2)

As a maintainer, I want automated backend and frontend coverage for profile load and save flows so regressions in hydration, validation, authorization, or persistence are caught before release.

**Why this priority**: The feature spans authenticated API behavior and UI state management; automated coverage prevents regressions in both layers and their integration.

**Independent Test**: Can be fully tested by running backend unit/integration tests and frontend component/E2E tests that cover successful load/save, validation failures, auth/error handling, and no-clobber persistence behavior.

**Acceptance Scenarios**:

1. **Given** backend test suites run, **When** profile read/update scenarios are exercised, **Then** tests verify accurate reads, valid updates, no-clobber behavior, and standardized error responses for applicable failure cases.
2. **Given** frontend component tests run, **When** profile load/save scenarios are exercised, **Then** tests verify form hydration, validation feedback, save request behavior, and UI/session state updates.
3. **Given** end-to-end tests run against an integrated environment, **When** a user loads and saves their profile, **Then** tests verify the full flow from UI interaction through API persistence and subsequent reload.

---

### Edge Cases

- What happens when the profile record exists but some optional fields are missing/null? The form should display safe empty/default values without breaking hydration.
- What happens when the client sends fields that are not editable or omits optional fields during update? The system must ignore/forbid unsafe fields as appropriate and must not overwrite existing persisted values with unintended nulls/defaults.
- How does the system handle concurrent profile updates (e.g., user saves in two tabs/sessions)? The system must persist a consistent result and return a clear error or latest-state outcome; it must not silently corrupt data.
- What happens when authentication token refresh is needed during profile load or save? The authorized request should complete transparently when refresh succeeds; otherwise the user is returned to a clear authentication-required state.
- What happens when the backend returns a rate-limit response? The UI shows a clear retry-later message and does not lose the user's in-progress edits.
- What happens when the submitted email address or phone number is already used by another account? The save is rejected with a standardized generic error that does not reveal which field conflicts, and no profile changes are persisted.
- What happens when profile save succeeds on the server but subsequent profile refresh fails? The UI must preserve the confirmed saved profile state and session/profile context, surface a clear refresh warning/error, and allow the user to retry refresh without losing saved data or showing a false save failure.
- What happens when two profile saves for the same user are submitted concurrently? The latest valid save wins; the persisted profile and returned/refreshed profile state reflect that latest save, with no silent data corruption.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an authenticated current-user profile read capability that returns accurate, current profile data for the signed-in user only, including the supported editable fields (first name, last name, middle name, email address, phone number) and read-only identity fields needed for display (such as username).
- **FR-002**: System MUST provide an authenticated current-user profile update capability that persists valid changes for the signed-in user only to supported editable fields: first name, last name, middle name, email address, and phone number. Username and other non-editable/security-sensitive fields MUST remain unchanged.
- **FR-003**: Profile read and update capabilities MUST enforce authentication and authorization; unauthenticated, expired, or unauthorized requests MUST be denied with standardized error responses.
- **FR-004**: Profile update validation MUST reject invalid input with standardized validation error responses that identify invalid fields/messages in a client-consumable form. Validation MUST cover required/format rules for supported editable fields, Email address is optional; when provided, it MUST be valid email format. Phone number is required and MUST match platform phone rules: 7-20 characters after trimming, allowing digits, spaces, `+`, `-`, and parentheses, and containing 7-15 digits. If an email address or phone number conflicts with another account, the system MUST reject the save with standardized HTTP 409 error response (code `PROFILE_CONTACT_CONFLICT`, generic message that does not identify the conflicting field) and MUST NOT persist any profile changes.
- **FR-005**: Profile update persistence MUST be partial-safe: fields not included in the update request, or not intended to change, MUST NOT be clobbered, reset, or overwritten with unintended defaults.
- **FR-013**: Concurrent profile updates for the same user MUST follow last-save-wins behavior: the latest valid save is persisted and the system returns/refreshes the latest saved profile state without silent data corruption.
- **FR-006**: Profile read/update error handling MUST use standardized error contracts for applicable conditions, including validation errors, authentication failures, authorization failures, missing resources, and request throttling/rate limits.
- **FR-007**: The profile page MUST fetch current profile data on load and when the user navigates to the page, and MUST reliably hydrate visible form fields from the returned profile payload.
- **FR-008**: The profile page MUST unwrap/normalize the profile response shape before hydration so supported fields populate consistently regardless of equivalent response envelope variations used by the platform.
- **FR-009**: The Save action MUST validate user input before or during submission, submit only supported profile updates through the authenticated API flow, and prevent duplicate/confusing success states during in-flight requests.
- **FR-010**: After a successful save, the system MUST immediately update the visible `/profile` UI state and the shared authenticated session/profile context used by the application using the confirmed saved profile. Other views MAY reflect the updated values on their normal next fetch/render, without requiring a manual full-page refresh. If a post-save profile refresh/refetch fails after the save has been confirmed, the UI MUST preserve the confirmed saved state, surface a clear refresh warning/error, and allow retry without losing saved data.
- **FR-011**: The profile UI MUST present clear loading, validation, success, and error states. Error states MUST preserve recoverable user input and provide actionable feedback.
- **FR-012**: Automated tests MUST cover profile read/update success and failure paths, including no-clobber persistence, standardized error handling, form hydration, save-state synchronization, and end-to-end load/save persistence.

### Key Entities *(include if feature involves data)*

- **User Profile**: The authenticated user's account/profile information exposed by the profile experience. Editable fields are first name, last name, middle name, email address, and phone number; username is displayed read-only.
- **Profile Update Request**: A validated set of intended profile changes submitted by the signed-in user; may include a subset of editable fields and must not implicitly modify unspecified fields.
- **Profile Save Outcome**: The user-visible and system-recorded result of a save attempt, including success confirmation with updated profile state or a standardized error with actionable feedback.

### Assumptions

- The existing authenticated user/profile domain model remains the source of truth; this feature fixes hydration and persistence behavior rather than introducing a new profile domain.
- Only fields already designated as user-editable in the product are editable on `/profile`; read-only/security-sensitive fields remain protected.
- Standard platform authentication/session behavior (including existing token refresh/retry conventions) applies to profile requests.
- Standardized error response contracts already used by the platform are the expected format for API error responses.
- "No clobbering unset fields" applies to omitted/untouched fields in partial updates and to fields not exposed as editable in the profile UI.

### Dependencies

- Authenticated session/token management and protected-route behavior.
- Existing user/profile persistence store and current-user identity resolution.
- Existing frontend auth/session context used by application shell/profile-adjacent UI.
- Automated test infrastructure for backend unit/integration, frontend component tests, and end-to-end browser tests.

### Scope Boundaries

**In Scope**:

- Current-user profile read and update correctness for `/profile`.
- Validation, standardized error handling, and no-clobber persistence for supported editable profile fields.
- Frontend hydration, save flow, state synchronization, and user-facing feedback.
- Automated backend/frontend/E2E coverage for load and save persistence.

**Out of Scope**:

- Redesigning the profile visual layout beyond necessary feedback/state clarity.
- Adding new profile fields or changing business ownership of profile data.
- Password, MFA, or account-security workflows except where existing profile page behavior requires compatible error/state handling.
- Broader user-management/admin profile editing features.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In automated end-to-end coverage, 100% of tested authenticated profile page loads display current persisted values for all supported profile fields.
- **SC-002**: In automated backend and E2E coverage, 100% of tested partial profile updates persist changed fields while preserving all unspecified/untouched fields.
- **SC-006**: In automated coverage, concurrent valid saves for the same user result in the latest valid save being persisted and reflected in the returned/refreshed profile state, with no silent data corruption.
- **SC-003**: In automated frontend and E2E coverage, 100% of successful save scenarios immediately reflect updated profile values in `/profile` and the shared authenticated session/profile context without requiring manual page refresh; other views may update on their normal next fetch/render.
- **SC-004**: In automated coverage, 100% of tested invalid, unauthorized, forbidden, missing-resource, rate-limited, and duplicate-contact conflict profile scenarios return or surface the expected standardized error outcome with no false success state and no unintended persistence.
- **SC-005**: Users can complete a routine profile edit and receive save confirmation within 10 seconds under normal operating conditions. Automated E2E/performance verification MUST assert save confirmation is observed within 10,000ms in the integrated test environment, or document an approved exception with evidence.
