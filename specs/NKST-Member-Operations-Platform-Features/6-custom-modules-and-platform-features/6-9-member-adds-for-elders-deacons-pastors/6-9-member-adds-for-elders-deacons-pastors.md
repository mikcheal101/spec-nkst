# Sub-Feature: Member adds for elders, deacons, pastors

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `6.9` Member adds for elders, deacons, pastors |
| Version | Version one |
| Parent Feature | `6` Custom Modules and Platform Features |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Custom Modules and Platform Features`, `REQ-078` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature lets church admin and church super admin add elders, deacons, members, and pastors, following approval pipelines where set. The admin can add a new user as a specific role (elder, deacon, member, or pastor) within a church context, and the role assignment follows the pipeline rules if one is configured.

## What the PRD states

> "Church admin and church super admin add elders, deacons, members, and pastors, following approval pipelines where set."

The PRD assigns this requirement `User Target: Web App` and `Priority: High`.

## Why It Exists

The PRD describes a church where leadership roles (elders, deacons, pastors) and regular members are assigned through a structured process. This sub-feature exists so that the church can add new role holders with the appropriate permissions, and the pipeline ensures that no single person both assigns and confirms a role, maintaining accountability.

## Detailed Mechanics

1. Church admin or church super admin opens the role addition screen from the web portal.
2. The admin selects the role type to add: elder, deacon, member, or pastor.
3. The admin enters the user's identity: the user's member ID, baptismal number, or the phone number/email if the user is not yet registered. If the user is not registered, the system creates a new member record with the role assignment.
4. The admin selects the church context (for a super admin, the admin can select which sub church the role is for).
5. The admin optionally selects an approval pipeline.
6. If a pipeline is set, the role assignment waits for approval before it takes effect.
7. On approval (or immediately if no pipeline is set), the role is assigned to the user and the user gains the permissions attached to that role within the church context.
8. The role assignment is logged in the audit trail in `5.3`, recording who was assigned the role, who assigned it, the role type, the church context, and the time.

The flow runs on the web portal for role addition. The mobile app does not add roles; the role assignment is visible on both surfaces once it is finalized.

## State and Data Impact

Before the role is assigned, the user has no role (or their existing role). After the role is assigned, the user carries the new role and gains the permissions attached to it within the church context. The user's profile is updated with the role. The audit trail gains an entry for the role assignment.

## Interaction With the Rest of the Product

`6.5` provides the approval pipeline configuration. `6.6` supplies the role configuration and the permissions attached to each role (elder, deacon, member, pastor). `5.3` logs every role assignment in the immutable audit trail. `6.7` and `6.8` supply church and department scope, so the role assignment is scoped to the selected church or sub church. The new role's permissions are checked on every subsequent request by the RBAC engine.

## Edge Cases

1. A pipeline is set but no one is available to approve. The role assignment must remain in pending status and surface the delay to an admin.
2. The user being assigned the role is already in the selected role. The system must refuse the duplicate assignment and log the attempt.
3. The admin assigns a role to a non baptized member for a role that requires baptism (for example, elder). The gate in `6.6` must refuse the assignment and log it, because the default RBAC matrix requires baptization for certain roles.
4. The admin assigns a role to a member who already has a different role. The system may allow the user to hold multiple roles, or it may require the old role to be removed first, configured by role.
5. A super admin assigns a role to a sub church. The role is scoped to the sub church, and the admin's scope for that role is limited to the sub church.

## Error and Gap Handling

No one available to approve: the role assignment stays pending and an admin is notified. Duplicate assignment: the attempt is refused and logged. Non baptized member for baptism-required role: the assignment is refused and logged. Existing role: the system either allows multiple roles or requires removal of the old one, configured by role. Sub church scoping: the role is scoped to the sub church and the admin's scope is limited.

## Acceptance Criteria

- Church admin or church super admin can add a role (elder, deacon, member, pastor) to a user.
- The admin enters the user's identity (member ID, baptismal number, or phone/email) and the church context.
- If a pipeline is set, the role assignment waits for approval before taking effect.
- On approval, the role is assigned and the user gains the role's permissions.
- If no pipeline is set, the role is assigned immediately.
- The role assignment is logged in the audit trail.
- A non baptized member is refused for a role that requires baptism.
- A duplicate role assignment is refused and logged.

## Test Scenarios

1. Add role no pipeline. Setup: an admin adds an elder to a user with no pipeline. Assertion: the elder role is assigned immediately and the user gains the elder's permissions.
2. Add role with pipeline. Setup: an admin adds an elder to a user with a pipeline. Assertion: the role assignment waits for approval and does not take effect until approved.
3. Pipeline approval. Setup: an admin adds an elder with a pipeline, and a pastor approves. Assertion: the elder role is assigned and the user gains the elder's permissions.
4. Pipeline rejection. Setup: an admin adds an elder with a pipeline, and a pastor rejects it. Assertion: the role assignment stays pending and the admin can edit and resubmit or discard.
5. Non baptized member. Setup: an admin tries to add an elder to a non baptized member. Assertion: the assignment is refused and logged.
6. Duplicate role. Setup: an admin tries to add an elder to a user who is already an elder. Assertion: the duplicate assignment is refused and logged.

## Jira-Ready Seed

User story: As a church admin, I want to add elders, deacons, members, and pastors to users, following approval pipelines where set, so that the church can assign role holders with appropriate permissions and accountability.
Technical tasks: build the role addition screen with the role type selector, identity entry, church context selector, and optional pipeline configuration, implement the approve/reject flow, enforce the baptism gate for roles that require it, handle duplicate role assignments, and log every assignment in the audit trail.
Depends on: `6.5`, `6.6`, `5.3`, `6.7`, `6.8`, and the baptism gate from `2.2`.