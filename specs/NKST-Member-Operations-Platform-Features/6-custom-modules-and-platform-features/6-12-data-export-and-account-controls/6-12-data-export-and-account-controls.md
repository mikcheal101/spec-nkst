# Sub-Feature: Data export and account controls

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `6.12` Data export and account controls |
| Version | Version one |
| Parent Feature | `6` Custom Modules and Platform Features |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Custom Modules and Platform Features`, `REQ-081` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature supports exporting member and financial data for authorized roles and for compliance requests. The platform can generate CSV or report exports of member records, contribution records, disciplinary records, audit trail entries, and other data, with filters for period, type, role, and other criteria. The export action is itself logged in the audit trail, and the exported data is restricted to authorized roles in accordance with the access control matrix and NDPR/NDPA compliance.

## What the PRD states

> "The platform supports exporting member and financial data for authorized roles and for compliance requests."

The PRD assigns this requirement `User Target: Web App` and `Priority: Medium`.

## Why It Exists

The PRD describes compliance requests from outside the church (for example, data subject access requests under NDPR/NDPA) and the need for authorized roles to pull data for review or reporting. This sub-feature exists so that the church can export data on demand, with proper filters and authorization, and with a full audit trail of who exported what and when.

## Detailed Mechanics

1. An authorized role (lead pastor, admin, or system admin) opens the data export screen from the web portal.
2. The admin selects the data type to export: member records, contribution records, disciplinary records, audit trail entries, or a custom selection.
3. The admin applies filters: period (for example, this month, this year, custom start and end dates), type, role, church scope, entry source (electronic or paper), or other criteria available for the selected data type.
4. The system assembles the requested data that matches the filters and is authorized for the requesting role per the access control matrix in `6.6` and the NDPR/NDPA compliance rules.
5. The system generates a file (CSV or XML) with the columns relevant to the selected data type: for member records, columns might include member ID, name, baptism status, baptismal number, contact, church; for contribution records, columns might include contribution ID, amount, type, date, gateway reference, entry source; for disciplinary records, columns might include record ID, member ID, date, reason, role, status; for audit trail entries, columns might include entry ID, record ID, change type, previous value, new value, role, time.
6. The admin downloads the file to their local machine.
7. The export action is itself logged in the audit trail in `5.3`, recording who exported, when, what data type, what filters were applied, and how many records were included.
8. The exported file is stored temporarily on the server and is available for download for a configurable period (for example, 24 hours) before it is automatically deleted, to protect sensitive data.

The flow runs on the web portal only. The mobile app does not export data; the export is an administrative surface.

## State and Data Impact

Before the export, the data exists in the platform databases. After the export, the data is unchanged; the CSV/file is a new artifact downloaded to the admin's machine. The audit trail gains an entry for the export action. The exported file is temporary and is deleted after the configurable retention period.

## Interaction With the Rest of the Product

`5.3` logs the export action in the immutable audit trail. `5.4` provides the browse view of the audit trail, which can filter on export entries. `6.6` gates who can export; the default allows lead pastor, admin, and system admin. `6.7` and `6.8` supply church and department scope, so the export is restricted to the church (or sub church) the role is configured for. The NDPR/NDPA compliance rules from `3.5` (Sensitive record visibility) and `258` (Security and data protection) are applied to determine which data rows are included. The export columns are derived from the record models for member, contribution, discipline, and audit trail entries.

## Edge Cases

1. A filter returns no records. The export must produce a file with the correct headers and no data rows, not an error.
2. The export includes sensitive data that the requesting role is not authorized to see. The system must omit the unauthorized rows and log the attempt.
3. The export runs while another export is in progress. The system must queue the new export and process it after the current one completes, logging that a export was deferred.
4. The downloaded file is kept beyond the configurable retention period. The system must automatically delete the file after the period and log the deletion.
5. The admin selects a period before the data was collected. The export must include only the data that exists and note that earlier periods have no data.

## Error and Gap Handling

No records match the filter: the export produces a file with headers only and no data rows. Unauthorized data access: the rows are omitted and the attempt is logged. Export deferred: the new export is queued and runs after the current one completes, and the deferral is logged. Retention period exceeded: the file is automatically deleted and the deletion is logged. Period before data collection: the export includes only existing data and notes the gap.

## Acceptance Criteria

- Lead pastor, admin, or system admin can open the data export screen from the web portal.
- The admin selects the data type to export (member records, contribution records, disciplinary records, audit trail entries, or custom selection).
- The admin applies filters: period, type, role, church scope, entry source, and other criteria available for the data type.
- The export assembles data that matches the filters and is authorized for the requesting role per the access control matrix and NDPR/NDPA compliance.
- The export generates a CSV or XML file with the columns relevant to the selected data type.
- The admin downloads the file to their local machine.
- The export action is logged in the audit trail with who exported, when, data type, filters, and record count.
- The exported file is temporary and is automatically deleted after the configurable retention period.
- A filter returning no records produces a file with headers only and no data rows.
- Unauthorized data rows are omitted and the attempt is logged.

## Test Scenarios

1. Export member records. Setup: a lead pastor exports member records for this year. Assertion: the CSV contains the member columns and only this year's records.
2. Export with filters. Setup: an admin exports contribution records for this month, type tithe. Assertion: the CSV contains only tithe contributions this month.
3. No records match filter. Setup: an admin exports member records for a period with no members. Assertion: the CSV has headers only and no data rows.
4. Unauthorized data omitted. Setup: a regular member tries to export disciplinary records. Assertion: the disciplinary rows are omitted and the attempt is logged.
5. Export logs audit entry. Setup: an export runs. Assertion: the audit trail logs who exported, when, data type, filters, and record count.
6. Retention period. Setup: an export runs and the retention period is 24 hours. Assertion: the file is automatically deleted after 24 hours and the deletion is logged.
7. Export deferred. Setup: an export is triggered while another export is in progress. Assertion: the new export is queued and runs after the current one completes.

## Jira-Ready Seed

User story: As a lead pastor, I want to export member and financial data for compliance requests, so that I can provide the data in the required format with proper authorization and audit trail.
Technical tasks: build the data export screen with the data type selection and filters, model the export file generation with the correct columns for each data type, implement the authorization check per the access control matrix and NDPR/NDPA, implement the audit trail logging of the export action, implement the temporary file storage with automatic deletion, and handle the edge cases of no records, unauthorized access, deferred exports, and retention expiration.
Depends on: `5.3`, `6.6`, `6.7`, `6.8`, the NDPR/NDPA compliance rules, and the record models for member, contribution, discipline, and audit trail.