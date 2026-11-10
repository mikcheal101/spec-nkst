# Sub-Feature: Clear or reverse a record

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `3.4` Clear or reverse a record |
| Version | Version one |
| Parent Feature | `3` Church Discipline and Awards |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 3`, `REQ-043` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature lets only roles granted the authority clear or reverse a disciplinary record, and the clear action is itself logged. The clearance must follow the same pipeline rules and is fully auditable.

## What the PRD states

> "Only roles granted the authority can clear or reverse a disciplinary record, and the clear action is itself logged."

The PRD assigns this requirement `User Target: Web App` and `Priority: High`.

## Why It Exists

The PRD describes a system where disciplinary records are not immutable forever; there must be a legitimate process to clear a record if the discipline was erroneous or resolved. This sub-feature exists so that a record can be reversed with full context (who cleared it and why), and the audit trail preserves both the original record and the clearance.

## Detailed Mechanics

1. An authorized role with the clear permission opens the discipline record view.
2. The role selects the record to clear and enters a reason for the clearance.
3. The system checks that the role has the clear permission per the access control matrix in `6.6`.
4. If the record is still in the approval pipeline, the pipeline must halt and the clear action is logged, halting the review.
5. If the record is final, the system records the clearance, updates the record status to cleared, and logs the clearance action with the acting role, the time, and the reason.
6. The audit trail now contains both the original record entry and the clearance entry, with the acting role and reason on the clearance.

The flow runs on the web portal only. A cleared record remains visible in the audit trail with its status changed.

## State and Data Impact

Before the clearance, the record is final. After the clearance, the record status changes to cleared. The audit trail gains a new entry: the clearance, with the acting role, time, and reason. The original record entry is preserved and marked cleared. The member's profile is updated to reflect the cleared status.

## Interaction With the Rest of the Product

`3.3` is the dual approval pipeline that this sub-feature must halt if the record is in pipeline. `3.5` configures which roles have the clear permission. `6.6` gates the clear permission in the access control matrix; the default grants it to lead pastor and church super admin. `5.3` logs the clearance action in the immutable audit trail.

## Edge Cases

1. A role without the clear permission attempts the action. The system must refuse and log the attempt.
2. A record already cleared is cleared again. The system must refuse and log that the record is already cleared.
3. A record in the pipeline is cleared. The pipeline must halt and the clear action is logged, overriding the pending review.
4. The clear reason is left blank. The system must require a reason and refuse the action if blank.
5. A super admin clears a record for their own church. This is allowed per the access control matrix.

## Error and Gap Handling

An unauthorized role is refused and logged. An already-cleared record is refused with an explanation. A blank reason is refused and the action is not performed. A record in the pipeline is cleared only by halting the pipeline and logging the override.

## Accessibility and Trust Notes

The clear permission must be explained in plain language on the role configuration screen. The clearance reason must be entered in plain language. The audit trail must make clear which entry was the original and which was the clearance, with the acting role and reason visible.

## Acceptance Criteria

- Only a role with the clear permission can clear a disciplinary record.
- A record already cleared cannot be cleared again.
- If the record is in the approval pipeline, the pipeline halts and the clear action is logged.
- A reason for the clearance is required; a blank reason refuses the action.
- The audit trail contains both the original record entry and the clearance entry, with the acting role and reason.
- The member's profile reflects the cleared status.

## Test Scenarios

1. Authorized clearance. Setup: a lead pastor clears a final discipline record. Assertion: the record status changes to cleared and the audit trail logs the clearance with the pastor's role and reason.
2. Unauthorized attempt. Setup: a member tries to clear a record. Assertion: the attempt is refused and logged.
3. Already cleared. Setup: a record already marked cleared is attempted again. Assertion: the attempt is refused and logged.
4. Clear in pipeline. Setup: a record pending pastor review is cleared. Assertion: the pipeline halts and the clear action is logged.
5. Blank reason. Setup: an authorized role attempts to clear without entering a reason. Assertion: the action is refused and the reason field is required.

## Jira-Ready Seed

User story: As a lead pastor, I want to clear a disciplinary record that was entered in error, so that the church record can be corrected with full auditability.
Technical tasks: model the clear permission on the access control matrix, build the clearance screen with a required reason field, halt the pipeline if the record is pending, and log the clearance in the audit trail.
Depends on: `3.3`, `3.5`, `6.6`, and `5.3`.