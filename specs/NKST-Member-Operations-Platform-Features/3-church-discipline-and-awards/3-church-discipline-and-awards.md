# Feature: Church Discipline and Awards

## Header Block

| Field | Value |
|---|---|
| Feature ID | `3` |
| Feature Name | Module 3: Church Discipline and Awards |
| Version | Version one |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 3` |
| Author | Hirekaan Micheal Hemen |

## Overview

Church Discipline and Awards turns the handwritten punishment and award entries in the hard cover note into structured records with an approval pipeline. Authorized roles record discipline or award events against a member, a clerk or recorder raises the record, a pastor approves it, and only an authorized role clears or reverses a discipline record. Sensitive records stay visible only to granted roles and are encrypted at rest, and governance reporting covers the activity for the lead pastor and admins.

## What the PRD states

> ### Module 3: Church Discipline and Awards
>
> | Requirement ID | Feature / Module Name | Requirement Description | User Target | Priority |
> |---|---|---|---|---|
> | REQ-040 | Disciplinary record capture | Authorized roles record a church discipline or punishment event against a member, with date, reason, and the recording role. | Web App | High |
> | REQ-041 | Award record capture | Authorized roles record a church award against a member, with date, reason, and the recording role. | Web App | High |
> | REQ-042 | Dual approval workflow | A disciplinary or award record moves through a pipeline between the clerk or recorder and a pastor before it is considered final, so one person cannot both raise and confirm it. | Web App | High |
> | REQ-043 | Clear or reverse a record | Only roles granted the authority can clear or reverse a disciplinary record, and the clear action is itself logged. | Web App | High |
> | REQ-044 | Sensitive record visibility | Disciplinary logs are visible only to roles granted that permission, and they are encrypted at rest. | Web App | High |
> | REQ-045 | Governance reporting | The system produces governance reports covering discipline and awards activity for the lead pastor and admins. | Web App | Medium |

## Why It Exists

The PRD treats discipline and awards as governance data that must be trustworthy. A record captures who acted, on what date, for what reason, and every step must leave an audit mark. The feature exists so a single person cannot raise and confirm their own record, sensitive disciplinary history is protected, and leadership sees a governance report instead of digging through the book.

## How It Works End to End

The flow starts on the web portal. An authorized role opens the discipline or award screen for a member and enters the date, the reason, and the recording role. The record is saved as `draft`. Because an approval pipeline is configured, the record enters the pipeline between the clerk or recorder and the pastor and moves to `pending approval`. The pastor reviews and approves or rejects. On approval, the record becomes `approved` and is written to the disciplinary log. Only a role granted the authority can later clear or reverse the record, which moves it to `cleared` and logs the actor and a reason. Every action in this flow writes an event that lands in the immutable audit trail from `5-paper-backup-and-activity-logs`. Sensitive records are visible only to roles granted that permission and are encrypted at rest. The lead pastor and admins read governance reports covering this activity.

## Inputs It Consumes

The feature consumes the target member from `1-member-registration-and-identity`, the role assignments that decide who may record, approve, and clear, the approval pipeline definitions from `6-custom-modules-and-platform-features`, and the date, reason, and recording role entered by the actor.

## Outputs It Produces

The feature produces the discipline and award records, their status history, the disciplinary log, the cleared state with its logged reason, the governance report, and audit events for every transition. The audit events feed `5-paper-backup-and-activity-logs`, and the records stay tied to the member from `1-member-registration-and-identity`.

## User Journey Summary

Journey D in the PRD (`A clerk raises a disciplinary record and a pastor approves it`) walks the flow. The clerk opens the discipline screen, creates a record against a member with the date and reason, and the record is saved as a draft rather than final. The record enters the approval pipeline and routes to the pastor role. The pastor reviews and approves or rejects. On approval the record becomes final and is written to the disciplinary log. A later clear is logged with the acting role and a reason, and every step lands in the immutable audit trail.

## Sub-Feature Index

| Sub-Feature ID | Name | Description | Folder |
|---|---|---|---|
| `3.1` | Disciplinary record capture | Authorized roles record a discipline or punishment event with date, reason, and role. | `3-1-disciplinary-record-capture/3-1-disciplinary-record-capture.md` |
| `3.2` | Award record capture | Authorized roles record an award with date, reason, and role. | `3-2-award-record-capture/3-2-award-record-capture.md` |
| `3.3` | Dual approval workflow | A record moves between the recorder and a pastor so one person cannot confirm their own work. | `3-3-dual-approval-workflow/3-3-dual-approval-workflow.md` |
| `3.4` | Clear or reverse a record | Granted roles clear or reverse a discipline record, and the action is logged. | `3-4-clear-or-reverse-a-record/3-4-clear-or-reverse-a-record.md` |
| `3.5` | Sensitive record visibility | Disciplinary logs are limited to granted roles and encrypted at rest. | `3-5-sensitive-record-visibility/3-5-sensitive-record-visibility.md` |
| `3.6` | Governance reporting | Governance reports cover discipline and awards for the lead pastor and admins. | `3-6-governance-reporting/3-6-governance-reporting.md` |

## Feature-Level Acceptance Criteria

- An authorized role records a discipline event against a member with date, reason, and the recording role.
- An authorized role records an award event against a member with date, reason, and the recording role.
- A record raised by a clerk or recorder cannot be confirmed by the same person and waits for a pastor.
- A record moves to approved only after the pastor approves, and to rejected after the pastor rejects.
- Only a role granted the authority clears or reverses a discipline record, and the clear action is logged.
- Discipline logs are visible only to roles granted that permission and are encrypted at rest.
- The lead pastor and admins can generate a governance report covering discipline and awards activity.

## Edge Cases and Risks

- The recorder is also the only configured pastor. The pipeline must surface a missing approver instead of letting the same person confirm their own record.
- A record is cleared and then the reason for clearing is disputed. The clear action and its reason must be retrievable in the audit trail.
- A non granted role opens a discipline log. The system must deny access before any record content is returned.
- A pastor rejects a record that was already approved. The system must reject the action as conflicting state rather than corrupt the status.
- A member record is deleted. Discipline and award history must not silently vanish with it, because the audit trail is the record of what happened.

## Dependencies

This feature depends on `1-member-registration-and-identity` for the target member, on `6-custom-modules-and-platform-features` for role assignments and approval pipeline definitions, and on `5-paper-backup-and-activity-logs` for the immutable audit trail. Nothing else in the tree feeds on discipline and award records except governance reporting.

## Measurable Outcomes

The PRD ties the sensitive data outcome to this feature. From PRD `Section 6`: "100 percent of sensitive records encrypted and protected in line with NDPR/NDPA." No other metric is stated for this feature.

## Jira Preparation

Candidate user stories and task titles this feature will produce:
- As a clerk, I want to raise a discipline record as a draft, so that it waits for pastoral approval.
- As a pastor, I want to approve or reject a discipline or award record, so that only confirmed records reach the log.
- As an authorized role, I want to clear a discipline record with a reason, so that the resolution is documented.
- Technical task: model the discipline and award records and their status transitions.
- Technical task: enforce that a recorder cannot confirm their own record.
- Technical task: encrypt discipline reason fields at rest.