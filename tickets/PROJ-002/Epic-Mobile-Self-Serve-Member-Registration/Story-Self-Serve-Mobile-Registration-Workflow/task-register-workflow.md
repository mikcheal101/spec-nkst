# Self-Serve Mobile Registration Workflow

**Standalone Title:** Self-Serve Mobile Registration Workflow

**User Story Statement:**
As a member, I want to register from the app with my phone number or card number, So that I can join the digital registry myself.

**Background and Current Behavior:**
The mobile app has no self-serve registration path. A new member opening the app cannot register themselves; they must wait on clerk-assisted onboarding. The backend `POST /api/v1/auth/sign-up` and web React registration via `useRegister()` hook are fully implemented, but no mobile screen exists. The mobile directory is uninitialized and requires root workspace bootstrapping.

**Target Functional Behavior (the delta):**
- Root workspace initialized with React Native/Expo scaffolding (verified via `expo-start`)
- Member opens registration screen from mobile app menu
- Member enters username (phone number or card number) and password
- Member selects church from loaded Lagos list (defaulting to first Lagos church)
- Member toggles baptism status; if baptized, enters baptismal number
- Member taps submit; system validates all fields
- System submits to `POST /api/v1/auth/register` with `{username, password, churchId, isBaptised, baptismalNumber}`
- Auth service checks duplicate via `existsByUsername()`; if duplicate, routes to review case, creates nothing
- If clean, `User` created with hashed password, `Member` created with church and baptism flags, `BaptismRecord` created if `isBaptised=true`
- Authenticated session (JWT/session cookie) returned and stored on mobile app
- Member navigates to dashboard with active session
- When `isBaptised=true`, financial section on dashboard is unlocked; when `false`, financial section hidden

**Out of Scope:**
- Backend endpoint changes or new tables
- Web portal registration changes
- Paper backup or offline sync details beyond outbox pattern

**Acceptance Criteria:**
- A member completes self service registration on the mobile app with a username, password, church, baptism status, and baptismal number
- The church list shows Lagos churches loaded from the database
- A successful registration lands the member on the dashboard with an authenticated session
- A duplicate username or baptismal number produces a review case and creates nothing
- The entered values survive a failed submit so the member can correct them
- The feature flag `nkst.features.memberSelfService=false` hides the registration screen and returns `403` on endpoint access
- Offline submit saves locally as `pending`; sync restores entry when connectivity returns
- Double tap on submit produces exactly one member record

---

## Technical Tasks

### FE: Initialize React Native / Expo mobile application workspace

**Exact file paths in backticks:**
- `expo.json` (new — created by `expo init`)
- `App.tsx` (new — created by `expo init`)
- `package.json` (new — created by `expo init`)
- `src/mobile/` (new directory — created by `expo init`)

**Description:** Initialize a new React Native/Expo mobile application workspace from scratch. This foundational task must precede all other mobile feature implementation. The task creates the root project structure, installs core dependencies, and configures essential providers.

**Step-by-Step Implementation Guide:**
1. Run `npx expo@latest init mobile-workspace --template blank` in the project root
2. Verify `expo.json` is created with project configuration
3. Verify `App.tsx` is created with basic Expo entry point
4. Verify `package.json` is created with `expo`, `react`, `react-native` dependencies
5. Install dependencies: `npm install` or `yarn install`
6. Start the development server: `npx expo-start`
7. Verify iOS simulator and Android emulator boot successfully
8. Add core providers: React Query `<QueryClientProvider>`, feature flag configuration
9. Add navigation setup: React Navigation or Expo Router configuration
10. Commit initial workspace scaffolding

**Error Codes:**
- `EXPO-INIT-FAIL` — expo init command failed; verify Node.js version and permissions
- `EXPO-PROJECT-EXISTS` — directory already has Expo project; choose different name

**Log Structures:**
- `EXPO-INIT-SUCCESS: project={projectName}, version={expoVersion}, template={template}`
- `EXPO-INIT-FAIL: error={errorMessage}, project={projectName}`

**Testing and Verification Plan:**
- Run `npx expo-start --ios` or `npx expo-start --android` and verify app launches
- Check that `App.tsx` renders without errors
- Verify `package.json` has required dependencies (`expo`, `react`, `react-native`)
- Confirm React Native CLI is available: `npx react-native--version`
- Verify navigation setup renders correctly

