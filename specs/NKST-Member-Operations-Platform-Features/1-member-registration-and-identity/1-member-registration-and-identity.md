# Feature: Member Registration and Identity

## Header Block

| Field | Value |
|---|---|
| Feature ID | `1` |
| Feature Name | Module 1: Member Registration and Identity |
| Version | Version one |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 1` |
| Author | Hirekaan Micheal Hemen |

## Overview

Member Registration and Identity is the digital replacement for the hard cover note entry that a clerk used to write by hand. A member registers themselves on the mobile app or a clerk registers them on the web portal, the system verifies the account, captures baptism status and the baptismal number, and the member becomes part of the searchable registry. Downstream financial access depends on the `baptized` status captured here.

## What the PRD states

> ### Module 1: Member Registration and Identity
>
> | Requirement ID | Feature / Module Name | Requirement Description | User Target | Priority |
> |---|---|---|---|---|
> | REQ-001 | Member registration (member self serve) | A member registers from the mobile app with a username (phone number or card number) and password, and picks their church, defaulting to the Lagos churches loaded from the database. | Mobile App | High |
> | REQ-002 | Member registration (assisted, web) | A clerk or admin registers a member from the web portal, including members who cannot self serve, capturing the same identity fields. | Web App | High |
> | REQ-003 | Baptized and non baptized capture | The registration form records baptism status so downstream access (especially financial) can be gated correctly. | Both | High |
> | REQ-004 | Baptismal number tracking | The baptismal number is the unique member identifier. The system stores it, validates uniqueness, and uses it as the primary lookup key for a member record. | Both | High |
> | REQ-005 | Account verification | The system verifies a new account, checking the username and the baptismal number against existing records, and flags duplicates for review instead of silently creating them. | Both | High |
> | REQ-006 | Authentication | Members and staff authenticate with username and password, and the session is honored across the mobile app and the web portal. | Both | High |
> | REQ-007 | Password reset via phone | A user who forgets their password resets it through their registered phone number. | Both | High |
> | REQ-008 | Member profile fields | The profile covers identity, contact, and church belonging so a member record is complete and searchable. | Both | High |
> | REQ-009 | Church belonging and hierarchy | A member belongs to a church, and for a super church the sub church and its super admins can be created and managed. | Web App | High |
> | REQ-010 | Membership status tracking | The system tracks member status such as active, inactive, transfer, or departed so the registry reflects reality over time. | Web App | Medium |
> | REQ-011 | Family grouping | Members can be linked as a family (for example husband, wife, children) for family based reporting. | Web App | Medium |
> | REQ-012 | Church directory | Members view the church directory from the mobile app. | Mobile App | Medium |
> | REQ-013 | Role assignment | Admins assign roles to users, and the RBAC rules attached to those roles decide what each user can see and do. | Web App | High |

## Why It Exists

The PRD frames the manual registry as slow and unscalable, because a clerk searches the book page by page by baptismal number and only one person can use the book at once. This feature removes that bottleneck by making identity digital, searchable, and reusable. It exists so registration happens once, the record is found in seconds, and every later feature that needs a member, such as giving, discipline, awards, roles, or messaging, resolves against a verified identity.

## How It Works End to End

The flow runs in two entry channels that converge on one registry. On the mobile app, the member opens registration, enters a username and password, picks their church from the Lagos list, records baptism status and the baptismal number, and submits. On the web portal, a clerk or admin enters the same identity fields for a member who cannot self serve. In both channels the system first verifies the account against existing records, flags duplicates for review instead of creating them, and on success creates the member record with `baptismal_number` as the key. The authenticated session is honored across both surfaces. In parallel with the record creation, the system assigns the member their role as defined by `Role assignment`, and later features read `baptized` status to gate financial access. The work runs in the mobile app and the web portal, and the record lives in the shared registry that both surfaces read.

## Inputs It Consumes

The feature consumes the username, password, church selection, baptism status, and baptismal number entered at registration, plus the identity and contact field values from `REQ-008`. It consumes the church list, which defaulted to the Lagos churches loaded from the database, and the existing registry records used by `REQ-005` to detect duplicates.

## Outputs It Produces

The feature produces a verified member record keyed by `baptismal_number`, an authenticated session usable on both surfaces, a role assignment for the new member, and the `baptized` flag that gates financial access in `2-financial-contributions-and-giving`. The record is consumed by `REQ-012` directory reads, by `REQ-040` and `REQ-041` discipline and award records, by `REQ-050` offline capture, and by every role based action in `6-custom-modules-and-platform-features`.

## User Journey Summary

Journey A in the PRD (`A member registers and sees their giving`) walks the flow. The member downloads the app and registers with a username and password, picks the church, records baptism status and the baptismal number, and the system verifies the account and flags any duplicate. On success the member lands on the dashboard, and because they are baptized the financial section unlocks and they open the contribution dashboard. A non baptized member sees the same registration but no financial section. Journey C (`A clerk registers a member from the web portal`) walks the assisted path, where the clerk enters identity, contact, church, and baptism details, the entry saves locally when offline, syncs when connectivity returns, and the record becomes searchable by baptismal number and name.

## Sub-Feature Index

| Sub-Feature ID | Name | Description | Folder |
|---|---|---|---|
| `1.1` | Member registration (member self serve) | Self service registration from the mobile app with username, password, church, and baptism data. | `1-1-member-registration-member-self-serve/1-1-member-registration-member-self-serve.md` |
| `1.2` | Member registration (assisted, web) | Clerk or admin registration from the web portal for members who cannot self serve. | `1-2-member-registration-assisted-web/1-2-member-registration-assisted-web.md` |
| `1.3` | Baptized and non baptized capture | Registration captures baptism status to gate downstream financial access. | `1-3-baptized-and-non-baptized-capture/1-3-baptized-and-non-baptized-capture.md` |
| `1.4` | Baptismal number tracking | The baptismal number is the validated unique member identifier and primary lookup key. | `1-4-baptismal-number-tracking/1-4-baptismal-number-tracking.md` |
| `1.5` | Account verification | New accounts are checked against existing records and duplicates are flagged for review. | `1-5-account-verification/1-5-account-verification.md` |
| `1.6` | Authentication | Username and password authentication with a session honored across both surfaces. | `1-6-authentication/1-6-authentication.md` |
| `1.7` | Password reset via phone | Forgotten passwords are reset through the registered phone number. | `1-7-password-reset-via-phone/1-7-password-reset-via-phone.md` |
| `1.8` | Member profile fields | Identity, contact, and church belonging fields make a record complete and searchable. | `1-8-member-profile-fields/1-8-member-profile-fields.md` |
| `1.9` | Church belonging and hierarchy | Members belong to a church, and super churches manage sub churches and their super admins. | `1-9-church-belonging-and-hierarchy/1-9-church-belonging-and-hierarchy.md` |
| `1.10` | Membership status tracking | Member status moves through active, inactive, transfer, or departed. | `1-10-membership-status-tracking/1-10-membership-status-tracking.md` |
| `1.11` | Family grouping | Members link as families for family based reporting. | `1-11-family-grouping/1-11-family-grouping.md` |
| `1.12` | Church directory | Members view the church directory from the mobile app. | `1-12-church-directory/1-12-church-directory.md` |
| `1.13` | Role assignment | Admins assign roles, and RBAC rules decide what each user sees and does. | `1-13-role-assignment/1-13-role-assignment.md` |

## Feature-Level Acceptance Criteria

- A member can register from the mobile app with a username, password, church selection, baptism status, and baptismal number, and the process completes.
- A clerk or admin can register the same identity fields from the web portal for a member who cannot self serve.
- A member record for the faith state always carries a `baptized` or non baptized value.
- A registered `baptismal_number` is unique across the registry and is the primary lookup key.
- A duplicate username or baptismal number produces a review case and does not silently create a second member.
- A successful registration produces an authenticated session that works on both the mobile app and the web portal.
- A member who forgets the password resets it through the registered phone number.
- The registry is searchable by baptismal number and name.
- A church super admin can create a sub church and its super admins.

## Edge Cases and Risks

- A member registers twice with the same baptismal number. The system must flag the duplicate for review and create nothing.
- A member registers while offline. The assisted and self service flows must capture locally and sync later, per `4-offline-data-saving-and-sync`.
- A Lagos church is not in the loaded list. The system must not silently assign a wrong church and must surface the missing church for an admin.
- A clerk registers a member who is already known under a different spelling. The verification step must surface the candidate for review.
- A non baptized member attempts to reach financial screens. The financial gate must deny access based on `baptized`.

## Dependencies

This feature feeds `2-financial-contributions-and-giving` through the `baptized` flag and verified identity, feeds `3-church-discipline-and-awards` because records target members, feeds `4-offline-data-saving-and-sync` because offline capture creates member records, and feeds the role and content features of `6-custom-modules-and-platform-features`. It depends on `Approval pipelines` inside `6-custom-modules-and-platform-features` only where a church configures one for role assignment.

## Measurable Outcomes

The PRD ties these targets to registry behavior. From PRD `Section 5`: "Member record lookup by baptismal number or name: results back in under 2 seconds under normal load." and "Record search across the registry: under 2 seconds for the pilot assembly size." From PRD `Section 6`: "Near instant member record lookup." No other metric is stated for this feature.

## Jira Preparation

Candidate user stories and task titles this feature will produce:
- As a member, I want to register from the app with my phone or card number, so that my membership is digital.
- As a clerk, I want to register a member from the web portal, so that members who cannot self serve still join the registry.
- As the system, I want to verify accounts and flag duplicates, so that the registry stays clean.
- Technical task: model the member record and the `baptismal_number` uniqueness rule.
- Technical task: implement the church list default for registration.
- Technical task: implement the assisted registration screen on the web portal.