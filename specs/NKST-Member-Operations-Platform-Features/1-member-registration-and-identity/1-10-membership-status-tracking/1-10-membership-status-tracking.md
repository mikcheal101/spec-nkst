# Sub-Feature: Membership Status Tracking

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `1.10` Membership status tracking |
| Version | Version one |
| Parent Feature | `1` Member Registration and Identity |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 1`, `REQ-010` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature tracks member status over time. A member record moves through states such as active, inactive, transfer, or departed, so the registry reflects reality instead of a stale snapshot.

## What the PRD states

> "The system tracks member status such as active, inactive, transfer, or departed so the registry reflects reality over time."

The PRD assigns this requirement `User Target: Web App` and `Priority: Medium`.

## Why It Exists

A member who drops out, moves to a transfer church, or passes away must not keep appearing as a fully active member. This sub-feature exists so status changes are explicit, current, and visible to the roles that manage the registry.

## Detailed Mechanics

1. A member record carries a status value.
2. The default status for a new member is active.
3. An authorized role changes the status to match reality.
4. The supported status values are active, inactive, transfer, or departed.
5. A change records who made it and when, feeding the audit trail.
6. The current status is shown wherever the member record is rendered.

The flow runs on the web portal and is driven by the roles granted status change permission under `6.6`.

## State and Data Impact

Before a change, the member carries the previous status. After a change, the member carries the new status, and the change itself is logged with the actor and time. The status affects how other features treat the member, such as whether they still receive export and directory treatment.

## Interaction With the Rest of the Product

`1.8` holds the profile that this sub-feature's status accompanies. `6.6` gates who can change status. `3.4` and the audit features in `5-paper-backup-and-activity-logs` record the change. The directory (`1.12`) should reflect the current status.

## Edge Cases

1. A departed member still has pending contributions. The status change must not erase history, and the audit trail must keep the record.
2. A transfer is pending. The status must hold the transfer state until the receiving church confirms.
3. A role without permission changes status. The change must be refused and logged.
4. A member returns from inactive. The status must move back to active.
5. Status change while offline. The change must follow the offline sync path so it is authoritative later.

## Error and Gap Handling

An unauthorized change is refused and logged. A change to an unsupported status value is refused. A status change never deletes the member record or its history.

## Accessibility and Trust Notes

Status must be shown in plain language, not codes. The web portal must let an authorized clerk or admin see the current status at a glance. Historical membership must remain visible so auditors can reconstruct what happened.

## Acceptance Criteria

- A new member defaults to active.
- An authorized role changes status between active, inactive, transfer, and departed.
- Each change records the actor and time.
- Status never deletes the member record or history.
- Unsupported role attempts are refused and logged.

## Test Scenarios

1. Default status. Setup: a new member. Assertion: the member starts as active.
2. Status change. Setup: an authorized role. Assertion: the member moves to the new status and the change is logged.
3. Departed with history. Setup: a departed member with contributions. Assertion: history remains and the audit entry exists.
4. Unauthorized change. Setup: a role without permission. Assertion: the change is refused and logged.
5. Return to active. Setup: an inactive member. Assertion: the member can move back to active.

## Jira-Ready Seed

User story: As a clerk, I want member status to reflect reality over time, so that the registry does not show stale members as active.
Technical tasks: add the status state to the member record, gate the change by role, and log every change.
Depends on: `1.6`, `1.8`, `5.3`, and `6.6`.