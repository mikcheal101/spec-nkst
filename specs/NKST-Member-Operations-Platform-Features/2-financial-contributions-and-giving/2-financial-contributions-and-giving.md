# Feature: Financial Contributions and Giving

## Header Block

| Field | Value |
|---|---|
| Feature ID | `2` |
| Feature Name | Module 2: Financial Contributions and Giving |
| Version | Version one |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 2` |
| Author | Hirekaan Micheal Hemen |

## Overview

Financial Contributions and Giving replaces the manual margin entry in the hard cover note with a traceable electronic giving journey. A baptized member views their own contribution history in real time, makes a contribution through a transfer based payment gateway, and receives a receipt. Church configuration controls contribution types, fee rules, and contribution requests, and finance staff drill down, export, and reconcile the month.

## What the PRD states

> ### Module 2: Financial Contributions and Giving
>
> | Requirement ID | Feature / Module Name | Requirement Description | User Target | Priority |
> |---|---|---|---|---|
> | REQ-020 | View own contributions | A baptized member views their own contribution history in real time on a dashboard. | Mobile App | High |
> | REQ-021 | Non baptized restriction | The system blocks all financial records and contribution dashboards for non baptized members. | Both | High |
> | REQ-022 | Make a contribution | A member makes a contribution from the mobile app, starting with a transfer based payment gateway. | Mobile App | High |
> | REQ-023 | Contribution types | The system supports contribution types including tithes, offerings, pledges, building fund, missions, and special projects. | Both | High |
> | REQ-024 | Configurable transaction fee rules | The church configures the fee model per contribution, choosing a flat fee, a percentage, or full subsidy by the church, and the choice is applied at charge time. | Web App | High |
> | REQ-025 | Payment gateway integration | The platform integrates a transfer based gateway and records the gateway reference against each contribution for traceability. | Both | High |
> | REQ-026 | Contribution requests | Church admin and finance admin create contribution requests, and members view outstanding requests on the mobile app. | Both | High |
> | REQ-027 | Contribution drill down | Finance admin drills from a summary into the individual contribution entries behind it. | Web App | High |
> | REQ-028 | Contribution export | Finance admin exports contributions to a file for offline review and reporting. | Web App | High |
> | REQ-029 | Reconciliation view | The system presents a reconciliation view that groups giving by period and type so a monthly audit can be completed quickly. | Web App | High |
> | REQ-030 | Giving receipts | The system generates a receipt for a completed contribution for the member record. | Both | Medium |

## Why It Exists

The PRD describes collection leakage from untraceable manual entries and granting disputes over contribution records. This feature exists so every transfer is traceable end to end with a gateway reference, giving shows in real time, the monthly audit takes about one hour instead of days, and non baptized members never see financial data. It also gives the church control over how giving is administered through types, requests, and configurable fee rules.

## How It Works End to End

The flow starts on the mobile app when a baptized member opens the contribution screen and taps give. The member picks a contribution type, enters an amount, and the system applies the church fee model configured in `REQ-024`, showing the final amount before confirmation. The charge routes through the transfer based gateway from `REQ-025`, which returns a gateway reference. On completion, the platform records the contribution with that reference, generates a receipt from `REQ-030`, and the member history on the dashboard refreshes in real time. In parallel, `REQ-026` contribution requests created by church admin and finance admin appear as outstanding requests for members, `REQ-027` lets finance admin drill from a summary into individual entries, `REQ-028` exports the set to a file, and `REQ-029` groups the month by period and type for the monthly audit. The financial dashboards are blocked for non baptized members by `REQ-021` on both surfaces. Giving capture also respects the offline path in `4-offline-data-saving-and-sync` when the connection drops.

## Inputs It Consumes

The feature consumes the `baptized` flag and verified identity from `1-member-registration-and-identity`, the contribution type and amount chosen by the member, the church fee configuration for the member church, the gateway reference from the transfer, and the contribution requests created by church admin and finance admin.

## Outputs It Produces

The feature produces a recorded contribution with a gateway reference, a receipt for the member record, a refreshed real time history on the member dashboard, an export file for finance admin, a reconciliation grouping for the monthly audit, and an audit entry for every financial adjustment. The reconciliation and export outputs feed the audit review in `5-paper-backup-and-activity-logs`.

## User Journey Summary

Journey B in the PRD (`A member makes a contribution`) walks the giving path. The member opens the contribution screen, taps give, picks a type, enters the amount, and the fee rule is applied and shown before confirming. The member completes the transfer at the gateway, the platform records the contribution with the gateway reference, the receipt appears on the dashboard, and the new contribution shows in the real time history. Journey F (`A finance admin reconciles the month`) walks the administrative path, where the finance admin opens the reconciliation view, filters to the month, sees giving grouped by period and type with electronic and paper entries labeled, drills into any group to see gateway references, exports the set, and finishes in about an hour instead of days.

## Sub-Feature Index

| Sub-Feature ID | Name | Description | Folder |
|---|---|---|---|
| `2.1` | View own contributions | A baptized member views their own history in real time on a dashboard. | `2-1-view-own-contributions/2-1-view-own-contributions.md` |
| `2.2` | Non baptized restriction | Financial records and dashboards are blocked for non baptized members. | `2-2-non-baptized-restriction/2-2-non-baptized-restriction.md` |
| `2.3` | Make a contribution | A member makes a contribution through a transfer based payment gateway. | `2-3-make-a-contribution/2-3-make-a-contribution.md` |
| `2.4` | Contribution types | Giving supports tithes, offerings, pledges, building fund, missions, and special projects. | `2-4-contribution-types/2-4-contribution-types.md` |
| `2.5` | Configurable transaction fee rules | The church sets a flat fee, a percentage, or full subsidy, applied at charge time. | `2-5-configurable-transaction-fee-rules/2-5-configurable-transaction-fee-rules.md` |
| `2.6` | Payment gateway integration | A transfer based gateway records a reference against every contribution. | `2-6-payment-gateway-integration/2-6-payment-gateway-integration.md` |
| `2.7` | Contribution requests | Church and finance admin create requests and members view outstanding ones. | `2-7-contribution-requests/2-7-contribution-requests.md` |
| `2.8` | Contribution drill down | Finance admin drills from a summary into the individual entries behind it. | `2-8-contribution-drill-down/2-8-contribution-drill-down.md` |
| `2.9` | Contribution export | Finance admin exports contributions to a file for offline review and reporting. | `2-9-contribution-export/2-9-contribution-export.md` |
| `2.10` | Reconciliation view | Giving is grouped by period and type so a monthly audit is quick. | `2-10-reconciliation-view/2-10-reconciliation-view.md` |
| `2.11` | Giving receipts | A completed contribution generates a receipt for the member record. | `2-11-giving-receipts/2-11-giving-receipts.md` |

## Feature-Level Acceptance Criteria

- A baptized member views their own contribution history in real time on the dashboard.
- A non baptized member receives no access to any financial screen on either surface.
- A member completes a contribution through the transfer based gateway and the contribution records the gateway reference.
- Every contribution carries one of the supported types: tithe, offering, pledge, building fund, mission, or special project.
- A church fee model of flat, percentage, or full subsidy is applied at charge time and shown before confirmation.
- A contribution request created by church admin or finance admin appears as outstanding for members.
- A finance admin drills from a summary into individual contribution entries.
- A finance admin exports the contributions to a file.
- The reconciliation view groups giving by period and type.
- A completed contribution produces a receipt on the member record.

## Edge Cases and Risks

- A member confirms a transfer but the gateway never confirms. The contribution must record the failure and remain retryable rather than show false success.
- A member gives twice in one session. The system must not double record a single confirmed transfer.
- A church has no fee configuration. The system must apply the safest plain default, which charges the member nothing extra, and record that no fee rule was configured.
- A non baptized member reaches a financial endpoint. The system must deny access server side, so hiding the screen in the app is never the security boundary.
- A contribution request is created after its end date. The request must not appear as outstanding.
- An export runs while a contribution is still pending. The export must include only completed contributions.

## Dependencies

This feature depends on `1-member-registration-and-identity` for the `baptized` flag and verified identity, on the church entity for type and fee configuration, and on `4-offline-data-saving-and-sync` for offline giving capture. It feeds `5-paper-backup-and-activity-logs`, because recorded contributions carry `entry_source` for paper linkage and every adjustment feeds the audit trail, and it feeds the export features inside `6-custom-modules-and-platform-features`.

## Measurable Outcomes

The PRD ties these targets to giving behavior. From PRD `Section 5`: "Contribution history load on the member dashboard: first view in under 3 seconds on a normal mobile connection." and "Monthly reconciliation report: generate in about 1 hour of human review time, with the report query itself returning in under 5 seconds." and "Contribution export: applied file ready in under 10 seconds for a single church month." From PRD `Section 6`: "Reliable uptime during Sunday services and special collections." No other metric is stated for this feature.

## Jira Preparation

Candidate user stories and task titles this feature will produce:
- As a baptized member, I want to see my giving history in real time, so that I can track my contributions without asking a clerk.
- As a member, I want to give through a transfer gateway, so that my contribution is traceable end to end.
- As a finance admin, I want to reconcile the month by period and type, so that the audit finishes quickly.
- Technical task: model the contribution record and the gateway reference field.
- Technical task: implement the fee model configuration screen.
- Technical task: implement the reconciliation and export views.