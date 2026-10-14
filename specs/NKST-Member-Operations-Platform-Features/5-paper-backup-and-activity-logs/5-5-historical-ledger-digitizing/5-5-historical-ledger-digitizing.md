# Sub-Feature: Historical ledger digitizing

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `5.5` Historical ledger digitizing |
| Version | Version one |
| Parent Feature | `5` Paper Backup and Activity Logs |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 5`, `REQ-064` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature handles the digitizing of historical ledger data during migration. Member related historical data is entered by the member or by a clerk, while church sensitive information about a member is entered by the system admin, and the source is tagged on each record. The digitizing process ensures that the historical record is preserved in the digital platform with full context and provenance.

## What the PRD states

> "During migration, member related historical data is entered by the member or by a clerk, while church sensitive information about a member is entered by the system admin, and the source is tagged on each record."

The PRD assigns this requirement `User Target: Web App` and `Priority: Medium`.

## Why It Exists

The PRD describes the pilot transition from the hard cover note to the digital platform. This sub-feature exists so that historical member data from the physical ledger is not lost during the migration; the church can continue to reference past members, and the digitized records carry a source tag so auditors know whether the data was entered by the member, a clerk, or the system admin.

## Detailed Mechanics

1. The system admin or a clerk opens the digitizing screen from the web portal.
2. The screen presents two entry modes: "Member entered" and "System admin entered".
3. If "Member entered" is selected, the clerk or the member themselves enters the historical member data (name, baptism status, baptismal number, contact, church belonging) into the system. The system tags each record with `source: member` and `source_tag: digitized by member/clerk`.
4. If "System admin entered" is selected, the system admin enters the data, but only the church sensitive information (for example, confession notes, disciplinary details, personal financial information that the church holds). The system tags each record with `source: system admin` and `source_tag: digitized by system admin`.
5. All other member data that is not sensitive is entered by the member or clerk through the "Member entered" mode.
6. Each digitized record is written to the member registry and carries the `source` and `source_tag` fields.
7. The audit trail logs the digitizing action, recording who entered the data, what data was entered, and the source tag.
8. The paper ledger is kept alongside the digital record, as described in `5.1` (Paper backup alongside digital), and the `paper_backup` flag is set as appropriate.

The flow runs on the web portal only. The digitizing screen is a web-based tool for clerks and system admins.

## State and Data Impact

Before the digitizing, the historical data exists only in the physical ledger. After the digitizing, the historical data is in the member registry with the `source` and `source_tag` fields. The audit trail gains entries for each digitizing action. The `paper_backup` flag may be set depending on whether a paper counterpart exists.

## Interaction With the Rest of the Product

`5.1` sets the `paper_backup` flag as appropriate during digitizing. `5.3` logs every digitizing action in the immutable audit trail. `5.4` allows authorized roles to browse the audit trail and see the digitizing entries. `6.6` gates who can enter data in digitizing mode; the default allows clerks (for member entered) and system admin (for system admin entered). The source and source_tag fields feed the governance reports in `3.6`.

## Edge Cases

1. A member's historical data is entered in "Member entered" mode but contains sensitive information. The system must flag the entry and require the system admin to review and re enter the sensitive parts in "System admin entered" mode.
2. A digitizing entry is made with incomplete data. The system must allow the entry to be saved with a "pending" status and prompt the user to complete it later.
3. The same historical member is digitized twice (for example, the clerk enters the data and then the system admin re enters it). The system must detect the duplicate and either refuse the second entry or merge the two, logging the action.
4. The paper ledger is damaged or illegible for a historical entry. The system admin must enter the data based on the best available information and tag it with `source: system admin` and a note that the paper source was damaged.
5. A member reviews their own historical data that was digitized. The member must see the `source` and `source_tag` fields, but they must not be able to edit or remove them; the fields are read only for the member.

## Error and Gap Handling

Sensitive data in member entered mode: the system flags the entry and requires the system admin to re enter the sensitive parts. Incomplete data: the entry is saved with "pending" status and a prompt to complete later. Duplicate digitizing: the second entry is refused or merged, and the action is logged. Damaged paper source: the system admin enters the data and tags it with a note about the damaged source. Member read only: the source and source_tag fields are shown to the member but are read only.

## Acceptance Criteria

- The digitizing screen presents two entry modes: "Member entered" and "System admin entered".
- "Member entered" tags each record with `source: member` and `source_tag: digitized by member/clerk`.
- "System admin entered" tags each record with `source: system admin` and `source_tag: digitized by system admin`.
- All non sensitive historical data is entered through "Member entered" mode.
- Each digitized record carries the `source` and `source_tag` fields and is written to the member registry.
- The audit trail logs the digitizing action, recording who entered the data, what data was entered, and the source tag.
- The paper backup flag is set as appropriate per `5.1`.

## Test Scenarios

1. Member entered mode. Setup: a clerk selects "Member entered" and enters historical data for a member. Assertion: the record is written to the registry with `source: member` and `source_tag: digitized by member/clerk`.
2. System admin entered mode. Setup: a system admin selects "System admin entered" and enters only sensitive data. Assertion: the record is written with `source: system admin` and `source_tag: digitized by system admin`.
3. Sensitive data flagged. Setup: a clerk enters sensitive data in "Member entered" mode. Assertion: the system flags the entry and requires the system admin to review and re enter the sensitive parts.
4. Incomplete data. Setup: a clerk starts a digitizing entry but does not complete all fields. Assertion: the entry is saved with "pending" status and a prompt to complete later.
5. Duplicate digitizing. Setup: the clerk enters the same historical member data and the system admin re enters it. Assertion: the second entry is refused or merged, and the action is logged.
6. Damaged paper source. Setup: the paper ledger is damaged for a historical entry. The system admin enters the data and tags it with a note about the damaged source. Assertion: the record is written with `source: system admin` and a damage note in the source_tag.

## Jira-Ready Seed

User story: As a clerk, I want to digitize historical member data from the physical ledger into the digital platform, so that the church can reference past members after the migration. Technical tasks: build the digitizing screen with the two entry modes, model the source and source_tag fields, implement the member entered and system admin entered flows, log the digitizing action in the audit trail, and handle the edge cases of sensitive data, incomplete data, duplicates, and damaged paper sources.
Depends on: the member registry model, the audit trail service, the source and source_tag field model, and the access control matrix `6.6`.