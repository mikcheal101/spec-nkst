# PROJ-002

**Header Block:**  
**Document ID:** `PROJ-002`  
**Title:** Mobile Self-Serve Member Registration Delivery Package  
**Author:** Hirekaan Micheal Hemen  
**Source reference:** `ENGR-002.md`

## Delivery Index

| Issue Type | Summary | Story Points | Depends On |
|---|---|---|---|
| Epic | Mobile Self-Serve Member Registration | 8 | — |
| Story | Self-Serve Mobile Registration Workflow | 5 | PROJ-002 |
| FE: | Initialize React Native / Expo mobile application workspace | 5 | PROJ-003 |
| FE: | Build mobile registration screen component (`RegistrationScreen.tsx`) | 3 | PROJ-004 |
| FE: | Implement `useMobileRegister()` React Query hook | 2 | PROJ-004 |
| FE: | Add feature flag `nkst.features.memberSelfService` with default `true` | 1 | PROJ-004 |
| FE: | Implement offline save outbox pattern following `4-offline-data-saving-and-sync` | 3 | PROJ-004 |
| FE: | Implement double-tap debounce on submit button | 1 | PROJ-004 |
| Story | Dashboard Financial Section Baptism Unlock | 3 | PROJ-002 |
| BE: | Ensure baptismal number validated for uniqueness against `Member.tel` | 1 | PROJ-005 |
| BE: | Ensure `BaptismRecord` created when `isBaptised=true` | 1 | PROJ-005 |
| Story | Feature Flag Endpoint Gate | 2 | PROJ-002 |
| FE: | Add feature flag evaluation before rendering registration screen | 1 | PROJ-006 |
| FE: | Test feature flag false hides registration screen | 1 | PROJ-006 |
| FE: | Test feature flag true enables registration screen | 1 | PROJ-006 |
| Epic | Baptism and Financial Section Unlock | 5 | — |
| Story | Baptism Status Recording and Validation | 3 | PROJ-002 |
| BE: | Ensure baptismal number validated for uniqueness against `Member.tel` | 1 | PROJ-007 |
| BE: | Ensure `BaptismRecord` created when `isBaptised=true` | 1 | PROJ-007 |
| Package Definition of Done | — | — | — |
| — | Mobile registration screen built and wired to existing backend endpoints | — | — |
| — | Feature flag `nkst.features.memberSelfService` configured with default `true` | — | — |
| — | Offline save outbox pattern integrated following `4-offline-data-saving-and-sync` | — | — |
| — | Double-tap debounce on submit implemented | — | — |
| — | All test cases pass (12 test scenarios) | — | — |
| — | Canary rollout to 10% of mobile users successful | — | — |
| — | 100% rollout with no critical issues | — | — |
| — | Root workspace initialized with React Native/Expo scaffolding | — | — |

## Feature Flag Registry

| Flag Key | Default State | Owning Ticket |
|---|---|---|
| `nkst.features.memberSelfService` | `true` | PROJ-003 |

## Key Decisions and Assumptions

- Mobile registration reuses existing `POST /api/v1/auth/register` and `POST /api/v1/members` endpoints; no new backend endpoints created.
- Baptism status stored via existing `Member.isBaptised` boolean and `BaptismRecord` entity; no new database columns.
- Church selection is a dropdown bound to `ChurchRepository` list; free-text entry not permitted.
- Feature flag `nkst.features.memberSelfService` defaults to `true`; gate evaluated at screen-render time.
- Offline saves follow outbox pattern from `4-offline-data-saving-and-sync`; no custom sync logic.
- Root workspace initialized with React Native/Expo scaffolding before mobile feature implementation.
- Mobile app has access to same API base URLs as web portal (`AUTH_API_BASE`, `PEOPLE_API_BASE`).
- Lagos church list in database is pre-populated and does not change frequently at runtime.
- Member `tel` column (phone/card number) is the unique identifier used for duplicate detection.
- Root workspace initialization follows `expo init` or `npx react-native@latest` pattern.

## The Tickets

### Epic: Mobile Self-Serve Member Registration

**Business Context:**  
A new member opening the mobile app cannot register themselves via self-serve; they need manual onboarding or clerk assistance. The backend and web portal registration flows are complete, but the mobile channel is unaddressed and the mobile workspace is uninitialized. This epic delivers the mobile self-serve registration flow so members can join the digital registry directly from their phone.

**High-Level Scope:**  
- Root workspace initialized with React Native/Expo scaffolding  
- Mobile registration screen with username (phone/card), password, church selection, baptism toggle, baptismal number  
- Wiring to existing `POST /api/v1/auth/register` and `POST /api/v1/members` endpoints  
- Feature flag `nkst.features.memberSelfService` gate (default `true`)  
- Offline save outbox pattern following `4-offline-data-saving-and-sync`  
- Double-tap debounce on submit  
- Baptism status stored; financial section unlocks when `isBaptised=true`  
- Feature flag evaluation before rendering screen  

