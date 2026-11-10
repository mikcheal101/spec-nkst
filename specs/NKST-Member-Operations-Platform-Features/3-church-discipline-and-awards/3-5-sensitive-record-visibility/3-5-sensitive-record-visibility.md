# Sub-Feature: Sensitive record visibility

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `3.5` Sensitive record visibility |
| Version | Version one |
| Parent Feature | `3` Church Discipline and Awards |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 3`, `REQ-044` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature ensures that disciplinary logs are visible only to roles granted that permission, and that they are encrypted at rest. The access control matrix in `6.6` decides which roles can see disciplinary data.

## What the PRD states

> "Disciplinary logs are visible only to roles granted that permission, and they are encrypted at rest."

The PRD assigns this requirement `User Target: Web App` and `Priority: High`.

## Why It Exists

The PRD defines data protection for sensitive records. This sub-feature exists so that disciplinary actions, which contain personal and potentially damaging information about a member, are not visible to every user on the platform. Only roles with the explicit permission can view them, and at rest encryption ensures that even if the database is compromised, the raw records are unreadable.

## Detailed Mechanics

1. A role opens a view that displays member-related data, such as profiles or contribution summaries.
2. Before any disciplinary log is rendered, the system checks the role's permission per the access control matrix in `6.6`.
3. If the role has the disciplinary view permission, the disciplinary logs for that member or church are rendered with their full content.
4. If the role does not have the permission, the disciplinary logs are replaced with a placeholder: "Disciplinary data is not available for your role."
5. All disciplinary logs are stored encrypted at rest using the platform's encryption at rest; the encryption keys are managed by the system admin and are separate from the application database.
6. In transit, disciplinary data is protected via TLS; the platform complies with local data privacy regulation NDPR/NDPA.

The check runs on every request that renders a view containing disciplinary data.

## State and Data Impact

Before the check, the role may or may not see disciplinary data depending on their configuration. After the check, the role either sees the logs (if permitted) or a denial placeholder (if not permitted). No record data is modified; only the UI visibility changes. The encryption at rest is transparent to the application; the application reads and writes encrypted data through the platform's data access layer.

## Interaction With the Rest of the Product

`6.6` owns the access control matrix that decides which roles have the disciplinary view permission. `3.1` and `3.2` produce the disciplinary and award records that this feature protects. `5.3` ensures every create and update writes to the immutable audit trail, which itself is encrypted at rest. `6.7` and `6.8` supply church and department scope, so the check also verifies that the role's church scope includes the member's church before rendering.

## Edge Cases

1. A role with permission for one church tries to view disciplinary logs for a member in a different church. The check must respect church scope and refuse if the role's church does not match.
2. The system admin views disciplinary logs. The system admin has full platform access per the matrix, so the check grants permission.
3. A record is viewed offline (for example, a cached page). The encryption at rest protects the data even if the cache file is extracted; the application must still check the role on decryption.
4. A role's permission is revoked mid session. The next request must re evaluate and hide the logs.

## Error and Gap Handling

A role without permission sees the denial placeholder, not the logs. A church scope mismatch is refused and logged. An offline cache that is extracted without proper decryption keys renders the data unreadable. A permission revocation takes effect on the next request.

## Accessibility and Trust Notes

The denial placeholder must be readable and screen reader friendly. The member must understand why disciplinary data is hidden. The encryption at rest is a platform-level control; the application does not implement its own crypto for this feature. The NDPR/NDPA compliance must be documented for the church's legal records.

## Acceptance Criteria

- A role with the disciplinary view permission can see disciplinary logs when viewing member profiles or summaries.
- A role without the permission sees the placeholder "Disciplinary data is not available for your role."
- The check runs on every request that renders disciplinary data.
- All disciplinary logs are stored encrypted at rest.
- In transit, disciplinary data is protected via TLS and NDPR/NDPA compliance.
- A church scope mismatch refuses the view and logs the attempt.

## Test Scenarios

1. Role with permission. Setup: a lead pastor views a member profile. Assertion: the disciplinary logs are visible.
2. Role without permission. Setup: a regular member views a member profile. Assertion: the placeholder is shown and the logs are not visible.
3. Church scope mismatch. Setup: a role configured for one church views a member from a different church. Assertion: the logs are hidden and the attempt is logged.
4. TLS in transit. Setup: a request is made over HTTPS. Assertion: the data is protected in transit.
5. Encryption at rest. Setup: the database is exported and the files are extracted. Assertion: the disciplinary data is unreadable without the encryption keys.

## Jira-Ready Seed

User story: As a lead pastor, I want to see disciplinary logs only when my role permits it, so that sensitive record data is protected from unauthorized viewing.
Technical tasks: model the disciplinary view permission in the access control matrix, implement the check on every render of disciplinary data, add encryption at rest for the disciplinary log records, and implement TLS in transit with NDPR/NDPA documentation.
Depends on: `6.6`, `5.3`, and the platform encryption at rest layer.