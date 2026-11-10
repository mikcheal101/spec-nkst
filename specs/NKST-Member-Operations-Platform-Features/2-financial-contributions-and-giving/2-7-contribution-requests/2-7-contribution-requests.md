# Sub-Feature: Contribution requests

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `2.7` Contribution requests |
| Version | Version one |
| Parent Feature | `2` Financial Contributions and Giving |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 2`, `REQ-026` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature lets church admin and finance admin create contribution requests, and members view outstanding requests on the mobile app. A contribution request is aasking a member to complete a giving entry of a certain type and amount.

## What the PRD states

> "Church admin and finance admin create contribution requests, and members view outstanding requests on the mobile app."

The PRD assigns this requirement `User Target: Both` and `Priority: High`.

## Why It Exists

The PRD describes a system where leadership can ask a member to complete a giving entry, for example during a special campaign or to close a budget gap. This sub-feature exists so requests are created, tracked, and visible to the member who must respond.

## Detailed Mechanics

1. Church admin or finance admin opens the contribution request creation screen.
2. The admin enters the requested amount, the contribution type, the target member, and a due date.
3. The system stores the request and marks it as outstanding.
4. On the mobile app, the member opens the contribution requests screen and sees a list of outstanding requests.
5. The member can tap a request to see the details: amount, type, due date, and who requested it.
6. The member can confirm the request, which creates a contribution record of the requested type and amount.
7. The request is marked as fulfilled and removed from the outstanding list.

The flow runs on both the mobile app and the web portal; admin creates on web, member views and responds on mobile.

## State and Data Impact

Before the flow runs, no request exists. After the admin creates a request, it appears in the outstanding list. After the member confirms, a contribution record is written and the request is marked fulfilled. The request record carries the admin who created it, the time created, the member targeted, the amount, the type, and the fulfillment status.

## Interaction With the Rest of the Product

`2.3` creates a contribution when a member confirms a request. `2.5` may apply a fee model to the requested amount. `2.6` records the gateway reference when the member confirms. `6.6` gates who can create requests; the default allows church admin and finance admin. `6.5` may require an approval pipeline before a request becomes active.

## Edge Cases

1. A member confirms a request after the due date. The request must not appear as outstanding and should be marked expired.
2. A member confirms a request twice. The system must refuse the second confirm and keep the request fulfilled.
3. A request targets a non baptized member. The gate in `2.2` must block the contribution creation, and the request must remain outstanding with a note.
4. An admin creates a request for a member who already has an outstanding request. The system may allow multiple outstanding requests or refuse, configured by role.

## Error and Gap Handling

An expired request is removed from the outstanding list and marked expired. A double confirm is refused. A non baptized member's attempt is blocked by `2.2` and logged. A pending request without a confirmed contribution remains outstanding until fulfilled or expired.

## Accessibility and Trust Notes

The requests screen on mobile must be readable and screen reader friendly. The member must see who requested the contribution, the amount, the type, and the due date. Request data is personal; only the targeted member and the creating admin can see the details.

## Acceptance Criteria

- Church admin or finance admin can create a contribution request with amount, type, target member, and due date.
- The request appears in the member's outstanding list on the mobile app.
- The member can view the request details: amount, type, due date, and creator.
- The member can confirm the request, which creates a contribution record.
- The request is marked as fulfilled and removed from the outstanding list.
- A request past its due date is marked expired and removed from outstanding.
- A non baptized member's confirm is blocked by the baptized gate.

## Test Scenarios

1. Create request. Setup: an admin creates a request for 500 currency units, tithe type, due in 7 days. Assertion: the request appears in the outstanding list.
2. Member confirms request. Setup: a member taps the request and confirms. Assertion: a contribution record is created and the request is fulfilled.
3. Due date passes. Setup: the due date passes without confirmation. Assertion: the request is marked expired and removed from outstanding.
4. Non baptized confirm. Setup: a non baptized member tries to confirm. Assertion: the gate blocks the confirm and logs the attempt.
5. Double confirm. Setup: a member confirms twice. Assertion: the second confirm is refused and the request stays fulfilled.

## Jira-Ready Seed

User story: As a member, I want to view and respond to contribution requests on the mobile app, so that I can complete giving entries when leadership asks.
Technical tasks: build the request creation screen for admin, wire the outstanding list on mobile, implement the confirm flow that creates a contribution, and enforce the baptized gate.
Depends on: `2.2`, `2.3`, `2.5`, and `6.6`.