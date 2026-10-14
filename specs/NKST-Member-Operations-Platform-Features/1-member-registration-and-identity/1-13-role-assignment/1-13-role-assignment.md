# Sub-Feature: Role Assignment

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `1.13` Role assignment |
| Version | Version one |
| Parent Feature | `1` Member Registration and Identity |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 1`, `REQ-013` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature lets admins assign roles to users. The RBAC rules attached to those roles decide what each user can see and do.

## What the PRD states

> "Admins assign roles to users, and the RBAC rules attached to those roles decide what each user can see and do."

The PRD assigns this requirement `User Target: Web App` and `Priority: High`.

## Why It Exists

The PRD defines an RBAC enabled platform where every action maps to a role. This sub-feature exists because roles are how the church tunes access: members see their own giving, the clerk records entries, the pastor approves, and no one sees disciplinary data unless their role says so.

## Detailed Mechanics

1. An admin opens the role assignment view.
2. The admin selects a user.
3. The admin selects the role for that user in the church context.
4. The system stores the assignment.
5. The system re evaluates permissions on the user's next request.
6. The assigned role decides visibility of profiles, financial dashboards, and disciplinary logs, per the PRD access control matrix.

The flow runs on the web portal. A super admin creates admins, a church admin adds sub admins as department heads, and church admin and church super admin add elders, deacons, members, and pastors, following approval pipelines where set.

## State and Data Impact

Before the flow runs, the user has no role or an old role. After it runs, the user carries the new role, and the next request evaluates permissions against it. The role scopes data access by church and department.

## Interaction With the Rest of the Product

`1.3` and `1.8` feed the user being assigned, `6.6` owns the role and permission model this sub-feature writes to, `6.7` and `6.8` supply church and department scope, and `3.5` uses the role data to gate discipline visibility.

## Edge Cases

1. A role is removed mid session. The next request must re evaluate and strip the access.
2. A role is scoped to a department. The user must only see that department's data.
3. A role assignment requires approval. The assignment must follow the pipeline from `6.5` before it takes effect.
4. A super admin assigns beyond their hierarchy. The assignment must respect church scope.
5. An assignment targets a non baptized member for financial roles. The financial access still requires baptism status, so the role alone cannot bypass `2.2`.

## Error and Gap Handling

An invalid assignment is refused and the user keeps the prior role. An assignment awaiting approval holds until the pipeline completes. A permission failure is logged. A removed role takes effect on the next request, so no stale session keeps old access.

## Accessibility and Trust Notes

Role names must match the church's own titles, such as clerk, elder, lead pastor, and admin, and must be explained in plain language. The assignment screen must make clear what a role can see and do so an admin does not over grant.

## Acceptance Criteria

- An admin assigns a role to a user in a church context.
- The assigned role drives the user's visibility of profiles, finances, and discipline logs.
- A role change takes effect on the next request.
- Department scope limits the access of a department role.
- A pipeline gated assignment waits for approval.

## Test Scenarios

1. Basic assignment. Setup: an admin and a user. Assertion: the user's next request evaluates the new role.
2. Revocation. Setup: an active role then removal. Assertion: the next request loses the old access.
3. Department scope. Setup: a department role. Assertion: the user sees only department data.
4. Pipeline assignment. Setup: an assignment requiring approval. Assertion: the role takes effect only after approval.
5. Non baptized financial role. Setup: assign a financial role to a non baptized member. Assertion: `2.2` still blocks financial access.

## Jira-Ready Seed

User story: As an admin, I want to assign roles to users, so that each person sees and does only what their role allows.
Technical tasks: build the assignment view, store assignments with church and department scope, and re evaluate permissions per request.
Depends on: `1.3`, `1.6`, `2.2`, `3.5`, `6.5`, `6.6`, `6.7`, and `6.8`.