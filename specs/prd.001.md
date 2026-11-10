# Enterprise Product Requirement Document (PRD)

| Field | Value |
|---|---|
| Document Title | Enterprise Product Requirement Document (PRD) |
| Document Reference | PRD-NKST-2026-001 |
| Target Systems | Cross-Platform Mobile App (Members) & Administrative Web Portal (Back-Office / Clerks / Leadership) |
| Source Document | BSD-NKST-2026-001 (Enterprise Business Strategy Document) |
| Status | Approved for Implementation |

---

## Section 1: Executive Overview and Product Vision

The NKST church keeps its member records in a single hard cover note. Registration, contributions, awards, punishment, and member updates all go into that book by hand. It works as the sacred source of truth, but it does not scale and it does not answer questions quickly.

The daily reality is slow. A clerk searches the book for a member by baptismal number, then writes the new entry in the margin. Two people cannot use the book at once. If the book is lost or carried away to a branch, there is no live copy. A member who wants to know their giving for the year has to wait while someone traces entries by hand.

This product moves those records into a digital platform. The rule is simple: the record becomes electronic, the church way of doing things does not change. Registration gets a digital entry point, giving becomes traceable end to end, discipline and awards get structured records, and every change leaves an audit trail. The pilot target is the main Lagos assembly with an estimated 100 to 200 active members, and the growth path runs from there to Lagos sub assemblies, then state level, then synod or national level.

### Platform division

The product ships as two connected surfaces.

**Mobile app for members.** This is the member facing surface. Members register, authenticate, view announcements and events, view the church directory, view and make contributions, view contribution requests, and send and respond to direct messages. Financial screens on this surface are gated by baptism status, so non baptized members do not see contribution dashboards. The mobile app is built offline first because assemblies have intermittent internet.

**Web portal for pastors and back office.** This is the administrative surface. Pastors, clerks, secretaries, elders, and admins run member management, contribution oversight, discipline, awards, announcements, events, media, and approvals here. The web portal holds the tools that need a bigger screen: bulk registration, historical ledger digitizing, financial export, approval pipelines, and audit review.

Both surfaces talk to the same platform services, so a record created on mobile is visible on the web instantly and the other way around.

---

## Section 2: User Roles and Access Control Matrix

The platform is RBAC enabled end to end. Every action maps to a role, and where an approval pipeline exists, the action follows that pipeline before it takes effect. Below is the full role breakdown, then the permission matrix.

### Role breakdown

**Regular member.** A baptized member who uses the mobile app. They register with a username (phone number or card number) and password, log in, view announcements, events, the church directory, contribution requests, and their own contribution history, make contributions, and use direct messaging. They see their own giving only.

**Non baptized member.** A registered member who has not been baptized. They can use the app for announcements, events, the directory, and messaging, but they are restricted from all financial records and the contribution dashboard.

**Church clerk / secretary.** The daily data entry role on the web portal. They register members, update records, and record contributions. Their computer literacy today is low, so the interface must stay simple and must work offline. They handle digitizing historical ledger data that relates to the member, while the system admin handles church sensitive information about a member.

**Church elder.** A supervisory role. Elders view member and contribution data, and they take part in approval pipelines. Their power to record, approve, or clear a disciplinary record is decided by their role configuration, not assumed.

**Church secretary (governance).** A records and governance role. They supervise record quality and help move approvals along, again bounded by the RBAC rules defined for them.

**Lead pastor.** The pastoral and governance authority. They view reports, approve sensitive actions, and oversee discipline and awards. They are the primary audience for governance reporting.

**Church admin.** Runs the church on the platform. They can add sub admins as department heads, manage contribution requests, announcements, events, and media, and add members, elders, deacons, and pastors. Actions follow approval pipelines where one is set.

**Finance admin.** Owns the money view. They create contribution requests, view contributions with drill down, and export contributions to file.

**Comms admin.** Owns content. They add announcements and events, publish sermons in video, audio, and print, and update or drop media publications.

**Sub admin (department head).** Created by a church admin to lead a department. Their scope is the department they head.

**Church super admin.** Runs the church tenant. They create church admins, and if the church is a super church they create sub churches plus the super admins for those churches.

**System admin.** The technical administrator. They handle church sensitive information about a member during digitizing and manage platform level configuration.