---

### FE: Build mobile registration screen component (`RegistrationScreen.tsx`)

**Exact file paths in backticks:**
- `src/mobile/RegistrationScreen.tsx` (new — creates the registration screen UI)

**Description:** Build the mobile registration screen component with all required input fields: username (phone/card), password, church selection, baptism toggle, and baptismal number.

**Step-by-Step Implementation Guide:**
1. Create `src/mobile/RegistrationScreen.tsx` as a React Native functional component
2. Add `TextInput` for username with placeholder "Phone number or card number"
3. Add `TextInput` for password with `secureTextEntry` enabled
4. Add `FlatList` or `Select` component for church dropdown, populated from `ChurchRepository` Lagos list
5. Add `Switch` or `Toggle` component for baptism status
6. Conditionally render `TextInput` for baptismal number when baptism toggle is `true`
7. Add `Button` for submission with double-tap debounce protection
8. Style components using Tailwind React Native or StyleSheet
9. Export `RegistrationScreen` as default

**Error Handling:**
- Validation: username must be 10-15 digits (phone) or 8-20 alphanumeric characters (card number)
- Validation: password minimum 8 characters with at least 1 uppercase, 1 lowercase, 1 number
- Validation: church must be selected from list (not free-text)
- Validation: if baptism toggle is `true`, baptismal number is required
- Error messages displayed inline above respective `TextInput` fields

**Log Structures:**
- `REG-SCREEN-RENDER: username={value}, password={masked}, churchId={id}, isBaptised={boolean}, baptismalNumber={value}`
- `REG-SCREEN-VALIDATION-ERROR: field={fieldName}, reason={errorReason}`

**Testing and Verification Plan:**
- Render `RegistrationScreen` in iOS simulator and verify all fields display correctly
- Enter valid username/password and verify no validation errors
- Enter invalid username (too short) and assert validation error displays
- Enter invalid password (too short) and assert validation error displays
- Toggle baptism `true` and verify baptismal number field appears
- Toggle baptism `false` and verify baptismal number field disappears
- Submit form with all valid fields and verify onSubmit handler is called

---

### FE: Implement `useMobileRegister()` React Query hook

**Exact file paths in backticks:**
- `src/mobile/hooks/useMobileRegister.ts` (new — React Query hook for mobile registration)

**Description:** Implement a React Query hook that handles the registration mutation, feature flag gating, offline outbox pattern, and response handling.

**Step-by-Step Implementation Guide:**
1. Create `src/mobile/hooks/useMobileRegister.ts`
2. Import `useMutation` from `@tanstack/react-query`
3. Import `authApi.register` API client method
4. Import `useFeatureFlag` from `../featureFlags`
5. Define mutation function: async (`{username, password, churchId, isBaptised, baptismalNumber}`) => {
   - Check feature flag `nkst.features.memberSelfService`; if `false`, throw `403` error
   - Call `authApi.register({username, password, churchId, isBaptised, baptismalNumber})`
   - On success, store JWT/session cookie, navigate to dashboard
   - On duplicate (409), route to review case
   - On failure, set error state for entered values to survive failed submit
}
6. Return `{ mutate, isLoading, isError, isSuccess, error }`
7. Use `useMutation` options: `onSuccess: () => navigate('/dashboard')`, `onError: (err) => setEnteredValues(...)`

**Error Codes:**
- `403` — Feature flag disabled, registration blocked
- `409` — Duplicate username or baptismal number, routed to review
- `500` — Unexpected server error

**Log Structures:**
- `MOBILE-REG-MUTATE-START: username={username}`
- `MOBILE-REG-MUTATE-SUCCESS: userId={userId}, sessionToken={token}`
- `MOBILE-REG-MUTATE-FAIL: error={errorMessage}, username={username}`
- `MOBILE-REG-MUTATE-DUPLICATE: baptismalNumber={baptismalNumber}, reason=existsByUsername`

**Testing and Verification Plan:**
- Invoke `mutate` with valid payload and assert `isSuccess` becomes `true`
- Assert navigation to `/dashboard` on success
- Invoke `mutate` with duplicate username and assert `isError` becomes `true` with `409` code
- Invoke `mutate` with feature flag `false` and assert `403` error is thrown
- Reload app with feature flag `false` and assert registration option is hidden

