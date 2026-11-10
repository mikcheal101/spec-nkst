# Sub-Feature: Giving receipts

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `2.11` Giving receipts |
| Version | Version one |
| Parent Feature | `2` Financial Contributions and Giving |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 2`, `REQ-030` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature generates a receipt for a completed contribution for the member record. The receipt shows the contribution amount, type, date, gateway reference (if any), and the final amount the member paid including any fee.

## What the PRD states

> "The system generates a receipt for a completed contribution for the member record."

The PRD assigns this requirement `User Target: Both` and `Priority: Medium`.

## Why It Exists

The PRD describes a giving system where every contribution has a record the member can reference. This sub-feature exists so the member has a receipt on their dashboard and can download or view it whenever they need to see the details of a single giving entry.

## Detailed Mechanics

1. A contribution is completed and recorded with a gateway reference (if the transfer was processed) and an entry source (electronic or paper).
2. The system generates a receipt record attached to the member's account.
3. The receipt shows: contribution ID, amount, type, date recorded, gateway reference (or N/A if paper), entry source, and the final amount the member paid.
4. The member opens their contribution dashboard on mobile or web and sees the receipt for each completed contribution.
5. The member can tap or click a receipt to view a detailed screen with all the fields.
6. The member can download or share the receipt; the system logs the view or download action.

The flow runs on both the mobile app and the web portal; the member sees the receipt on either surface.

## State and Data Impact

Before the receipt is generated, no receipt record exists for this contribution. After it is generated, the member's account carries the receipt. The receipt is immutable once written; it cannot be edited or removed. The receipt feeds the member's giving history and is included in export files.

## Interaction With the Rest of the Product

`2.3` records the contribution that this receipt belongs to. `2.6` provides the gateway reference shown on the receipt. `2.5` provides the fee model so the receipt shows the final amount paid. `2.1` gates the receipt for non baptized members: the receipt is shown only to baptized members or to non baptized members for their own non financial giving history, per role configuration. `6.6` gates who can configure receipt settings; the default shows receipts to baptized members only for financial entries.

## Edge Cases

1. A paper contribution (no gateway reference). The receipt must show N/A for the reference and paper for the entry source.
2. A contribution with a subsidized fee (member paid nothing extra). The receipt must show the final amount as the original amount, with a note that the church subsidized the fee.
3. A member views a receipt on mobile and then on web. The receipt must show the same data on both surfaces.
4. A receipt is deleted or edited. The system must refuse and log the attempt; receipts are immutable.

## Error and Gap Handling

A paper contribution shows N/A and paper on the receipt. A subsidized fee shows the original amount with a subsidy note. A delete or edit attempt is refused and logged. A missing contribution ID defaults the receipt to a minimal view and logs the gap.

## Accessibility and Trust Notes

The receipt must be readable on a phone and screen reader friendly. The member must see the amount, type, date, and final amount paid clearly. The gateway reference, when present, is an internal identifier and does not need to be read by a screen reader for the receipt to be accessible. The receipt data is personal; only the member and authorized roles can view it.

## Acceptance Criteria

- A completed contribution generates a receipt attached to the member's account.
- The receipt shows: amount, type, date, gateway reference (or N/A), entry source, and final amount paid.
- The member can view the receipt on mobile and on web.
- The receipt is immutable once written.
- A paper contribution shows N/A for the gateway reference and paper for the entry source.
- A subsidized fee shows the original amount with a note that the church subsidized the fee.

## Test Scenarios

1. Receipt generated. Setup: a completed contribution. Assertion: a receipt record is attached to the member's account and shows all required fields.
2. Receipt on mobile. Setup: a baptized member views the dashboard on mobile. Assertion: the receipt is visible and readable.
3. Receipt on web. Setup: the same member views the dashboard on web. Assertion: the receipt shows the same data.
4. Paper contribution receipt. Setup: a contribution with no gateway reference (paper only). Assertion: the receipt shows N/A for the reference and paper for the entry source.
5. Subsidized fee receipt. Setup: a contribution with a subsidized fee. Assertion: the receipt shows the original amount with a note that the church subsidized the fee.
6. Receipt immutability. Setup: an attempt to edit or delete a receipt. Assertion: the attempt is refused and logged.

## Jira-Ready Seed

User story: As a member, I want to see a receipt for each contribution I make, so that I have a record of the giving entry for my own records.
Technical tasks: build the receipt record attached to the member's contribution, render the fields (amount, type, date, reference, source, final amount), and make the receipt visible on both mobile and web surfaces.
Depends on: `2.3`, `2.5`, `2.6`, `2.1`, and `6.6`.