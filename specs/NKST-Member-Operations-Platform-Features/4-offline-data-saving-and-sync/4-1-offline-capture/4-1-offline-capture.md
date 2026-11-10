# Sub-Feature: Offline capture

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `4.1` Offline capture |
| Version | Version one |
| Parent Feature | `4` Offline Data Saving and Sync |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 4`, `REQ-050` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature ensures that registration and contribution recording keep working when the internet drops, caching the data locally on the device or browser. The member or clerk can continue their work offline, and the entries will sync when connectivity returns.

## What the PRD states

> "Registration and contribution recording keep working when the internet drops, caching the data locally on the device or browser."

The PRD assigns this requirement `User Target: Both` and `Priority: High`.

## Why It Exists

The PRD describes assemblies with intermittent internet. This sub-feature exists so that a clerk or member is not blocked from registering a new member or recording a contribution just because the connection is temporarily down. The local cache preserves the data until the connection returns.

## Detailed Mechanics

1. The member or clerk opens the registration or contribution screen on the mobile app or web portal.
2. If the connection is detected as down, the system switches to offline mode and caches the entry locally on the device or in the browser's local storage.
3. The cached entry is given a pending status and is marked unsynced.
4. The member or clerk completes the entry as normal: entering the member identity, contact details, contribution amount and type, or the contribution details.
5. When the connection returns, the cached entry automatically syncs to the platform server.
6. The sync changes the entry's status to synced and updates the registry or contribution record on the platform.
7. If the connection does not return within a reasonable time, the user sees a sync failure status and can retry the entry manually.

The flow runs on the mobile app and the web portal; both surfaces have an offline mode that caches data locally.

## State and Data Impact

Before the offline mode, the entry is lost if the connection drops. After the offline mode, the entry is cached locally with a pending status. After sync, the entry is written to the platform and its status changes to synced. The platform record is updated to include the new member or contribution, and the audit trail logs the creation or adjustment.

## Interaction With the Rest of the Product

`4.2` caches the essential data that this sub-feature relies on (member records and pending contribution entries). `4.3` handles the sync on reconnect, which this sub-feature triggers. `2.3` and `2.5` are affected when a contribution is recorded offline; the gateway reference and fee model are applied when the sync completes. `6.6` gates who can start an entry in offline mode; the default allows any registered member or clerk. `4.4` handles conflict resolution when two offline edits touch the same record.

## Edge Cases

1. The connection drops mid entry. The system must cache what has been entered so far and not lose the partial data.
2. The connection returns but the sync fails (for example, a conflict). The entry must show a failed status and offer a retry.
3. Two clerks enter the same member locally. The conflict handling in `4.4` must surface the conflict when both try to sync.
4. The device is switched offline and back online multiple times. Each sync must be idempotent; duplicate entries must be refused.
5. A member records a contribution offline. The gateway reference must be applied when the sync completes, not before.

## Error and Gap Handling

A partial entry is cached and preserved. A failed sync shows a retry state and allows the user to retry the entry. A duplicate sync is refused and logged. A connection that never returns leaves the entry in failed status until the user or admin manually resolves it.

## Accessibility and Trust Notes

The offline mode must be indicated clearly on the screen so the user knows they are working without a connection. The cached data must not contain sensitive passwords or encryption keys; only the entry data (member identity, contribution amount, etc.) is cached. The sync failure message must be readable and actionable.

## Acceptance Criteria

- When the internet drops, registration and contribution recording continue working by caching data locally.
- A cached entry has a pending status and is marked unsynced.
- When the connection returns, the cached entry automatically syncs to the platform.
- After sync, the entry's status changes to synced and the platform record is updated.
- If the connection does not return, the user sees a sync failure status and can manually retry.
- Partial entries captured before a connection drop are preserved and included in the sync.

## Test Scenarios

1. Connection drop during registration. Setup: a clerk registers a member while the connection drops. Assertion: the entry is cached locally with pending status.
2. Auto sync on reconnect. Setup: the connection returns and the cached entry syncs. Assertion: the entry status changes to synced and the member appears in the registry.
3. Failed sync. Setup: the connection returns but the sync fails (conflict). Assertion: the entry shows failed status and a retry option appears.
4. Duplicate sync. Setup: the same entry syncs twice. Assertion: the second sync is refused and logged.
5. Partial entry preserved. Setup: a clerk starts a contribution, the connection drops, and they resume later. Assertion: the partial contribution is cached and included in the eventual sync.

## Jira-Ready Seed

User story: As a clerk, I want to register a member or record a contribution even when the internet is down, so that my work is not blocked by temporary connectivity issues.
Technical tasks: build the offline mode detection, cache entry data locally, manage the pending/synced/failed statuses, implement the auto sync on reconnect, and handle conflict resolution with `4.4`.
Depends on: `4.2`, `4.3`, `4.4`, `2.3`, `2.5`, and `6.6`.