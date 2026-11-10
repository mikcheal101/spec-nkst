# Sub-Feature: Local cache of essential data

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `4.2` Local cache of essential data |
| Version | Version one |
| Parent Feature | `4` Offline Data Saving and Sync |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 4`, `REQ-051` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature caches essential records (member records and pending contribution entries) so a clerk can keep working without a connection. The cache stores the most recent member and contribution data locally on the device or browser, allowing the clerk to view and edit records even when offline.

## What the PRD states

> "The system caches essential records (member records and pending contribution entries) so a clerk can keep working without a connection."

The PRD assigns this requirement `User Target: Both` and `Priority: High`.

## Why It Exists

The PRD describes a clerk with low computer literacy who must be able to keep working even when the internet is down. This sub-feature exists so the clerk has immediate access to the member records and contribution entries they have recently used, without needing to query the server. The cache is a lightweight local store that persists across app launches while the connection is down.

## Detailed Mechanics

1. The clerk opens the member record screen or contribution screen on the mobile app or web portal.
2. The system queries the server for the essential data (the member record or the pending contribution entry).
3. The essential data is stored in the local cache on the device or in the browser's local storage.
4. The cache is tagged with a timestamp and a connection status: online or offline.
5. While the connection is offline, the clerk can view the cached record, make edits, and the edits are also cached.
6. When the connection returns, the cache synchronizes with the server: the edited record is sent up, and the server record is updated.
7. The cache persists across app launches while the connection remains offline, up to a configurable limit (for example, the 10 most recent records).

The cache only holds essential data: member identity, contact, church, and baptism status for member records; contribution amount, type, and status for contribution entries. No sensitive fields (such as passwords or encryption keys) are cached.

The flow runs on the mobile app and the web portal; both surfaces have a local cache.

## State and Data Impact

Before the cache, the clerk must have a live connection to view or edit member and contribution records. After the cache is populated, the clerk can view and edit the cached records offline. After sync, the server records are updated to match the cached edits. The audit trail logs every create, update, and the sync action.

## Interaction With the Rest of the Product

`4.1` relies on the cache to keep working when the internet drops. `4.3` syncs the cache to the server when connectivity returns. `4.4` handles conflicts when the same record is edited in the cache and in the server simultaneously. `2.3` and `2.5` are affected when a contribution in the cache is synced; the gateway reference and fee model are applied at sync time. `6.6` gates who can access the cache; the default allows any registered clerk or member.

## Edge Cases

1. The cache is cleared (for example, the user clears app data or the browser cache is reset). The next online launch must refetch the essential data from the server.
2. The cache limit is reached (for example, 10 most recent records). The least recently used record is evicted to make room for a new one.
3. A record is edited in the cache and also edited on the server before sync. The conflict handling in `4.4` must surface the conflict for a human decision.
4. The clerk views a member record that has never been cached. The system must fetch it from the server and then cache it.
5. A contribution entry in the cache has a gateway reference that was not yet applied. The sync must apply the gateway reference before writing to the server.

## Error and Gap Handling

A cleared cache refetches from the server on the next online launch. A cache limit evicts the least recently used record and logs the eviction. A concurrent edit triggers the conflict handling in `4.4`. A gateway reference that was not applied is applied during sync.

## Accessibility and Trust Notes

The cache must not be accessible to the user as a separate folder or file; it is internal to the app or browser. The cached data must not contain sensitive passwords or encryption keys. The sync status must be indicated clearly on the screen so the clerk knows whether the record is up to date.

## Acceptance Criteria

- The clerk can view a recently used member record without a live connection, using the local cache.
- The clerk can edit a cached member record while offline, and the edit is cached.
- The clerk can view a recently used pending contribution entry without a live connection.
- The clerk can edit a cached contribution entry while offline, and the edit is cached.
- When the connection returns, the cached edits sync to the server and the server records are updated.
- The cache persists across app launches while the connection is offline, up to the configured limit.
- No sensitive fields (passwords, encryption keys) are cached.

## Test Scenarios

1. View cached member. Setup: a clerk views a member record, the connection drops, and the clerk reopens the screen. Assertion: the cached record is shown.
2. Edit cached member. Setup: a clerk edits a cached member record while offline, then the connection returns. Assertion: the server record is updated to match the edit.
3. View cached contribution. Setup: a clerk views a pending contribution entry, the connection drops, and the clerk reopens the screen. Assertion: the cached entry is shown.
4. Edit cached contribution. Setup: a clerk edits a cached contribution entry while offline, then the connection returns. Assertion: the server entry is updated to match the edit.
5. Cache limit. Setup: the clerk has cached 10 records and views an 11th new record. Assertion: the least recently used record is evicted and logged, and the new record is cached.
6. No sensitive data in cache. Setup: the cache is inspected. Assertion: no passwords or encryption keys are present.

## Jira-Ready Seed

User story: As a clerk, I want to keep working without a connection, so that the essential member and contribution data I need is available offline.
Technical tasks: build the local cache on the mobile app and web portal, model the essential data fields, manage the cache timestamp and status, implement the sync on reconnect, and enforce the cache limit and eviction policy.
Depends on: `4.1`, `4.3`, `4.4`, `2.3`, `2.5`, and `6.6`.