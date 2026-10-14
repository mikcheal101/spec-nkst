# Sub-Feature: Approval pipelines

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `6.5` Approval pipelines |
| Version | Version one |
| Parent Feature | `6` Custom Modules and Platform Features |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Custom Modules and Platform Features`, `REQ-074` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature implements configurable approval pipelines, so that sensitive and user flagged actions follow a configurable approval pipeline, and the action is not final until the pipeline completes. Different action types (for example, discipline, award, announcement, event) can have different pipelines configured, and the pipeline steps are defined by the church's RBAC roles.

## What the PRD states

> "Sensitive and user flagged actions follow a configurable approval pipeline, and the action is not final until the pipeline completes."

The PRD assigns this requirement `User Target: Both` and `Priority: High`.

## Why It Exists

The PRD defines the RBAC and accountability guarantee: no sensitive action takes effect without review by the configured pipeline. This sub-feature exists so that the church can tune what actions require review, which roles are in the pipeline, and what happens when the pipeline completes or is bypassed. The pipeline is the mechanism that implements the "one person cannot both raise and confirm it" guarantee described in the access control matrix `6.6`.

## Detailed Mechanics

1. The church super admin or church admin opens the pipeline configuration screen from the web portal.
2. The admin selects an action type: for example, discipline, award, announcement, event, or contribution request.
3. The admin adds one or more pipeline steps, each assigning the step to a specific role.
4. A typical pipeline step routes the action to the role's inbox, where the role reviews the action and makes a decision: approve, reject, or return for revision.
5. The pipeline proceeds step by step; the action is not final until the last step is completed and the action is approved.
6. If any step rejects or returns for revision, the action is halted and returns to the captor (the user who started the action) with a reason.
7. On approval of the final step, the action is marked final and proceeds to its own flow (for example, a discipline record becomes final and is written to the log, an announcement publishes).
8. The pipeline is configurable per church; some churches may have no pipeline for certain action types, in which case the captor's role alone finalizes the action, and the pipeline configuration records this as "disabled".
9. Every pipeline step is logged in the audit trail in `5.3`, recording the action, the role, the decision, and the time.

The flow runs on the web portal for pipeline configuration and action processing. The mobile app does not configure pipelines, but actions that require a pipeline are gated by the pipeline status.

## State and Data Impact

Before the pipeline runs, the action is in draft or pending status. After the pipeline completes, the action is final and proceeds to its own flow. The audit trail gains entries for each pipeline step. The action's final status is stored on the record (for example, discipline finalized, announcement published).

## Interaction With the Rest of the Product

`6.1`, `6.2`, `6.3`, `6.4` produce the actions that may enter a pipeline. `3.3` is the dual approval workflow for discipline and awards, which is a specific pipeline configuration. `6.6` gates who can configure pipelines and who is in pipelines; the default allows church super admin and church admin. `5.3` logs every pipeline step. `6.7` and `6.8` supply church and department scope, so the pipeline only involves roles from the same church and department. The action's final status feeds the specific feature flows (for example, `3.1` discipline capture, `6.2` announcements).

## Edge Cases

1. No pipeline configured for an action type. The action is finalized by the captor's role, and the pipeline configuration records this as "disabled".
2. A role in the pipeline is unavailable (on leave, removed from role). The pipeline must hold the action in pending status and surface the delay to an admin.
3. A role in the pipeline recuses themselves. The pipeline must have a substitute role configured, or the action is halted and an admin is notified.
4. The same action type has different pipelines for different churches. Each church's configuration is independent; the pipeline only involves roles from that church and department.
5. A pipeline step times out. The system must surface the timeout to an admin and offer a retry or a substitute role.
6. An action is submitted while a pipeline is already in progress for the same action type. The system must queue the new action and process pipelines in the order they were submitted.

## Error and Gap Handling

No pipeline configured: the action is finalized by the captor and the pipeline is recorded as disabled. Role unavailable: the action stays pending and an admin is notified. Role recusal: the action is halted and an admin is notified unless a substitute is configured. Pipeline timeout: the admin is notified and offered a retry or substitute. Queued actions: the new action is processed after the current one completes.

## Acceptance Criteria

- The church super admin or church admin can configure pipelines for action types: discipline, award, announcement, event, contribution request.
- A pipeline assigns the action to specific roles in a step by step sequence.
- The action is not final until the last pipeline step is completed and the action is approved.
- If any step rejects or returns for revision, the action is halted and returns to the captor with a reason.
- On final approval, the action proceeds to its own flow (discipline written to log, announcement publishes, etc.).
- If no pipeline is configured for an action type, the captor's role alone finalizes the action and the configuration records this as "disabled".
- Every pipeline step is logged in the audit trail.

## Test Scenarios

1. Configure pipeline. Setup: a church admin configures a discipline pipeline with two steps: elder then pastor. Assertion: the discipline pipeline is saved and discipline records will follow this pipeline.
2. Pipeline halts on reject. Setup: a discipline record enters the pipeline and the pastor rejects. Assertion: the record returns to the elder with a rejection reason and is not finalized.
3. No pipeline configured. Setup: a church has no pipeline for contribution requests. Assertion: a contribution request is finalized by the captor's role and the pipeline is recorded as disabled.
4. Role unavailable. Setup: a pipeline step assigns a role that has been removed. Assertion: the action stays pending and an admin is notified.
5. Pipeline timeout. Setup: a pipeline step times out without a decision. Assertion: the admin is notified and offered a retry or substitute role.
6. Action final approval. Setup: a discipline record enters the pipeline and all steps approve. Assertion: the record becomes final and is written to the disciplinary log.

## Jira-Ready Seed

User story: As a church admin, I want to configure approval pipelines for sensitive actions, so that the action is not final until the pipeline completes and the church can control who reviews and decides each action.
Technical tasks: build the pipeline configuration screen, model the pipeline steps and roles, implement the step by step approval flow, handle the edge cases of no pipeline, role unavailable, recusal, and timeout, and log every step in the audit trail.
Depends on: `6.6`, `5.3`, `6.7`, `6.8`, and the action type configuration (discipline, award, announcement, event, contribution request).