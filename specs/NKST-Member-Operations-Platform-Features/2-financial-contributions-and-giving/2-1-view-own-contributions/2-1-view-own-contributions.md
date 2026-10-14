# Sub-Feature: View Own Contributions

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `2.1` View own contributions |
| Version | Version one |
| Parent Feature | `2` Financial Contributions and Giving |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 2`, `REQ-020` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature lets a baptized member view their own contribution history in real time on a dashboard. A member sees their giving without asking a clerk.

## What the PRD states

> "A baptized member views their own contribution history in real time on a dashboard."

The PRD assigns this requirement `User Target: Mobile App` and `Priority: High`.

## Why It Exists

The PRD describes a member who has to wait while someone traces entries by hand. This sub-feature exists so the member sees their own giving instantly, which removes the clerk lookup and gives the member confidence in the record.

## Detailed Mechanics

1. The baptized member opens the contribution dashboard.
2. The system confirms the member identity and the `baptized` state through `2.2`.
3. The system loads the contributions recorded against this member.
4. The dashboard renders the history in real time.
5. A new contribution refreshes into the history immediately after `2.3` completes.

The flow runs on the mobile app and only for the member's own records.

## State and Data Impact

Before the flow runs, the member sees no personal giving data. After it runs, the dashboard shows the member's own contribution history. The dashboard reads the contribution records written by `2.3`.

## Interaction With the Rest of the Product

`2.2` blocks the dashboard for non baptized members, `2.3` writes the records this view reads, `2.4` labels the contribution types, and `2.11` attaches receipts the view can show.

## Edge Cases

1. A member with no contributions. The dashboard must render an empty state, not an error.
2. A non baptized member opens the dashboard. The view must be blocked by `2.2`.
3. A contribution syncs from offline. The dashboard must show it once it is recorded.
4. A member opens another member's history. The view must refuse and show only the member's own records.
5. A slow connection. The dashboard must meet the PRD load target of under 3 seconds on a normal mobile connection.

## Error and Gap Handling

A blocked access returns a denial and the dashboard does not render. An empty history renders an empty state. A load failure shows a retry state. The member's own records are the only data returned.

## Accessibility and Trust Notes

The dashboard must render contributions in plain language with the type and amount readable by a screen reader. The giving data is personal, so the member sees only their own records and never another member's giving.

## Acceptance Criteria

- A baptized member sees their own contribution history on the dashboard.
- A non baptized member is blocked from the view.
- A member only sees their own records.
- New contributions appear in real time after recording.
- An empty history renders an empty state.

## Test Scenarios

1. History load. Setup: a baptized member with contributions. Assertion: the dashboard shows the member's own history.
2. Non baptized block. Setup: a non baptized member. Assertion: the view is denied.
3. Real time refresh. Setup: a completed contribution. Assertion: the new contribution appears in the history immediately.
4. No results. Setup: a baptized member with no contributions. Assertion: the empty state renders.
5. Access isolation. Setup: two members. Assertion: each sees only their own records.

## Jira-Ready Seed

User story: As a baptized member, I want to see my own giving history in real time, so that I do not have to ask a clerk.
Technical tasks: build the member dashboard, enforce `2.2` gating, and load only the requester's contributions.
Depends on: `2.2`, `2.3`, `2.4`, and `2.11`.