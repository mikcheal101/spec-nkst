# Sub-Feature: Church Directory

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `1.12` Church directory |
| Version | Version one |
| Parent Feature | `1` Member Registration and Identity |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 1`, `REQ-012` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature makes the member registry visible as a directory that members view from the mobile app. Members find one another through the searchable list while their own profile stays private to them.

## What the PRD states

> "Members view the church directory from the mobile app."

The PRD assigns this requirement `User Target: Mobile App` and `Priority: Medium`.

## Why It Exists

The PRD describes a church where members communicate and respond to direct messages. This sub-feature exists so a member can find another member in the directory, which is the natural entry point for communication and fellowship.

## Detailed Mechanics

1. The member opens the directory in the mobile app.
2. The directory loads the member list for the member church.
3. The member searches by name or by baptismal number.
4. The search results render with the searchable profile fields.
5. The member opens a profile and reads directory visibility fields.
6. The directory shows only what directory sharing rules allow, per `6.6`.

The flow runs on the mobile app and never exposes financial or disciplinary data.

## State and Data Impact

Before the flow runs, the directory shows a list of the church members available for directory visibility. After it runs, the member has placed a directory query or opened a profile. The directory reads the member records from `1.8` and applies privacy rules.

## Interaction With the Rest of the Product

`1.8` supplies the profile fields, `1.4` supplies the baptismal number lookup, `6.1` lets a member start a direct message from a directory profile, and `6.6` decides which fields are directory shared.

## Edge Cases

1. A departed member appears in the directory. The directory must respect `1.10` status so departed members do not stay visible.
2. A member searches with no results. The directory must show an empty state without error.
3. A non baptized member opens a profile. Directory access respects role rules; financial data never appears.
4. A member hides their number from the directory. The sharing rule from `6.6` must be honored.
5. Directory loads offline. The local cache in `4.2` must serve the cached list.

## Error and Gap Handling

A failed directory load shows a retry state and, when offline, falls back to the cached list. A search returning nothing shows an empty state. A profile that is not shareable shows only what the rules allow.

## Accessibility and Trust Notes

The directory must be readable on a phone and screen reader friendly. The member's contact data is personal, so the directory shows only the fields the sharing rules allow. The member must be able to understand why some fields are hidden.

## Acceptance Criteria

- A member views the church directory from the mobile app.
- The directory searches by name and by baptismal number.
- Directory fields honor the sharing rules.
- Financial and disciplinary data never appear in the directory.
- Departed members do not stay visible.

## Test Scenarios

1. Directory load. Setup: a member with a populated church. Assertion: the directory lists the searchable members.
2. Search by name. Setup: a stored name. Assertion: the search returns the member.
3. Hidden field. Setup: a member who hides a field. Assertion: the field is absent from other members views.
4. Departed member. Setup: a departed member. Assertion: the departed member is not visible.
5. Offline directory. Setup: no connectivity. Assertion: the cached list from `4.2` loads.

## Jira-Ready Seed

User story: As a member, I want to view the church directory, so that I can find and connect with other members.
Technical tasks: build the directory view, wire name and number search, and enforce the sharing rules.
Depends on: `1.4`, `1.8`, `1.10`, `4.2`, and `6.6`.