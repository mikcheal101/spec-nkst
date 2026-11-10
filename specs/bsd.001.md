# Enterprise Business Strategy Document (BSD)

| Field | Value |
|---|---|
| Document Title | Enterprise Business Strategy Document (BSD) |
| Document Reference | BSD-NKST-2026-001 |
| Target Domain | Administrative & Member Operations Platform |
| Status | Approved for Pre-PRD Analysis |

---

## Section 1: Executive Summary & Business Problem

The NKST church runs its member operations on a single hard cover note. Every registration, contribution, award, punishment, and status update is written into that book by hand. The book is treated as a sacred record, and for good reason, because it is the only place the church history lives. The problem is that a hard cover note does not scale and it does not answer questions quickly.

Here is what that looks like in daily practice. A clerk opens the book, flips through pages to find a member by baptismal number, then writes the new contribution or update in the margin. If two people need the book at the same time, one of them waits. If the book is lost, damaged, or taken to a branch, the church has no live copy. If a member wants to know how much they have given this year, someone has to trace every entry by hand.

The vision is simple to state. Move member registration, member records, and giving into a digital platform where the information is searchable, accurate, and available in real time. Keep the church way of doing things exactly as it is today. The record becomes electronic, the operating rules stay the same.

The expected impact is a church that can register a member once and find their record in seconds, where a member sees their own giving without asking a clerk, and where a monthly audit takes about an hour instead of days. The platform starts with one assembly in Lagos and is built to grow into other Lagos assemblies, then to state level, and finally to synod or national level.

---

## Section 2: Project Scope & Core Objectives

This section draws the boundary between what the first release delivers and what comes later.

### In scope for the pilot release

- Digital registration for both baptized and non baptized members.
- A member mobile app where a baptized member can view their own contributions in real time.
- A web application for pastors and back office staff to manage members, contributions, discipline, awards, announcements, and approvals.
- Baptismal tracking, using the baptismal number as the current member identifier.
- Role based access control (RBAC) across the whole system, so every action is tied to a role.
- Configurable transaction fees on electronic giving, set by the church as needed.
- Offline first data capture, so registration and recording keep working when the internet drops.
- Paper backup during the transition, so the hard cover note stays as evidence for an agreed period.
- Full audit trails on every record edit and every financial adjustment.
- Encryption and protection of sensitive records, especially disciplinary actions and personal giving data, in line with local data privacy regulation such as NDPR/NDPA.

### Later phases

- Expansion from the main assembly to the Lagos sub assemblies.
- State level rollout once the Lagos rollout proves successful.
- Synod and national level rollout after state level success.
- Retiring the paper backup once the church is confident in the digital record.
- A central support and maintenance model, which today is my company as the sole maintainer.

### Core objectives

1. **Member management:** Replace the manual book with a searchable digital registry covering baptized and non baptized members, families, and status changes.
2. **Financial transparency:** Let members and church leadership see contributions clearly, in real time, with a configurable fee model and fast reconciliation.
3. **Governance reporting:** Give pastors, elders, and secretaries role based control over discipline, awards, and records, backed by immutable audit logs.

---

## Section 3: Target Audience & Stakeholder Matrix

The platform serves two broad groups: members who use a mobile app, and church workers who use a web application for back office and pastoral operations.

### Members

Regular church members. They register, authenticate, view announcements and events, view the church directory, view and make contributions, and view contribution requests. Today the target assembly is estimated at 100 to 200 active members. Non baptized members are not allowed to view financial records, so dashboard features are restricted by baptism or communicant status. Members are expected to be the primary adopters, and the success metric is 90 percent of mobile users in the church using the app.

### Local administrative clerks and secretaries

These are the daily data entry users. Their computer literacy is low today, so there will be computer literacy training as part of the rollout. They register members, update records, and record contributions. They also handle the digitizing of historical ledger data where the data relates to the member, while the system admin handles church sensitive information about a member. They need an interface that is fast, forgiving on slow connections, and works offline.

