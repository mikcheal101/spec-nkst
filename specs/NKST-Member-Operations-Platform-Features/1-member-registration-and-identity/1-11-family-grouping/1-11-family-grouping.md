# Sub-Feature: Family Grouping

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `1.11` Family grouping |
| Version | Version one |
| Parent Feature | `1` Member Registration and Identity |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 1`, `REQ-011` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature links members as a family, such as a husband, wife, and children, so the registry supports family based reporting.

## What the PRD states

> "Members can be linked as a family (for example husband, wife, children) for family based reporting."

The PRD assigns this requirement `User Target: Web App` and `Priority: Medium`.

## Why It Exists

The church thinks about members in family units, not only as individuals. This sub-feature exists so reports can group a household, and so leadership can see a family's membership picture instead of isolated records.

## Detailed Mechanics

1. An authorized role opens a member profile.
2. The role links the member to a family group.
3. The role assigns the relationship within the family, such as husband, wife, or child.
4. The system stores the link between the member and the family.
5. The system renders the linked family.
6. Reporting features can group by family.

The flow runs on the web portal and reuses the member records created by `1.1` and `1.2`.

## State and Data Impact

Before the flow runs, the member has no family link. After it runs, the member belongs to a family group with a relationship value. The family data is stored alongside the member record and is available to reporting and directory views.

## Interaction With the Rest of the Product

`1.8` holds the profile being linked, `1.12` can render family units in the directory, and reporting in `2.10` and beyond can group by family. Membership status in `1.10` still applies per member inside the group.

## Edge Cases

1. A member is linked to two families. The system must enforce one family home per member to keep reporting clean.
2. A child is linked as a parent. The relationship value must match the allowed set.
3. A family member leaves the church. The schedule of the family group must survive the status change without deleting the household.
4. Two families split. The system must let a member move from one family to another with the change logged.
5. Historical migration. `5.5` must allow family links to be entered during digitizing.

## Error and Gap Handling

A conflicting family link is refused with an explanation. An unsupported relationship value is refused. A family move is logged so the history is recoverable.

## Accessibility and Trust Notes

Family labels must use the plain relationship words the church uses. The web portal must render the family clearly so a clerk can verify the links. Family data is personal and follows the role rules in `6.6`.

## Acceptance Criteria

- An authorized role links a member to a family with a relationship value.
- A member belongs to one family home.
- A family renders as a group.
- Reporting can group by family.
- A family move is logged.

## Test Scenarios

1. Family link. Setup: a member and a family. Assertion: the member stores the family link and relationship.
2. One family home. Setup: a member already linked. Assertion: a second link is refused.
3. Family render. Setup: a linked family. Assertion: the group renders together.
4. Family move. Setup: a member moving families. Assertion: the move is logged.
5. Digitizing links. Setup: a historical family. Assertion: `5.5` can enter the link with a source tag.

## Jira-Ready Seed

User story: As an authorized role, I want to group members into families, so that reporting reflects the household picture.
Technical tasks: model the family group and relationship, enforce one family home, and render the family group.
Depends on: `1.8`, `1.12`, and `5.5`.