**Maintaining company (Alcestis).** The sole maintainer for now. They own build, deployment, support, and long term maintenance, and they deliver the pilot. This is an operational role, not a normal product end user role.

### Access control matrix

| Role | Profile Viewing | Financial Dashboards | Disciplinary Logs | Record Edit / Approval | Primary Surface |
|---|---|---|---|---|---|
| Regular member (baptized) | Own profile only | Own contributions only | No access | No access | Mobile app |
| Non baptized member | Own profile only | No access | No access | No access | Mobile app |
| Church clerk / secretary | All member profiles in their church | Record and view entries they capture, no fee config | Create drafts, no approve or clear | Create and update member and contribution records | Web portal |
| Church elder | All member profiles in their church | View church contribution summaries | View and approve per role config | Approve or reject per pipeline, no fee config | Web portal |
| Church secretary (governance) | All member profiles in their church | View church contribution summaries | View and route records for approval | Update records per role config, no fee config | Web portal |
| Lead pastor | All member profiles in their church | Full church financial view and reports | Full view, final approval and clear | Approve sensitive actions, oversee discipline and awards | Web portal |
| Church admin | All member profiles in their church | Full church financial view | View and manage per pipeline | Manage members, elders, deacons, pastors, departments, announcements, events, media | Web portal |
| Finance admin | Member profiles as needed | Full financial view, drill down, export | No access | Create contribution requests, export contributions | Web portal |
| Comms admin | Member profiles as needed | No access | No access | Manage announcements, events, sermons, media | Web portal |
| Sub admin (department head) | Profiles in their department | Department level summaries | No access | Manage department content per role config | Web portal |
| Church super admin | All profiles across managed churches | All financial views across managed churches | Full view and manage per pipeline | Create admins, create sub churches and their super admins | Web portal |
| System admin | Church sensitive member fields | Full platform financial view | Full view | Platform configuration, sensitive field management | Web portal |

Notes on the matrix. The matrix is the default. RBAC lets a church adjust what a role can do, so the values above are the starting point, not a hard cage. No role creates or edits transaction fee rules except the roles explicitly granted fee configuration, which defaults to church super admin with finance admin as an optional delegate. All sensitive changes route through the approval pipeline when one is configured.

---

## Section 3: Core Features and Requirements

This is the full requirement set for the pilot release. Each row is a requirement with a stable ID, the module it belongs to, a plain description of the behavior, the surface it applies to, and a priority.

### Module 1: Member Registration and Identity

| Requirement ID | Feature / Module Name | Requirement Description | User Target | Priority |
|---|---|---|---|---|
| REQ-001 | Member registration (member self serve) | A member registers from the mobile app with a username (phone number or card number) and password, and picks their church, defaulting to the Lagos churches loaded from the database. | Mobile App | High |
| REQ-002 | Member registration (assisted, web) | A clerk or admin registers a member from the web portal, including members who cannot self serve, capturing the same identity fields. | Web App | High |
| REQ-003 | Baptized and non baptized capture | The registration form records baptism status so downstream access (especially financial) can be gated correctly. | Both | High |
| REQ-004 | Baptismal number tracking | The baptismal number is the unique member identifier. The system stores it, validates uniqueness, and uses it as the primary lookup key for a member record. | Both | High |
| REQ-005 | Account verification | The system verifies a new account, checking the username and the baptismal number against existing records, and flags duplicates for review instead of silently creating them. | Both | High |
| REQ-006 | Authentication | Members and staff authenticate with username and password, and the session is honored across the mobile app and the web portal. | Both | High |
| REQ-007 | Password reset via phone | A user who forgets their password resets it through their registered phone number. | Both | High |
| REQ-008 | Member profile fields | The profile covers identity, contact, and church belonging so a member record is complete and searchable. | Both | High |
| REQ-009 | Church belonging and hierarchy | A member belongs to a church, and for a super church the sub church and its super admins can be created and managed. | Web App | High |
| REQ-010 | Membership status tracking | The system tracks member status such as active, inactive, transfer, or departed so the registry reflects reality over time. | Web App | Medium |
| REQ-011 | Family grouping | Members can be linked as a family (for example husband, wife, children) for family based reporting. | Web App | Medium |
| REQ-012 | Church directory | Members view the church directory from the mobile app. | Mobile App | Medium |
| REQ-013 | Role assignment | Admins assign roles to users, and the RBAC rules attached to those roles decide what each user can see and do. | Web App | High |

