# Sub-Feature: Authentication

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `1.6` Authentication |
| Version | Version one |
| Parent Feature | `1` Member Registration and Identity |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 1`, `REQ-006` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature authenticates members and staff with a username and password and ensures the session is honored across both the mobile app and the web portal.

## What the PRD states

> "Members and staff authenticate with username and password, and the session is honored across the mobile app and the web portal."

The PRD assigns this requirement `User Target: Both` and `Priority: High`.

## Why It Exists

Every feature that shows member data depends on a trusted identity. This sub-feature exists so one authentication produces a session that the mobile app and the web portal both accept, which lets a member move between surfaces without re authenticating.

## Detailed Mechanics

1. The user enters a username and password on either surface.
2. The system checks the credentials against the stored account.
3. On success, the system issues a session that carries the member identity.
4. The session is accepted by both the mobile app and the web portal.
5. The system re evaluates the role and permissions on each request as described in `6.6`.
6. On failure, the system denies access and records the attempt.

The flow runs for both members on the mobile app and staff on the web portal. It does not run for a non baptized member's financial screens, because those are blocked separately by `2.2`.

## State and Data Impact

Before the flow runs, the user is anonymous. After it runs, an authenticated session exists for that identity and works on both surfaces. The role and permission state lives with the account and is read on each request.

## Interaction With the Rest of the Product

`1.1` and `1.2` create the account this sub-feature authenticates. `1.13` supplies the role bound to the identity. `6.6` owns the permission checks applied after authentication. `2.2` still blocks financial access independently of successful authentication.

## Edge Cases

1. Wrong password. The attempt must fail, be recorded, and never create a session.
2. Repeated failed attempts. The system must apply a reasonable retry limit and lock path to protect the account.
3. Session used after logout. The ended session must no longer be honored.
4. Session presented on the other surface. The session must be honored across surfaces.
5. A non baptized member authenticates. Authentication succeeds for the non financial parts of the app, and `2.2` blocks financial access.

## Error and Gap Handling

A credential failure returns a denial and logs the attempt. A locked account shows the lock state and the recovery path through `1.7`. A malformed session is rejected and the user is asked to sign in again. Authorization failures return a denial rather than leaking data.

## Accessibility and Trust Notes

The sign in screen must label both fields, support a screen reader, and never echo the password. The password field must be revealed only on explicit user action. Session behavior must be described simply so a low literacy member trusts that one sign in covers the app and the portal.

## Acceptance Criteria

- A valid username and password produce a session.
- The same session works on the mobile app and the web portal.
- A wrong password produces no session and is recorded.
- A logged out session is not honored again.
- A non baptized member authenticates but financial screens stay blocked.

## Test Scenarios

1. Valid sign in. Setup: a stored account. Assertion: a session is issued and honored on both surfaces.
2. Wrong password. Setup: an incorrect password. Assertion: no session is issued and the attempt is recorded.
3. Logout. Setup: an active session then logout. Assertion: the ended session is rejected.
4. Cross surface session. Setup: sign in on the app. Assertion: the portal accepts the same session.
5. Non baptized financial block. Setup: a non baptized account. Assertion: authentication works but `2.2` denies the financial screens.

## Jira-Ready Seed

User story: As a user, I want one sign in to work on the app and the portal, so that I do not authenticate twice.
Technical tasks: implement credential verification, issue the cross surface session, and enforce per request permission checks.
Depends on: `1.1`, `1.2`, `1.13`, `2.2`, and `6.6`.