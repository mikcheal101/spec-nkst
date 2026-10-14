# Sub-Feature: Governance reporting

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `3.6` Governance reporting |
| Version | Version one |
| Parent Feature | `3` Church Discipline and Awards |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 3`, `REQ-045` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature produces governance reports covering discipline and awards activity for the lead pastor and admins. The reports group records by period, type, and role, and include entry source labels and audit trail summaries.

## What the PRD states

> "The system produces governance reports covering discipline and awards activity for the lead pastor and admins."

The PRD assigns this requirement `User Target: Web App` and `Priority: Medium`.

## Why It Exists

The PRD describes a reporting need where the lead pastor and admins can see the big picture of discipline and awards activity across the church, so they can provide oversight and make governance decisions. This sub-feature exists so the reports are generated on demand, with filters, and with the same access controls and encryption that protect the individual records.

## Detailed Mechanics

1. The lead pastor or admin opens the governance reporting screen from the web portal.
2. The system presents filters: period (for example, this month, this quarter, year to date), type (discipline, awards, or both), and role (to filter by the role that recorded or approved the record).
3. The system queries the immutable audit trail for all matching discipline and award records.
4. Each group is labeled with the entry source: electronic or paper, and the total count and total amount (where applicable) are shown.
5. The report renders a table with columns: record type, member identifier, date, reason, recording role, approval status, entry source, and church.
6. The lead pastor or admin can export the report to a CSV file for offline review.
7. The export action is itself logged in the audit trail, recording who generated the report, when, and what filters were applied.

The flow runs on the web portal only.

## State and Data Impact

Before the report runs, the audit trail contains the records. After the report runs, the records are unchanged; the report is a new artifact displayed on screen or saved as a CSV file. The export action writes an audit entry.

## Interaction With the Rest of the Product

`3.3` and `3.4` provide the records and clearance actions that the report queries. `5.3` supplies the audit trail that is the source of truth for the report. `6.6` gates who can generate the report; the default allows lead pastor and admins. `5.5` may tag records with source during digitizing, so the report can include or exclude paper entries. The export in `2.9` produces the CSV file for this report.

## Edge Cases

1. A filter returns no records. The report must show an empty state with a message that no records match the filter.
2. A report for a period before the audit trail was active. The report must show only records from the active period and note that earlier records are not available.
3. A lead pastor generates a report for a different church. The check in `6.6` must respect church scope and either show only that church's records or refuse, depending on the pastor's role configuration.
4. A report includes both electronic and paper entries. Each group must show the entry source label.

## Error and Gap Handling

An empty filter shows an empty state. A period before the audit trail starts shows only available records with a note. A church scope mismatch is refused and logged. A failed export shows a retry state.

## Accessibility and Trust Notes

The reporting screen must be readable on a desktop browser and screen reader friendly. The entry source labels (electronic or paper) must be clear so the pastor understands the data provenance. The report must not expose raw encryption keys or internal system data. NDPR/NDPA compliance must be documented for any exported data.

## Acceptance Criteria

- Lead pastor or admin can open the governance reporting screen.
- The screen presents filters: period, type (discipline/awards/both), and role.
- The report queries the immutable audit trail for matching records.
- Each group is labeled with the entry source (electronic or paper).
- The report table shows: record type, member identifier, date, reason, recording role, approval status, entry source, and church.
- The lead pastor or admin can export the report to a CSV file.
- The export action is logged in the audit trail.
- A filter returning no records shows an empty state.
- Church scope respects the access control matrix.

## Test Scenarios

1. Report with filters. Setup: a lead pastor generates a report for this month, discipline type, elder role. Assertion: the report shows only discipline records from elders this month.
2. Empty filter. Setup: a pastor generates a report with a period that has no records. Assertion: the report shows an empty state with a message.
3. Period before audit trail. Setup: a pastor generates a report for the first month the platform was active. Assertion: only records from that month are shown, with a note that earlier records are not available.
4. Export from report. Setup: a pastor exports the report. Assertion: a CSV file is downloaded and the export action is logged.
5. Church scope. Setup: a pastor configured for one church tries to generate a report for a different church. Assertion: the report either shows only that church's records or is refused, depending on role configuration.

## Jira-Ready Seed

User story: As a lead pastor, I want governance reports covering discipline and awards activity, so that I can provide oversight and make governance decisions for the church.
Technical tasks: build the reporting screen with filters, query the audit trail, model the report table and entry source labels, implement the export to CSV, and handle the edge cases of empty filters, periods before the trail, and church scope.
Depends on: `3.3`, `3.4`, `5.3`, `6.6`, and `2.9`.