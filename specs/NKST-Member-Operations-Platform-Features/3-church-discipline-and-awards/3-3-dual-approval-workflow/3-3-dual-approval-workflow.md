# Sub-Feature: Dual approval workflow

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `3.3` Dual approval workflow |
| Version | Version one |
| Parent Feature | `3` Church Discipline and Awards |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 3`, `REQ-042` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature implements a pipeline between the clerk or recorder and a pastor before a disciplinary or award record is considered final, so one person cannot both raise and confirm it. The pipeline routes the record from captor to pastor for review and decision.

## What the PRD states

> "A disciplinary or award record moves through a pipeline between the clerk or recorder and a pastor before it is considered final, so one person cannot both raise and confirm it."

The PRD assigns this requirement `User Target: Web App` and `Priority: High`.

## Why It Exists

The PRD defines the core RBAC and approval guarantee: no single role can both create and finalize a sensitive record. This sub-feature exists so that the church can trust that every discipline and award has been reviewed by a second pair of eyes, maintaining the integrity of the log.

## Detailed Mechanics

1. A clerk or recorder captures a discipline or award record and saves it as a draft.
2. The system automatically routes the draft record into the approval pipeline.
3. The pipeline assigns the record to the pastor role configured for this church.
4. The pastor reviews the record, entering a decision: approve or reject.
5. If the pastor approves, the record becomes final and is written to the disciplinary log or awards log.
6. If the pastor rejects, the record stays as draft and a rejection reason is logged.
7. On approval or rejection, the audit trail logs the pipeline step with the pastor's role, the decision, and the time.

The pipeline is configurable per church; some churches may set no pipeline (in which case the captor's role alone finalizes the record), but the default is the dual pipeline as described.

The flow runs on the web portal only.

## State and Data Impact

Before the pipeline runs, the record is a draft. After the pastor's decision, the record is either final (written to the log) or remains draft (with a rejection reason). The audit trail is updated with the pipeline step. The member's profile is not changed until the record becomes final.

## Interaction With the Rest of the Product

`3.1` and `3.2` produce the draft records that this pipeline processes. `3.4` controls who can clear or reverse a finalized record. `3.5` configures whether a pipeline is active for this church and which pastor role is assigned. `6.6` gates who can capture records that will enter the pipeline; the default allows church elder and lead pastor. `5.3` logs every pipeline step in the immutable audit trail.

## Edge Cases

1. No pastor role is configured. The pipeline must hold the record and log that no pastor is assigned, rather than finalizing without review.
2. The pastor is on leave or unavailable. The pipeline must hold the record in pending state and surface the delay to an admin.
3. The pastor approves their own record. The system must refuse the approval and log a conflict of interest.
4. The pipeline is disabled for this church. The captor's role alone finalizes the record, and the pipeline step is logged as disabled.
5. A record is cleared while in the pipeline. The pipeline must halt and the clear action must be logged.

## Error and Gap Handling

No pastor configured: the record stays draft and an admin is notified. Pastor unavailable: the record stays pending and an admin is notified. Pastor self-approves: the approval is refused and a conflict is logged. Pipeline disabled: the captor finalizes and the pipeline step is logged as disabled. Record cleared in pipeline: the pipeline halts and the clear is logged.

## Accessibility and Trust Notes

The pipeline status must be visible on the record view so an admin can see whether a record is pending pastor review. The decision (approve/reject) must be entered in plain language. The audit trail must capture the pipeline step completely so an auditor can reconstruct the review decision.

## Acceptance Criteria

- A draft record is automatically routed into the approval pipeline.
- The pipeline assigns the record to the configured pastor role.
- The pastor reviews and decides: approve or reject.
- On approval, the record becomes final and is written to the log.
- On rejection, the record stays draft and a reason is logged.
- The audit trail logs the pipeline step with the pastor's role, decision, and time.
- If no pastor is configured, the record stays draft and an admin is notified.

## Test Scenarios

1. Basic pipeline. Setup: an elder captures a discipline record, pastor approves. Assertion: the record becomes final and appears in the disciplinary log.
2. Pastor rejection. Setup: an elder captures a record, pastor rejects. Assertion: the record stays draft and a rejection reason is logged.
3. No pastor configured. Setup: a church has no pastor role set. Assertion: the record stays draft and an admin notification is generated.
4. Pastor self-approval. Setup: a pastor captures and approves their own record. Assertion: the approval is refused and a conflict is logged.
5. Pipeline disabled. Setup: a church disables the pipeline. Assertion: the captor's role alone finalizes the record and the pipeline step is logged as disabled.

## Jira-Ready Seed

User story: As a church elder, I want every discipline and award record to move through a pipeline to a pastor before it is final, so that one person cannot both raise and confirm a sensitive record.
Technical tasks: build the pipeline routing, model the pastor review and decision, implement the approve/reject flow, and handle the edge cases of no pastor, unavailable pastor, and self-approval.
Depends on: `3.1`, `3.2`, `3.4`, `3.5`, `5.3`, and `6.6`.