### Church elders and church secretaries

They supervise records and help approve changes. They need to view member and contribution data, and they act within the approval pipelines. Under RBAC, their authority to record, approve, or clear a disciplinary record is defined by their role.

### Lead pastors

They hold pastoral and governance authority. They view reports, approve sensitive actions, and oversee discipline and awards. The lead pastor is a primary audience for governance reporting.

### Church super admins and admins

They run the platform for a church. A super admin can create church admins, and for a super church can create sub churches plus the super admins for those churches. Admins can add sub admins as department heads and manage contribution requests, announcements, events, and media. Everything here is RBAC enabled and, where an approval pipeline exists, changes follow that pipeline.

### The maintaining company

Alcestis is the sole maintainer for now. It owns build, deployment, support, and long term maintenance, and it is the delivery partner for the pilot next week.

---

## Section 4: High-Level Functional Requirements

### Module 1: Member Registration, Profile Verification, and Baptismal Tracking

- Digital registration of baptized and non baptized members, replacing the manual book entry.
- Baptismal number as the current unique member identifier, with a digital validation step at registration.
- Profile fields covering identity, contact, and church belonging, with the church defaulting initially to Lagos churches from the database.
- Registration and login using username (phone number or card number) with password.
- Password reset through phone number.
- Membership status tracking and family grouping as the registry grows.

### Module 2: Financial Contributions, Giving Gateways, and Fee Configuration

- Member ability to view contributions and make contributions, starting with a transfer based payment gateway.
- Real time contribution dashboard for members, restricted so non baptized members cannot view financial records.
- Contribution types covering tithes, offerings, pledges, building fund, missions, and special projects.
- Contribution requests created by church admin and finance admin, with drill down and export to file.
- A configurable fee model, so the church can set a flat fee or a percentage per contribution, or fully subsidize giving from central or local church budgets.
- Reconciliation support so monthly audits are fast and traceable.

### Module 3: Church Discipline, Awards, and Governance Audit Logs

- Records for church discipline and punishments and for awards.
- Total RBAC control over who can record, approve, or clear any disciplinary or award record.
- Approval pipelines for sensitive changes, following the workflow already used by the church.
- Governance audit logs for every record edit and financial adjustment.

### Module 4: Offline First Data Caching and Synchronization

- Offline first registration and recording for assemblies with intermittent internet.
- Local cache of essential data (member records, contribution entries) that syncs when connectivity returns.
- Conflict handling so two offline edits do not silently overwrite each other.

### Module 5: Immutable Activity Trails and Administrative Backups

- Immutable activity trails for all create, update, and delete actions, feeding the audit service.
- Administrative backups following an agreed schedule.
- Paper backup as evidence during the transition period, kept alongside the digital record until the church retires it.

### Custom modules from stakeholder input

- **Web application for pastors and back office:** All pastoral and back office operations run on the web app. This includes member management, contribution oversight, discipline, awards, announcements, events, media, and approvals.
- **Mobile application for members:** Members register, view giving, give, and consume church content through the mobile app.
- **Direct messaging:** Every user can send and respond to direct messages.
- **Announcements, events, and media:** Church admins and comms admins publish announcements, events, sermons (video, audio, print), and manage publications, with approvals where pipelines exist.

---

## Section 5: Financial Justification & Return on Investment (ROI)

The church has not disclosed a build budget ceiling, an operating expenditure target, or an estimated cost of the current losses from physical ledgers. Those figures remain to be determined and this document does not invent them. What can be stated with confidence is where the return comes from.

### Where the value is created

- **Reduced collection leakage:** Electronic giving with real time records means every transfer is traceable end to end, which lowers the chance of missed or unaccounted entries.
- **Faster auditing cycles:** The stated target is to cut a monthly audit reconciliation down to about one hour. Today that work is manual and slow.
- **Eliminated paper ledger costs:** Over time the church stops buying, storing, and replacing hard cover notes, and stops paying for physical auditing trips.
- **Administrative staff efficiency:** Clerks stop flipping pages and hand tracing entries. Record lookup drops from a page by page search to a search box, and the stated target is about one hour for a monthly reconciliation and near instant record lookup.
- **Governance and trust:** A complete, immutable audit trail reduces dispute over contributions and disciplinary records, which protects the church reputation and leadership.

