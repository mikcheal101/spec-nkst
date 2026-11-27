# Data Model: Profile Hydration & Save Persistence

## Entities

### User Profile (current authenticated user)
- **Source of truth**: Existing member/user-backed profile record resolved for authenticated user (api-service member/profile domain).
- **Identity/read-only fields**:
  - `username` (string, read-only display; derived from authenticated identity/profile fallback rules)
  - `userId/memberId` (internal identifier, not editable)
- **Editable fields**:
  - `firstName` (string, required, trimmed, max length per existing domain/validation constraints)
  - `lastName` (string, required, trimmed)
  - `middleName` (string, optional; empty string normalized as absent/null per existing convention where applicable)
  - `emailAddress/email` (string, optional; when provided must be valid email format; unique across accounts by platform rule but conflict response is generic)
  - `tel/phoneNumber` (string, required; trimmed; 7-20 chars allowing digits/spaces/+/-/parentheses and containing 7-15 digits; unique/conflict handled generically)
- **Validation rules**:
  - Reject missing required fields and invalid formats with standardized 400 validation error.
  - Reject duplicate email/phone conflicts with standardized HTTP 409 error, code `PROFILE_CONTACT_CONFLICT`, generic message that does not identify conflicting field; no persistence.
  - Ignore/deny unsafe non-editable fields if submitted.
- **State transitions**:
  - `Loaded` -> `Editing` (user changes form values)
  - `Editing` -> `Saving` (valid submit)
  - `Saving` -> `Saved` (persisted; latest state returned)
  - `Saving` -> `ValidationError` / `ConflictGenericError` / `AuthError` / `Forbidden` / `NotFound` / `RateLimited` / `ServerError`
  - Concurrent valid saves: latest valid save becomes persisted state (last-save-wins).

### Profile Update Request
- **Fields**: subset/all of supported editable fields: `firstName`, `lastName`, `middleName`, `emailAddress`, `tel`.
- **Rules**:
  - Partial-safe: omitted fields must not clobber persisted values.
  - Only editable fields may change.
  - Input normalized before validation/persistence (trim where appropriate).

### Profile Save Outcome
- **Success**: persisted profile payload + UI success signal; updates `/profile` and shared auth/session profile context immediately using confirmed saved profile. If post-save refresh fails, preserve confirmed saved state, surface refresh warning/error, and allow retry.
- **Failure**: standardized error payload (`status/error/code/message/path/correlationId/details?`), no false success, recoverable form input preserved.

## Relationships
- Authenticated user/session -> exactly one current User Profile.
- Profile Update Request -> mutates only editable fields of that User Profile.
- Profile Save Outcome -> references resulting User Profile state or standardized error.
