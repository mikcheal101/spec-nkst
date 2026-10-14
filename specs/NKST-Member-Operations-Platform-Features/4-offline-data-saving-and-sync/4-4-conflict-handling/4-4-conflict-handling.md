# Sub-Feature: Conflict handling

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `4.4` Conflict handling |
| Version | Version one |
| Parent Feature | `4` Offline Data Saving and Sync |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 4`, `REQ-053` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature surfaces a conflict for a human decision when two offline edits touch the same record, instead of silently overwriting one edit with the other. The system must let the user see both versions and choose which to keep, or merge them.

## What the PRD states

> "If two offline edits touch the same record, the system surfaces the conflict for a human decision instead of silently overwriting."

The PRD assigns this requirement `User Target: Both` and `Priority: High`.

## Why It Exists

The PRD describes a scenario where two clerks might edit the same member record or contribution entry while working offline. Without conflict handling, one clerk's changes would silently overwrite the other's, leading to data loss and mistrust of the system. This sub-feature exists so that every offline edit is preserved and the human can decide which version is correct, or merge the two.

## Detailed Mechanics

1. The first clerk opens a member record or contribution entry while online, and the system caches the record locally.
2. While the first clerk is offline, the second clerk also opens the same record (the server still has the original version) and makes edits while offline.
3. When the first clerk returns online and attempts to sync, the system records the first clerk's edits and marks the record as synced.
4. When the second clerk returns online and attempts to sync, the system detects that the server record has been modified by the first clerk's sync.
5. The system surfaces a conflict view: the original server version, the second clerk's offline edits, and the first clerk's edits (if already synced).
6. The human reviewer sees side by side: the fields that changed in each version, with the before and after values.
7. The reviewer can choose to keep the server version, keep the offline version, or merge the changes field by field.
8. The reviewer's decision is recorded: which version was kept, which fields were merged, and who made the final decision. The audit trail logs the conflict and the resolution.
9. The resolved record is then marked synced and the audit trail is updated.

The flow runs on both the mobile app and the web portal; both surfaces present a conflict view when two offline edits touch the same record.

## State and Data Impact

Before the conflict, the system has no record of the clash. After the conflict is resolved, the record carries the reviewer's chosen version, and the audit trail contains both the conflicting edits and the resolution decision. The record is then marked synced and the platform registry is updated.

## Interaction With the Rest of the Product

`4.1` and `4.2` produce the offline edits that may conflict. `4.3` syncs the entries and detects the conflict when the server version differs from the offline version. `5.3` logs the conflict and its resolution in the immutable audit trail. `6.6` gates who can resolve conflicts; the default allows any registered clerk or admin. The resolution decision feeds back into the record that `4.3` will then sync.

## Edge Cases

1. Three or more offline edits on the same record. The conflict view must surface all versions and let the reviewer choose one or merge across all.
2. The same field is edited differently in each version. The merge option must let the reviewer type the final value for that field.
3. The reviewer chooses to keep the server version. The offline edits are discarded and the server version remains; the fact that there were offline edits is logged.
4. The reviewer chooses to keep the offline version. The server record is updated with the offline edits, and the server version is discarded; the fact that there were server edits is logged.
5. The reviewer merges field by field. Some fields keep the server version, some keep the offline version, and the merged record is saved.
6. The conflict view times out. The system must save the reviewer's choice if they have made it, or prompt them to make a choice before timing out.
7. The auditor views the conflict and resolution later. The audit trail must contain enough context to reconstruct which versions conflicted and why the resolution was chosen.

## Error and Gap Handling

A three-way or greater conflict: the view surfaces all versions and lets the reviewer choose one or merge. A field level merge: the reviewer types the final value. A reviewer choice to keep server or offline: the choice is recorded and the audit trail is updated. A conflict view timeout: if the reviewer has not made a choice, the system prompts them before timing out; if they have made a choice, the choice is saved. The audit trail always records the conflict and the resolution.

## Accessibility and Trust Notes

The conflict view must be readable on a desktop browser and screen reader friendly. The before/after values for each field must be clear so the reviewer understands the difference between versions. The merge field must be presented as an editable plain-text field. The audit trail must not expose sensitive data from the conflicting versions; it should record only the fact of the conflict, which versions were presented, and the resolution decision.

## Acceptance Criteria

- When two offline edits touch the same record, the system surfaces a conflict view.
- The conflict view shows the original server version and the offline edits side by side.
- The reviewer can choose to keep the server version, keep the offline version, or merge field by field.
- The reviewer's decision is recorded and the audit trail logs the conflict and the resolution.
- The resolved record is then marked synced and the platform registry is updated.
- A three way or greater conflict surfaces all versions and lets the reviewer choose one or merge.
- A field level merge lets the reviewer type the final value for each field.

## Test Scenarios

1. Two offline edits conflict. Setup: two clerks edit the same member record offline. Assertion: the conflict view appears when the second clerk syncs, showing both versions side by side.
2. Reviewer keeps server version. Setup: the reviewer chooses to keep the server version. Assertion: the server record remains unchanged and the audit trail logs the conflict and the resolution.
3. Reviewer keeps offline version. Setup: the reviewer chooses to keep the offline version. Assertion: the server record is updated with the offline edits and the audit trail logs the conflict and the resolution.
4. Field by field merge. Setup: the reviewer merges some fields from server and some from offline. Assertion: the merged record is saved and the audit trail logs the conflict and the merge decision.
5. Three way conflict. Setup: three clerks edit the same record offline. Assertion: the conflict view surfaces all three versions and lets the reviewer choose one or merge.
6. Conflict view timeout. Setup: the reviewer does not make a choice before the timeout. Assertion: the system prompts the reviewer to make a choice before timing out.

## Jira-Ready Seed

User story: As a clerk, I want the system to surface a conflict when two offline edits touch the same record, so that I can see the differences and decide which version to keep, rather than having one edit silently overwrite the other.
Technical tasks: build the conflict detection on sync, render the side by side comparison, implement the keep server/keep offline/merge options, and record the resolution in the audit trail.
Depends on: `4.1`, `4.2`, `4.3`, `5.3`, `6.6`, and the audit trail layer.