### Module 2: Financial Contributions and Giving

| Requirement ID | Feature / Module Name | Requirement Description | User Target | Priority |
|---|---|---|---|---|
| REQ-020 | View own contributions | A baptized member views their own contribution history in real time on a dashboard. | Mobile App | High |
| REQ-021 | Non baptized restriction | The system blocks all financial records and contribution dashboards for non baptized members. | Both | High |
| REQ-022 | Make a contribution | A member makes a contribution from the mobile app, starting with a transfer based payment gateway. | Mobile App | High |
| REQ-023 | Contribution types | The system supports contribution types including tithes, offerings, pledges, building fund, missions, and special projects. | Both | High |
| REQ-024 | Configurable transaction fee rules | The church configures the fee model per contribution, choosing a flat fee, a percentage, or full subsidy by the church, and the choice is applied at charge time. | Web App | High |
| REQ-025 | Payment gateway integration | The platform integrates a transfer based gateway and records the gateway reference against each contribution for traceability. | Both | High |
| REQ-026 | Contribution requests | Church admin and finance admin create contribution requests, and members view outstanding requests on the mobile app. | Both | High |
| REQ-027 | Contribution drill down | Finance admin drills from a summary into the individual contribution entries behind it. | Web App | High |
| REQ-028 | Contribution export | Finance admin exports contributions to a file for offline review and reporting. | Web App | High |
| REQ-029 | Reconciliation view | The system presents a reconciliation view that groups giving by period and type so a monthly audit can be completed quickly. | Web App | High |
| REQ-030 | Giving receipts | The system generates a receipt for a completed contribution for the member record. | Both | Medium |

### Module 3: Church Discipline and Awards

| Requirement ID | Feature / Module Name | Requirement Description | User Target | Priority |
|---|---|---|---|---|
| REQ-040 | Disciplinary record capture | Authorized roles record a church discipline or punishment event against a member, with date, reason, and the recording role. | Web App | High |
| REQ-041 | Award record capture | Authorized roles record a church award against a member, with date, reason, and the recording role. | Web App | High |
| REQ-042 | Dual approval workflow | A disciplinary or award record moves through a pipeline between the clerk or recorder and a pastor before it is considered final, so one person cannot both raise and confirm it. | Web App | High |
| REQ-043 | Clear or reverse a record | Only roles granted the authority can clear or reverse a disciplinary record, and the clear action is itself logged. | Web App | High |
| REQ-044 | Sensitive record visibility | Disciplinary logs are visible only to roles granted that permission, and they are encrypted at rest. | Web App | High |
| REQ-045 | Governance reporting | The system produces governance reports covering discipline and awards activity for the lead pastor and admins. | Web App | Medium |

### Module 4: Offline Data Saving and Sync

| Requirement ID | Feature / Module Name | Requirement Description | User Target | Priority |
|---|---|---|---|---|
| REQ-050 | Offline capture | Registration and contribution recording keep working when the internet drops, caching the data locally on the device or browser. | Both | High |
| REQ-051 | Local cache of essential data | The system caches essential records (member records and pending contribution entries) so a clerk can keep working without a connection. | Both | High |
| REQ-052 | Sync on reconnect | When connectivity returns, cached entries sync automatically to the platform with a visible sync status. | Both | High |
| REQ-053 | Conflict handling | If two offline edits touch the same record, the system surfaces the conflict for a human decision instead of silently overwriting. | Both | High |
| REQ-054 | Sync status visibility | The user can see which entries are pending, synced, or failed, and can retry a failed entry. | Both | Medium |

### Module 5: Paper Backup and Activity Logs

| Requirement ID | Feature / Module Name | Requirement Description | User Target | Priority |
|---|---|---|---|---|
| REQ-060 | Paper backup alongside digital | During the transition the physical ledger stays as evidence alongside the digital record, and the system marks records that also have a paper entry. | Web App | High |
| REQ-061 | Admin backups | The system runs administrative backups on an agreed schedule and records the backup outcome. | Web App | High |
| REQ-062 | Immutable audit trail | Every create, update, delete, and financial adjustment is written to an immutable activity trail, and the entry cannot be edited or removed. | Both | High |
| REQ-063 | Audit trail review | Authorized roles browse the audit trail with filters for user, action, and date range. | Web App | High |
| REQ-064 | Historical ledger digitizing | During migration, member related historical data is entered by the member or by a clerk, while church sensitive information about a member is entered by the system admin, and the source is tagged on each record. | Web App | Medium |

