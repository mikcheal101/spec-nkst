# Feature Tree Index

## 1. Source PRD

| Field | Value |
|---|---|
| Document ID | `PRD-NKST-2026-001` |
| Document Title | Enterprise Product Requirement Document (PRD) |
| Status | Approved for Implementation |
| Source file | `docs/prd.001.md` |

This tree is built from `docs/prd.001.md`. The feature list lives in PRD `Section 3: Core Features and Requirements`, which groups the system into six headings: `Module 1: Member Registration and Identity`, `Module 2: Financial Contributions and Giving`, `Module 3: Church Discipline and Awards`, `Module 4: Offline Data Saving and Sync`, `Module 5: Paper Backup and Activity Logs`, and `Custom Modules and Platform Features`. Each requirement row inside a module is a sub-feature.

## 2. Conventions

Folder and file names use the PRD number followed by a kebab-case slug of the title. The feature headings in the PRD are `Module 1` to `Module 5` plus `Custom Modules and Platform Features`, so the features are numbered `1` to `6` in the PRD's reading order. A sub-feature name combines its feature number and its position inside the module, so `REQ-001 Member registration (member self serve)` in `Module 1` becomes `1-1-member-registration-member-self-serve`. Feature files share the name of their folder and sit directly inside it. Every sub-feature gets its own folder inside its feature folder, containing a file of the same name. The recursion rule is one level per sub-feature, because no PRD requirement contains its own nested requirement. Reading order is preserved by the number prefixes.

## 3. Feature Table

| Feature ID | Name | Folder | Version | Summary |
|---|---|---|---|---|
| `1` | Member Registration and Identity | `1-member-registration-and-identity/` | Version one | Digital member onboarding and identity with baptismal number as the unique identifier. |
| `2` | Financial Contributions and Giving | `2-financial-contributions-and-giving/` | Version one | Electronic giving, contribution types, fee rules, requests, export, and reconciliation. |
| `3` | Church Discipline and Awards | `3-church-discipline-and-awards/` | Version one | Structured discipline and award records with approval and governance reporting. |
| `4` | Offline Data Saving and Sync | `4-offline-data-saving-and-sync/` | Version one | Local capture, caching, outbox sync, and conflict handling when the internet drops. |
| `5` | Paper Backup and Activity Logs | `5-paper-backup-and-activity-logs/` | Version one | Paper ledger linkage, administrative backups, immutable audit trail, and digitizing. |
| `6` | Custom Modules and Platform Features | `6-custom-modules-and-platform-features/` | Version one | Messaging, content, pipelines, RBAC, church management, security, and export. |

Each feature file links below.
- `1-member-registration-and-identity/1-member-registration-and-identity.md`
- `2-financial-contributions-and-giving/2-financial-contributions-and-giving.md`
- `3-church-discipline-and-awards/3-church-discipline-and-awards.md`
- `4-offline-data-saving-and-sync/4-offline-data-saving-and-sync.md`
- `5-paper-backup-and-activity-logs/5-paper-backup-and-activity-logs.md`
- `6-custom-modules-and-platform-features/6-custom-modules-and-platform-features.md`

## 4. Sub-Feature Table

### Feature `1`: Member Registration and Identity

| Sub-Feature ID | Name | Folder |
|---|---|---|
| `1.1` | Member registration (member self serve) | `1-1-member-registration-member-self-serve/1-1-member-registration-member-self-serve.md` |
| `1.2` | Member registration (assisted, web) | `1-2-member-registration-assisted-web/1-2-member-registration-assisted-web.md` |
| `1.3` | Baptized and non baptized capture | `1-3-baptized-and-non-baptized-capture/1-3-baptized-and-non-baptized-capture.md` |
| `1.4` | Baptismal number tracking | `1-4-baptismal-number-tracking/1-4-baptismal-number-tracking.md` |
| `1.5` | Account verification | `1-5-account-verification/1-5-account-verification.md` |
| `1.6` | Authentication | `1-6-authentication/1-6-authentication.md` |
| `1.7` | Password reset via phone | `1-7-password-reset-via-phone/1-7-password-reset-via-phone.md` |
| `1.8` | Member profile fields | `1-8-member-profile-fields/1-8-member-profile-fields.md` |
| `1.9` | Church belonging and hierarchy | `1-9-church-belonging-and-hierarchy/1-9-church-belonging-and-hierarchy.md` |
| `1.10` | Membership status tracking | `1-10-membership-status-tracking/1-10-membership-status-tracking.md` |
| `1.11` | Family grouping | `1-11-family-grouping/1-11-family-grouping.md` |
| `1.12` | Church directory | `1-12-church-directory/1-12-church-directory.md` |
| `1.13` | Role assignment | `1-13-role-assignment/1-13-role-assignment.md` |