---

### FE: Add feature flag `nkst.features.memberSelfService` with default `true`

**Exact file paths in backticks:**
- `src/mobile/featureFlags.ts` (new — feature flag configuration and hook)
- `src/mobile/navigation/RootNavigator.tsx` (modify — connect flag to navigation visibility)

**Description:** Add feature flag configuration for `nkst.features.memberSelfService` with default `true`, and connect it to the navigation menu to hide/show the registration option.

**Step-by-Step Implementation Guide:**
1. Create `src/mobile/featureFlags.ts` with feature flag configuration
   - Define flag key: `const MEMBER_SELF_SERVICE_FLAG = 'nkst.features.memberSelfService'`
   - Create hook: `useFeatureFlag(key: string)` that returns `{ value: boolean, loading: boolean }`
   - Default value: `true` if flag not configured
2. At the top of `RegistrationScreen.tsx`, evaluate the feature flag (see task above)
3. In `RootNavigator.tsx`, conditionally show/hide the "Register" menu option based on flag value
4. Update `expo-modules` or `react-native-config` if needed for remote flag management
5. Commit feature flag configuration

**Error Codes:**
- None (feature flag is a configuration toggle; no runtime error paths)

**Testing and Verification Plan:**
- Set `nkst.features.memberSelfService=false` in config
- Launch app and verify registration screen/option is hidden
- Show "Coming soon" message when registration is hidden
- Set `nkst.features.memberSelfService=true` (default)
- Launch app and verify registration screen/option is visible

---

### FE: Implement offline save outbox pattern following `4-offline-data-saving-and-sync`

**Exact file paths in backticks:**
- `src/mobile/outbox/pendingRegisterOutbox.ts` (new — outbox entry for pending registration)
- `src/mobile/sync/offlineSync.ts` (new — sync service for restoring pending entries)

**Description:** Implement the offline save outbox pattern so that if the app is killed or loses connectivity before the registration request completes, the entry is saved locally and synced when connectivity returns.

**Step-by-Step Implementation Guide:**
1. Create `src/mobile/outbox/pendingRegisterOutbox.ts` with schema:
   - `id: string` (uuid)
   - `timestamp: number` (ISO timestamp)
   - `status: 'pending' | 'synced' | 'failed'` — default `'pending'`
   - `payload: {username, password, churchId, isBaptised, baptismalNumber}`
2. Before calling `authApi.register()`, check if online; if offline, save entry to `AsyncStorage` as outbox item with status `'pending'`
3. Create `src/mobile/sync/offlineSync.ts` that periodically checks `AsyncStorage` for pending outbox items and re-attempts `authApi.register()`
4. On successful sync, update outbox item status to `'synced'`
5. On sync failure, keep status as `'failed'` and surface error to user
6. On app startup, scan outbox and attempt sync if connectivity is available

**Error Codes:**
- `OFFLINE-SYNC-FAIL` — sync attempt failed after retries; user must re-submit

**Log Structures:**
- `OUTBOX-STORE: id={outboxId}, status=pending, payloadSize={payloadSize}`
- `OUTBOX-SYNC-START: id={outboxId}`
- `OUTBOX-SYNC-SUCCESS: id={outboxId}, status=synced`
- `OUTBOX-SYNC-FAIL: id={outboxId}, error={errorMessage}`

**Testing and Verification Plan:**
- Disable connectivity, submit registration, assert entry stored in `AsyncStorage` with status `pending`
- Re-enable connectivity, wait for sync, assert entry status changes to `synced`
- Submit registration while online, assert no outbox entry created
- Force close app after submission, reopen, assert sync restores entry

---

### FE: Implement double-tap debounce on submit button

**Exact file paths in backticks:**
- `src/mobile/RegistrationScreen.tsx` (modify — add debounce state to submit button)
- `src/mobile/hooks/useDebounce.ts` (new — debounce hook)

**Description:** Implement a 1-second debounce on the registration submit button to prevent double-tap submissions that could create duplicate member records.

**Step-by-Step Implementation Guide:**
1. Create `src/mobile/hooks/useDebounce.ts`:
   - Accept `value: any` and `delay: number` (default 1000)
   - Use `useState` for `lastTriggered` timestamp
   - Use `useEffect` with `setTimeout` to reset after delay
   - Return `bool isDebounced` — `true` if called within delay period
