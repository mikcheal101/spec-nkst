# Sub-Feature: Member Registration (Member Self Serve)

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `1.1` Member registration (member self serve) |
| Version | Version one |
| Parent Feature | `1` Member Registration and Identity |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 1`, `REQ-001` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature lets a member register themselves from the mobile app. They enter a username and password, pick their church, record their baptism status and baptismal number, and on success they land on the dashboard with an authenticated session.

## What the PRD states

> "A member registers from the mobile app with a username (phone number or card number) and password, and picks their church, defaulting to the Lagos churches loaded from the database."

The PRD assigns this requirement `User Target: Mobile App` and `Priority: High`.

## Why It Exists

The PRD frames manual registration as a slow page by page process. Self service registration exists so a member can join the digital registry directly from the mobile app, picking their church from the Lagos list that the database already holds, instead of waiting on a clerk.

## Detailed Mechanics

1. The member installs and opens the mobile app.
2. The member taps register.
3. The member enters a username, which is a phone number or a card number, and a password.
4. The member picks their church from the loaded list, which defaults to the Lagos churches from the database.
5. The member records their baptism status and, when baptized, their baptismal number.
6. The member submits the registration.
7. The system verifies the account and checks the username and baptismal number against existing records as described in `1.5`.
8. On a clean verification, the system creates the member record and an authenticated session.
9. The member lands on the dashboard.
10. When the member is baptized, the financial section unlocks. The center does not run this step for non baptized members.

The flow does not run when the username or password is empty, when the church is not selected, or when `1.5` flags a duplicate for review.

## State and Data Impact

Before the flow runs, no member record or session exists for this person. After it runs, a member record exists keyed by `baptismal_number`, the `baptized` value is stored, and an authenticated session is active on the mobile app. A duplicate case writes nothing and leaves the registration in a review queue.

## Interaction With the Rest of the Product

`1.3` supplies the baptism status, `1.4` supplies the unique baptismal number, `1.5` verifies before this sub-feature confirms, `1.6` produces the session, and `1.9` supplies the church list. Downstream, the financial features in `2-financial-contributions-and-giving` read the `baptized` flag.

## Edge Cases

1. Duplicate username or baptismal number. The registration must be flagged for review in `1.5` and must not create a second member.
2. Empty church selection. The system must refuse to submit and ask for the church.
3. Low connectivity. The registration must follow `4-offline-data-saving-and-sync` and save locally.
4. Member selects a church not in the loaded list. The list must be the bound choice, and a missing church surfaces to an admin rather than being silently typed.
5. Duplicate tap on submit. The system must submit once and ignore the second tap until the first resolves.

## Error and Gap Handling

A failed submission shows a clear message naming the missing or invalid field and keeps the entered values so the member can correct and resubmit. A verification failure routes the case to `1.5` for review instead of showing a generic error. A network failure stores the entry locally for later sync and tells the member the entry is pending.

## Accessibility and Trust Notes

The registration screen must work with a screen reader, labels every field, and announces success or failure audibly. The screen must explain that the username is a phone number or a card number and that the password is private. No password is ever echoed back.

## Acceptance Criteria

- A member completes self service registration on the mobile app with a username, password, church, baptism status, and baptismal number.
- The church list shows Lagos churches loaded from the database.
- A successful registration lands the member on the dashboard with an authenticated session.
- A duplicate username or baptismal number produces a review case and creates nothing.
- The entered values survive a failed submit so the member can correct them.

## Test Scenarios

1. Happy path registration. Setup: a fresh member and a populated Lagos church list. Assertion: the member record exists, the session is active, and the dashboard loads.
2. Missing password. Setup: submit with an empty password. Assertion: the form refuses and names the password field.
3. Duplicate baptismal number. Setup: a pre existing baptismal number. Assertion: a review case is created and no second record exists.
4. Offline submit. Setup: no connectivity. Assertion: the entry saves locally as `pending`.
5. Double tap. Setup: tap submit twice quickly. Assertion: exactly one member record exists.

## Jira-Ready Seed

User story: As a member, I want to register from the app with my phone number or card number, so that I can join the digital registry myself.
Technical tasks: build the registration form, wire the church list default, wire account verification, and store the authenticated session on success.
Depends on: `1.3`, `1.4`, `1.5`, `1.6`, and `1.9`.