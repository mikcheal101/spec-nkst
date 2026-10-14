# Sub-Feature: Sync on reconnect

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `4.3` Sync on reconnect |
| Version | Version one |
| Parent Feature | `4` Offline Data Saving and Sync |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 4`, `REQ-052` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature syncs cached entries automatically to the platform when connectivity returns, with a visible sync status. When the device or browser detects that the internet is back, any pending or failed entries from the offline period are sent to the server, and their status is updated to synced or retained as failed if the sync did not succeed.

## What the PRD states

> "When connectivity returns, cached entries sync automatically to the platform with a visible sync status."

The PRD assigns this requirement `User Target: Both` and `Priority: High`.

## Why It Exists

The PRD describes a system where the clerk or member does not have to manually re enter data after a connection drop. This sub-feature exists so that as soon as connectivity is restored, the platform moves the cached entries into the live registry or contribution records, and the user sees immediately whether the sync succeeded or failed.

## Detailed Mechanics

1. The mobile app or web portal detects that the connection has been restored.
2. The system scans the local cache for any entries with a pending or failed status.
3. For each pending or failed entry, the system sends a sync request to the platform server with the entry data.
4. The server processes the sync request: if the entry is a member record, it is added or updated in the registry; if it is a contribution entry, the contribution is recorded with the gateway reference and fee model applied.
5. The entry's status is updated to synced on the device/browser, and a sync success notification is shown.
6. If the server returns an error (for example, a conflict or a validation failure), the entry's status is updated to failed, and a sync failure notification is shown with a retry option.
7. The user can manually retry a failed entry, which re sends the sync request.
8. The sync action is itself logged in the audit trail, recording what was synced, when, and whether it succeeded or failed.

The flow runs on both the mobile app and the web portal; both surfaces have automatic sync on reconnect.

## State and Data Impact

Before the sync, the entries are in the cache with pending or failed status. After the sync, the entries are written to the platform and their status changes to synced. If the sync fails, the entries remain in the cache with failed status and a retry option. The platform records (member registry, contribution records) are updated to include the synced entries, and the audit trail logs the sync action.

## Interaction With the Rest of the Product

`4.1` and `4.2` produce the cached entries that this sub-feature syncs. `4.4` handles conflicts that arise when the same record was edited both in the cache and on the server. `2.3` and `2.5` are affected when a contribution is synced; the gateway reference and fee model are applied at sync time. `6.6` gates who can sync; the default allows any registered clerk or member. `5.3` logs the sync action in the immutable audit trail.

## Edge Cases

1. The connection returns but the server is temporarily unavailable. The entry must remain in pending status and retry the next time connectivity returns.
2. Multiple entries sync simultaneously. Each entry must be processed independently; a failure on one entry must not prevent the others from syncing.
3. A sync request times out. The entry must remain in pending status and show a timeout message with a retry option.
4. A sync succeeds for some entries and fails for others. Each entry's status must be updated independently (some synced, some failed).
5. The user goes back offline before the sync completes. The sync must pause and resume when the connection returns again.

## Error and Gap Handling

A temporarily unavailable server: the entry stays pending and retries on the next connectivity return. A sync failure (conflict, validation error): the entry is marked failed and a retry option is shown. A timeout: the entry stays pending and a timeout message with retry appears. Mixed success/failure: each entry's status is updated independently. Going back offline: the sync pauses and resumes when connectivity returns.

## Accessibility and Trust Notes

The sync status must be indicated clearly on the screen so the user knows whether their entries are synced. The retry option must be actionable and labeled clearly. The sync success and failure notifications must be readable and actionable. The audit trail entry for the sync must not expose sensitive data; it should record only the entry ID, timestamp, and success/failure status.

## Acceptance Criteria

- When the internet returns, cached entries sync automatically to the platform.
- Each entry's status is updated to synced or failed, and the user sees a visible sync status.
- A sync success notification is shown when an entry is synced.
- A sync failure notification with a retry option is shown when an entry fails to sync.
- The user can manually retry a failed entry.
- The sync action is logged in the audit trail with the entry ID, timestamp, and success/failure status.
- If the connection returns but the server is unavailable, the entry stays pending and retries later.
- Multiple entries sync independently; a failure on one does not prevent the others.

## Test Scenarios

1. Auto sync on reconnect. Setup: a cached entry exists with pending status, the connection returns. Assertion: the entry syncs to the platform and its status changes to synced.
2. Sync failure with retry. Setup: a cached entry syncs and the server returns a conflict. Assertion: the entry is marked failed and a retry option appears.
3. Server unavailable. Setup: the connection returns but the server is down. Assertion: the entry stays pending and will retry on the next connectivity return.
4. Multiple entries sync. Setup: several cached entries sync simultaneously. Assertion: each entry is processed independently; a failure on one does not prevent the others.
5. Timeout. Setup: a sync request times out. Assertion: the entry stays pending and a timeout message with retry appears.
6. Goes back offline. Setup: the connection returns and sync starts, then the connection drops again. Assertion: the sync pauses and resumes when connectivity returns.

## Jira-Ready Seed

User story: As a clerk, I want cached entries to sync automatically when the internet returns, so that I do not have to manually re enter data after a connection drop.
Technical tasks: build the connectivity detection, scan the cache for pending/failed entries, send sync requests to the server, update each entry's status independently, and show success/failure notifications with retry options.
Depends on: `4.1`, `4.2`, `4.4`, `2.3`, `2.5`, `6.6`, and `5.3`.