### Feature `2`: Financial Contributions and Giving

| Sub-Feature ID | Name | Folder |
|---|---|---|
| `2.1` | View own contributions | `2-1-view-own-contributions/2-1-view-own-contributions.md` |
| `2.2` | Non baptized restriction | `2-2-non-baptized-restriction/2-2-non-baptized-restriction.md` |
| `2.3` | Make a contribution | `2-3-make-a-contribution/2-3-make-a-contribution.md` |
| `2.4` | Contribution types | `2-4-contribution-types/2-4-contribution-types.md` |
| `2.5` | Configurable transaction fee rules | `2-5-configurable-transaction-fee-rules/2-5-configurable-transaction-fee-rules.md` |
| `2.6` | Payment gateway integration | `2-6-payment-gateway-integration/2-6-payment-gateway-integration.md` |
| `2.7` | Contribution requests | `2-7-contribution-requests/2-7-contribution-requests.md` |
| `2.8` | Contribution drill down | `2-8-contribution-drill-down/2-8-contribution-drill-down.md` |
| `2.9` | Contribution export | `2-9-contribution-export/2-9-contribution-export.md` |
| `2.10` | Reconciliation view | `2-10-reconciliation-view/2-10-reconciliation-view.md` |
| `2.11` | Giving receipts | `2-11-giving-receipts/2-11-giving-receipts.md` |

### Feature `3`: Church Discipline and Awards

| Sub-Feature ID | Name | Folder |
|---|---|---|
| `3.1` | Disciplinary record capture | `3-1-disciplinary-record-capture/3-1-disciplinary-record-capture.md` |
| `3.2` | Award record capture | `3-2-award-record-capture/3-2-award-record-capture.md` |
| `3.3` | Dual approval workflow | `3-3-dual-approval-workflow/3-3-dual-approval-workflow.md` |
| `3.4` | Clear or reverse a record | `3-4-clear-or-reverse-a-record/3-4-clear-or-reverse-a-record.md` |
| `3.5` | Sensitive record visibility | `3-5-sensitive-record-visibility/3-5-sensitive-record-visibility.md` |
| `3.6` | Governance reporting | `3-6-governance-reporting/3-6-governance-reporting.md` |

### Feature `4`: Offline Data Saving and Sync

| Sub-Feature ID | Name | Folder |
|---|---|---|
| `4.1` | Offline capture | `4-1-offline-capture/4-1-offline-capture.md` |
| `4.2` | Local cache of essential data | `4-2-local-cache-of-essential-data/4-2-local-cache-of-essential-data.md` |
| `4.3` | Sync on reconnect | `4-3-sync-on-reconnect/4-3-sync-on-reconnect.md` |
| `4.4` | Conflict handling | `4-4-conflict-handling/4-4-conflict-handling.md` |
| `4.5` | Sync status visibility | `4-5-sync-status-visibility/4-5-sync-status-visibility.md` |

### Feature `5`: Paper Backup and Activity Logs

| Sub-Feature ID | Name | Folder |
|---|---|---|
| `5.1` | Paper backup alongside digital | `5-1-paper-backup-alongside-digital/5-1-paper-backup-alongside-digital.md` |
| `5.2` | Admin backups | `5-2-admin-backups/5-2-admin-backups.md` |
| `5.3` | Immutable audit trail | `5-3-immutable-audit-trail/5-3-immutable-audit-trail.md` |
| `5.4` | Audit trail review | `5-4-audit-trail-review/5-4-audit-trail-review.md` |
| `5.5` | Historical ledger digitizing | `5-5-historical-ledger-digitizing/5-5-historical-ledger-digitizing.md` |

### Feature `6`: Custom Modules and Platform Features

