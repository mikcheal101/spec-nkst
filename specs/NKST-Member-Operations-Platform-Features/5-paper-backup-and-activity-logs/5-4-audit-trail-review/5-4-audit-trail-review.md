# Sub-Feature: Audit trail review

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `5.4` Audit trail review |
| Version | Version one |
| Parent Feature | `5` Paper Backup and Activity Logs |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 5`, `REQ-063` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature lets authorized roles browse the audit trail with filters for user, action, and date range. The audit trail is the complete, immutable log of every create, update, delete, and financial adjustment in the platform, and this sub-feature provides the view and filtering tools that authorized roles need.

## What the PRD states

> "Authorized roles browse the audit trail with filters for user, action, and date range."

The PRD assigns this requirement `User Target: Web App` and `Priority: High`.

## Why It Exists

The PRD describes a need where the lead pastor and admins must be able to see the full history of changes to understand what happened, who did it, and when. This sub-feature exists so that the audit trail is not just written but is actually usable: authorized roles can filter it, search it, and export it for review or compliance requests.

## Detailed Mechanics

1. The lead pastor, admin, or system admin opens the audit trail review screen from the web portal.
2. The screen presents three filters: user (to filter by the role that made the change), action (to filter by create, update, delete, or financial adjustment), and date range (for example, this month, this quarter, custom start and end dates).
3. The system queries the immutable audit trail for entries that match all selected filters.
4. The entries are rendered in a table with columns: entry ID, record ID, change type, previous value summary, new value summary, user role, time of change, and church scope.
5. The reviewer can sort by any column and paginate through the results.
6. The reviewer can export the displayed entries to a CSV file for offline review; the export action is itself logged in the audit trail.
7. The screen also shows the total entry count and the count of entries matching the filters.

The flow runs on the web portal only. The mobile app does not have an audit trail review view.

## State and Data Impact

Before the review, the audit trail exists in the storage layer but is not directly viewable through the UI. After the review, the administrator sees the filtered entries and can take action (for example, export, note a pattern). No record data is modified; only the presentation changes.

## Interaction With the Rest of the Product

`5.3` is the immutable audit trail that this sub-feature queries. `5.2` records backup outcomes in the audit trail, which this view can filter on. `5.5` uses the audit trail as the source for digitizing historical ledger entries, and this view can filter on those entries. `6.6` gates who can open the view; the default allows lead pastor, admin, and system admin. `6.7` and `6.8` supply church and department scope, so the filter automatically includes the role's church scope unless the role is super admin. The export in `6-custom-modules-and-platform-features` can produce a CSV from the filtered results.

## Edge Cases

1. A filter returns no entries. The screen must show an empty state with a message that no entries match the filter.
2. The reviewer filters by a user role that has no entries in the selected date range. The screen must show an empty state, not an error.
3. The reviewer exports a large number of entries. The export must produce the CSV with the filtered entries and should not time out; a progress indicator should be shown.
4. The reviewer is not super admin and filters by a different church's entries. The system must respect the role's church scope and either show only entries from the role's church or refuse, depending on the configuration.
5. The audit trail is empty (for example, a fresh platform installation). The screen must show an empty state with a message that the audit trail has no entries yet.

## Error and Gap Handling

An empty filter shows an empty state. A role without permission is refused and shown the denial placeholder. A large export times out: a timeout message appears and the user can retry or reduce the filter. A church scope mismatch is refused and logged.

## Acceptance Criteria

- Lead pastor, admin, or system admin can open the audit trail review screen from the web portal.
- The screen presents filters: user, action, and date range.
- The system queries the immutable audit trail for entries matching the filters.
- The entries are rendered in a table with: entry ID, record ID, change type, previous value summary, new value summary, user role, time of change, and church scope.
- The reviewer can sort by any column and paginate through the results.
- The reviewer can export the displayed entries to a CSV file.
- The export action is logged in the audit trail.
- A filter returning no entries shows an empty state.
- Church scope is respected per the access control matrix.

## Test Scenarios

1. Open audit trail review. Setup: a lead pastor opens the screen. Assertion: the screen loads with the filter controls.
2. Filter by user. Setup: a pastor filters by "Church clerk / secretary". Assertion: only entries made by that role appear.
3. Filter by action. Setup: a pastor filters by "delete". Assertion: only delete entries appear.
4. Filter by date range. Setup: a pastor filters to this month. Assertion: only entries from this month appear.
5. Empty filter. Setup: a pastor applies a filter that matches no entries. Assertion: the screen shows an empty state with a message.
6. Export from review. Setup: a pastor exports the displayed entries. Assertion: a CSV file is downloaded and the export action is logged in the audit trail.
7. Church scope. Setup: a pastor configured for one church tries to filter by a different church's entries. Assertion: the system either shows only the role's church entries or refuses, depending on configuration.

## Jira-Ready Seed

User story: As a lead pastor, I want to browse the audit trail with filters for user, action, and date range, so that I can see the history of changes and perform compliance reviews.
Technical tasks: build the audit trail review screen with the three filter controls, query the audit trail service with the filters, render the table with the correct columns, implement sort and paginate, implement the export to CSV, and handle the edge cases of empty filters, role only entries, church scope, and empty audit trail.
Depends on: `5.3`, `6.6`, `6.7`, `6.8`, and the export features in `6-custom-modules-and-platform-features`.