**Excluded Scope:**  
- No backend endpoint changes; mobile reuses existing contracts  
- No web portal changes; existing React registration unaffected  
- No new database tables or columns  

**Delta Focus:**  
- Initialize root workspace with React Native/Expo scaffolding  
- Build mobile registration screen component (`RegistrationScreen.tsx`)  
- Implement `useMobileRegister()` React Query hook  
- Add API client methods for mobile (`authApi.register()`, `peopleApi.create()`)  
- Add feature flag configuration `nkst.features.memberSelfService`  
- Integrate offline save outbox pattern  
- Implement double-tap debounce on submit  
- Add feature flag evaluation before rendering screen  

**Flag and Contract Strategy:**  
- Feature flag `nkst.features.memberSelfService` gates the registration screen rendering and endpoint access; default `true`  
- No contract changes; mobile DTO maps to existing `SignupRequest` and `MemberRequest`  
- Backward compatibility: no existing endpoints or schemas modified  

**Risks:**  
- Root workspace initialization fails — mitigation: follow Expo documentation; use `npx expo@latest`  
- Feature flag default `true` enables endpoint for all users — mitigation: flag toggleable `false` in config  
- Baptismal number uniqueness clash with `Member.tel` unique index — mitigation: validate before submission, clear error message  
- Offline data loss if app killed before sync — mitigation: outbox pattern with persistent local storage  
- Double-tap submissions despite debounce — mitigation: 1-second debounce; UI disables submit after first tap  

**Exit Criteria:**  
- Root workspace initialized with React Native/Expo scaffolding  
- Mobile registration screen renders and accepts all required inputs  
- Successful registration creates member record and authenticated session  
- Duplicate username or baptismal number routes to review, creates nothing  
- Feature flag `false` hides registration screen, endpoint returns `403`  
- Offline save stores entry locally as `pending`; sync restores entry when connectivity returns  
- Canary rollout to 10% successful, then 100% with no critical issues  

### User Story: Self-Serve Mobile Registration Workflow

**Description:**  
As a member,  
I want to register from the app with my phone number or card number,  
So that I can join the digital registry myself.

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
- A member completes self service registration on the mobile app with a username, password, church, baptism status, and baptismal number.  
- The church list shows Lagos churches loaded from the database.  
- A successful registration lands the member on the dashboard with an authenticated session.  
- A duplicate username or baptismal number produces a review case and creates nothing.  
- The entered values survive a failed submit so the member can correct them.  
- The feature flag `nkst.features.memberSelfService=false` hides the registration screen and returns `403` on endpoint access.  
- Offline submit saves locally as `pending`; sync restores entry when connectivity returns.  
- Double tap on submit produces exactly one member record.  

### User Story: Dashboard Financial Section Baptism Unlock

**Description:**  
As a member,  
I want the baptism status to unlock the financial section on dashboard,  
So that I can view my financial records immediately upon verifying my baptism status.

**Background and Current Behavior:**  
The backend already stores baptism status via `Member.isBaptised` boolean and `BaptismRecord` entity. When a member is baptized (`isBaptised=true`), the financial section on the dashboard is unlocked. However, the mobile registration screen does not collect or submit baptism status or baptismal number. The mobile workspace is uninitialized and must be bootstrapped first.

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

### FE: Initialize React Native / Expo mobile application workspace

**Exact file paths in backticks:**
- `expo.json` (new — created by `expo init`)
- `App.tsx` (new — created by `expo init`)
- `package.json` (new — created by `expo init`)
- `src/mobile/` (new directory — created by `expo init`)

**Description:**  
Initialize a new React Native/Expo mobile application workspace from scratch. This foundational task must precede all other mobile feature implementation. The task creates the root project structure, installs core dependencies, and configures essential providers.

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

### BE: Ensure baptismal number validated for uniqueness against Member.tel

**Exact file paths in backticks:**
- `src/api/modules/member/impl/MemberServiceImpl.java` (modify — add baptismal number uniqueness validation)

**Description:**  
Validate baptismal number uniqueness against the `Member.tel` column before member registration. This BE task ensures that when a member submits a baptismal number during registration, it is checked against existing `Member.tel` values to prevent duplicates. If a duplicate is found, the case is routed to review and no member record is created.

**Service Context and Architecture Overview:**  
The `MemberServiceImpl` class contains the business logic for member creation and baptism record management. This task adds a validation step in the registration flow to check baptismal number uniqueness before proceeding with user/member creation.

**Context and Problem Statement:**  
Currently, the backend does not validate baptismal number uniqueness during mobile registration. A member could submit a baptismal number that already exists in the `Member.tel` column, potentially creating ambiguity in the registry. This task adds the validation to maintain data integrity.

**File Locations in backticks:**
- `src/api/modules/member/impl/MemberServiceImpl.java` — modify `registerMember()` method to add uniqueness check

**Current Code Implementation:**  
The `registerMember()` method currently checks username uniqueness via `MemberRepository.existsByUsername()` but does not check baptismal number uniqueness against `Member.tel`.