| Sub-Feature ID | Name | Folder |
|---|---|---|
| `6.1` | Direct messaging | `6-1-direct-messaging/6-1-direct-messaging.md` |
| `6.2` | Announcements | `6-2-announcements/6-2-announcements.md` |
| `6.3` | Events | `6-3-events/6-3-events.md` |
| `6.4` | Media and sermons | `6-4-media-and-sermons/6-4-media-and-sermons.md` |
| `6.5` | Approval pipelines | `6-5-approval-pipelines/6-5-approval-pipelines.md` |
| `6.6` | RBAC administration | `6-6-rbac-administration/6-6-rbac-administration.md` |
| `6.7` | Super church management | `6-7-super-church-management/6-7-super-church-management.md` |
| `6.8` | Department management | `6-8-department-management/6-8-department-management.md` |
| `6.9` | Member adds for elders, deacons, pastors | `6-9-member-adds-for-elders-deacons-pastors/6-9-member-adds-for-elders-deacons-pastors.md` |
| `6.10` | Password and session security | `6-10-password-and-session-security/6-10-password-and-session-security.md` |
| `6.11` | Notifications | `6-11-notifications/6-11-notifications.md` |
| `6.12` | Data export and account controls | `6-12-data-export-and-account-controls/6-12-data-export-and-account-controls.md` |

## 5. Dependency Map

Dependencies are stated functionally, feature to feature, never by number alone.

The member registry spreads trust outward. `Member registration and identity` feeds `Financial contributions and giving`, because only a verified member owns financial records. It feeds `Church discipline and awards`, because discipline and awards are recorded against members. It feeds `Offline data saving and sync`, because offline capture creates member records before the network returns. It feeds the role machinery in `Custom modules and platform features`, because roles attach to registered members.

`Financial contributions and giving` depends on the member registry for `baptized` status and the church assignment. The fee configuration depends on the church entity created by the church hierarchy part of the member feature. Reconciliation and export depend on recorded contributions.

`Church discipline and awards` depends on the member registry for the target member, on `Approval pipelines` for its dual approval workflow, and on the audit trail in `Paper backup and activity logs` for the immutable log of every action.

`Offline data saving and sync` depends on the member registry and the contribution records for what it caches and replays, and it depends on the sync status visibility sub-feature to report outcome.

`Paper backup and activity logs` depends on the contribution records and the member registry for paper linkage, and on every other feature for the events that feed the immutable audit trail.

`Custom modules and platform features` depends on the member registry for identities and roles, on the approval pipeline for content publishing, on the contribution records for exports, and on the audit trail for logged exports.

## 6. Decisions Log

The PRD header carries a generic document title rather than a product name, so the root folder is named from the product as the PRD describes it in `Section 1`, which is `NKST-Member-Operations-Platform-Features`.

The PRD feature list uses `Module` headings, not numbered feature headings, so the tree maps the modules to features `1` through `6` in reading order and maps each requirement row to a sub-feature. This mapping is recorded here as the settled interpretation.

Every requirement in the PRD is part of the pilot release, so every feature and sub-feature is `Version one`. The PRD marks no feature as version two.

The PRD is silent on internal state names, so the feature files define plain state names such as `draft`, `pending approval`, `approved`, `rejected`, `cleared`, `pending`, `synced`, and `failed` as design defaults. These names are defaults and the same files note where the PRD is silent.

The PRD is silent on the exact digitizing handover rule beyond `REQ-064`, so the model keeps member related data entered by the member or a clerk and church sensitive information entered by the system admin, exactly as `REQ-064` states, and the source tag records the entrant.

The PRD is silent on the default fee model per church, so the safest plain default is a fee that charges the member nothing extra until the church configures a fee. This default is recorded here and is also stated in `2-5-configurable-transaction-fee-rules`.

## 7. Version Two Boundary

No feature or sub-feature in `docs/prd.001.md` is marked version two, so this tree contains no version two content, and nothing in the tree is promoted beyond version one. The PRD `Section 6` phases two to four describe rollout expansion (Lagos sub assemblies, state level, synod and national level) and the later retirement of the paper ledger, which are operational rollout steps for the same pilot features rather than version two features. If any future PRD marks a feature version two, the tree rule is the same as the PRD rule: the feature stays labeled version two in its folder name label, its header, and its content.