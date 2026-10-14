# Sub-Feature: Baptismal Number Tracking

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `1.4` Baptismal number tracking |
| Version | Version one |
| Parent Feature | `1` Member Registration and Identity |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 1`, `REQ-004` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature makes the baptismal number the unique member identifier. The system stores it, validates its uniqueness, and uses it as the primary lookup key for a member record.

## What the PRD states

> "The baptismal number is the unique member identifier. The system stores it, validates uniqueness, and uses it as the primary lookup key for a member record."

The PRD assigns this requirement `User Target: Both` and `Priority: High`.

## Why It Exists

The PRD explains that a clerk searches for a member by baptismal number today. This sub-feature exists so that same number becomes a machine enforced unique key, which makes lookup fast and prevents two members from silently sharing an identity.

## Detailed Mechanics

1. The registration form collects the baptismal number for baptized members.
2. The system checks the submitted number against existing member records.
3. When the number is unique, the system stores it on the member record.
4. When the number already exists, the system flags the case for review in `1.5` and stores nothing.
5. The system exposes the number as the primary lookup key for member search.
6. Member search by number returns the matching record quickly, per the PRD lookup target.

The flow does not run for non baptized members, because no number is collected in that branch.

## State and Data Impact

Before the flow runs, no number is bound to the member. After it runs, the number is stored on the member record and is unique across the registry. The number becomes the key used by directory lookups, discipline records, giving records, and digitizing.

## Interaction With the Rest of the Product

`1.3` supplies the baptized value that decides whether a number is required, `1.5` consumes the duplicate result, and `1.12` exposes search by number. Giving and discipline records reference the member through this key. The digitizing flow in `5.5` must respect the same uniqueness rule.

## Edge Cases

1. Two members with the same number. The second must be flagged, never created.
2. A number entered with formatting differences. The stored value must be normalized so the lookup finds the record regardless of formatting.
3. A non baptized member with no number. The record must be allowed without one.
4. A search that matches no number. The search must return no results without error.
5. A historical record whose number is unknown. `5.5` must surface the gap rather than invent a number.

## Error and Gap Handling

A duplicate number produces a review case and a clear message. A refused case keeps the entered values so the reviewer can act. A search with no match returns an empty result. A missing number on a baptized record refuses submission and names the field.

## Accessibility and Trust Notes

The number field must be labeled and read aloud. The screen must explain why the number matters and that it is unique to the member. Duplicate warnings must be worded so the reviewer understands no record was created.

## Acceptance Criteria

- A baptized member stores a unique baptismal number on the member record.
- A second member cannot take an existing number.
- The number is a primary lookup key and finds the record in normal registry search.
- A non baptized member needs no number.
- A duplicate produces a review case and creates nothing.

## Test Scenarios

1. Unique number stored. Setup: a new baptismal number. Assertion: the member record stores it.
2. Duplicate number refused. Setup: an existing number. Assertion: a review case is created and no record is created.
3. Lookup by number. Setup: a stored number. Assertion: search by that number returns the member.
4. Normalized format. Setup: a number with different formatting. Assertion: lookup still finds the record.
5. Non baptized without number. Setup: a non baptized member. Assertion: the record saves without a number.

## Jira-Ready Seed

User story: As the system, I want the baptismal number to be unique and searchable, so that each member has one identity.
Technical tasks: add the number field with uniqueness enforcement, add normalization on save, and index the number as a lookup key.
Depends on: `1.3`, `1.5`, and `1.12`.