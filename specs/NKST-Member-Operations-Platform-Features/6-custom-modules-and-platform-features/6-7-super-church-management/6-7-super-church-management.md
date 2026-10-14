# Sub-Feature: Super church management

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `6.7` Super church management |
| Version | Version one |
| Parent Feature | `6` Custom Modules and Platform Features |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Custom Modules and Platform Features`, `REQ-076` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature lets a super admin create church admins, and for a super church, creates sub churches plus the super admins for those churches. The super church hierarchy model lets a large church organize into assemblies, with each assembly having its own leadership while remaining under the parent super church.

## What the PRD states

> "A super admin creates church admins, and for a super church creates sub churches plus the super admins for those churches."

The PRD assigns this requirement `User Target: Web App` and `Priority: High`.

## Why It Exists

The PRD describes a church that grows beyond a single assembly and needs a hierarchy that supports sub assemblies, state level, and synod or national level. This sub-feature exists so that the super admin can organize the church into a manageable hierarchy without losing the RBAC and audit trail integrity.

## Detailed Mechanics

1. The church super admin opens the church management screen from the web portal.
2. The admin selects "Create sub church" and enters the sub church name, location, and description.
3. The system creates the sub church and assigns a new super admin account for it. The super admin can be an existing user promoted to the sub church super admin role, or a new user account created for the role.
4. The sub church appears under the parent church in the hierarchy, and the new super admin can create admins and members within it.
5. The super admin for the sub church has the same permission model as the parent church super admin, but scoped to the sub church: they can create admins, members, elders, deacons, and pastors within their sub church, and they can view reports for their sub church only.
6. The parent church super admin can view reports across all sub churches and manage the overall hierarchy.
7. The RBAC model applies per church: roles and permissions are configured independently for each church in the hierarchy, but the super admin at each level has the highest authority within their scope.
8. Every hierarchy change (sub church creation, super admin assignment) is logged in the audit trail in `5.3`, recording what was changed, who changed it, and when.

The flow runs on the web portal only. The mobile app does not manage hierarchy; the super admin views the hierarchy and manages it from the web portal.

## State and Data Impact

Before the sub church is created, the hierarchy has only the parent church. After the sub church is created, the hierarchy has a parent and a child, with the new super admin assigned. The member and role counts under the sub church start at zero and grow as the super admin creates them. The audit trail gains entries for the hierarchy changes.

## Interaction With the Rest of the Product

`6.6` supplies the role configuration that the new super admin and sub church admins inherit. `5.3` logs every hierarchy change in the immutable audit trail. `6.7` is the feature itself; it is the super church management flow. `6.8` supplies department scope for the new admins and members created within the sub church. The RBAC model in `6.6` is inherited but scoped to the sub church.

## Edge Cases

1. The super admin tries to create a sub church with a name that already exists under a different sub church. The system must refuse the creation and log the conflict.
2. The super admin assigns an existing user as the sub church super admin. The user's role is scoped to the new sub church; their permissions for the parent church remain unchanged.
3. The parent church super admin deletes a sub church. The system must refuse the deletion and log the attempt; a sub church can only be archived, not deleted, and the members and roles within it must be reassigned or transferred first.
4. A sub church super admin tries to create another sub church. The system must allow it, creating a second level of hierarchy (sub sub church), but the RBAC model must ensure that the new super admin's scope is limited to their immediate parent church.
5. The hierarchy becomes very deep (many levels). The system must still perform well for role checks and report queries; if the depth exceeds a configurable limit, the admin is warned.

## Error and Gap Handling

Name conflict: the creation is refused and the conflict is logged. User role scoping: the user's parent church permissions are preserved. Deletion refusal: the system refuses and logs the attempt; the admin must archive or re assign. Hierarchy depth warning: the admin is warned if the depth exceeds the limit.

## Acceptance Criteria

- Church super admin can create a sub church from the web portal.
- The admin enters the sub church name, location, and description.
- The system assigns a new super admin account for the sub church.
- The sub church appears under the parent church in the hierarchy.
- The new super admin can create admins and members within their sub church.
- The parent super admin can view reports across all sub churches.
- A sub church name conflict is refused and logged.
- A user assigned as sub church super admin keeps their parent church role permissions.
- Deleting a sub church is refused; the system requires archival or re assignment first.

## Test Scenarios

1. Create sub church. Setup: a super admin creates a sub church named "Lagos West". Assertion: the sub church appears under the parent church and a new super admin account is assigned.
2. Super admin scoping. Setup: the new sub church super admin views the hierarchy. Assertion: the super admin's scope is limited to the sub church.
3. Name conflict. Setup: a super admin tries to create a sub church with a name already used under another sub church. Assertion: the creation is refused and the conflict is logged.
4. User role scoping. Setup: an existing user is promoted to sub church super admin. Assertion: the user's parent church permissions remain unchanged.
5. Deletion refusal. Setup: a super admin tries to delete a sub church. Assertion: the deletion is refused and the system requires archival or re assignment first.

## Jira-Ready Seed

User story: As a church super admin, I want to create sub churches and assign super admins for them, so that the church can organize into assemblies at state and national level.
Technical tasks: build the sub church creation screen, model the hierarchy with parent and child churches, assign the new super admin account, implement the scope scoping for roles and reports, and handle the edge cases of name conflict, user role scoping, and deletion refusal.
Depends on: `6.6` (role configuration), `5.3` (audit trail), `6.8` (department scope), and the church hierarchy model.