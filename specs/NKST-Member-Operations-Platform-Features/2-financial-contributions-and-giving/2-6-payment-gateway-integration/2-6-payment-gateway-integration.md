# Sub-Feature: Payment gateway integration

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `2.6` Payment gateway integration |
| Version | Version one |
| Parent Feature | `2` Financial Contributions and Giving |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 2`, `REQ-025` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature integrates a transfer based payment gateway against each contribution for traceability. The gateway records a reference that links the bank transfer to the member's contribution record.

## What the PRD states

> "The platform integrates a transfer based gateway and records the gateway reference against each contribution for traceability."

The PRD assigns this requirement `User Target: Both` and `Priority: High`.

## Why It Exists

The PRD describes a giving system where every transfer is traceable. This sub-feature exists so the church has a gateway reference for each contribution, which allows the finance admin to reconcile, export, and audit the giving record end to end.

## Detailed Mechanics

1. The member opens the contribution screen and enters the amount and type.
2. The member starts the payment, which routes through the transfer based gateway.
3. The gateway processes the transfer and returns a gateway reference (a transaction ID or reference number).
4. The platform records the contribution with the gateway reference attached.
5. The gateway reference is stored on the contribution record and is visible on the receipt, the dashboard, and in export files.
6. The finance admin can drill into any contribution and see the gateway reference, the entry source (electronic or paper), and the date.

The flow runs on the mobile app when the member confirms the transfer, and on the web portal when finance admin views or exports contributions.

## State and Data Impact

Before the flow runs, the contribution has no gateway reference. After it runs, the contribution record carries the gateway reference. The reference is immutable once recorded; it cannot be edited or removed. It feeds the audit trail in `5-paper-backup-and-activity-logs` and the export features in `6-custom-modules-and-platform-features`.

## Interaction With the Rest of the Product

`2.3` starts the contribution flow and routes to the gateway. `2.5` may show the fee model before the gateway is invoked. `2.8` and `2.9` read the gateway reference when exporting or reconciling. `4.1` and `4.2` handle the offline path: when the connection drops, the gateway reference is cached locally and synced when connectivity returns. `5.3` logs every adjustment, and the gateway reference is part of that audit entry.

## Edge Cases

1. A member confirms but the gateway never returns a reference. The contribution must record the failure and remain retryable.
2. A gateway reference already exists for a different contribution. The system must refuse the duplicate and log the attempt.
3. A gateway reference is present but the transfer failed. The contribution must show the reference with a failure status, not a success.
4. A contribution syncs from offline. The cached gateway reference must be applied when the sync completes.
5. The gateway is temporarily unavailable. The contribution must be held in a pending state until the gateway returns.

## Error and Gap Handling

A failed gateway confirmation records the contribution with a failure status and a retry flag. A duplicate reference is refused and logged. A missing reference on a synced contribution triggers a retry of the gateway call. A temporarily unavailable gateway holds the contribution in pending state.

## Accessibility and Trust Notes

The gateway reference is not shown to the member on the mobile screen; it is an internal trace identifier. The member sees a receipt with the contribution details but not the raw reference number. The reference feeds only authorized roles through the drill down and export features.

## Acceptance Criteria

- A contribution records a gateway reference when the transfer is processed.
- The gateway reference is immutable once recorded.
- The reference is visible on the receipt, the dashboard, and in export files.
- A failed gateway leaves the contribution in a retryable state.
- A duplicate reference is refused and logged.

## Test Scenarios

1. Gateway reference recorded. Setup: a member confirms a transfer. Assertion: the contribution record has a gateway reference.
2. Reference immutability. Setup: a contribution with a reference. Assertion: the reference cannot be edited or removed.
3. Reference visible in export. Setup: an export includes contributions. Assertion: the gateway reference appears in the export file.
4. Failed gateway. Setup: a member confirms but the gateway fails. Assertion: the contribution is marked retryable.
5. Offline sync. Setup: an offline contribution syncs. Assertion: the gateway reference is recorded after sync.

## Jira-Ready Seed

User story: As a finance admin, I want every contribution to have a gateway reference, so that I can trace every transfer end to end.
Technical tasks: integrate the transfer based gateway, record the reference on the contribution, and make the reference visible in drill down and export.
Depends on: `2.3`, `4.1`, and the transfer gateway service.