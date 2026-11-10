# Sub-Feature: Configurable transaction fee rules

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `2.5` Configurable transaction fee rules |
| Version | Version one |
| Parent Feature | `2` Financial Contributions and Giving |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 2`, `REQ-024` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature lets the church configure a fee model per contribution, choosing a flat fee, a percentage, or full subsidy by the church, and the choice is applied at charge time. The default safest plain fee charges the member nothing extra.

## What the PRD states

> "The church configures the fee model per contribution, choosing a flat fee, a percentage, or full subsidy by the church, and the choice is applied at charge time."

The PRD assigns this requirement `User Target: Web App` and `Priority: High`.

## Why It Exists

The PRD describes a giving system where the church can control whether a fee is added to the member's transfer, and what the fee model is. This sub-feature exists so the church can set a flat fee (for example, a fixed donation), a percentage (for example, 2 percent of the amount), or a full subsidy (the church covers the full cost), and the choice is applied when the member confirms the transfer.

## Detailed Mechanics

1. The church admin opens the fee configuration screen.
2. The admin selects a fee model for a contribution type: `FLAT`, `PERCENTAGE`, or `SUBSIDY`.
3. If `FLAT`, the admin enters the fixed amount that will be added to the member's transfer.
4. If `PERCENTAGE`, the admin enters the percentage rate that will be applied to the amount.
5. If `SUBSIDY`, the admin marks the contribution as fully subsidized; the member pays nothing extra.
6. The configuration is saved and becomes the active model for that contribution type.
7. When a member makes a contribution, the fee model is applied at charge time and the final amount (amount plus fee, or amount if subsidized) is shown before confirmation.

The flow runs on both the mobile app and the web portal; the mobile app shows the final amount before the member confirms, and the web portal stores the configuration.

## State and Data Impact

Before the configuration runs, no fee model is active for the contribution type. After it runs, the contribution type carries the active fee model. When a member makes a contribution, the fee is calculated and added to the amount the member transfers. The recorded contribution stores the original amount, the fee, the model type, and the final amount the member paid.

## Interaction With the Rest of the Product

`2.3` starts the contribution flow and shows the final amount. `2.4` presents the type that may have a linked fee model. `2.6` creates contribution requests that may have a fee attached. `4.1` and `4.2` handle the offline path when the connection drops and the fee model must be available from the local cache. `6.6` gates who can configure fee rules; the default is church super admin with finance admin as optional delegate.

## Edge Cases

1. A church has no fee configuration. The system must apply the safest plain default, which charges the member nothing extra, and record that no fee rule was configured.
2. A fee model is changed after contributions have been recorded. The new model applies to future contributions; past contributions keep their original fee records.
3. A `PERCENTAGE` rate is set to 0. The system must treat this as a subsidy (no extra charge) and log the change.
4. A member's transfer fails partway through. The contribution must record the failure and remain retryable; the fee calculation must not charge twice.

## Error and Gap Handling

A missing fee configuration applies the plain default (no extra charge) and records that no rule was set. A failed transfer does not charge the member; the contribution is marked retryable. A percentage rate of 0 is treated as a subsidy and a log entry is added.

## Accessibility and Trust Notes

The fee configuration screen must use plain language for the three models: "Flat fee", "Percentage of amount", "Church subsidizes (member pays nothing)". The member must see the final amount (including any fee) before confirming. The fee data is personal to the church; only authorized roles can configure it.

## Acceptance Criteria

- The church can configure a fee model per contribution type: FLAT, PERCENTAGE, or SUBSIDY.
- A FLAT fee shows a fixed amount added to the member's transfer.
- A PERCENTAGE fee shows a percentage of the amount added to the member's transfer.
- A SUBSIDY means the member pays nothing extra; the church covers the cost.
- When a member makes a contribution, the final amount with the fee is shown before confirmation.
- If no fee rule is configured, the member pays nothing extra (plain default).
- A percentage rate of 0 is treated as a subsidy and logged.

## Test Scenarios

1. Configure FLAT fee. Setup: an admin sets a flat fee of 100 currency units for tithes. Assertion: the fee of 100 is applied at charge time and shown before confirmation.
2. Configure PERCENTAGE fee. Setup: an admin sets 2 percent for offerings. Assertion: 2 percent of the contribution amount is added at charge time.
3. Configure SUBSIDY. Setup: an admin marks building fund as subsidized. Assertion: the member pays nothing extra at charge time.
4. No fee configuration. Setup: no fee model is set. Assertion: the member pays the full amount with no extra charge.
5. Percentage rate of 0. Setup: an admin sets 0 percent. Assertion: the system treats this as a subsidy and logs the change.
6. Failed transfer. Setup: a member confirms but the gateway fails. Assertion: the contribution is marked retryable and no fee is charged twice.

## Jira-Ready Seed

User story: As a church admin, I want to configure the fee model for each contribution type, so that the church can control whether a fee is added to the member's giving transfer.
Technical tasks: build the fee configuration screen, model the FLAT PERCENTAGE and SUBSIDY options, apply the fee at charge time, and enforce the plain default when no rule is set.
Depends on: `2.3`, `2.4`, `6.6`, and the church entity for type configuration.