# Sub-Feature: Paper backup alongside digital

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `5.1` Paper backup alongside digital |
| Version | Version one |
| Parent Feature | `5` Paper Backup and Activity Logs |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 5`, `REQ-060` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature ensures that during the transition the physical ledger stays as evidence alongside the digital record, and the system marks records that also have a paper entry. The paper ledger is the sacred source of truth that the church has used for years, and the digital platform must coexist with it during the pilot.

## What the PRD states

> "During the transition the physical ledger stays as evidence alongside the digital record, and the system marks records that also have a paper entry."

The PRD assigns this requirement `User Target: Web App` and `Priority: High`.

## Why It Exists

The PRD describes a pilot where the paper ledger is kept as evidence alongside the digital record. This sub-feature exists so that every digital record that also has a paper entry is marked as such, and the paper ledger remains the authoritative source during the transition period. No digital record is considered complete without its paper counterpart being acknowledged.

## Detailed Mechanics

1. When a new member is registered or a contribution is recorded digitally, the system checks whether a paper entry also exists in the physical ledger.
2. If a paper entry exists, the system marks the digital record with a `paper_backup` flag set to true and writes a note linking the digital record to its paper counterpart (for example, ledger page number and entry date).
3. If no paper entry exists, the system marks the digital record with `paper_backup` set to false.
4. The `paper_backup` flag is stored on the member record or contribution record and is visible in the profile and dashboard views.
5. The paper ledger is kept in a secure location at the church; the digital platform does not replace or destroy it.
6. During audits, the auditor can see the `paper_backup` flag and know to request the corresponding paper ledger page as evidence.

The flow runs on the web portal during data entry and on the mobile app when the member or clerk views a record with paper backup.

## State and Data Impact

Before the flag, the digital record has no awareness of its paper counterpart. After the flag is written, the digital record carries the `paper_backup` value. The flag is read only; it cannot be edited directly by the user. The audit trail logs when the flag is set and when the linked paper entry is requested.

## Interaction With the Rest of the Product

`5.2` runs admin backups that include the `paper_backup` flag state. `5.3` writes every change to the immutable audit trail, which includes the flag changes. `5.4` allows authorized roles to review the audit trail with the `paper_backup` flag as a filter. `5.5` enters historical data during digitizing and sets the `paper_backup` flag for records that have a paper counterpart. `6.6` gates who can see the flag; the default allows any registered user.

## Edge Cases

1. A record is created digitally and a paper entry is added later. The system must allow the clerk to retroactively set the `paper_backup` flag when the paper entry is presented.
2. A paper entry exists but the digital record was created without the flag. The clerk can set the flag manually when the paper entry is reviewed.
3. The paper ledger is lost or destroyed. The `paper_backup` flag must remain as it was set; the church acknowledges the loss of the physical evidence and notes it in the audit trail.
4. A record has `paper_backup=true` but the paper entry is for a different member. The system must flag this as a data integrity issue and log it for review.

## Error and Gap Handling

A retroactive flag: the clerk can set the flag when the paper entry is presented; the action is logged. A mismatched paper entry: the system flags it as an integrity issue and logs it; the clerk must review and correct the link. The paper ledger loss: the audit trail records the loss and the flag remains as set.

## Acceptance Criteria

- When a new member or contribution is recorded digitally, the system checks for a paper entry and sets the `paper_backup` flag accordingly.
- The `paper_backup` flag is stored on the record and is visible in the profile and dashboard views.
- The flag is read only; it cannot be edited directly by the user.
- The audit trail logs when the flag is set and when the linked paper entry is requested.
- The paper ledger is kept alongside the digital record; the digital platform does not replace or destroy it.
- During audits, the `paper_backup` flag tells the auditor to request the corresponding paper ledger page.

## Test Scenarios

1. New member with paper entry. Setup: a clerk registers a member and the paper ledger has an entry for this member. Assertion: the digital record has `paper_backup=true` and the ledger page is linked.
2. New member without paper entry. Setup: a clerk registers a member and the paper ledger has no entry. Assertion: the digital record has `paper_backup=false`.
3. Retroactive flag. Setup: a record was created digitally and later a paper entry is presented. Assertion: the clerk can set the `paper_backup=true` flag and the action is logged.
4. Mismatched paper entry. Setup: the `paper_backup=true` flag is set but the paper entry is for a different member. Assertion: the system flags this as a data integrity issue and logs it.

## Jira-Ready Seed

User story: As a clerk, I want the system to mark digital records that have a paper backup, so that during the transition the physical ledger is acknowledged as evidence alongside the digital record.
Technical tasks: model the `paper_backup` flag on the member and contribution records, implement the check at record creation, render the flag in the profile and dashboard views, and make the flag read only with a retroactive set action for when the paper entry is later presented.
Depends on: the member and contribution record models, and the paper ledger linkage logic.