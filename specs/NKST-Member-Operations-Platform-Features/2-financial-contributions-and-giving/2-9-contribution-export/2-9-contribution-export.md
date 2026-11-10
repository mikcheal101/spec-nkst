# Sub-Feature: Contribution export

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `2.9` Contribution export |
| Version | Version one |
| Parent Feature | `2` Financial Contributions and Giving |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 2`, `REQ-028` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature lets finance admin export contributions to a file for offline review and reporting. The export produces a CSV file containing the contribution entries selected by period, type, and other filters.

## What the PRD states

> "Finance admin exports contributions to a file for offline review and reporting."

The PRD assigns this requirement `User Target: Web App` and `Priority: High`.

## Why It Exists

The PRD describes a monthly audit process where the finance admin needs a file of all contributions for the month to review offline, share with leadership, or feed compliance requests. This sub-feature exists so the export is produced quickly and includes only completed contributions.

## Detailed Mechanics

1. The finance admin opens the export screen from the reconciliation view.
2. The admin selects a period (for example, this month) and may filter by type (tithe, offering, and so on).
3. The system assembles the contributions that match the selection and are in a completed state.
4. The system generates a CSV file with the columns: contribution ID, member identifier, amount, type, gateway reference, entry source, date, and church.
5. The admin downloads the file to their local machine.
6. The export action is itself logged in the audit trail, recording who exported, when, and what filters were applied.

The flow runs on the web portal only. The mobile app does not export.

## State and Data Impact

Before the export, the contributions exist in the database. After the export, the contributions are unchanged; the CSV file is a new artifact stored on the admin's machine. The export action writes an audit entry.

## Interaction With the Rest of the Product

`2.8` is the export action itself. `2.7` creates contribution requests that may appear in the export if fulfilled. `2.2` gates the export for non baptized members: the export must include only contributions from baptized members or those the role is authorized to see. `5.3` labels the entry source (electronic or paper) in the export. `6.6` decides which roles can export.

## Edge Cases

1. An export runs while a contribution is still pending. The export must include only completed contributions; pending entries must not appear.
2. A church has no contributions for the selected period. The export must produce an empty CSV file, not an error.
3. A filtered type has no entries. The export must produce a CSV with only the headers and no data rows.
4. A non baptized member's contributions are in the database. The export must respect the baptized gate and exclude contributions from non baptized members unless the admin role is authorized.

## Error and Gap Handling

An empty export produces a CSV with headers only. A failed export shows a retry state. A non baptized attempt is refused with a 403 and logged.

## Accessibility and Trust Notes

The export screen must be readable on a desktop browser. The CSV columns must be labeled clearly so the admin understands each field. The export itself is logged; no contribution data is silently dropped.

## Acceptance Criteria

- Finance admin can open the export screen from the reconciliation view.
- The admin selects a period and may filter by type.
- The export generates a CSV with the columns: contribution ID, member identifier, amount, type, gateway reference, entry source, date, and church.
- The export includes only completed contributions; pending entries are excluded.
- An export with no matching contributions produces a CSV with headers only.
- The export action is logged in the audit trail.
- Non baptized members' contributions are excluded unless the admin role is authorized.

## Test Scenarios

1. Export with filters. Setup: an admin selects this month and filters by tithe. Assertion: the CSV contains only tithe contributions for this month.
2. Export empty period. Setup: an admin selects a period with no contributions. Assertion: the CSV has headers only and no data rows.
3. Non baptized exclusion. Setup: the database contains contributions from non baptized members. Assertion: the export excludes them unless the admin role is authorized.
4. Export logs audit entry. Setup: an export runs. Assertion: an audit entry records who exported, when, and what filters were applied.

## Jira-Ready Seed

User story: As a finance admin, I want to export contributions to a CSV file for offline review and reporting, so that I can share the data with leadership or feed compliance requests.
Technical tasks: build the export screen, wire the period and type filters, generate the CSV with the correct columns, exclude pending entries, and log the export action.
Depends on: `2.2`, `2.7`, `5.3`, and `6.6`.