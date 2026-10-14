# Sub-Feature: Contribution drill down

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `2.8` Contribution drill down |
| Version | Version one |
| Parent Feature | `2` Financial Contributions and Giving |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 2`, `REQ-027` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature lets finance admin drill from a summary into the individual contribution entries behind it. The finance admin can see each contribution's details, gateway reference, entry source, and date.

## What the PRD states

> "Finance admin drills from a summary into the individual contribution entries behind it."

The PRD assigns this requirement `User Target: Web App` and `Priority: High`.

## Why It Exists

The PRD describes a reconciliation view where the finance admin sees giving grouped by period and type, and then needs to see the individual entries that make up each group. This sub-feature exists so the finance admin can inspect a single contribution, see its gateway reference and entry source, and take action if needed.

## Detailed Mechanics

1. The finance admin opens the reconciliation view and groups by period and type.
2. The admin selects a group to drill into.
3. The system renders the individual contribution entries behind that group.
4. Each entry shows the amount, type, gateway reference (if any), entry source (electronic or paper), and the date recorded.
5. The admin can filter, sort, and export the displayed entries.

The flow runs on the web portal only. The mobile app does not drill; it only shows the member's own history.

## State and Data Impact

Before the drill, the finance admin sees grouped summaries. After the drill, the admin sees the individual entries. No record data is modified; only the view changes.

## Interaction With the Rest of the Product

`2.9` presents the reconciliation view that the drill down originates from. `2.6` provides the gateway reference shown in each entry. `2.4` provides the contribution type shown. `5.3` may label the entry source (electronic or paper) in the audit trail. `6.6` gates who can drill; the default allows finance admin.

## Edge Cases

1. A group has no individual entries. The drill must show an empty state, not an error.
2. An entry has no gateway reference (for example, a paper entry from before the gateway was active). The entry must show the reference as N/A and the entry source as paper.
3. The admin changes a filter and the drill results change. The new results must render without a page reload, or the admin must re select the group.
4. A paper entry from a previous church year. The drill must still surface it with the correct entry source label.

## Error and Gap Handling

An empty group shows an empty state. An entry without a gateway reference shows N/A. A failed render shows a retry state.

## Accessibility and Trust Notes

The drill down screen must be readable on a desktop browser and screen reader friendly. The entry source label (electronic or paper) must be clear so the finance admin understands the data provenance. The gateway reference, when present, is an internal identifier and does not need to be read by a screen reader for the entry to be accessible.

## Acceptance Criteria

- Finance admin can open the reconciliation view and select a group to drill into.
- The drill down renders the individual contribution entries behind the selected group.
- Each entry shows the amount, type, gateway reference, entry source, and date.
- A group with no entries shows an empty state.
- An entry without a gateway reference shows N/A for the reference.
- The admin can filter and sort the displayed entries.

## Test Scenarios

1. Drill into group. Setup: a reconciliation view with a group of contributions. Assertion: the drill down renders the individual entries.
2. Empty group. Setup: a group with no contributions. Assertion: the drill down shows an empty state.
3. Entry without reference. Setup: a paper entry from before the gateway was active. Assertion: the entry shows N/A for the gateway reference and paper for the entry source.
4. Filter and sort. Setup: the admin applies a filter and sorts by amount. Assertion: the displayed entries update to match the filter and sort.
5. Drill from mobile. Setup: a member tries to drill from the mobile app. Assertion: the drill is not available; the app shows only the member's own history.

## Jira-Ready Seed

User story: As a finance admin, I want to drill from a reconciliation summary into individual contribution entries, so that I can inspect a single contribution's details and gateway reference.
Technical tasks: build the drill down view, wire the entry data (amount, type, reference, source, date), and handle the empty and N/A cases.
Depends on: `2.9`, `2.6`, `2.4`, and `6.6`.