### Custom Modules and Platform Features

| Requirement ID | Feature / Module Name | Requirement Description | User Target | Priority |
|---|---|---|---|---|
| REQ-070 | Direct messaging | Every user sends and responds to direct messages. | Both | High |
| REQ-071 | Announcements | Church admin and comms admin publish announcements, and members view them on the mobile app. | Both | High |
| REQ-072 | Events | Church admin and comms admin publish church events, and members view them on the mobile app. | Both | High |
| REQ-073 | Media and sermons | Comms admin publishes sermons in video, audio, and print, and updates or drops media publications. | Both | High |
| REQ-074 | Approval pipelines | Sensitive and user flagged actions follow a configurable approval pipeline, and the action is not final until the pipeline completes. | Both | High |
| REQ-075 | RBAC administration | Admins manage roles and permissions, so a church can tune what each role can do. | Web App | High |
| REQ-076 | Super church management | A super admin creates church admins, and for a super church creates sub churches plus the super admins for those churches. | Web App | High |
| REQ-077 | Department management | A church admin adds sub admins as department heads, and a sub admin manages their department. | Web App | Medium |
| REQ-078 | Member adds for elders, deacons, pastors | Church admin and church super admin add elders, deacons, members, and pastors, following approval pipelines where set. | Web App | High |
| REQ-079 | Password and session security | Authentication uses password hashing, and password reset happens over the registered phone number. | Both | High |
| REQ-080 | Notifications | A user is notified of relevant events and requests (for example a contribution request or an approval waiting on them). | Both | Medium |
| REQ-081 | Data export and account controls | The platform supports exporting member and financial data for authorized roles and for compliance requests. | Web App | Medium |

---

## Section 4: Step-by-Step User Journeys

### Journey A: A member registers and sees their giving

1. The member downloads the app and opens it.
2. The member taps register and enters a username (phone number or card number) and a password.
3. The member selects their church, which defaults to a Lagos church from the loaded list.
4. The member records their baptism status and their baptismal number.
5. The system verifies the account, checks the username and baptismal number against existing records, and flags any duplicate for review.
6. On success, the member lands on the dashboard.
7. Because the member is baptized, the financial section is unlocked. The member opens the contribution dashboard and sees their giving history in real time.
8. If the member is not baptized, the financial section stays hidden and only the non financial parts of the app are available.

### Journey B: A member makes a contribution

1. The member opens the contribution screen and taps give.
2. The member picks a contribution type (tithe, offering, pledge, building fund, mission, or special project).
3. The member enters the amount and starts the payment, which routes through the transfer based gateway.
4. The church fee rule for that contribution is applied (flat fee, percentage, or full subsidy), and the member sees the final amount before confirming.
5. The member completes the transfer at the gateway.
6. The platform records the contribution with the gateway reference and shows a receipt on the member dashboard.
7. The member sees the new contribution appear in their real time history.

### Journey C: A clerk registers a member from the web portal

1. The clerk logs in to the web portal with their role credentials.
2. The clerk opens the member registration screen.
3. The clerk enters the member identity, contact, church, and baptism details.
4. If the internet is down, the entry saves locally and shows a pending sync status.
5. When the connection returns, the entry syncs automatically and the status changes to synced.
6. If another edit touched the same record, the system raises a conflict for the clerk to resolve by hand.
7. The record now appears in the registry and is searchable by baptismal number and by name.

### Journey D: A clerk raises a disciplinary record and a pastor approves it

1. The clerk opens the discipline screen and creates a new record against a member, entering the date and reason.
2. The record is saved as a draft, not final.
3. The record enters the approval pipeline and routes to the pastor role.
4. The pastor reviews the record, then approves or rejects it.
5. On approval, the record becomes final and is written to the disciplinary log.
6. If the record is later cleared, the clear action is logged with the acting role and a reason.
7. Every step of this flow lands in the immutable audit trail.

### Journey E: An admin creates a sub church

