# Sub-Feature: Make a contribution

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `2.3` Make a contribution |
| Version | Version one |
| Parent Feature | `2` Financial Contributions and Giving |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 2`, `REQ-022` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature lets a baptized member make a contribution from the mobile app, starting with a transfer based payment gateway. The member picks a type, enters an amount, and the system routes the payment through the gateway, applies the fee rule, and records the contribution with a receipt.

## What the PRD states

> "A member makes a contribution from the mobile app, starting with a transfer based payment gateway."

The PRD assigns this requirement `User Target: Mobile App` and `Priority: High`.

## Why It Exists

The PRD describes the giving journey that replaces a manual margin entry. This sub-feature exists so every transfer is traceable end to end with a gateway reference, and the member sees a receipt immediately after confirming the payment.

## Detailed Mechanics

1. The baptized member opens the contribution screen on the mobile app.
2. The member picks a contribution type (tithe, offering, pledge, building fund, mission, or special project).
3. The member enters the amount.
4. The church fee rule for that contribution is applied, showing the final amount before confirmation.
5. The member confirms the transfer, which routes through the transfer based gateway.
6. The gateway returns a reference; the platform records the contribution with that reference.
7. A receipt appears on the member dashboard and the member sees the new contribution in their real time history.

The flow runs on the mobile app only. A separate flow on the web portal handles contribution requests and drill down, but the member's own giving starts on mobile.

## State and Data Impact

Before the flow runs, no contribution record exists for this amount and type. After it runs, a contribution record is written with the gateway reference, the receipt is attached to the member record, and the member's real time history is updated. The contribution also feeds the audit trail in `5-paper-backup-and-activity-logs`.

## Interaction With the Rest of the Product

`2.2` gates this flow for the `baptized` flag. `2.4` provides the enum of allowed types. `2.5` provides the fee model configuration that is shown before confirmation. `2.6` creates contribution requests that may be associated with this contribution. `2.11` attaches a receipt. `2.8` and `2.9` can operate on the recorded contribution after it is saved. `4.1` and `4.2` handle the offline path when the connection drops.

## Edge Cases

1. A member confirms but the gateway never responds. The contribution must record the failure and remain retryable.
2. A member gives twice in one session. The system must not double record a single confirmed transfer.
3. A church has no fee configuration. The system must apply the safest plain default, which charges the member nothing extra, and record that no fee rule was configured.
4. A non baptized member reaches the contribution screen. The gate in `2.2` must deny access server side.
5. A contribution syncs from offline. The gateway reference and receipt must be recorded when the sync completes.

## Error and Gap Handling

A failed gateway confirmation records the contribution with a failure status and a retry flag. A double‑confirm in one session is refused with an explanation. A missing fee configuration applies the plain default and logs the fact. A non baptized attempt is refused with a 403.

## Accessibility and Trust Notes

The contribution screen must be readable on a phone and screen reader friendly. The member must see the final amount (including any fee) before confirming. The giving data is personal, so the member sees only their own contribution screen.

## Acceptance Criteria

- A baptized member can open the contribution screen on mobile.
- The member picks a contribution type from the supported enum.
- The member enters an amount and sees the final amount with the fee applied.
- The member confirms the transfer and the gateway processes it.
- The contribution records with a gateway reference and a receipt appears.
- The member's real time history shows the new contribution immediately.
- A non baptized member is blocked from the contribution screen.
- A failed gateway leaves the contribution in a retryable state.

## Test Scenarios

1. Basic contribution. Setup: a baptized member on mobile. Assertion: the contribution records with a gateway reference and a receipt appears.
2. Type enum. Setup: a member picks a type. Assertion: only tithe, offering, pledge, building fund, mission, or special project are accepted.
3. Fee display. Setup: a member enters an amount. Assertion: the final amount with the fee rule applied is shown before confirmation.
4. Double confirm. Setup: a member confirms twice in one session. Assertion: the second confirm is refused.
5. Non baptized block. Setup: a non baptized member opens the screen. Assertion: the gate denies access.
6. Offline sync. Setup: an offline contribution entry syncs. Assertion: the gateway reference and receipt are recorded after sync.

## Jira-Ready Seed

User story: As a baptized member, I want to give through the mobile app, so that my contribution is traceable end to end with a gateway reference.
Technical tasks: build the contribution screen, wire the type enum, implement the fee model display, integrate the transfer gateway, record the reference and receipt, and enforce the baptized gate.
Depends on: `2.2`, `2.4`, `2.5`, and `4.1`.