2. In `RegistrationScreen.tsx`, add `useDebounce` hook with 1000ms delay
3. Add state `isSubmitting` initialized to `false`
4. On submit button press:
   - If `isDebounced` or `isSubmitting`, do nothing and return early
   - Set `isSubmitting = true`
   - Call `mutate()` (registration mutation)
   - On completion (success or error), set `isSubmitting = false`
5. Disable submit button when `isSubmitting` or `isDebounced` is `true`
6. Set button `disabled` attribute and show spinner when submitting

**Error Codes:**
- None (debounce is a UI protection; no runtime error paths)

**Log Structures:**
- `DOUBLE-TAP-IGNORED: timestamp={timestamp}, reason=debounceActive`
- `DOUBLE-TAP-PROCESSED: timestamp={timestamp}, userId={userId}`

**Testing and Verification Plan:**
- Tap submit button twice within 1 second, assert second tap has no effect
- Tap submit button once, wait 1.5 seconds, tap again, assert second tap triggers submission
- Submit with valid payload, assert exactly one member record created in database
- Submit with valid payload twice (after debounce expires), assert two member records (expected if debounce expired)

---

### BE: Ensure baptismal number validated for uniqueness against `Member.tel`

**Exact file paths in backticks:**
- `src/api/api-service/src/main/java/com/mikkytrionze/nkst/member/application/service/MemberServiceImpl.java` (modify — add baptismal number uniqueness validation)

**Description:** Validate baptismal number uniqueness against the `Member.tel` column before member registration. This BE task ensures that when a member submits a baptismal number during registration, it is checked against existing `Member.tel` values to prevent duplicates. If a duplicate is found, the case is routed to review and no member record is created.

**Service Context and Architecture Overview:**
The `MemberServiceImpl` class contains the business logic for member creation and baptism record management. This task adds a validation step in the registration flow to check baptismal number uniqueness against `Member.tel`.

**Context and Problem Statement:**
Currently, the backend does not validate baptismal number uniqueness during mobile registration. A member could submit a baptismal number that already exists in the `Member.tel` column, potentially creating ambiguity in the registry. This task adds the validation to maintain data integrity.

**File Locations in backticks:**
- `src/api/api-service/src/main/java/com/mikkytrionze/nkst/member/application/service/MemberServiceImpl.java` — modify `registerMember()` method to add uniqueness check

**Current Code Implementation:**
The `registerMember()` method currently checks username uniqueness via `MemberRepository.existsByUsername()` but does not check baptismal number uniqueness against `Member.tel`.

**Target Code Implementation:**
Add a validation step in `registerMember()` that queries `MemberRepository.existsByTel(baptismalNumber)` before creating the member record. If a match is found, return a `409 Conflict` error and route the case to the review queue.

**Step-by-Step Implementation Guide:**
1. Open `src/api/api-service/src/main/java/com/mikkytrionze/nkst/member/application/service/MemberServiceImpl.java`
2. Locate the `registerMember()` method
3. Add validation: `if (memberRepository.existsByTel(baptismalNumber)) { throw new DuplicateBaptismalNumberException(); }`
4. Ensure `MemberRepository` interface has `existsByTel(String tel)` method
5. If method doesn't exist, add `boolean existsByTel(String tel)` to `MemberRepository.java`
6. Build the project: `mvn compile`
7. Run unit tests: `mvn test`
8. Verify the validation works as expected

**Error Codes:**
- `409` — Duplicate baptismal number; case routed to review

**Log Structures:**
- `AUTH-REGISTER-BAPTISMAL-DUPLICATE: baptismalNumber={baptismalNumber}, reason=existsByTel`

**Testing and Verification Plan:**
- Submit registration with a baptismal number that already exists in `Member.tel`
- Assertion: `409` response received, no member record created, case routed to review
- Submit registration with a new baptismal number
- Assertion: member record created successfully

---

### BE: Ensure BaptismRecord created when `isBaptised=true`

**Exact file paths in backticks:**
- `src/api/api-service/src/main/java/com/mikkytrionze/nkst/member/application/service/MemberServiceImpl.java` (modify — ensure BaptismRecord creation)

