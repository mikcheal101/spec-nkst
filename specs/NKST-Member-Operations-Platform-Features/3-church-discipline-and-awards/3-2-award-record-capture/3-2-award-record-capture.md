# Sub-Feature: Award record capture

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `3.2` Award record capture |
| Version | Version one |
| Parent Feature | `3` Church Discipline and Awards |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 3`, `REQ-041` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature lets authorized roles record a church award against a member, with a date, reason, and the recording role. The record enters an approval pipeline before it becomes final, mirroring the discipline capture flow.

## What the PRD states

> "Authorized roles record a church award against a member, with date, reason, and the recording role."

The PRD assigns this requirement `User Target: Web App` and `Priority: High`.

## Why It Exists

The PRD describes a structured replacement for margin notes in the hard cover book. This sub-feature exists so that awards are recorded consistently, with full context (who, when, why), and so that the church can track both discipline and awards in the same audit trail.

## Detailed Mechanics

1. An authorized role opens the award capture screen.
2. The role selects the member who received the award.
3. The role enters the date the award was given and the reason for the award.
4. The role selects the recording role (who is capturing this entry).
5. The system saves the record as a draft, not final.
6. The record enters the approval pipeline (if one is configured) and routes to the pastor role.
7. The pastor reviews the record and then approves or rejects it.
8. On approval, the record becomes final and is written to the awards log.
9. If the record is later cleared, the clear action is logged with the acting role and a reason.

The flow runs on the web portal only. Award records are not created directly on the mobile app.

## State and Data Impact

Before the flow runs, no award record exists for this event. After the flow completes, the awards log carries the final record with the date, reason, recording role, and approval status. The member's profile is updated with the new award entry, and the audit trail logs every step.

## Interaction With the Rest of the Product

`3.1` captures discipline, which is a parallel flow. `3.3` is the dual approval workflow that this sub-feature calls. `3.4` controls who can clear or reverse a record. `3.5` provides the approval pipeline configuration. `6.6` gates who can capture an award record; the default allows church elder and lead pastor per the access control matrix. `5.3` logs every step of the flow in the immutable audit trail.

## Edge Cases

1. A role without permission tries to capture an award. The system must refuse the attempt and log it.
2. A pastor approves their own record. The pipeline must refuse and log the conflict of interest.
3. A record is cleared mid pipeline. The pipeline must halt and the clear action must be logged.
4. An award event is entered for a departed member. The record must still be created; the member's status does not prevent recording.
5. Two roles capture the same event. The system must merge or refuse based on role configuration.

## Error and Gap Handling

An unauthorized attempt is refused and logged. A conflict of interest (pastor approving own record) is refused and logged. A cleared pipeline halts and the clear action is logged. An award for a departed member is still created and visible in the audit trail.

## Accessibility and Trust Notes

The award capture screen must be readable on a desktop browser and screen reader friendly. The reason for the award must be entered in plain language. Award data is less sensitive than discipline but still follows the access control matrix in `6.6`. The audit trail must be complete so an auditor can reconstruct what happened.

## Acceptance Criteria

- An authorized role can open the award capture screen.
- The role selects a member, date, reason, and recording role.
- The record is saved as a draft.
- The record enters the approval pipeline and routes to the pastor.
- On pastor approval, the record becomes final and is written to the awards log.
- On pastor rejection, the record stays as draft and a reason is logged.
- A later clear action is logged with the acting role and reason.

## Test Scenarios

1. Basic capture and approve. Setup: an elder captures an award and a pastor approves. Assertion: the record becomes final and appears in the awards log.
2. Rejection. Setup: an elder captures an award and the pastor rejects it. Assertion: the record stays as draft and a rejection reason is logged.
3. Unauthorized capture. Setup: a member tries to capture an award. Assertion: the attempt is refused and logged.
4. Self-approval conflict. Setup: a pastor captures and then approves their own record. Assertion: the pipeline refuses and logs the conflict.
5. Clear after final. Setup: a final award record is cleared by an authorized role. Assertion: the clear action is logged and the record status changes.

## Jira-Ready Seed

User story: As a church elder, I want to record a church award against a member with a date and reason, so that the church has a structured record and the approval pipeline prevents one person from both raising and confirming it.
Technical tasks: build the award capture screen, model the draft-to-final pipeline, wire the pastor review and approval/rejection, and implement the clear action with logging.
Depends on: `3.1`, `3.3`, `3.4`, `3.5`, `5.3`, and `6.6`.