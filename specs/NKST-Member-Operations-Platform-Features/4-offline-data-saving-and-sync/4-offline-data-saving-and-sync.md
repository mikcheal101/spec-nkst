# Feature: Offline Data Saving and Sync

## Header Block

| Field | Value |
|---|---|
| Feature ID | `4` |
| Feature Name | Module 4: Offline Data Saving and Sync |
| Version | Version one |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 4` |
| Author | Hirekaan Micheal Hemen |

## Overview

Offline Data Saving and Sync keeps registration and contribution recording alive when the internet drops. Data is cached locally on the device or browser, queued entries sync automatically when connectivity returns with a visible sync status, and conflicts between two offline edits are surfaced for a human decision rather than silently overwritten.

## What the PRD states

> ### Module 4: Offline Data Saving and Sync
>
> | Requirement ID | Feature / Module Name | Requirement Description | User Target | Priority |
> |---|---|---|---|---|
> | REQ-050 | Offline capture | Registration and contribution recording keep working when the internet drops, caching the data locally on the device or browser. | Both | High |
> | REQ-051 | Local cache of essential data | The system caches essential records (member records and pending contribution entries) so a clerk can keep working without a connection. | Both | High |
> | REQ-052 | Sync on reconnect | When connectivity returns, cached entries sync automatically to the platform with a visible sync status. | Both | High |
> | REQ-053 | Conflict handling | If two offline edits touch the same record, the system surfaces the conflict for a human decision instead of silently overwriting. | Both | High |
> | REQ-054 | Sync status visibility | The user can see which entries are pending, synced, or failed, and can retry a failed entry. | Both | Medium |

## Why It Exists

The PRD names intermittent internet as a reality at the assembly sites, and the clerk role depends on a simple interface that must keep working offline. This feature exists so a dropped connection degrades to local capture rather than a hard failure, and so no offline work disappears or silently collides with another edit.

## How It Works End to End

The trigger is a registration or contribution action taken while the device or browser has no connection. The entry is written into a local queue as `pending` instead of being rejected. In parallel, the device retains cached copies of essential member records and pending contribution entries so the clerk keeps working. When connectivity returns, the queue replays automatically to the platform and each entry moves to `synced`. If the replay finds that a later edit already touched the same record on the platform, the entry is flagged `conflicted` and a human decision is required. Failed entries stay visible as `failed` and can be retried. The user sees the whole state per entry: `pending`, `synced`, or `failed`, plus the conflict case. The work runs on the device for capture and on the platform for sync and conflict resolution.

## Inputs It Consumes

The feature consumes new registration and contribution operations, the connectivity state of the device, cached member records and pending contribution entries, and the server state of a record when a queued entry is replayed.

## Outputs It Produces

The feature produces a local queue of pending operations, cached essential records, synced platform records, conflict cases awaiting a human decision, and a per entry status that both surfaces render. The synced records feed the member registry and the contribution records, and the conflicts feed the resolution flow.

## User Journey Summary

Journey C in the PRD (`A clerk registers a member from the web portal`) walks the offline path in steps. The clerk enters the member identity, contact, church, and baptism details. If the internet is down, the entry saves locally and shows a pending sync status. When the connection returns, the entry syncs automatically and the status changes to synced. If another edit touched the same record, the system raises a conflict for the clerk to resolve by hand, and the record appears in the registry searchable by baptismal number and name.

## Sub-Feature Index

| Sub-Feature ID | Name | Description | Folder |
|---|---|---|---|
| `4.1` | Offline capture | Registration and contribution recording keep working offline and cache locally. | `4-1-offline-capture/4-1-offline-capture.md` |
| `4.2` | Local cache of essential data | Essential member records and pending contribution entries stay usable without a connection. | `4-2-local-cache-of-essential-data/4-2-local-cache-of-essential-data.md` |
| `4.3` | Sync on reconnect | Cached entries sync automatically on reconnect with a visible status. | `4-3-sync-on-reconnect/4-3-sync-on-reconnect.md` |
| `4.4` | Conflict handling | Two offline edits on the same record surface for a human decision. | `4-4-conflict-handling/4-4-conflict-handling.md` |
| `4.5` | Sync status visibility | Users see pending, synced, or failed per entry and can retry failures. | `4-5-sync-status-visibility/4-5-sync-status-visibility.md` |

## Feature-Level Acceptance Criteria

- A registration or contribution recorded while offline saves locally as `pending` and is not rejected.
- A clerk continues entering members and contributions while fully offline because essential records stay cached.
- When connectivity returns, queued entries sync automatically and the visible status changes to `synced`.
- Two offline edits touching the same record produce a conflict that waits for a human decision.
- A failed entry stays visible as `failed` and can be retried.
- The sync state is visible per entry in both surfaces.

## Edge Cases and Risks

- The device loses power while entries sit in the local queue. The queue must be durable so the entries survive a restart.
- Two devices edit the same member record offline. The later replay must surface the conflict instead of overwriting silently.
- The connection returns and drops again mid sync. The replay must resume or retry without duplicating entries.
- A queued contribution is synced twice. The platform must apply it once so giving is not double counted.
- The local cache grows unbounded. The cache must follow a bounded retention rule so the device does not fill.

## Dependencies

This feature depends on `1-member-registration-and-identity` and `2-financial-contributions-and-giving` for the operations it captures and replays. It feeds back into the member registry and contribution records once entries sync, and it produces the conflict events that the audit trail in `5-paper-backup-and-activity-logs` records.

## Measurable Outcomes

The PRD ties the sync timing to this feature. From PRD `Section 5`: "Offline sync: a queued entry syncs within 30 seconds of connectivity returning, and sync failures are surfaced to the user immediately." No other metric is stated for this feature.

## Jira Preparation

Candidate user stories and task titles this feature will produce:
- As a clerk, I want registration to keep working offline, so that a dropped connection never stops my work.
- As a user, I want to see which entries are pending, synced, or failed, so that I can trust the sync state.
- As a user, I want a clear conflict screen, so that I can resolve two offline edits by hand.
- Technical task: implement the durable local queue on both surfaces.
- Technical task: implement idempotent replay so a synced entry is applied once.
- Technical task: implement the conflict resolution flow.