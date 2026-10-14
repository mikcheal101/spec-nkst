# Sub-Feature: Account Verification

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `1.5` Account verification |
| Version | Version one |
| Parent Feature | `1` Member Registration and Identity |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 1`, `REQ-005` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature verifies a new account before it is created. The system checks the username and the baptismal number against existing records and flags duplicates for review instead of silently creating them.

## What the PRD states

> "The system verifies a new account, checking the username and the baptismal number against existing records, and flags duplicates for review instead of silently creating them."

The PRD assigns this requirement `User Target: Both` and `Priority: High`.

## Why It Exists

The PRD describes a sacred record that must stay clean. This sub-feature exists so the registry never silently accepts two records for one person, and so a human reviewer decides borderline duplicate cases instead of the system guessing.

## Detailed Mechanics

1. A registration arrives from either surface with a username and a baptismal number.
2. The system checks the username against existing accounts.
3. The system checks the baptismal number against existing member records.
4. When both are clear, the account is verified and registration proceeds.
5. When the username or the number matches an existing record, the system flags a duplicate case for review.
6. A flagged case creates no member record and no session.
7. A reviewer opens the case and decides to accept, merge, or reject.

The flow runs before every account creation and does not auto approve duplicates.

## State and Data Impact

Before the flow runs, a submitted username and number are unverified. After it runs, a clean case becomes a member record and a session, and a duplicate case exists as a review item that holds no member record. The review decision then creates, merges, or discards the case.

## Interaction With the Rest of the Product

`1.1`, `1.2`, and `1.4` feed the submitted data into verification. `1.6` issues the session only after verification passes. The digitizing flow in `5.5` must route historical duplicates through the same review queue.

## Edge Cases

1. Username exists but number is new. The case must be flagged for review, because the username already belongs to someone.
2. Number exists but username is new. The case must be flagged, because the identity is already taken.
3. Both match a different existing member. The case must be flagged and never auto created.
4. The reviewer accepts a borderline case. The accepted record must then pass the uniqueness checks in `1.4`.
5. Offline registration. The offline case must run verification at sync time, because it cannot check the live registry offline.

## Error and Gap Handling

A flagged case returns a clear review message and stores no record. A reviewer action that violates uniqueness is refused by `1.4`. An offline case defers verification to sync and shows `pending` rather than a false success.

## Accessibility and Trust Notes

The verification outcome must be explained in plain language so a member understands the result. The reviewer queue must label each case with the colliding field and the candidate record so no sensitive data leaks to the wrong person.

## Acceptance Criteria

- A clean username and baptismal number verify and create the account.
- A colliding username or number flags a review case and creates nothing.
- A review case holds no member record until a reviewer decides.
- Offline registrations verify at sync time.

## Test Scenarios

1. Clean verification. Setup: unused username and number. Assertion: the account is verified and created.
2. Username collision. Setup: an existing username. Assertion: a review case is created and no account exists.
3. Number collision. Setup: an existing number. Assertion: a review case is created and no account exists.
4. Review accept. Setup: a flagged borderline case. Assertion: accepting creates the record subject to `1.4`.
5. Offline registration. Setup: no connectivity. Assertion: verification runs at sync and a duplicate is then flagged.

## Jira-Ready Seed

User story: As the system, I want to verify accounts against existing records, so that duplicates go to a human instead of silently creating confusion.
Technical tasks: build the verification step, build the duplicate review queue, and run verification at sync time for offline entries.
Depends on: `1.1`, `1.2`, `1.4`, `1.6`, and `4-offline-data-saving-and-sync`.