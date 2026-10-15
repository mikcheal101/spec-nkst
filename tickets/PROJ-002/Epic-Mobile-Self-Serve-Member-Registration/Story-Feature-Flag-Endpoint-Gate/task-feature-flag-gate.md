# Feature Flag Endpoint Gate

**Standalone Title:** Feature Flag Endpoint Gate

**User Story Statement:**
As a member, I want feature flag gate on registration endpoint, So that backend registration requests are securely blocked when self-service registration is disabled.

**Background and Current Behavior:**
The feature flag `nkst.features.memberSelfService` gates the registration screen rendering in the mobile app. However, the backend endpoint `POST /api/v1/auth/register` does not check the feature flag. This story ensures the endpoint also respects the feature flag, returning `403` when the flag is `false`.

**Target Functional Behavior (the delta):**
- When `nkst.features.memberSelfService=false`, `POST /api/v1/auth/register` returns HTTP 403
- When `nkst.features.memberSelfService=true`, the endpoint functions normally
- Feature flag evaluation is consistent between mobile screen and backend endpoint

**Out of Scope:**
- Changing the feature flag default value
- Modifying any existing endpoint payloads

**Acceptance Criteria:**
- Set `nkst.features.memberSelfService=false` in configuration
- Submit `POST /api/v1/auth/register` with valid payload
- Assertion: HTTP 403 returned
- Set `nkst.features.memberSelfService=true` (default)
- Submit `POST /api/v1/auth/register` with valid payload
- Assertion: HTTP 201 returned, member record created

---

## Technical Tasks

### FE: Add feature flag evaluation before rendering registration screen

**Exact file paths in backticks:**
- `src/mobile/featureFlags.ts` (new — creates the feature flag hook)
- `src/mobile/RegistrationScreen.tsx` (modify — add feature flag check at top)

**Description:** Add feature flag evaluation before rendering the mobile registration screen. When the flag `nkst.features.memberSelfService` is `false`, hide the registration option and show a "Coming soon" message. When `true`, render the full registration form.

**Step-by-Step Implementation Guide:**
1. Create `src/mobile/featureFlags.ts` with `useFeatureFlag('nkst.features.memberSelfService')` hook
   - Import `useState`, `useEffect` from `react`
   - Define flag key: `const FLAG_KEY = 'nkst.features.memberSelfService'`
   - Create hook that returns `{ value: boolean, loading: boolean, refresh: () => void }`
   - Default value: `true` if flag not configured remotely
   - Add `useEffect` to fetch flag from feature flag service at mount
   - Add `useEffect` to poll for flag changes every 30 seconds using `setInterval`
2. At the top of `RegistrationScreen.tsx`, evaluate the feature flag
   - If `false`, render `<View style={styles.container}><Text>Coming soon</Text></View>` and return early
   - If `true`, proceed with rendering the registration form
3. Connect feature flag state to navigation visibility (hide/show register option in menu)
4. Add `useEffect` in `useFeatureFlag` to refresh flag from config service when value changes

**Error Codes:**
- None (feature flag is a configuration toggle; no runtime error paths)

**Testing and Verification Plan:**
- Set `nkst.features.memberSelfService=false` in config
- Launch app and verify registration screen/option is hidden
- Show "Coming soon" message when registration is hidden
- Set `nkst.features.memberSelfService=true` (default)
- Launch app and verify registration screen is visible
- Toggle flag in config and verify screen appears/disappears

---

### FE: Test feature flag false hides registration screen

**Description:** Verify that setting the feature flag `nkst.features.memberSelfService` to `false` hides the registration screen and shows "Coming soon" message.

**Acceptance Criteria:**
- Configuration: `nkst.features.memberSelfService=false`
- App launches, registration screen/option is not visible
- "Coming soon" message displayed in place of registration

---

### FE: Test feature flag true enables registration screen

**Description:** Verify that setting the feature flag `nkst.features.memberSelfService` to `true` (default) enables the registration screen.

**Acceptance Criteria:**
- Configuration: `nkst.features.memberSelfService=true`
- App launches, registration screen/option is visible
- Full registration form renders correctly