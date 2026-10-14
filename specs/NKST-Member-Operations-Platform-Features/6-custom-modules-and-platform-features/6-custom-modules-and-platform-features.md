# Feature: Custom Modules and Platform Features

## Header Block

| Field | Value |
|---|---|
| Feature ID | `6` |
| Feature Name | Custom Modules and Platform Features |
| Version | Version one |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Custom Modules and Platform Features` |
| Author | Hirekaan Micheal Hemen |

## Overview

Custom Modules and Platform Features gathers the cross cutting capabilities that every other module leans on: direct messaging, announcements, events, media and sermons, configurable approval pipelines, RBAC administration, super church management, department management, member role adds, password and session security, notifications, and data export. These features bind the surfaces and the roles together.

## What the PRD states

> ### Custom Modules and Platform Features
>
> | Requirement ID | Feature / Module Name | Requirement Description | User Target | Priority |
> |---|---|---|---|---|
> | REQ-070 | Direct messaging | Every user sends and responds to direct messages. | Both | High |
> | REQ-071 | Announcements | Church admin and comms admin publish announcements, and members view them on the mobile app. | Both | High |
> | REQ-072 | Events | Church admin and comms admin publish church events, and members view them on the mobile app. | Both | High |
> | REQ-073 | Media and sermons | Comms admin publishes sermons in video, audio, and print, and updates or drops media publications. | Both | High |
> | REQ-074 | Approval pipelines | Sensitive and user flagged actions follow a configurable approval pipeline, and the action is not final until the pipeline completes. | Both | High |
> | REQ-075 | RBAC administration | Admins manage roles and permissions, so a church can tune what each role can do. | Web App | High |
> | REQ-076 | Super church management | A super admin creates church admins, and for a super church creates sub churches plus the super admins for those churches. | Web App | High |
> | REQ-077 | Department management | A church admin adds sub admins as department heads, and a sub admin manages their department. | Web App | Medium |
> | REQ-078 | Member adds for elders, deacons, pastors | Church admin and church super admin add elders, deacons, members, and pastors, following approval pipelines where set. | Web App | High |
> | REQ-079 | Password and session security | Authentication uses password hashing, and password reset happens over the registered phone number. | Both | High |
> | REQ-080 | Notifications | A user is notified of relevant events and requests (for example a contribution request or an approval waiting on them). | Both | Medium |
> | REQ-081 | Data export and account controls | The platform supports exporting member and financial data for authorized roles and for compliance requests. | Web App | Medium |

## Why It Exists

The PRD defines an RBAC enabled platform where every action maps to a role and every sensitive action follows a pipeline. This feature exists to provide the shared machinery: content that reaches members, communication between users, roles that gate access, pipelines that guard sensitive change, church hierarchy management, secure sessions, notifications that keep people moving, and exports that satisfy reporting and compliance.

## How It Works End to End

The feature operates across both surfaces. Direct messaging lets every user send and respond. Announcements and events are published by church admin and comms admin and viewed by members on the mobile app. Media and sermons are published by comms admin in video, audio, and print, and can be updated or dropped. Approval pipelines sit in front of sensitive and user flagged actions, and an action is not final until the pipeline completes. RBAC administration lets admins manage roles and permissions so a church can tune its access model. A super admin creates church admins and, for a super church, sub churches plus the super admins for those churches. A church admin adds sub admins as department heads, and a sub admin manages their own department. Church admin and church super admin add elders, deacons, members, and pastors, following approval pipelines where set. Password and session security hashes passwords and resets them over the registered phone number. Notifications reach users for relevant events and requests, such as a contribution request or an approval waiting on them. Data export and account controls let authorized roles export member and financial data for reporting and compliance. Every action that writes a record feeds the audit trail in `5-paper-backup-and-activity-logs`.

## Inputs It Consumes

The feature consumes the verified sessions and role assignments from `1-member-registration-and-identity`, the member and church entities, the contribution records from `2-financial-contributions-and-giving`, the approval pipeline definitions, and the message, announcement, event, and media payloads created by users.

## Outputs It Produces

The feature produces direct messages, published announcements and events, published media publications, completed approval pipeline decisions, updated roles and permissions, created sub churches and admins, department head assignments, member role adds, secure password and session state, delivered notifications, and exported data files. Its outputs feed the member registry, the giving records, and the audit trail.

## User Journey Summary

Journey E in the PRD (`An admin creates a sub church`) walks super church management in steps: the super admin opens church management, creates a sub church, creates the super admin account for it, the sub church appears under the parent, and the new super admin can create admins and members within it. Journey G (`Publisher posts an announcement and a member reads it`) walks the content path: the comms admin creates and submits an announcement, the announcement waits for approval when a pipeline is set, publishes on approval or immediately when none is set, and the member views it and can reply by direct message.

## Sub-Feature Index

| Sub-Feature ID | Name | Description | Folder |
|---|---|---|---|
| `6.1` | Direct messaging | Every user sends and responds to direct messages. | `6-1-direct-messaging/6-1-direct-messaging.md` |
| `6.2` | Announcements | Church admin and comms admin publish, members view on the mobile app. | `6-2-announcements/6-2-announcements.md` |
| `6.3` | Events | Church admin and comms admin publish, members view on the mobile app. | `6-3-events/6-3-events.md` |
| `6.4` | Media and sermons | Comms admin publishes video, audio, and print and manages publications. | `6-4-media-and-sermons/6-4-media-and-sermons.md` |
| `6.5` | Approval pipelines | Sensitive actions wait for a configurable pipeline before becoming final. | `6-5-approval-pipelines/6-5-approval-pipelines.md` |
| `6.6` | RBAC administration | Admins manage roles and permissions so a church can tune access. | `6-6-rbac-administration/6-6-rbac-administration.md` |
| `6.7` | Super church management | Super admins create church admins and sub churches plus their super admins. | `6-7-super-church-management/6-7-super-church-management.md` |
| `6.8` | Department management | Church admins add sub admins as department heads. | `6-8-department-management/6-8-department-management.md` |
| `6.9` | Member adds for elders, deacons, pastors | Church admin and super admin add roles, following pipelines where set. | `6-9-member-adds-for-elders-deacons-pastors/6-9-member-adds-for-elders-deacons-pastors.md` |
| `6.10` | Password and session security | Password hashing and reset over the registered phone number. | `6-10-password-and-session-security/6-10-password-and-session-security.md` |
| `6.11` | Notifications | Users are notified of relevant events and pending requests. | `6-11-notifications/6-11-notifications.md` |
| `6.12` | Data export and account controls | Authorized roles export member and financial data for reporting and compliance. | `6-12-data-export-and-account-controls/6-12-data-export-and-account-controls.md` |

## Feature-Level Acceptance Criteria

- Every user sends and responds to direct messages.
- Church admin and comms admin publish announcements and events, and members view them on the mobile app.
- Comms admin publishes sermons in video, audio, and print and updates or drops media publications.
- A sensitive or user flagged action waits for the configured pipeline and is not final until it completes.
- An admin manages roles and permissions so the church can tune what each role can do.
- A super admin creates a church admin and, for a super church, a sub church with its super admins.
- A church admin adds a sub admin as a department head.
- Church admin and church super admin add elders, deacons, members, and pastors, following pipelines where set.
- Passwords are hashed and reset over the registered phone number.
- A user is notified of a contribution request or an approval waiting on them.
- An authorized role exports member and financial data for reporting or compliance.

## Edge Cases and Risks

- A message is sent to a member who has left the church. The send must respect membership status and the recipient's privacy.
- An announcement is submitted but no pipeline exists. The PRD journey states it publishes immediately when no pipeline is set.
- A media publication is dropped. The drop must be logged and the audit trail must record who did it.
- A super admin creates a sub church whose name already exists. The system must reject the duplicate.
- A church admin removes a role from a user mid session. The session must re evaluate permissions on the next request.
- A role assignment for a pastor arc requires approval. The add must wait for the pipeline before the role takes effect.

## Dependencies

This feature depends on `1-member-registration-and-identity` for identities, roles, and church hierarchy, on `2-financial-contributions-and-giving` for contribution requests that trigger notifications and exports, and on `5-paper-backup-and-activity-logs` for the audit trail of every action. Discipline and awards in `3-church-discipline-and-awards` consume the approval pipeline and role features here.

## Measurable Outcomes

The PRD ties the adoption goal to the platform broadly. From PRD `Section 6`: "90 percent of mobile users in the church using the app." No other metric is stated for this feature.

## Jira Preparation

Candidate user stories and task titles this feature will produce:
- As a member, I want to message another member directly, so that I can communicate within the church.
- As a comms admin, I want to publish announcements that wait for approval, so that only confirmed content reaches members.
- As an admin, I want to manage roles and permissions, so that each role sees and does only what it should.
- Technical task: implement the approval pipeline engine.
- Technical task: implement the RBAC administration screens.
- Technical task: implement notification delivery for requests and approvals.