**Description:** Ensure that when `isBaptised=true` is submitted during registration, a `BaptismRecord` entity is created with the provided baptismal number and optional fields.

**Service Context and Architecture Overview:**
The `MemberServiceImpl` class handles member creation and associated `BaptismRecord` entity management. This task ensures the BaptismRecord is properly created and persisted when the baptism flag is set to true.

**Context and Problem Statement:**
The backend already has `BaptismRecord` entity and `BaptismRecordRepository`, but the registration flow may not always create the record when `isBaptised=true`. This task ensures the record is always created in the correct circumstances.

**File Locations in backticks:**
- `src/api/api-service/src/main/java/com/mikkytrionze/nkst/member/application/service/MemberServiceImpl.java` — modify `registerMember()` to create `BaptismRecord` when `isBaptised=true`

**Current Code Implementation:**
The `registerMember()` method may conditionally create `BaptismRecord` but does not guarantee creation when `isBaptised=true`.

**Target Code Implementation:**
Add unconditional `BaptismRecord` creation when `isBaptised=true` in the `registerMember()` method. Map `baptismalNumber` to `BaptismRecord.serialNumber`, and set optional fields (`worshipCenter`, `bibleVerse`, `baptizedBy`, `remark`, `dateOfBaptism`) from submission payload.

**Step-by-Step Implementation Guide:**
1. Open `src/api/api-service/src/main/java/com/mikkytrionze/nkst/member/application/service/MemberServiceImpl.java`
2. Locate the `registerMember()` method
3. Add block: `if (isBaptised) { BaptismRecord record = new BaptismRecord(); record.setSerialNumber(baptismalNumber); record.setWorshipCenter(worshipCenter); record.setBibleVerse(bibleVerse); record.setBaptizedBy(baptizedBy); record.setRemark(remark); record.setDateOfBaptism(dateOfBaptism); baptismRecordRepository.save(record); }`
4. Ensure `BaptismRecordRepository` has `save(BaptismRecord)` method (already exists)
5. Build the project: `mvn compile`
6. Run unit tests: `mvn test`
7. Verify the BaptismRecord is created when `isBaptised=true`

**Error Codes:**
- None (operation is additive; no new error paths)

**Log Structures:**
- `AUTH-REGISTER-BAPTISMAL-RECORD-CREATED: userId={userId}, baptismalNumber={baptismalNumber}`

**Testing and Verification Plan:**
- Register a member with `isBaptised=true` and a baptismal number
- Assertion: `BaptismRecord` exists in database with `serialNumber` matching baptismal number
- Register a member with `isBaptised=false`
- Assertion: no `BaptismRecord` created

---

### FE: Add feature flag evaluation before rendering registration screen

**Exact file paths in backticks:**
- `src/mobile/featureFlags.ts` (new — creates the feature flag hook)
- `src/mobile/RegistrationScreen.tsx` (modify — add feature flag check at top)

**Description:** Add feature flag evaluation before rendering the mobile registration screen. When the flag `nkst.features.memberSelfService` is `false`, hide the registration option and show a "Coming soon" message. When `true`, render the full registration form.

**Step-by-Step Implementation Guide:**
1. Create `src/mobile/featureFlags.ts` with `useFeatureFlag('nkst.features.memberSelfService')` hook
   - Import `useState`, `useEffect` from `react`
   - Define flag key: `const FLAG_KEY = 'nkst.features.memberSelfService'`
   - Create hook that reads from remote config or returns default `true`
   - Add `useEffect` to fetch flag from feature flag service at mount
2. At the top of `RegistrationScreen.tsx`, evaluate the feature flag
   - If `false`, render `<View><Text>Coming soon</Text></View>` and return early
   - If `true`, proceed with rendering the registration form
3. Connect feature flag state to navigation visibility (hide/show register option in menu)
4. Add `useEffect` in `useFeatureFlag` to poll for flag changes (every 30 seconds)

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

---

### Epic: Baptism and Financial Section Unlock

**Business Context:**
The backend already stores baptism status via `Member.isBaptised` boolean and `BaptismRecord` entity. When a member is baptized (`isBaptised=true`), the financial section on the dashboard is unlocked. This epic ensures the mobile registration flow properly records baptism status and that the dashboard financial section responds correctly.

