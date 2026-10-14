# Sub-Feature: RBAC administration

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `6.6` RBAC administration |
| Version | Version one |
| Parent Feature | `6` Custom Modules and Platform Features |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Custom Modules and Platform Features`, `REQ-075` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature lets admins manage roles and permissions, so a church can tune what each role can do. The access control matrix is the default role breakdown, but each church can adjust the permissions for its own roles, add custom roles, and remove default ones. The changes are stored in the role configuration and applied on every request.

## What the PRD states

> "Admins manage roles and permissions, so a church can tune what each role can do."

The PRD assigns this requirement `User Target: Web App` and `Priority: High`.

## Why It Exists

The PRD describes a church that may need to customize the default role breakdown for its own context (for example, adding a youth pastor role, adjusting financial permissions, or creating a new department). This sub-feature exists so that the church can tune the RBAC model without needing a developer deployment, and the changes are applied end to end on every request.

## Detailed Mechanics

1. The church super admin or church admin opens the role management screen from the web portal.
2. The screen displays the default role breakdown from the access control matrix in `6.6` (the one shown in the PRD, with roles such as regular member, non baptized member, clerk, elder, secretary, lead pastor, admin, finance admin, comms admin, sub admin, church super admin, system admin).
3. The admin can select a role and edit its permissions: check or uncheck the boxes for each permission in the matrix (for example, "view disciplinary logs", "export contributions", "create announcements").
4. The admin can add a custom role: enter a role name, select a parent role (for inheritance of default permissions), and assign the new role's unique permissions.
5. The admin can remove a default role: the role is marked as inactive and is no longer available for assignment, but its permission history is preserved in the audit trail.
6. The admin saves the changes.
7. The role configuration is saved and applied on every subsequent request: the RBAC engine checks the configured permissions for the user's role before allowing any action.
8. The changes are logged in the audit trail in `5.3`, recording who made the change, which roles were edited, which permissions were added or removed, and the time.

The flow runs on the web portal only. The mobile app does not manage roles; the configured permissions are applied server side and are visible on both surfaces.

## State and Data Impact

Before the role configuration change, the permissions are the default from the access control matrix. After the change, the permissions are updated to match the admin's configuration. The role configuration is a persistent setting that survives app restarts and sessions. The audit trail gains entries for each role change.

## Interaction With the Rest of the Product

`6.7` and `6.8` supply church and department scope, so the role management screen shows only the roles for the selected church and department. `5.3` logs every role change in the immutable audit trail. `6.5` (Approval pipelines) may use the role configuration to decide which roles are in the pipeline. `6.1` through `6.5` all check the role configuration on every request to enforce the tuned permissions. `6.6` is the feature itself; it is the access control matrix that is being tuned.

## Edge Cases

1. The admin removes a role that is currently assigned to a user. The user's role is automatically downgraded to the next available role or to a default "regular member" role, and the change is logged.
2. The admin edits a permission that would give a role access to sensitive data. The system must warn the admin and require a confirmation before saving.
3. The admin adds a custom role with permissions that conflict with an existing role. The system must warn the admin and require a confirmation before saving.
4. The role configuration is saved with a syntax error. The system must refuse the save and show the error details, and the previous configuration remains in effect.
5. The admin changes the permissions for the "lead pastor" role. The change takes effect on the next request; the current request still uses the previous permissions.

## Error and Gap Handling

Role currently assigned: the user is downgraded and the change is logged. Permission edit warning: the admin is warned and must confirm. Permission conflict: the admin is warned and must confirm. Syntax error: the save is refused and the previous configuration remains. Permission change takes effect on next request: the current request is not affected.

## Acceptance Criteria

- Church super admin or church admin can open the role management screen.
- The screen displays the default role breakdown from the access control matrix.
- The admin can edit a role's permissions (check/uncheck boxes).
- The admin can add a custom role with a name, parent role, and unique permissions.
- The admin can remove a default role (marked inactive, history preserved).
- The admin saves the changes and they are applied on every subsequent request.
- The changes are logged in the audit trail.
- The admin is warned and must confirm before saving a permission that grants sensitive data access.
- The admin is warned and must confirm before saving a permission conflict.
- A syntax error in the role configuration is refused and the previous configuration remains.
- A permission change takes effect on the next request; the current request is unaffected.

## Test Scenarios

1. Edit role permissions. Setup: an admin edits the "elder" role to add "view financial summaries". Assertion: the elder role now has the new permission and it takes effect on the next request.
2. Add custom role. Setup: an admin adds a "youth pastor" role with parent "elder" and the permission "create announcements". Assertion: the new role appears in the role list and the youth pastor can create announcements.
3. Remove default role. Setup: an admin removes the "finance admin" role. Assertion: the role is marked inactive and is no longer assignable; the audit trail logs the removal.
4. Warning on sensitive permission. Setup: an admin tries to give "regular member" the "export contributions" permission. Assertion: the system warns and requires confirmation before saving.
5. Conflict warning. Setup: an admin tries to give two roles overlapping permissions that conflict. Assertion: the system warns and requires confirmation.
6. Syntax error. Setup: the admin saves a role configuration with invalid JSON. Assertion: the save is refused and the previous configuration remains in effect.

## Jira-Ready Seed

User story: As a church admin, I want to manage roles and permissions, so that I can tune what each role can do for my church's context.
Technical tasks: build the role management screen, model the access control matrix, implement the edit/add/remove role flows, enforce the warning and confirmation for sensitive/conflicting permissions, handle the syntax error case, and log every change in the audit trail.
Depends on: `5.3`, the access control matrix model, the role configuration service, and the RBAC engine that checks permissions per request.