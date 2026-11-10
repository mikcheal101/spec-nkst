# Sub-Feature: Announcements

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `6.2` Announcements |
| Version | Version one |
| Parent Feature | `6` Custom Modules and Platform Features |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Custom Modules and Platform Features`, `REQ-071` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature lets church admin and comms admin publish announcements, and members view them on the mobile app. Announcements can be set to require an approval pipeline before they publish, or publish immediately if no pipeline is configured.

## What the PRD states

> "Church admin and comms admin publish announcements, and members view them on the mobile app."

The PRD assigns this requirement `User Target: Both` and `Priority: High`.

## Why It Exists

The PRD describes a church where content is regularly shared with the congregation. This sub-feature exists so that leadership can publish announcements (for example, service changes, event updates, prayer requests) and members can view them on their phones, keeping the congregation informed.

## Detailed Mechanics

1. Church admin or comms admin opens the announcement creation screen from the web portal.
2. The admin enters the announcement title, body, and optionally selects an approval pipeline.
3. If an approval pipeline is set, the announcement waits for approval before it publishes.
4. The admin submits the announcement.
5. If a pipeline is set, the announcement routes to the configured role(s) for review and approval or rejection.
6. On approval (or immediately if no pipeline is set), the announcement publishes.
7. The announcement appears in the mobile app's announcements screen, where members can view it.
8. Members can act on the announcement, for example by replying by direct message (as described in `6.1`).

The flow runs on the web portal for creation and publishing, and on the mobile app for viewing. Members cannot create or publish announcements; only church admin and comms admin have that authority.

## State and Data Impact

Before the announcement is published, no announcement record exists on the platform. After it is published, an announcement record is written with the title, body, publisher, publish date, and approval status. The announcement is visible to all members on the mobile app. The publish event is logged in the audit trail in `5.3`.

## Interaction With the Rest of the Product

`6.1` is available when a member acts on an announcement by direct message. `6.3` works in parallel for events. `6.4` works in parallel for media and sermons. `6.5` provides the approval pipeline configuration. `6.7` and `6.8` supply church and department scope, so the admin can create announcements for their church or department. `5.3` logs the publish action in the audit trail. `6.6` gates who can create announcements; the default allows church admin and comms admin.

## Edge Cases

1. A pipeline is set but no one is available to approve. The announcement must remain in pending status and surface the delay to an admin.
2. The admin modifies an announcement after it has been submitted but before it publishes. The pipeline must re evaluate with the new content.
3. A member tries to create an announcement. The system must refuse the attempt and log it; only church admin and comms admin can create announcements.
4. An announcement is rejected by the pipeline. The admin can edit and resubmit, or discard it.
5. An announcement is set to publish immediately (no pipeline). It appears on the mobile app as soon as the admin submits it.

## Error and Gap Handling

No one available to approve: the announcement stays pending and an admin is notified. Admin modifies after submit: the pipeline re evaluates. Non admin create attempt: the attempt is refused and logged. Announcement rejected: the admin can edit and resubmit or discard.

## Acceptance Criteria

- Church admin or comms admin can create an announcement with title, body, and optional pipeline.
- If a pipeline is set, the announcement waits for approval before publishing.
- If no pipeline is set, the announcement publishes immediately.
- The announcement appears in the mobile app's announcements screen.
- Members can view the announcement on the mobile app.
- A non admin attempt to create an announcement is refused and logged.
- A pipeline rejected announcement can be edited and resubmitted.

## Test Scenarios

1. Create announcement no pipeline. Setup: an admin creates an announcement with no pipeline. Assertion: the announcement publishes immediately and appears on the mobile app.
2. Create announcement with pipeline. Setup: an admin creates an announcement with a pipeline. Assertion: the announcement waits for approval and does not appear on the mobile app until approved.
3. Pipeline approval. Setup: an admin creates an announcement with a pipeline, and a pastor approves. Assertion: the announcement publishes and appears on the mobile app.
4. Pipeline rejection. Setup: an admin creates an announcement with a pipeline, and a pastor rejects it. Assertion: the announcement stays in pending status and the admin can edit and resubmit or discard.
5. Non admin create. Setup: a regular member tries to create an announcement. Assertion: the attempt is refused and logged.
6. Member view. Setup: a member opens the announcements screen on mobile. Assertion: the announced announcements are visible.

## Jira-Ready Seed

User story: As a member, I want to view announcements on the mobile app, so that I can stay informed about church updates.
Technical tasks: build the announcement creation screen for admin, wire the pipeline optional configuration, implement the publish flow, build the mobile app announcements screen, and enforce the admin-only creation gate.
Depends on: `6.3`, `6.5`, `6.6`, and the mobile app content screen.