**High-Level Scope:**
- Mobile registration screen collects baptism status and baptismal number
- Baptism status stored via `Member.isBaptised` boolean
- Financial section on dashboard unlocks when `isBaptised=true`
- Financial section remains hidden when `isBaptised=false`

**Excluded Scope:**
- Backend baptism record creation logic (already implemented)
- Dashboard financial section logic (already exists)

**Delta Focus:**
- Ensure mobile screen reveals baptismal number field when baptism toggle is `true`
- Ensure baptismal number validated for uniqueness before submission
- Ensure after registration with `isBaptised=true`, dashboard financial section is unlocked
- Ensure after registration with `isBaptised=false`, dashboard financial section remains hidden

**Flag and Contract Strategy:**
- Baptism status flows through existing `Member.isBaptised` and `BaptismRecord` entities
- No contract changes; mobile DTO maps to existing `MemberRequest`

**Risks:**
- Baptismal number not submitted when `isBaptised=true` — mitigation: reveal baptismal number field only when toggle is on, make submission fail if missing

**Exit Criteria:**
- Mobile screen reveals baptismal number field when baptism toggle is `true`
- Baptismal number validated for uniqueness before submission
- After registration with `isBaptised=true`, dashboard financial section is unlocked
- After registration with `isBaptised=false`, dashboard financial section remains hidden

---

### User Story: Baptism Status Recording and Validation

**Description:**
As a member, I want my baptism status to be recorded during registration, So that my baptism details are captured and validated correctly in the system.

**Background and Current Behavior:**
The backend already stores baptism status via `Member.isBaptised` boolean and `BaptismRecord` entity. When a member is baptized (`isBaptised=true`), the financial section on the dashboard is unlocked. However, the mobile registration screen does not collect or submit baptism status or baptismal number.

**Target Functional Behavior (the delta):**
- Mobile registration screen includes a baptism toggle switch
- When the toggle is `true`, a baptismal number text field is revealed
- Baptismal number is validated for uniqueness against `Member.tel` column
- If baptismal number is a duplicate, the case is routed to review and no member record is created
- When `isBaptised=true`, the `BaptismRecord` is created with `serialNumber` (baptismal number), and optional fields `worshipCenter`, `bibleVerse`, `baptizedBy`, `remark`, `dateOfBaptism`
- After successful registration, the dashboard financial section checks `Member.isBaptised` and unlocks accordingly

**Out of Scope:**
- Backend baptism record creation logic (already implemented)
- Dashboard financial section logic (already exists)
- Baptismal number format validation beyond uniqueness

**Acceptance Criteria:**
- Mobile screen reveals baptismal number field when baptism toggle is `true`
- Baptismal number is validated for uniqueness before submission
- If duplicate baptismal number, review case created, no second member record exists
- After registration with `isBaptised=true`, dashboard financial section is unlocked
- After registration with `isBaptised=false`, dashboard financial section remains hidden

---

## Technical Tasks

### BE: Ensure baptismal number validated for uniqueness against `Member.tel`

**Exact file paths in backticks:**
- `src/api/api-service/src/main/java/com/mikkytrionze/nkst/member/application/service/MemberServiceImpl.java` (modify — add baptismal number uniqueness validation)

**Description:** Validate baptismal number uniqueness against the `Member.tel` column before member registration. This BE task ensures that when a member submits a baptismal number during registration, it is checked against existing `Member.tel` values to prevent duplicates. If a duplicate is found, the case is routed to review and no member record is created.

**Service Context and Architecture Overview:**
The `MemberServiceImpl` class contains the business logic for member creation and baptism record management. This task adds a validation step in the registration flow to check baptismal number uniqueness against `Member.tel`.

**Context and Problem Statement:**
Currently, the backend does not validate baptismal number uniqueness during mobile registration. A member could submit a baptismal number that already exists in the `Member.tel` column, potentially creating ambiguity in the registry. This task adds the validation to maintain data integrity.

**File Locations in backticks:**
- `src/api/api-service/src/main/java/com/mikkytrionze/nkst/member/application/service/MemberServiceImpl.java` — modify `registerMember()` method to add uniqueness check

**Current Code Implementation:**
The `registerMember()` method currently checks username uniqueness via `MemberRepository.existsByUsername()` but does not check baptismal number uniqueness against `Member.tel`.

