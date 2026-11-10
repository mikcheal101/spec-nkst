# Sub-Feature: Non baptized restriction

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `2.2` Non baptized restriction |
| Version | Version one |
| Parent Feature | `2` Financial Contributions and Giving |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 2`, `REQ-021` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature blocks all financial records and contribution dashboards for non baptized members. Non baptized members may use the mobile app for announcements, events, the directory, and messaging, but financial data is never shown.

## What the PRD states

> "The system blocks all financial records and contribution dashboards for non baptized members."

The PRD assigns this requirement `User Target: Both` and `Priority: High`.

## Why It Exists

The PRD defines a baptism gate on financial access. This sub-feature exists so that a member who has not been baptized cannot view contribution histories, make contributions, or see financial summaries. The gate protects the integrity of the giving record and follows the church's teaching that baptism is the entry point for financial participation.

## Detailed Mechanics

1. A member record carries a `baptized` flag set at registration.
2. Before any financial screen renders, the system checks the `baptized` flag.
3. If the flag is false, the financial screen is replaced with a denial message.
4. If the flag is true, the financial screen renders normally.
5. The check runs on every request to a financial endpoint.
6. The flag cannot be set or cleared without an authorized role and an approval pipeline.

The flow runs on both the mobile app and the web portal; the same gate enforces access on both surfaces.

## State and Data Impact

Before the check, the member sees whatever the unauthenticated UI shows. After the check, the member either sees the financial data (if baptized) or a denial (if not baptized). No record data is modified; only the UI visibility changes.

## Interaction With the Rest of the Product

`2.1` reads the `baptized` flag to show the contribution dashboard. `2.3` uses the same flag to allow or block contribution type selection. `2.2` is the gate that both of these call. `6.6` owns the role configuration that may adjust this gate, but the default denies non baptized access.

## Edge Cases

1. A member's baptism status changes after the flag is set. The change must follow the pipeline in `6.5` and update the flag on the next sync.
2. A non baptized member tries a financial endpoint directly. The endpoint must refuse with a 403 and log the attempt.
3. A baptized member's flag is temporarily cleared (for example, during a discipline process). The financial screens must reflect the new flag value immediately.
4. A role without permission toggles the flag. The change is refused and logged.

## Error and Gap Handling

A denied access returns a 403 and a plain-language message: "Financial data is only available to baptized members." A failed flag check defaults to the denial state so no financial data leaks. The attempt is logged for audit.

## Accessibility and Trust Notes

The denial message must be readable on a phone and screen reader friendly. The member must understand why the financial section is hidden. The rule applies equally on mobile and web; no surface shows financial data to a non baptized member.

## Acceptance Criteria

- A non baptized member cannot view the contribution dashboard on mobile.
- A non baptized member cannot view contribution summaries on the web portal.
- A baptized member can view and use the contribution dashboard on mobile.
- A baptized member can view and use contribution summaries on the web portal.
- An endpoint call for financial data from a non baptized member returns 403 and logs the attempt.

## Test Scenarios

1. Non baptized dashboard block. Setup: a non baptized member logs into the mobile app. Assertion: the contribution dashboard is denied and a plain-language message appears.
2. Baptized dashboard unlock. Setup: a baptized member logs into the mobile app. Assertion: the contribution dashboard renders with the member's history.
3. Non baptized web block. Setup: a non baptized member logs into the web portal. Assertion: financial summaries are not visible.
4. Baptized web unlock. Setup: a baptized member logs into the web portal. Assertion: financial summaries render.
5. Flag change after discipline. Setup: a baptized member's flag is cleared by an authorized role. Assertion: the financial screens reflect the cleared flag on the next request.

## Jira-Ready Seed

User story: As a non baptized member, I want to use the app for announcements and events, so that I am not blocked from the non financial parts of the app.
Technical tasks: model the `baptized` flag on the member record, gate every financial endpoint with the flag, and render the denial message on both surfaces.
Depends on: `1.3`, `1.5`, `2.1`, and `6.5`.