### Cost side

Costs include build and deployment, ongoing hosting and infrastructure, gateway transaction fees (configurable, and optionally subsidized), and maintenance, which today sits with my company. A full cost model and a payback calculation should be completed once the church provides budget figures.

---

## Section 6: Key Performance Indicators (KPIs) & Success Metrics

### Adoption

- 90 percent of mobile users in the church using the app.
- Percentage of active members digitally registered against the target 100 to 200 members in the pilot assembly.
- Clerk and secretary adoption of the web app for daily data entry.

### Financial performance

- Reduction in collection leakage, measured as the gap between expected and recorded giving.
- Number of contributions captured electronically versus entries that fall back to paper.
- Gateway transaction fee cost as a percentage of total giving, with the subsidy split made visible.

### Operational efficiency

- Monthly audit reconciliation reduced to about 1 hour.
- Record lookup time reduced to near instant.
- Historical ledger digitizing progress, as a percentage of records migrated.

### System reliability

- Uptime during peak giving periods (Sunday services and special collections).
- Offline sync success rate, that is, the percentage of offline captures that sync cleanly once connectivity returns.
- Audit trail completeness, meaning every edit and financial adjustment is logged.

### Governance and compliance

- 100 percent of sensitive records encrypted and protected in line with NDPR/NDPA.
- Percentage of sensitive changes that went through a defined approval pipeline.
- Reduction in disputes over contribution or disciplinary records.

---

## Section 7: Rollout, Timeline, and Pilot Strategy

- **Pilot launch:** Next week, starting with a single main Lagos assembly.
- **Pilot audience:** An estimated 100 to 200 active members, plus the clerks, elders, secretaries, and lead pastor of that assembly.
- **Transition:** Paper backup stays as evidence during the transition, then is retired once the church is confident in the digital record.
- **Training:** Computer literacy classes for local secretaries and clerks before and during rollout.
- **Growth path:** Main Lagos assembly, then Lagos sub assemblies, then state level, then synod or national level.

---

## Section 8: Risks, Assumptions, and Open Items

### Risks

- **Low computer literacy** among clerks and secretaries could slow data entry. Mitigation: training and a simple interface.
- **Unreliable internet** at assembly sites could interrupt capture. Mitigation: offline first design with sync.
- **Undisclosed budget and loss figures** make ROI projection incomplete. Mitigation: gather figures before the pre-PRD stage.
- **Transition data quality:** historical digitizing depends on member provided data, which may be incomplete or hard to verify.
- **Single maintainer dependency:** my company is the sole maintainer today, which is a concentration risk for long term support.

### Assumptions

- The pilot starts next week with one main Lagos assembly.
- The baptismal number remains the unique identifier for now.
- The church modus operandi does not change. Only the record becomes digital.
- RBAC and approval pipelines govern all sensitive actions.

### Open items (to be confirmed)

- Budget ceiling and operating expenditure target.
- Estimated cost of current manual ledger losses.
- Device mix between smartphones and feature phones.
- Internet reliability at each assembly site.
- Exact scope and duration of the paper backup period.
- The full digitizing handover boundary between members and the system admin.

### Out of scope for this document

Any figure, scale, or claim not provided by the church. Where the information was marked undisclosed or unknown, this document records it as such rather than guessing.

---

## Section 9: Recommendation

Proceed to pre-PRD analysis. The business case is grounded, because the pain is real and the target outcomes (90 percent mobile adoption, one hour monthly reconciliation, full audit trails) are concrete and measurable. The immediate action is to confirm the open items above, complete a cost and payback model, and stand up the single assembly pilot next week on the web and mobile platforms described here.
