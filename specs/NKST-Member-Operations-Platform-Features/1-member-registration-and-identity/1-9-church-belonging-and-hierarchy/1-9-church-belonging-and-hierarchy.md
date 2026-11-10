# Sub-Feature: Church Belonging and Hierarchy

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `1.9` Church belonging and hierarchy |
| Version | Version one |
| Parent Feature | `1` Member Registration and Identity |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 1`, `REQ-009` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature assigns every member to a church and models the church hierarchy. A member belongs to a church, and for a super church the sub church and its super admins can be created and managed.

## What the PRD states

> "A member belongs to a church, and for a super church the sub church and its super admins can be created and managed."

The PRD assigns this requirement `User Target: Web App` and `Priority: High`.

## Why It Exists

The PRD describes a growth path from the main Lagos assembly to sub assemblies, to state level, and to synod and national level. This sub-feature exists so the church tree can grow without changing the member model, and so a super admin can stand up a sub church with its own super admins.

## Detailed Mechanics

1. A church entity exists for every assembly.
2. A member record stores the church the member belongs to.
3. A super church can contain sub churches.
4. A super admin creates a sub church under the super church.
5. The super admin creates the super admin account for that sub church.
6. The sub church appears under the parent and its super admin can create admins and members within it.
7. The hierarchy governs scope for roles as described in `6.6`.

The flow runs on the web portal and never on the mobile app, per the PRD user target.

## State and Data Impact

Before a super church action runs, no sub church exists under the parent. After it runs, a sub church record exists, its super admin account exists, and both appear in the hierarchy for scope checks.

## Interaction With the Rest of the Product

`1.9` supplies the church list consumed by `1.1` and `1.2`. `6.7` owns the super church management action in full. `6.6` scopes roles by church. The giving feature scopes fee rules per church through `2.5`.

## Edge Cases

1. A sub church name already exists under the parent. The creation must be refused.
2. A super admin without super church rights tries to create a sub church. The action must be refused and logged.
3. A member is assigned to a parent instead of a sub church. The assignment must follow the church tree rules.
4. A sub church is created offline. Creation must wait for a live connection because hierarchy changes must be authoritative.
5. A sub church needs its super admin created before it can operate. The two creations must complete together so the new sub church is not orphaned.

## Error and Gap Handling

A duplicate sub church is refused with a clear message. A permission failure denies the action and logs it. A partial creation where the sub church exists but its super admin does not is treated as an error and raised for completion rather than left half built.

## Accessibility and Trust Notes

The church management screen must use the church names the church itself uses, without introducing confusing codes. The screen must be usable by a super admin on the web portal and must never hide the church a member belongs to.

## Acceptance Criteria

- Every member record carries the church the member belongs to.
- A super church can contain sub churches.
- A super admin creates a sub church and its super admins.
- A new sub church super admin can create admins and members within it.
- A duplicate sub church is refused.

## Test Scenarios

1. Member church assignment. Setup: a member and a church. Assertion: the member record stores the church.
2. Sub church creation. Setup: a super admin. Assertion: the sub church appears under the parent.
3. Super admin creation. Setup: a new sub church. Assertion: the sub church gets a super admin who can create admins and members.
4. Duplicate sub church. Setup: an existing name. Assertion: creation is refused.
5. Permission denied. Setup: an admin without super church rights. Assertion: creation is refused and logged.

## Jira-Ready Seed

User story: As a super admin, I want to create a sub church with its own super admins, so that the hierarchy reflects the real church structure.
Technical tasks: model the church tree, build the sub church creation, and bind the sub church super admin creation.
Depends on: `1.1`, `1.2`, `6.6`, and `6.7`.