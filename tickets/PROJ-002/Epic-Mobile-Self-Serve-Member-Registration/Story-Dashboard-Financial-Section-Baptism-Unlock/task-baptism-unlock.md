# Dashboard Financial Section Baptism Unlock

**Standalone Title:** Dashboard Financial Section Baptism Unlock

**User Story Statement:**
As a member, I want the baptism status to unlock the financial section on dashboard, So that I can view my financial records immediately upon verifying my baptism status.

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

---

## Technical Tasks

### FE: Implement baptism toggle and conditional baptismal number field

**Exact file paths in backticks:**
- `src/mobile/RegistrationScreen.tsx` (modify — add baptism toggle and conditional field)
- `src/mobile/hooks/useBaptism.ts` (new — baptism state hook)

**Description:** Implement the baptism toggle switch that reveals/hides the baptismal number text field, and ensure the state is properly managed and submitted with the registration payload.

**Step-by-Step Implementation Guide:**
1. Create `src/mobile/hooks/useBaptism.ts`:
   - Initialize `isBaptised` state to `false`
   - Initialize `baptismalNumber` state to empty string
   - Export functions: `setIsBaptised(value: boolean)`, `setBaptismalNumber(value: string)`
   - When `isBaptised` changes to `true`, reveal baptismal number field
   - When `isBaptised` changes to `false`, clear baptismal number field
2. In `RegistrationScreen.tsx`, import and use `useBaptism` hook
3. Add `Switch` component for baptism toggle
4. Conditionally render `TextInput` for baptismal number when `isBaptised` is `true`
5. Add label "Baptismal number" above the conditional field
6. Add validation: if `isBaptised=true` and baptismal number is empty, show error "Baptismal number is required when baptized"
7. Pass `baptismalNumber` in registration payload to `useMobileRegister` mutation

**Error Handling:**
- Validation: if `isBaptised=true` and baptismal number is empty, show error "Baptismal number is required when baptized"
- Validation: if `isBaptised=true` and baptismal number already exists in `Member.tel`, show error "Baptismal number already registered; case routed to review"
- Error messages displayed inline above baptismal number field

**Log Structures:**
- `BAPTISM-TOGGLE: isBaptised={boolean}, baptismalNumber={value}`
- `BAPTISM-FIELD-SHOW: isBaptised={true}`
- `BAPTISM-FIELD-HIDE: isBaptised={false}`

**Testing and Verification Plan:**
- Render `RegistrationScreen`, verify baptism toggle is `false` by default
- Verify baptismal number field is hidden when `isBaptised=false`
- Toggle baptism `true`, verify baptismal number field appears
- Toggle baptism `false`, verify baptismal number field disappears and is cleared
- Enter baptismal number and submit with `isBaptised=true`, assert validation passes if unique
- Enter duplicate baptismal number, assert error "Baptismal number already registered" displays

---

### FE: Ensure feature flag evaluation hides baptismal number field when flag is false

**Exact file paths in backticks:**
- `src/mobile/featureFlags.ts` (modify — ensure flag check gates baptism fields)
- `src/mobile/RegistrationScreen.tsx` (modify — add flag check before rendering baptism section)

**Description:** Ensure that when the feature flag `nkst.features.memberSelfService` is `false`, the entire registration screen including baptism fields is hidden, and a "Coming soon" message is shown instead.

**Step-by-Step Implementation Guide:**
1. In `src/mobile/featureFlags.ts`, the `useFeatureFlag` hook should evaluate `nkst.features.memberSelfService`
2. At the top of `RegistrationScreen.tsx`, check feature flag before rendering ANY part of the screen
3. If `false`, render `<View><Text>Coming soon</Text></View>` and return early — no baptism fields shown
4. If `true`, proceed with rendering the full registration screen including baptism toggle and field
5. Add `useEffect` to poll for flag changes every 30 seconds and re-render accordingly

**Error Codes:**
- None (feature flag is a configuration toggle; no runtime error paths)

**Testing and Verification Plan:**
- Set `nkst.features.memberSelfService=false` in config
- Launch app and verify registration screen/option is hidden
- Verify "Coming soon" message displayed, no baptism fields visible
- Set `nkst.features.memberSelfService=true` (default)
- Launch app and verify full registration screen with baptism fields renders correctly

---