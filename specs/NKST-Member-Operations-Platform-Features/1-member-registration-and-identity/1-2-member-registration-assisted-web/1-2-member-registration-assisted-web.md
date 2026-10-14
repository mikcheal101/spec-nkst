# Sub-Feature: Member Registration (Assisted, Web)

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `1.2` Member registration (assisted, web) |
| Version | Version one |
| Parent Feature | `1` Member Registration and Identity |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 1`, `REQ-002` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature lets a clerk or admin register a member from the web portal, capturing the same identity fields as self service. It exists for members who cannot register themselves, and it runs on the web portal where the clerk role does its daily data entry.

## What the PRD states

> "A clerk or admin registers a member from the web portal, including members who cannot self serve, capturing the same identity fields."

The PRD assigns this requirement `User Target: Web App` and `Priority: High`.

## Why It Exists

The PRD describes the clerk as the daily data entry role with low computer literacy, so the assisted flow must stay simple and must work offline. It exists because not every member can or will register from the mobile app, and the web portal is where the clerk captures those members into the same registry.

## Detailed Mechanics

1. The clerk logs in to the web portal with role credentials.
2. The clerk opens the member registration screen.
3. The clerk enters the member identity fields, which are the same fields the mobile app captures.
4. The clerk enters the member contact details.
5. The clerk selects the member church.
6. The clerk records the baptism details and the baptismal number.
7. The clerk submits the registration.
8. The system runs the same verification as `1.5` and the same uniqueness rule as `1.4`.
9. On success, the member record appears in the registry.
10. When the internet is down, the entry saves locally and shows the pending sync status from `4-offline-data-saving-and-sync`.

The flow does not run when the clerk role lacks registration permission under `1.13`.

## State and Data Impact

Before the flow runs, the member is absent from the registry. After it runs, a member record exists with the same fields as a self served record, plus a captured record of which clerk or admin created it. In the offline case the entry first exists locally as `pending` and becomes a registry row after sync.

## Interaction With the Rest of the Product

The sub-feature consumes the same verification (`1.5`), uniqueness (`1.4`), and church (`1.9`) machinery as self service. It depends on `1.6` for the clerk session and on `1.13` for the permission check. Its offline branch feeds `4-offline-data-saving-and-sync`. Its output record is read by the directory (`1.12`) and by discipline and giving features.

## Edge Cases

1. Clerk offline. The entry must save locally as `pending` and sync later.
2. Clerk lacks the registration role. The portal must refuse before the form opens.
3. Duplicate baptismal number. The verification must flag it for review and create nothing.
4. Member belongs to a super church. The clerk must assign the member to the correct sub church under `1.9`.
5. A historical member is entered during migration. The record must carry the source tag from `5.5`.

## Error and Gap Handling

A failed submit shows the invalid field and keeps the entered values. A duplicate case routes to review. An offline submit stores the entry locally and reports `pending` rather than failing the clerk. A permission failure shows a denial message and logs the attempt.

## Accessibility and Trust Notes

The assisted form must be readable at the clerk's literacy level, label every field, and support keyboard only entry. Sensitive member data entered here must only be visible to the clerk role and above. No password is shown for the member.

## Acceptance Criteria

- A clerk or admin registers a member from the web portal with the same identity fields as self service.
- The assisted registration succeeds for a member who cannot self serve.
- The offline branch saves locally and syncs on reconnect.
- A duplicate case creates nothing and goes to review.
- A clerk without permission cannot open the assisted registration screen.

## Test Scenarios

1. Assisted happy path. Setup: a clerk with registration permission. Assertion: the member appears in the registry with all identity fields.
2. Offline assisted entry. Setup: no connectivity. Assertion: the entry is saved locally as `pending` and syncs later.
3. Permission denied. Setup: a clerk without registration permission. Assertion: the screen does not open and an attempt is logged.
4. Duplicate detect. Setup: an existing baptismal number. Assertion: a review case is created and nothing else is written.
5. Super church assignment. Setup: a super church with sub churches. Assertion: the clerk assigns the member to the correct sub church.

## Jira-Ready Seed

User story: As a clerk, I want to register a member from the web portal, so that members who cannot self serve still join the registry.
Technical tasks: build the assisted registration form, reuse verification and uniqueness, and wire the offline save branch.
Depends on: `1.4`, `1.5`, `1.6`, `1.9`, `1.13`, and `4-offline-data-saving-and-sync`.