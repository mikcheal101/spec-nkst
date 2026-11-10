# Sub-Feature: Contribution types

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `2.4` Contribution types |
| Version | Version one |
| Parent Feature | `2` Financial Contributions and Giving |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 2`, `REQ-023` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature provides the enum of contribution types that a member can choose from when making a giving entry. The supported types are tithes, offerings, pledges, building fund, missions, and special projects.

## What the PRD states

> "The system supports contribution types including tithes, offerings, pledges, building fund, missions, and special projects."

The PRD assigns this requirement `User Target: Both` and `Priority: High`.

## Why It Exists

The PRD describes a giving system where every entry is tagged with a type so reports can break down giving by category. This sub-feature exists so the church can see how much is given as tithe, offering, pledge, and so on, and so the member sees the correct type on their receipt and dashboard.

## Detailed Mechanics

1. The contribution screen presents the member with the supported type enum.
2. The member selects one type: tithe, offering, pledge, building fund, mission, or special project.
3. The system stores the selected type against the contribution record.
4. The type is rendered on the receipt, the dashboard history, and in all reports.
5. Reporting features can filter or group by type.

The flow runs on the mobile app when the member makes a contribution and on the web portal when finance admin views or exports contributions.

## State and Data Impact

Before the flow runs, the contribution has no type. After it runs, the contribution carries the selected type value. The type affects how the contribution appears in summaries, reports, and the member's receipt.

## Interaction With the Rest of the Product

`2.3` presents the type selection screen. `2.5` may apply different fee rules per type. `2.7` drills from a summary into entries of a given type. `2.9` groups contributions by type in the reconciliation view. `5.3` and `6.9` may tag types during audit review.

## Edge Cases

1. A member selects an unsupported type. The system must refuse the selection and show the allowed enum.
2. A report filters by a type that has no entries. The report must show an empty state, not an error.
3. A contribution type is changed after recording. The change must be logged and the record updated.
4. A special project type is used for a one off giving campaign. The system must allow any string the church configures under the special project label, but the enum defaults are the six listed.

## Error and Gap Handling

An unsupported type is refused with the allowed enum listed. A type change is logged. A report with no entries for the filtered type renders an empty state.

## Accessibility and Trust Notes

The type enum must be presented in plain language on the mobile screen. The member must understand the difference between a tithe, offering, pledge, and so on. The type data is not sensitive, but it feeds reports that the church leadership reviews.

## Acceptance Criteria

- The contribution screen presents the enum: tithe, offering, pledge, building fund, mission, special project.
- A member can select one type.
- The selected type is stored on the contribution record.
- The type renders on the receipt and the member's dashboard history.
- Reporting can filter by type.
- An unsupported type is refused and the allowed enum is shown.

## Test Scenarios

1. Type selection. Setup: a member on the contribution screen. Assertion: the enum presents the six supported types.
2. Type storage. Setup: a member selects a type and confirms. Assertion: the contribution record carries the selected type.
3. Type render on receipt. Setup: a contribution with a type. Assertion: the receipt shows the type.
4. Type filter in report. Setup: a report filters by type. Assertion: only contributions of that type appear.
5. Unsupported type. Setup: a member tries to input a type not in the enum. Assertion: the system refuses and shows the allowed enum.

## Jira-Ready Seed

User story: As a member, I want to select a contribution type (tithe, offering, pledge, and so on), so that my giving is categorized correctly.
Technical tasks: model the contribution type enum, wire the selection screen, store the type on the record, and render it on the receipt and dashboard.
Depends on: `2.3`, and the church's type configuration.