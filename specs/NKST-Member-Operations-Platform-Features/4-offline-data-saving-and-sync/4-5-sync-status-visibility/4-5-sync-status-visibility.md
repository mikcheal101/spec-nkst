# Sub-Feature: Sync status visibility

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `4.5` Sync status visibility |
| Version | Version one |
| Parent Feature | `4` Offline Data Saving and Sync |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Module 4`, `REQ-054` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature lets the user see which entries are pending, synced, or failed, and can retry a failed entry. The sync status is shown on every cached entry so the user always knows the state of their data.

## What the PRD states

> "The user can see which entries are pending, synced, or failed, and can retry a failed entry."

The PRD assigns this requirement `User Target: Both` and `Priority: Medium`.

## Why It Exists

The PRD describes a clerk who needs to know whether their offline work has made it onto the platform. This sub-feature exists so the clerk, member, or admin has a clear visual indicator on each entry: green check for synced, clock for pending, and exclamation for failed. The retry action is one tap or click away.

## Detailed Mechanics

1. Every cached entry (member record or contribution entry) displays a sync status indicator: a green check mark for synced, a clock for pending, or an exclamation mark for failed.
2. The indicator is based on the entry's status field, which is updated by `4.3` (sync on reconnect) when the sync completes successfully or fails.
3. When the user taps or clicks a failed entry, a retry action is shown. The retry re sends the sync request to the platform server.
4. After the retry, the status is updated: if the server accepts the entry, it changes to synced; if the server rejects it, it stays failed and the user can retry again.
5. A pending entry shows the clock indicator and does not yet have a sync attempt result; the user can manually trigger a sync request if they want to force it, or wait for the automatic sync.
6. A synced entry shows the green check and is read only; the user cannot retry it because it is already up to date.

The sync status indicator appears on the member record screen, the contribution entry screen, the offline queue screen, and any list that displays cached entries.

The flow runs on both the mobile app and the web portal; both surfaces show the sync status.

## State and Data Impact

Before the status indicator, the user has no visual cue about whether their offline entries are on the platform. After the status indicator, the user sees the state of each entry (pending, synced, failed) and can take action on failed entries. The entry's status field is updated by the sync actions in `4.3` and `4.5`.

## Interaction With the Rest of the Product

`4.3` updates the status field when sync completes or fails. `4.5` reads the status field and shows the indicator and retry action. `4.1` and `4.2` produce the cached entries that carry the status field. `6.6` gates who can see the sync status; the default allows any registered user. The retry action in `4.5` calls `4.3` internally.

## Edge Cases

1. The connection drops while the status indicator is being displayed. The indicator must reflect the last known status from the cache, not attempt a live check that fails.
2. A failed entry is retried successfully. The status changes from failed to synced and the green check appears.
3. A sync is manually triggered on a pending entry. The entry status changes to synced if the server accepts it, or to failed if the server rejects it.
4. Multiple entries have different statuses. Each entry shows its own status indicator independently.
5. The user clears the app cache. The status indicators must refetch from the server on the next online launch, or show a default (pending) until the cache is repopulated.

## Error and Gap Handling

A connection drop while displaying: the indicator shows the last known cached status. A successful retry: the status changes to synced. A failed retry: the status stays failed and the user can retry again. A manual sync on pending: the status updates based on the server response. Cache cleared: the indicators show pending until the cache is repopulated.

## Accessibility and Trust Notes

The sync status indicators must be more than color alone; they must include text labels: "Synced", "Pending", "Failed". The retry action must be keyboard accessible and screen reader friendly. The status labels must be clear and actionable. The failed status must include an explanation of why the sync failed, when possible.

## Acceptance Criteria

- Every cached entry displays a sync status indicator: green check for synced, clock for pending, exclamation for failed.
- The indicator includes a text label: "Synced", "Pending", or "Failed".
- A failed entry shows a retry action; tapping or clicking it re syncs the entry.
- A successful retry changes the status from failed to synced.
- A pending entry shows the clock indicator and can be manually synced.
- A synced entry shows the green check and is read only.
- Each entry's status is independent; multiple entries can have different statuses.
- After the app cache is cleared, the indicators show pending until the cache is repopulated.

## Test Scenarios

1. Synced indicator. Setup: a contribution entry that has been synced. Assertion: the green check mark and "Synced" text appear.
2. Pending indicator. Setup: a contribution entry that is pending sync. Assertion: the clock icon and "Pending" text appear.
3. Failed indicator and retry. Setup: a contribution entry that failed to sync. Assertion: the exclamation mark and "Failed" text appear, and a retry action is shown.
4. Successful retry. Setup: a failed entry is retried and the server accepts it. Assertion: the status changes to synced and the green check appears.
5. Manual sync on pending. Setup: a pending entry is manually triggered for sync. Assertion: the status updates to synced or failed based on the server response.
6. Cache cleared. Setup: the app cache is cleared and the screen is reopened. Assertion: the status indicators show pending until the cache is repopulated.

## Jira-Ready Seed

User story: As a clerk, I want to see which of my offline entries are synced, pending, or failed, and be able to retry a failed entry with one tap, so that I always know the state of my data and can recover from sync failures.
Technical tasks: model the status field on each cached entry, render the status indicators with text labels, implement the retry action for failed entries, and handle the status updates after successful and failed retries.
Depends on: `4.1`, `4.2`, `4.3`, `6.6`, and the status field model.