**Target Code Implementation:**
Add a validation step in `registerMember()` that queries `MemberRepository.existsByTel(baptismalNumber)` before creating the member record. If a match is found, return a `409 Conflict` error and route the case to the review queue.

**Step-by-Step Implementation Guide:**
1. Open `src/api/api-service/src/main/java/com/mikkytrionze/nkst/member/application/service/MemberServiceImpl.java`
2. Locate the `registerMember()` method
3. Add validation: `if (memberRepository.existsByTel(baptismalNumber)) { throw new DuplicateBaptismalNumberException(); }`
4. Ensure `MemberRepository` interface has `existsByTel(String tel)` method
5. If method doesn't exist, add `boolean existsByTel(String tel)` to `MemberRepository.java`
6. Build the project: `mvn compile`
7. Run unit tests: `mvn test`
8. Verify the validation works as expected

**Error Codes:**
- `409` — Duplicate baptismal number; case routed to review

**Log Structures:**
- `AUTH-REGISTER-BAPTISMAL-DUPLICATE: baptismalNumber={baptismalNumber}, reason=existsByTel`

**Testing and Verification Plan:**
- Submit registration with a baptismal number that already exists in `Member.tel`
- Assertion: `409` response received, no member record created, case routed to review
- Submit registration with a new baptismal number
- Assertion: member record created successfully

---

### BE: Ensure BaptismRecord created when `isBaptised=true`

**Exact file paths in backticks:**
- `src/api/api-service/src/main/java/com/mikkytrionze/nkst/member/application/service/MemberServiceImpl.java` (modify — ensure BaptismRecord creation)

**Description:** Ensure that when `isBaptised=true` is submitted during registration, a `BaptismRecord` entity is created with the provided baptismal number and optional fields.

**Service Context and Architecture Overview:**
The `MemberServiceImpl` class handles member creation and associated `BaptismRecord` entity management. This task ensures the BaptismRecord is properly created and persisted when the baptism flag is set to true.

**Context and Problem Statement:**
The backend already has `BaptismRecord` entity and `BaptismRecordRepository`, but the registration flow may not always create the record when `isBaptised=true`. This task ensures the record is always created in the correct circumstances.

**File Locations in backticks:**
- `src/api/api-service/src/main/java/com/mikkytrionze/nkst/member/application/service/MemberServiceImpl.java` — modify `registerMember()` to create `BaptismRecord` when `isBaptised=true`

**Current Code Implementation:**
The `registerMember()` method may conditionally create `BaptismRecord` but does not guarantee creation when `isBaptised=true`.

**Target Code Implementation:**
Add unconditional `BaptismRecord` creation when `isBaptised=true` in the `registerMember()` method. Map `baptismalNumber` to `BaptismRecord.serialNumber`, and set optional fields (`worshipCenter`, `bibleVerse`, `baptizedBy`, `remark`, `dateOfBaptism`) from submission payload.

**Step-by-Step Implementation Guide:**
1. Open `src/api/api-service/src/main/java/com/mikkytrionze/nkst/member/application/service/MemberServiceImpl.java`
2. Locate the `registerMember()` method
3. Add block: `if (isBaptised) { BaptismRecord record = new BaptismRecord(); record.setSerialNumber(baptismalNumber); record.setWorshipCenter(worshipCenter); record.setBibleVerse(bibleVerse); record.setBaptizedBy(baptizedBy); record.setRemark(remark); record.setDateOfBaptism(dateOfBaptism); baptismRecordRepository.save(record); }`
4. Ensure `BaptismRecordRepository` has `save(BaptismRecord)` method (already exists)
5. Build the project: `mvn compile`
6. Run unit tests: `mvn test`
7. Verify the BaptismRecord is created when `isBaptised=true`

**Error Codes:**
- None (operation is additive; no new error paths)

**Log Structures:**
- `AUTH-REGISTER-BAPTISMAL-RECORD-CREATED: userId={userId}, baptismalNumber={baptismalNumber}`

**Testing and Verification Plan:**
- Register a member with `isBaptised=true` and a baptismal number
- Assertion: `BaptismRecord` exists in database with `serialNumber` matching baptismal number
- Register a member with `isBaptised=false`
- Assertion: no `BaptismRecord` created

---