# Sub-Feature: Department management

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `6.8` Department management |
| Version | Version one |
| Parent Feature | `6` Custom Modules and Platform Features |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Custom Modules and Platform Features`, `REQ-077` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature lets a church admin add sub admins as department heads, and a sub admin manages their department. The department model lets a church organize its leadership and members into functional units (for example, worship, youth, finance, facilities) with their own admins and members.

## What the PRD states

> "A church admin adds sub admins as department heads, and a sub admin manages their department."

The PRD assigns this requirement `User Target: Web App` and `Priority: Medium`.

## Why It Exists

The PRD describes a church that needs to organize its leadership and members into functional departments. This sub-feature exists so that the church admin can create departments and assign department heads, and the department head can manage members and content within their department, with the RBAC permissions scoped to the department.

## Detailed Mechanics

1. The church admin opens the department management screen from the web portal.
2. The admin selects "Add department" and enters the department name, description, and the member who will be the department head (or the admin can designate the role later).
3. The system creates the department and assigns the sub admin role to the designated member, with permissions scoped to the department only.
4. The sub admin can view the members in their department, add or remove members from the department, and manage content (for example, announcements, events, media) that is scoped to the department.
5. The church admin can view all departments and their members, and can edit or remove departments.
6. The RBAC permissions for the sub admin are scoped to the department: the sub admin can only see and act on data that belongs to their department, and cannot access data from other departments unless explicitly granted.
7. Every department creation, member assignment, and permission change is logged in the audit trail in `5.3`, recording what was changed, who changed it, and when.

The flow runs on the web portal for management. The mobile app does not manage departments; the sub admin views their department content from the mobile app, but management is web portal only.

## State and Data Impact

Before the department is created, the church has no departments. After the department is created, the church has a new department with a sub admin and zero members. The member count grows as the sub admin adds members. The audit trail gains entries for each department change.

## Interaction With the Rest of the Product

`6.6` supplies the role configuration that the sub admin inherits (the sub admin role with department-scoped permissions). `5.3` logs every department change in the immutable audit trail. `6.7` is independent; it manages the super church hierarchy, which is a separate model from departments. `6.8` is the feature itself; it is the department management flow. `6.7` and `6.8` are independent but both use the RBAC model from `6.6`. The sub admin's mobile app view of their department content queries the RBAC engine with the department scope.

## Edge Cases

1. The admin adds a department with a name that already exists. The system must refuse the creation and log the conflict.
2. The sub admin is reassigned to a different department. The sub admin's permissions are updated to the new department, and the old department's member count is decremented. The change is logged.
3. The admin removes a department. The system must refuse the removal if the department still has members; the admin must re assign or remove all members first, and the change is logged.
4. A sub admin tries to access another department's content. The RBAC engine must refuse the access and log the attempt.
5. A department is given a name that conflicts with a super church hierarchy level. The system must allow it; departments and super churches are independent models, but the admin is warned if the name is identical to a top level in the hierarchy.

## Error and Gap Handling

Department name conflict: the creation is refused and logged. Sub admin reassignment: the permissions are updated to the new department and the old department is decremented; the change is logged. Admin removal refusal: the system refuses if members exist and logs the attempt; the admin must re assign or remove members first. Cross department access: the RBAC engine refuses and logs the attempt.

## Acceptance Criteria

- Church admin can add a department from the web portal.
- The admin enters the department name and description, and designates the department head.
- The system creates the department and assigns the sub admin role with department-scoped permissions.
- The sub admin can view members in their department, add or remove members, and manage department-scoped content.
- The church admin can view all departments and their members, and edit or remove departments.
- A department name conflict is refused and logged.
- The admin cannot remove a department that still has members; all members must be re assigned or removed first.
- A sub admin cannot access another department's content; the RBAC engine refuses and logs the attempt.

## Test Scenarios

1. Add department. Setup: a church admin adds a department named "Worship" and designates member X as department head. Assertion: the department is created and member X is assigned as sub admin with department-scoped permissions.
2. Sub admin manages department. Setup: the sub admin views their department members and adds a new member. Assertion: the new member is added to the department and the member count increases.
3. Remove department with members. Setup: an admin tries to remove the "Worship" department that has 5 members. Assertion: the removal is refused and the admin is required to re assign or remove all members first.
4. Cross department access. Setup: a sub admin from the "Worship" department tries to view the "Finance" department's content. Assertion: the access is refused and logged.
5. Department name conflict. Setup: an admin tries to add a department named "Worship" when one already exists. Assertion: the creation is refused and the conflict is logged.

## Jira-Ready Seed

User story: As a church admin, I want to add sub admins as department heads and manage departments, so that the church can organize its leadership and members into functional units.
Technical tasks: build the department management screen, model the department with scoped RBAC permissions, implement the add department flow, handle the edge cases of name conflict, member reassignment, removal refusal, and cross department access, and log every change in the audit trail.
Depends on: `6.6` (role configuration with department scope), `5.3` (audit trail), and the RBAC engine that checks department scoped permissions per request.