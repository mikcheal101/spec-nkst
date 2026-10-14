# Sub-Feature: Password and session security

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `6.10` Password and session security |
| Version | Version one |
| Parent Feature | `6` Custom Modules and Platform Features |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Custom Modules and Platform Features`, `REQ-079` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature implements password hashing for authentication and a password reset flow tied to the registered phone number. Authentication uses password hashing, and password reset happens over the registered phone number, so a user who forgets their password can reset it without needing to contact support, as long as they have access to their registered phone.

## What the PRD states

> "Authentication uses password hashing, and password reset happens over the registered phone number."

The PRD assigns this requirement `User Target: Both` and `Priority: High`.

## Why It Exists

The PRD describes a system where users authenticate with a username and password, and the reset flow is tied to the registered phone number so that a lost password is not a permanent block. This sub-feature exists so that the platform stores passwords securely (hashed, never in plain text) and provides a self service reset path that the user can trigger from the login screen.

## Detailed Mechanics

1. When a user creates an account (during registration in `1.1` or `1.2`), the system hashes the chosen password using a strong one way hash (bcrypt or argon2) and stores only the hash; the plain text password is never written to the database.
2. When the user attempts to authenticate, the system receives the username and password, hashes the submitted password, and compares the hash to the stored hash. If they match, the authentication succeeds and a session is created.
3. If the user forgets their password, the user opens the password reset screen on the login page.
4. The user enters their username (phone number or card number) or registered email.
5. The system looks up the user's record and verifies that the username matches an existing account.
6. The system sends a one time password (OTP) to the user's registered phone number via the SMS gateway or notification service.
7. The user receives the OTP on their phone and enters it into the reset screen.
8. The system verifies the OTP. If it matches, the user is prompted to enter a new password.
9. The system hashes the new password and updates the stored hash, replacing the old one. The session is kept or a new session is created.
10. If the OTP does not match or the username is not found, the reset screen shows an error and the user can try again.

The flow runs on both the mobile app and the web portal; the login and reset screens exist on both surfaces.

## State and Data Impact

Before the password is set, the user record has no password hash. After the account is created, the user record carries the password hash. After a password reset, the hash is updated to the new password. The session is refreshed after a reset. The audit trail logs the password creation and the reset action.

## Interaction With the Rest of the Product

`1.7` (Password reset via phone) is the earlier feature that this sub-feature extends and formalizes; this feature is the RBAC and platform level implementation of the same concept. `6.6` gates who can change the password policy (for example, the system admin can configure the hash algorithm, minimum length, and expiration), but the default uses bcrypt with a reasonable policy. `5.3` logs the password creation and reset in the audit trail. `6.8` (Notifications) sends the OTP to the user's phone.

## Edge Cases

1. The user's phone number changes. The system must allow the admin to update the registered phone number, and the next reset will use the new number.
2. The SMS gateway is temporarily unavailable. The reset flow must show an error and offer a manual admin reset option.
3. The user enters the wrong OTP multiple times. The system must lock the account for a configurable period (for example, 30 minutes) and surface the lock to the user.
4. A user tries to set a password that is on a commonly used password list. The system must reject the password and prompt the user to choose a stronger one.
5. An admin resets a user's password from the web portal. The admin enters the user's identity, generates an OTP, and the system follows the same reset flow, but the admin can also choose to set a new password directly without an OTP if they have the super admin role.

## Error and Gap Handling

Phone number change: the admin can update the registered number and the next reset uses the new number. SMS gateway unavailable: the reset flow shows an error and offers a manual admin reset option. Wrong OTP multiple times: the account is locked for the configurable period and the user sees the lock message. Common password: the system rejects the password and prompts for a stronger one. Admin direct reset: the admin can set a new password directly if they have the super admin role.

## Acceptance Criteria

- Passwords are hashed using a strong one way hash (bcrypt/argon2) and never stored in plain text.
- Authentication compares the submitted password hash to the stored hash.
- Password reset sends an OTP to the registered phone number.
- The user enters the OTP and then sets a new password.
- The new password is hashed and the stored hash is updated.
- The session is kept or a new session is created after a reset.
- If the SMS gateway is unavailable, the reset flow shows an error and offers a manual admin reset.
- If the user enters the wrong OTP multiple times, the account is locked for the configurable period.
- If the user tries a commonly used password, the system rejects it and prompts for a stronger one.
- An admin can reset a user's password directly from the web portal if they have the super admin role.

## Test Scenarios

1. Account creation with hash. Setup: a new user registers with a password. Assertion: the stored password is a hash, not plain text.
2. Authentication with correct password. Setup: a user logs in with the correct password. Assertion: the session is created and the user is logged in.
3. Authentication with wrong password. Setup: a user tries to log in with the wrong password. Assertion: the login is refused and the user sees an error.
4. Password reset OTP sent. Setup: a user initiates a password reset. Assertion: an OTP is sent to the registered phone number.
5. Password reset OTP verified. Setup: the user enters the correct OTP and sets a new password. Assertion: the new password is hashed and the stored hash is updated.
6. Password reset wrong OTP. Setup: the user enters the wrong OTP. Assertion: the reset screen shows an error and the user can try again.
7. SMS gateway unavailable. Setup: the user initiates a reset but the SMS gateway is down. Assertion: the reset flow shows an error and offers a manual admin reset option.
8. Account lock after wrong OTP attempts. Setup: the user enters the wrong OTP many times. Assertion: the account is locked for the configurable period and the user sees the lock message.
9. Common password rejected. Setup: the user tries to set a password that is on the common list. Assertion: the system rejects the password and prompts for a stronger one.
10. Admin direct reset. Setup: a super admin resets a user's password from the web portal. Assertion: the user can log in with the new password.

## Jira-Ready Seed

User story: As a user, I want my password to be hashed and a reset flow tied to my phone number, so that my account is secure and I can recover my password if I forget it.
Technical tasks: implement bcrypt/argon2 password hashing, build the login screen with hash comparison, build the password reset screen with OTP to phone, implement the OTP verification and new password flow, handle the edge cases of SMS gateway unavailable, account lock, common password rejection, and admin direct reset, and log the password actions in the audit trail.
Depends on: the user record model with password hash, the SMS/notification service for OTP, the OTP service, the common password list, and the admin reset screen.