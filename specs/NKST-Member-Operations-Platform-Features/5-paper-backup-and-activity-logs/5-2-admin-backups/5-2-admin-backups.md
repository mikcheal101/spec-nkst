# Sub-Feature: Admin backups

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `5.2` Admin backups |
| Version | Version one |
| Parent Feature | `5` Paper Backup and Activity Logs |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 5`, `REQ-061` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature runs administrative backups on an agreed schedule and records the backup outcome. The backup includes the full platform state: member records, contribution records, disciplinary logs, award records, and the `paper_backup` flag status on each record. The backup outcome is written to the audit trail and is visible to the church super admin and system admin.

## What the PRD states

> "The system runs administrative backups on an agreed schedule and records the backup outcome."

The PRD assigns this requirement `User Target: Web App` and `Priority: High`.

## Why It Exists

The PRD describes a situation where the sole maintainer (Alcestis) must ensure that the platform data can be recovered. This sub-feature exists so that backups are taken regularly, the outcome of each backup is recorded, and the church has a known recovery point in case of data loss. The backup is stored in a secure location separate from the live platform database.

## Detailed Mechanics

1. The system admin or church super admin triggers an administrative backup from the web portal.
2. The system reads the current state of the platform: all member records, contribution records, disciplinary logs, award records, and the `paper_backup` flag status on each record.
3. The system writes a backup file (for example, a compressed SQL dump or a set of JSON files) to a secure storage location that is separate from the live platform database.
4. The backup operation records the outcome: success or failure, the timestamp, the number of records included, and any errors encountered.
5. The backup outcome is written to the immutable audit trail, recording who triggered the backup, when it ran, and whether it succeeded or failed.
6. The system retains the backup for an agreed period (for example, 90 days) according to the church's data retention policy.
7. The church super admin or system admin can initiate a restore from a backup; the restore operation reads the backup file and reloads the platform state.

The backup runs on a schedule configured by the church super admin; the default schedule is daily at midnight, but the church can adjust it.

The flow runs on the web portal only. The mobile app does not initiate or manage administrative backups.

## State and Data Impact

Before the backup, the platform state is live and the backup does not yet exist. After the backup, a backup file exists in secure storage and the audit trail has a new entry. The live platform state is unchanged; the backup is a copy. After a restore, the platform state is reloaded from the backup file and the audit trail records the restore action.

## Interaction With the Rest of the Product

`5.1` provides the `paper_backup` flag state that is included in the backup. `5.3` logs the backup outcome in the immutable audit trail. `5.4` and `5.5` may query the backup during audit trail review. `6.6` gates who can trigger and manage backups; the default allows church super admin and system admin. The backup file is stored in a location managed by the system admin.

## Edge Cases

1. The storage location becomes full. The system must delete the oldest backups according to the retention policy and log the deletion.
2. The live platform database is corrupted. The backup must be usable to restore the platform state; the system must verify the backup integrity before marking it as valid.
3. A backup is triggered while another backup is already running. The system must queue the new backup and run it after the current one completes, logging that a backup was deferred.
4. The backup includes a record that has been since deleted or modified. The backup file is a snapshot; the restored state will reflect what was included at backup time, and the audit trail will show the later changes.

## Error and Gap Handling

Storage full: the oldest backups are deleted per retention policy and the deletion is logged. Corrupted backup: the system verifies integrity and marks the backup as invalid; the admin is notified and must use a previous valid backup. Backup deferred: the new backup is queued and runs after the current one finishes, and the deferral is logged. Snapshot reflects state at backup time: the audit trail shows later changes.

## Accessibility and Trust Notes

The backup outcome must be readable and the audit trail entry must be clear about what was backed up and whether it succeeded. The backup file itself is stored in a location managed by the system admin; the application does not expose the file path to regular users. The NDPR/NDPA compliance for the backup data must be documented; the backup contains personal member data and must be stored securely.

## Acceptance Criteria

- The system admin or church super admin can trigger an administrative backup from the web portal.
- The backup includes the full platform state: member records, contribution records, disciplinary logs, award records, and the `paper_backup` flag status.
- The backup outcome (success/failure, timestamp, record count, errors) is recorded in the audit trail.
- The system retains the backup for an agreed period according to the data retention policy.
- The church super admin or system admin can initiate a restore from a backup.
- The backup runs on a configurable schedule (default: daily at midnight).
- The backup file is stored in secure storage separate from the live platform database.

## Test Scenarios

1. Trigger backup. Setup: the admin clicks "Run backup". Assertion: the backup file is created in secure storage and the audit trail records the outcome.
2. Backup success. Setup: a backup runs with a healthy database. Assertion: the outcome is success, the record count is included, and the audit trail logs the success.
3. Backup failure. Setup: a backup runs and the database is temporarily unavailable. Assertion: the outcome is failure, the error is logged, and the audit trail records the failure.
4. Retention policy. Setup: the retention period is 90 days and 91 backups exist. Assertion: the oldest backup is deleted and the deletion is logged.
5. Restore from backup. Setup: the admin initiates a restore from a valid backup. Assertion: the platform state is reloaded from the backup and the audit trail logs the restore action.
6. Backup during another backup. Setup: a backup is triggered while another is running. Assertion: the new backup is queued and runs after the current one completes.

## Jira-Ready Seed

User story: As the system admin, I want the system to run automatic administrative backups and record the outcome, so that the church can recover the platform data in case of loss.
Technical tasks: build the backup trigger screen, model the platform state snapshot, write the backup file to secure storage, record the outcome in the audit trail, implement the retention policy with old backup deletion, and build the restore from backup flow.
Depends on: `5.3`, `6.6`, the secure storage layer, and the platform snapshot/export layer.