# Sub-Feature: Reconciliation view

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `2.10` Reconciliation view |
| Version | Version one |
| Parent Feature | `2` Financial Contributions and Giving |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 2`, `REQ-029` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature presents a reconciliation view that groups giving by period and type so a monthly audit can be completed quickly. The finance admin sees electronic and paper entries labeled, can drill into any group, and exports the set to a file.

## What the PRD states

> "The system presents a reconciliation view that groups giving by period and type so a monthly audit can be completed quickly."

The PRD assigns this requirement `User Target: Web App` and `Priority: High`.

## Why It Exists

The PRD describes the monthly audit process where the finance admin groups giving by period and type to complete the audit in about an hour instead of days. This sub-feature exists so the admin has a single view that electronic and paper entries are labeled, can drill into individual entries, and export the set.

## Detailed Mechanics

1. The finance admin opens the reconciliation view from the financial dashboard.
2. The view groups all contributions by period (for example, this month, last month) and by type (tithe, offering, pledge, building fund, mission, special project).
3. Each group shows the total amount, the number of entries, and labels for each entry's source: electronic or paper.
4. The admin can select a group to drill into and see the individual contributions behind it.
5. The admin can apply filters: period, type, entry source, date range, or member.
6. The admin can export the displayed set to a CSV file for offline review.

The flow runs on the web portal only. The mobile app does not have a reconciliation view.

## State and Data Impact

Before the view runs, the contributions exist in the database with their entry source and type. After the view runs, the admin sees the grouped display. No record data is modified; only the presentation changes.

## Interaction With the Rest of the Product

`2.9` is the export action that originates from this view. `2.8` is the drill down that originates from this view. `2.5` may apply fee models that affect the amounts shown. `2.2` may gate what the admin sees based on baptized status and role. `5.3` provides the entry source label (electronic or paper) for each group. `6.6` gates who can open the view; the default allows finance admin and above.

## Edge Cases

1. A period has only paper entries. The view must label each group as paper and show the totals.
2. A period has only electronic entries. The view must label each group as electronic.
3. A filter returns no groups. The view must show an empty state with a message that no entries match the filter.
4. The admin changes the period and the groups re compute. The new groups must render without a page reload, or the admin must re open the view.

## Error and Gap Handling

An empty view shows an empty state with a message. A failed render shows a retry state. A filter that returns no results shows no groups and a message.

## Accessibility and Trust Notes

The reconciliation view must be readable on a desktop browser and screen reader friendly. The entry source labels (electronic or paper) must be clear so the admin understands the data provenance. The grouping by period and type must be deterministic so the admin can rely on the numbers.

## Acceptance Criteria

- Finance admin can open the reconciliation view from the financial dashboard.
- The view groups contributions by period and by type.
- Each group shows the total amount, the number of entries, and the entry source label (electronic or paper).
- The admin can drill into any group to see individual contributions.
- The admin can apply filters: period, type, entry source, date range, or member.
- The admin can export the displayed set to a CSV file.
- A period with only paper or only electronic entries is labeled correctly.
- A filter returning no results shows an empty state.

## Test Scenarios

1. Groups by period and type. Setup: contributions across two periods and two types. Assertion: the view renders groups with correct totals, counts, and entry source labels.
2. Only paper entries. Setup: a period with only paper contributions. Assertion: each group is labeled paper.
3. Only electronic entries. Setup: a period with only electronic contributions. Assertion: each group is labeled electronic.
4. Filter returns no results. Setup: a filter that matches no contributions. Assertion: the view shows an empty state.
5. Export from view. Setup: the admin exports from the view. Assertion: the CSV contains only the displayed contributions.

## Jira-Ready Seed

User story: As a finance admin, I want a reconciliation view that groups giving by period and type, so that I can complete the monthly audit quickly.
Technical tasks: build the reconciliation view, group by period and type, label entry sources, implement drill down and export, and handle empty and filter cases.
Depends on: `2.8`, `2.9`, `2.5`, `2.2`, `5.3`, and `6.6`.