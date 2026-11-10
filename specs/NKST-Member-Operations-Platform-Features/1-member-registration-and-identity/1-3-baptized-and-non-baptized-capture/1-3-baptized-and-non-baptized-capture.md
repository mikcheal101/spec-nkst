# Sub-Feature: Baptized and Non Baptized Capture

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `1.3` Baptized and non baptized capture |
| Version | Version one |
| Parent Feature | `1` Member Registration and Identity |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 1`, `REQ-003` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature records whether a member is baptized or not at registration. The flag drives downstream access, especially financial access, so the data must be captured correctly and reused everywhere.

## What the PRD states

> "The registration form records baptism status so downstream access (especially financial) can be gated correctly."

The PRD assigns this requirement `User Target: Both` and `Priority: High`.

## Why It Exists

The PRD gates the entire financial surface on baptism status: baptized members see giving, non baptized members do not. This sub-feature exists to capture that fact once, at registration, so every later check reads a single trusted value.

## Detailed Mechanics

1. The registration form presents a baptism status choice.
2. When the member is baptized, the form records the baptismal number as required by `1.4`.
3. When the member is not baptized, the form records the non baptized state and no baptismal number is required.
4. The chosen value is stored on the member record.
5. Every downstream financial check reads the stored value rather than re asking the member.
6. The financial surface renders or hides according to the value, per `2.2`.

The flow runs inside both registration channels and never gets a third value, because the choice is one of baptized or non baptized.

## State and Data Impact

Before the flow runs, no baptism status exists for the member. After it runs, the member record carries a stored `baptized` value. That value stays with the member record and is read by `2-financial-contributions-and-giving`, `1.12`, and the role logic in `6-custom-modules-and-platform-features`.

## Interaction With the Rest of the Product

`1.1` and `1.2` render the choice, `1.4` consumes the baptized branch to capture the baptismal number, and `2.2` consumes the stored value to block non baptized members from financial screens. The sensitive discipline feature (`3.5`) is independent but also reads member status when it renders records.

## Edge Cases

1. A member is baptized but no number is stored. The form must require the number so the record is complete.
2. A non baptized member later becomes baptized. The member record must be updatable so the value and number can change over time.
3. The financial check runs while the value is missing. The safe default must treat the missing value as non baptized and deny financial access.
4. A record entered during historical digitizing has no baptism value. `5.5` must require the value or the safe non baptized default before saving.

## Error and Gap Handling

A submission without a baptism choice is refused and the field is named. A baptized submission without a baptismal number is refused by `1.4`. A missing stored value on an old record defaults to non baptized, which is the safe denial default for financial access.

## Accessibility and Trust Notes

The choice must be announced by a screen reader and must be a single clear question. The financial consequence must be described in plain language so a member understands what the choice unlocks.

## Acceptance Criteria

- The registration form records baptized or non baptized on both surfaces.
- A baptized member requires a baptismal number and a non baptized member does not.
- The stored value gates financial access: baptized opens, non baptized denies.
- A missing value defaults to the non baptized denial path.

## Test Scenarios

1. Baptized capture. Setup: register a baptized member with a number. Assertion: the stored value is baptized and financial access works.
2. Non baptized capture. Setup: register a non baptized member. Assertion: the stored value is non baptized and financial access is denied.
3. Missing choice. Setup: submit without baptism status. Assertion: the form refuses and names the field.
4. Missing number for a baptized member. Setup: baptized with no number. Assertion: `1.4` refuses the submit.
5. Value upgrade. Setup: a non baptized member becomes baptized. Assertion: the updated record reflects the new value and unlocks financial access.

## Jira-Ready Seed

User story: As a member, I want registration to record my baptism status, so that the right features unlock for me.
Technical tasks: add the baptism status field to the registration form, enforce the number rule for baptized members, and store the value on the member record.
Depends on: `1.1`, `1.2`, `1.4`, and `2.2`.