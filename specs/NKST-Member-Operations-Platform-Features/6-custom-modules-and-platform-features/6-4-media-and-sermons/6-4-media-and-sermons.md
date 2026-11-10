# Sub-Feature: Media and sermons

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `6.4` Media and sermons |
| Version | Version one |
| Parent Feature | `6` Custom Modules and Platform Features |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Custom Modules and Platform Features`, `REQ-073` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature lets comms admin publish sermons in video, audio, and print, and updates or drops media publications. Members can view and listen to sermons on the mobile app, and the comms admin manages the media library on the web portal.

## What the PRD states

> "Comms admin publishes sermons in video, audio, and print, and updates or drops media publications."

The PRD assigns this requirement `User Target: Both` and `Priority: High`.

## Why It Exists

The PRD describes a church that archives its sermons and makes them available to the congregation. This sub-feature exists so that the comms admin can manage a media library of sermons in multiple formats, and members can access them on the mobile app for listening or viewing at their convenience.

## Detailed Mechanics

1. Comms admin opens the media management screen from the web portal.
2. The admin uploads a sermon in one or more formats: video (MP4), audio (MP3), or print (PDF).
3. The admin enters the sermon title, speaker, date preached, and a brief description.
4. The admin selects whether the sermon is active (available to members) or dropped (removed from the library).
5. The system stores the media files and the metadata in the media library.
6. The sermon appears in the mobile app's media screen, where members can browse, play video or audio, or download/print the PDF.
7. The comms admin can update a sermon's metadata or change its active/dropped status.
8. The comms admin can drop a sermon, which removes it from the mobile app library but keeps the media files in storage for archival purposes.

The flow runs on the web portal for management and on the mobile app for member viewing.

## State and Data Impact

Before the sermon is published, no media record exists on the platform. After it is published, a media record is written with the title, speaker, date, description, formats, and active/dropped status. The media is visible to all members on the mobile app. The management action (upload, update, drop) is logged in the audit trail in `5.3`.

## Interaction With the Rest of the Product

`6.2` works in parallel for announcements. `6.3` works in parallel for events. `6.5` may provide approval pipelines for sensitive sermons. `6.6` gates who can manage media; the default allows comms admin. `5.3` logs the management action in the audit trail. `6.7` and `6.8` supply church and department scope, so the comms admin can manage media for their church or department.

## Edge Cases

1. The upload fails partway through. The media record must be created with a "failed upload" status and the admin must be able to retry the upload.
2. A sermon is dropped and later restored. The admin can change the active status back to active and the sermon reappears on the mobile app.
3. A member tries to upload a sermon. The system must refuse the attempt and log it; only comms admin can upload sermons.
4. The media file is corrupted. The system must flag the sermon and refuse to play it; the admin must re upload or replace the file.

## Error and Gap Handling

Upload failure: the media record is created with failed status and a retry option is shown. Non comms admin upload: the attempt is refused and logged. Corrupted file: the sermon is flagged and the admin is notified to re upload or replace the file.

## Acceptance Criteria

- Comms admin can upload a sermon in video, audio, or print format from the web portal.
- The admin enters the sermon title, speaker, date preached, and description.
- The admin sets the sermon as active or dropped.
- The sermon appears in the mobile app's media screen.
- Members can browse, play, or download the sermon formats.
- A non comms admin upload attempt is refused and logged.
- A failed upload can be retried by the admin.

## Test Scenarios

1. Upload sermon. Setup: a comms admin uploads a sermon in MP4 format. Assertion: the media record is created and the sermon appears on the mobile app.
2. Drop and restore. Setup: a comms admin drops a sermon, then restores it to active. Assertion: the sermon is removed and then reappears on the mobile app.
3. Non comms admin upload. Setup: a regular member tries to upload a sermon. Assertion: the attempt is refused and logged.
4. Failed upload. Setup: an upload fails partway through. Assertion: the media record has a failed status and a retry option appears.

## Jira-Ready Seed

User story: As a member, I want to view and listen to sermons on the mobile app, so that I can access them at my convenience.
Technical tasks: build the media management screen for comms admin, model the media record with formats and active/dropped status, build the mobile app media screen with play and download, enforce the comms admin-only upload gate, and handle the edge cases of failed uploads and corrupted files.
Depends on: `6.2`, `6.3`, `6.6`, and the media storage layer.