**Target Code Implementation:**  
Add a validation step in `registerMember()` that queries `MemberRepository.existsByTel(baptismalNumber)` before creating the member record. If a match is found, return a `409 Conflict` error and route the case to the review queue.

**Step-by-Step Implementation Guide:**
1. Open `src/api/modules/member/impl/MemberServiceImpl.java`
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

### BE: Ensure BaptismRecord created when isBaptised=true

**Exact file paths in backticks:**
- `src/api/modules/member/impl/MemberServiceImpl.java` (modify — ensure BaptismRecord creation)

**Description:**  
Ensure that when `isBaptised=true` is submitted during registration, a `BaptismRecord` entity is created with the provided baptismal number and optional fields.

**Service Context and Architecture Overview:**  
The `MemberServiceImpl` class handles member creation and associated `BaptismRecord` entity management. This task ensures the BaptismRecord is properly created and persisted when the baptism flag is set to true.

**Context and Problem Statement:**  
The backend already has `BaptismRecord` entity and `BaptismRecordRepository`, but the registration flow may not always create the record when `isBaptised=true`. This task ensures the record is always created in the correct circumstances.

**File Locations in backticks:**
- `src/api/modules/member/impl/MemberServiceImpl.java` — modify `registerMember()` to create `BaptismRecord` when `isBaptised=true`

**Current Code Implementation:**  
The `registerMember()` method may conditionally create `BaptismRecord` but does not guarantee creation when `isBaptised=true`.

**Target Code Implementation:**  
Add unconditional `BaptismRecord` creation when `isBaptised=true` in the `registerMember()` method. Map `baptismalNumber` to `BaptismRecord.serialNumber`, and set optional fields (`worshipCenter`, `bibleVerse`, `baptizedBy`, `remark`, `dateOfBaptism`) from submission payload.

**Step-by-Step Implementation Guide:**
1. Open `src/api/modules/member/impl/MemberServiceImpl.java`
2. Locate the `registerMember()` method
3. Add block: `if (isBaptised) { BaptismRecord record = new BaptismRecord(); record.setSerialNumber(baptismalNumber); record.setWorshipCenter(worshipCenter); ...; baptismRecordRepository.save(record); }`
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

### User Story: Feature Flag Endpoint Gate

**Description:**  
As a member,  
I want feature flag gate on registration endpoint,  
So that backend registration requests are securely blocked when self-service registration is disabled.

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

### FE: Add feature flag evaluation before rendering registration screen

**Exact file paths in backticks:**
- `src/mobile/featureFlags.ts` (new)
- `src/mobile/RegistrationScreen.tsx` (modify — add feature flag check at top)

**Description:**  
Add feature flag evaluation before rendering the mobile registration screen. When the flag `nkst.features.memberSelfService` is `false`, hide the registration option and show a "Coming soon" message. When `true`, render the full registration form.

**Step-by-Step Implementation Guide:**
1. Create `src/mobile/featureFlags.ts` with `useFeatureFlag('nkst.features.memberSelfService')` hook
2. At the top of `RegistrationScreen.tsx`, evaluate the feature flag
3. If `false`, render "Coming soon" message and return early
4. If `true`, proceed with rendering the registration form
5. Connect feature flag state to navigation visibility (hide/show register option in menu)

**Error Codes:**
- None (feature flag is a configuration toggle; no runtime error paths)

**Testing and Verification Plan:**
- Set `nkst.features.memberSelfService=false` in config
- Launch app and verify registration screen/option is hidden
- Show "Coming soon" message when registration is hidden
- Set `nkst.features.memberSelfService=true` (default)
- Launch app and verify registration screen is visible
- Toggle flag in config and verify screen appears/disappears

### FE: Test feature flag false hides registration screen

**Description:**  
Verify that setting the feature flag `nkst.features.memberSelfService` to `false` hides the registration screen and shows "Coming soon" message.

**Acceptance Criteria:**  
- Configuration: `nkst.features.memberSelfService=false`  
- App launches, registration screen/option is not visible  
- "Coming soon" message displayed in place of registration  

### FE: Test feature flag true enables registration screen

**Description:**  
Verify that setting the feature flag `nkst.features.memberSelfService` to `true` (default) enables the registration screen.

**Acceptance Criteria:**  
- Configuration: `nkst.features.memberSelfService=true`  
- App launches, registration screen/option is visible  
- Full registration form renders correctly  

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

### User Story: Baptism Status Recording and Validation

**Description:**  
As a member,  
I want my baptism status to be recorded during registration,  
So that my baptism details are captured and validated correctly in the system.

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

### Package Definition of Done

- Mobile registration screen built and wired to existing backend endpoints
- Feature flag `nkst.features.memberSelfService` configured with default `true`
- Offline save outbox pattern integrated following `4-offline-data-saving-and-sync`
- Double-tap debounce on submit implemented
- All 12 test scenarios pass
- Canary rollout to 10% of mobile users successful
- 100% rollout with no critical issues; feature flag can be toggled `false` to disable instantly
- Root workspace initialized with React Native/Expo scaffolding