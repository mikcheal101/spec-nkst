# Baptism Status Recording and Validation

**Standalone Title:** Baptism Status Recording and Validation

**User Story Statement:**
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