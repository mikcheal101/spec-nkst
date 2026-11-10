# Sub-Feature: Immutable audit trail

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `5.3` Immutable audit trail |
| Version | Version one |
| Parent Feature | `5` Paper Backup and Activity Logs |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 5`, `REQ-062` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature ensures that every create, update, delete, and financial adjustment is written to an immutable activity trail, and the entry cannot be edited or removed. The audit trail is the source of truth for what happened to every record, and it protects the integrity of the platform's data history.

## What the PRD states

> "Every create, update, delete, and financial adjustment is written to an immutable activity trail, and the entry cannot be edited or removed."

The PRD assigns this requirement `User Target: Both` and `Priority: High`.

## Why It Exists

The PRD describes a system where no edit goes unlogged. This sub-feature exists so that the church has a complete, tamper evident record of every change to member records, contribution records, disciplinary records, and financial adjustments. The audit trail is the primary tool for compliance with NDPR/NDPA, for resolving disputes, and for audits.

## Detailed Mechanics

1. Every time a record is created, updated, or deleted in the platform, the system writes an audit entry to the immutable activity trail before the platform change is committed.
2. The audit entry records: the record ID that was changed, the type of change (create, update, delete), the previous value (if an update), the new value (if a create or update), the user role that made the change, the time of the change, and the action performed.
3. The audit entry is written to a separate storage layer that is physically or logically separated from the platform's primary database; it is append only, meaning new entries can only be added, never edited or removed.
4. The platform's application code never writes directly to the audit trail via raw SQL or direct database manipulation; all entries go through the audit trail service, which enforces the append only rule.
5. The audit trail can be browsed by authorized roles (lead pastor, admin, system admin) with filters for user, action, and date range, as described in `5.4`.
6. The audit trail is itself protected by encryption at rest and TLS in transit, as described in `3.5` (Sensitive record visibility).
7. The system can generate a report from the audit trail for compliance requests, as described in `6-custom-modules-and-platform-features` (Data export and account controls).

The flow runs on both the web portal and the mobile app; every create, update, or delete action on either surface writes an audit entry.

## State and Data Impact

Before the change, no audit entry exists for this action. After the action, the audit trail has a new entry that is immutable. The platform record is updated as normal, but the audit entry is the historical record that cannot be altered. The audit trail grows by one entry per platform action.

## Interaction With the Rest of the Product

`5.4` provides the browse view for authorized roles to review the audit trail. `5.2` records the backup outcome in the audit trail. `5.5` uses the audit trail as the source for digitizing historical ledger entries. `6.6` gates who can browse the audit trail; the default allows lead pastor, admin, and system admin. `6.7` and `6.8` supply church and department scope, so the audit trail filters by church and department when the role is not super admin. The export features in `6-custom-modules-and-platform-features` can produce a CSV or report from the audit trail.

## Edge Cases

1. A user tries to edit or delete an audit entry. The system must refuse the attempt and log it as a security violation.
2. A database migration changes the audit trail schema. The migration script must preserve all existing entries and maintain the append only rule.
3. The audit trail storage becomes full. The system must surface a warning to the system admin and either stop accepting new entries after a configurable threshold or implement a rotate and archive policy that preserves the oldest entries.
4. A role without permission tries to browse the audit trail. The system must refuse and show the denial placeholder.
5. An audit entry is created for a delete operation. The entry records the record ID, the type (delete), the value before deletion, the role, and the time. The platform record is removed, but the audit entry remains.

## Error and Gap Handling

A user tries to edit/delete an audit entry: the attempt is refused and logged as a security violation. A schema migration: the script preserves all entries and maintains append only. Storage full: a warning is surfaced to the system admin; the system either stops new entries after a threshold or rotates and archives. A role without permission: the browse view shows the denial placeholder.

## Accessibility and Trust Notes

The audit trail must be readable on a desktop browser and screen reader friendly. The entry fields (record ID, change type, previous value, new value, role, time) must be labeled clearly. The append only rule must be enforced by the audit trail service, not by application code that could bypass it. The encryption at rest and TLS in transit must be transparent to the application; the audit trail service handles the crypto.

## Acceptance Criteria

- Every create, update, delete, and financial adjustment writes an audit entry before the platform change is committed.
- The audit entry records: the record ID, the change type, the previous value (if update), the new value (if create or update), the user role, the time, and the action performed.
- The audit trail is append only: new entries can only be added, never edited or removed.
- The audit trail is stored in a separate layer, physically or logically separated from the primary database.
- The application never writes to the audit trail via raw SQL or direct database manipulation; all entries go through the audit trail service.
- Authorized roles can browse the audit trail with filters for user, action, and date range.
- The audit trail is protected by encryption at rest and TLS in transit.
- A user who tries to edit or delete an audit entry is refused and the attempt is logged as a security violation.

## Test Scenarios

1. Create audit entry. Setup: a clerk creates a new member. Assertion: an audit entry is written with the record ID, change type (create), the new member values, the clerk's role, and the time.
2. Update audit entry. Setup: a clerk updates a member's contact information. Assertion: an audit entry is written with the record ID, change type (update), the previous value, the new value, the clerk's role, and the time.
3. Delete audit entry. Setup: a clerk deletes a contribution entry. Assertion: an audit entry is written with the record ID, change type (delete), the value before deletion, the clerk's role, and the time. The contribution record is removed from the platform.
4. Edit audit entry refused. Setup: a user attempts to edit an audit entry. Assertion: the attempt is refused and logged as a security violation.
5. Browse audit trail. Setup: a lead pastor browses the audit trail with a date filter. Assertion: the entries within the date range are shown, with the recorded fields.
6. Storage full. Setup: the audit trail reaches its configured size threshold. Assertion: a warning is surfaced to the system admin.

## Jira-Ready Seed

User story: As a system admin, I want every create, update, delete, and financial adjustment to write to an immutable audit trail, so that the church has a complete and tamper evident record of all changes for compliance and audits.
Technical tasks: build the audit trail service with append only enforcement, model the audit entry fields, ensure all creates/updates/deletes go through the service, implement the browse view with filters for authorized roles, and enforce encryption at rest and TLS in transit.
Depends on: the platform's data access layer, the audit trail service, the encryption at rest layer, and the TLS layer.