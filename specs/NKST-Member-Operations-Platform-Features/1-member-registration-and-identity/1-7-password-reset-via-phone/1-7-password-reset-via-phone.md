# Sub-Feature: Password Reset via Phone

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `1.7` Password reset via phone |
| Version | Version one |
| Parent Feature | `1` Member Registration and Identity |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 1`, `REQ-007` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature lets a user who forgot their password reset it through their registered phone number. The reset is tied to the phone number, and the new password takes effect over the stored account.

## What the PRD states

> "A user who forgets their password resets it through their registered phone number."

The PRD assigns this requirement `User Target: Both` and `Priority: High`.

## Why It Exists

The PRD describes low computer literacy among the clerk role, so a forgotten password must not be a recovery project. This sub-feature exists so a user can recover access with the phone number they already registered, on both surfaces.

## Detailed Mechanics

1. The user requests a password reset.
2. The user enters their registered phone number.
3. The system confirms a valid code to the phone number. The exact delivery path is not stated in the PRD, so the safe plain default is a verification code sent to the phone.
4. The user enters the code received.
5. The system verifies the code.
6. The user sets a new password.
7. The system stores the new password and ends the current session so the old credentials stop working.
8. The user signs in with the new password on either surface.

The flow does not run when the phone number is not registered. The delivery of the code is tied to the registered phone number, so a user must own the phone number.

## State and Data Impact

Before the flow runs, the account has the old password. After it runs, the account carries a new password and any active session has ended. The phone number itself is not changed by this flow, because the PRD ties reset only to the registered number.

## Interaction With the Rest of the Product

`1.6` issues the sessions that this flow ends on reset. `6.10` owns the password hashing that stores the new password. `6.11` delivers the reset communication to the phone number. The flow never touches `baptismal_number` identity because it is an account recovery path, not a re registration.

## Edge Cases

1. Phone number not registered. The system must refuse and direct the user to the registration and verification path.
2. Wrong code. The flow must refuse, and repeated wrong codes must expire the attempt for safety.
3. Reset initiated by someone who does not own the phone. The code goes to the registered number, so the real owner controls the outcome.
4. Code expired. The user must request a new code.
5. Reset while offline. The reset must require a live connection, because ending sessions and storing a new password must be authoritative.

## Error and Gap Handling

An unregistered number fails with a clear message. A wrong code fails and the attempt counter increments. A failed reset never changes the stored password. A successful reset ends the old session so no stale credential keeps working.

## Accessibility and Trust Notes

The reset flow must use plain language and a screen reader friendly form. The system must explain that the code goes only to the registered number and that the new password replaces the old one. No code is ever shown back on screen.

## Acceptance Criteria

- A user resets the password through the registered phone number.
- A valid code allows a new password to be stored.
- The old session ends after a successful reset.
- An unregistered number is refused.
- A reset cannot complete without a live connection to the registry.

## Test Scenarios

1. Successful reset. Setup: a registered number and a valid code. Assertion: the new password works and the old session is ended.
2. Unregistered number. Setup: a number with no account. Assertion: the flow refuses and points to registration.
3. Wrong code. Setup: an incorrect code. Assertion: the reset is refused and the password is unchanged.
4. Expired code. Setup: a code past its lifetime. Assertion: the user must request a new code.
5. Post reset sign in. Setup: a completed reset. Assertion: the new password signs in on both surfaces.

## Jira-Ready Seed

User story: As a user, I want to reset my password with my registered phone number, so that I can recover access when I forget it.
Technical tasks: build the reset flow, deliver the code to the phone number, store the new password via `6.10`, and end active sessions on reset.
Depends on: `1.6`, `6.10`, and `6.11`.