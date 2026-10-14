# Sub-Feature: Member Profile Fields

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `1.8` Member profile fields |
| Version | Version one |
| Parent Feature | `1` Member Registration and Identity |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 1`, `REQ-008` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature defines the member profile fields. The profile covers identity, contact, and church belonging, and the fields make a member record complete and searchable.

## What the PRD states

> "The profile covers identity, contact, and church belonging so a member record is complete and searchable."

The PRD assigns this requirement `User Target: Both` and `Priority: High`.

## Why It Exists

The PRD moves the hard cover note into a searchable registry. This sub-feature exists because search and reporting only work when the record holds the right fields: identity, ways to contact, and the church the member belongs to.

## Detailed Mechanics

1. The registration form collects the identity fields.
2. The registration form collects the contact fields.
3. The registration form collects the church belonging field.
4. The profile stores these fields on the member record.
5. The stored fields make the record searchable and complete.
6. The same fields render on the mobile app for the member and on the web portal for authorized roles.

The flow runs at registration and later when an authorized role updates the profile. The fields must be present for the record to be considered complete.

## State and Data Impact

Before the flow runs, no profile exists for the member. After it runs, the member record carries identity, contact, and church belonging values. Directory, discipline, giving, and export features read these fields.

## Interaction With the Rest of the Product

`1.1` and `1.2` collect the fields, `1.9` supplies the church belonging value, `1.12` renders the profile in the directory, `2.8` and `2.9` use profile data in giving drill down and export, and `5.5` fills these fields during digitizing.

## Edge Cases

1. A required field is empty. The form must refuse and name the field.
2. Contact details change. An authorized role must be able to update the profile.
3. The profile is missing data entered historically. `5.5` must surface the gaps.
4. A member updates their own profile. The member can see their own profile, and edit rights follow the role rules in `1.13`.

## Error and Gap Handling

A submit with a missing required field fails and names the field while keeping the entered values. A profile update that would empty a required field is refused. Historical gaps go to the digitizing flow rather than being guessed.

## Accessibility and Trust Notes

The profile form must label every field and support a screen reader. Contact data is personal, so the profile is only visible to the member and to authorized roles. The form must avoid jargon so a low literacy clerk reads it easily.

## Acceptance Criteria

- The profile captures identity, contact, and church belonging.
- A member record is complete and searchable from the profile fields.
- A missing required field refuses submission.
- Authorized roles can update the profile.
- The member can view their own profile.

## Test Scenarios

1. Complete profile created. Setup: a full registration. Assertion: the profile carries identity, contact, and church belonging.
2. Missing field. Setup: empty contact. Assertion: submission is refused and the field is named.
3. Profile update. Setup: a changed phone number. Assertion: the record stores the new value.
4. Search by profile. Setup: a stored name. Assertion: registry search finds the member.
5. Profile visibility. Setup: a member and an authorized role. Assertion: the member sees their own profile and the role sees it within their scope.

## Jira-Ready Seed

User story: As the system, I want a complete profile for every member, so that the registry is searchable and usable by every other feature.
Technical tasks: define the identity, contact, and church fields, enforce required fields, and render the profile on both surfaces.
Depends on: `1.1`, `1.2`, `1.9`, `1.12`, `1.13`, and `5.5`.