1. A church super admin logs in to the web portal.
2. The super admin opens church management and creates a sub church.
3. The super admin creates the super admin account for that sub church.
4. The sub church appears under the parent church, and the new super admin can create admins and members within it.
5. The action is recorded in the audit trail.

### Journey F: A finance admin reconciles the month

1. The finance admin logs in to the web portal.
2. The finance admin opens the reconciliation view and filters to the month.
3. The view groups giving by period and type, with electronic and paper entries labeled.
4. The finance admin drills into any group to see the individual contributions and gateway references.
5. The finance admin exports the reconciled set to a file.
6. The reconciliation finishes in about an hour instead of days.

### Journey G: Publisher posts an announcement and a member reads it

1. A comms admin logs in to the web portal.
2. The comms admin creates an announcement and submits it.
3. If an approval pipeline is set for announcements, the announcement waits for approval.
4. On approval (or immediately if no pipeline is set), the announcement publishes.
5. A member opens the app and views the announcement.
6. The member can act on it, for example replying by direct message.

---

## Section 5: System Performance and Security Rules

### Performance targets

- Member record lookup by baptismal number or name: results back in under 2 seconds under normal load.
- Contribution history load on the member dashboard: first view in under 3 seconds on a normal mobile connection.
- Monthly reconciliation report: generate in about 1 hour of human review time, with the report query itself returning in under 5 seconds.
- Contribution export: applied file ready in under 10 seconds for a single church month.
- Record search across the registry: under 2 seconds for the pilot assembly size.
- Offline sync: a queued entry syncs within 30 seconds of connectivity returning, and sync failures are surfaced to the user immediately.

### Security and data protection

- Sensitive records, especially disciplinary actions and personal giving data, are encrypted at rest and protected in transit.
- Every record edit and every financial adjustment writes an immutable audit entry that cannot be edited or deleted.
- Access is RBAC controlled on every request, so a user only reaches the data their role allows.
- Authentication uses password hashing and a password reset flow tied to the registered phone number.
- The platform complies with local data privacy regulation, listed in the source as NDPR/NDPA.
- Data exports are restricted to authorized roles and are themselves logged.
- Backup and restore are tested so an administrative backup can actually be recovered.

### Reliability targets

- The platform stays available during peak giving periods, meaning Sunday services and special collections.
- A dropped connection degrades to offline capture rather than a hard failure.
- Conflict handling on sync prevents silent data loss.
- Audit trail completeness is treated as a hard guarantee, so no edit goes unlogged.

---

## Section 6: Launch Phases and Success Goals

### Phase 1: Pilot (main Lagos assembly)

- Launch next week with the single main Lagos assembly.
- Pilot audience is an estimated 100 to 200 active members, plus the clerks, elders, secretaries, and lead pastor of that assembly.
- Ship the member mobile app and the administrative web portal together.
- Keep the paper ledger as evidence alongside the digital record during the transition.
- Run computer literacy classes for local secretaries and clerks before and during rollout.
- Success goals: 90 percent of the mobile users in the church using the app, monthly audit reconciliation reduced to about 1 hour, record lookup near instant, and full audit trails on every change.

### Phase 2: Lagos sub assemblies

- Extend from the main assembly to the Lagos sub assemblies.
- Reuse the same church hierarchy and RBAC model, with sub church super admins managing their own assemblies.
- Success goals: sustained adoption across assemblies, growing share of giving captured electronically with fewer paper fallbacks.

### Phase 3: State level

- Roll out across the state once the Lagos rollout proves successful.
- Success goals: stable reconciliation times across assemblies, consistent uptime during peak giving periods, and migration of historical ledgers progressing on schedule.

### Phase 4: Synod and national level

- Extend to synod and national level after state level success.
- Retire the paper backup once the church is confident in the digital record.
- Success goals: platform wide adoption, a single consistent governance and audit standard, and a support model that scales beyond the current sole maintainer.

### Concrete success targets across phases

- 90 percent of mobile users in the church using the app.
- Monthly audit reconciliation reduced to about 1 hour.
- Near instant member record lookup.
- 100 percent of sensitive records encrypted and protected in line with NDPR/NDPA.
- Full audit trail coverage on every record edit and every financial adjustment.
- Growing electronic capture rate versus paper fallback.
- Reliable uptime during Sunday services and special collections.
