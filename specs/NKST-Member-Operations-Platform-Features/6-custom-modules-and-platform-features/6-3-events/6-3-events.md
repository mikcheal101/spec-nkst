# Sub-Feature: Events

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `6.3` Events |
| Version | Version one |
| Parent Feature | `6` Custom Modules and Platform Features |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Custom Modules and Platform Features`, `REQ-072` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature lets church admin and comms admin publish church events, and members view them on the mobile app. Events can have a date, time, location, description, and an optional approval pipeline before they publish.

## What the PRD states

> "Church admin and comms admin publish church events, and members view them on the mobile app."

The PRD assigns this requirement `User Target: Both` and `Priority: High`.

## Why It Exists

The PRD describes a church that regularly schedules services, bible studies, prayer meetings, and special gatherings. This sub-feature exists so that leadership can publish events and members can view them on their phones, ensuring the congregation knows when and where gatherings happen.

## Detailed Mechanics

1. Church admin or comms admin opens the event creation screen from the web portal.
2. The admin enters the event title, description, date, time, and location.
3. The admin optionally selects an approval pipeline.
4. The admin submits the event.
5. If an approval pipeline is set, the event waits for approval before it publishes.
6. On approval (or immediately if no pipeline is set), the event publishes.
7. The event appears in the mobile app's events screen, where members can view it.
8. Members can see the event details: title, description, date, time, location, and the publisher.
9. Members can act on the event, for example by sending a direct message to the event organizer or setting a reminder.

The flow runs on the web portal for creation and publishing, and on the mobile app for viewing. Members cannot create or publish events; only church admin and comms admin have that authority.

## State and Data Impact

Before the event is published, no event record exists on the platform. After it is published, an event record is written with the title, description, date, time, location, publisher, and approval status. The event is visible to all members on the mobile app. The publish event is logged in the audit trail in `5.3`.

## Interaction With the Rest of the Product

`6.2` works in parallel for announcements. `6.4` works in parallel for media and sermons. `6.5` provides the approval pipeline configuration. `6.7` and `6.8` supply church and department scope, so the admin can create events for their church or department. `5.3` logs the publish action in the audit trail. `6.6` gates who can create events; the default allows church admin and comms admin.

## Edge Cases

1. A pipeline is set but no one is available to approve. The event must remain in pending status and surface the delay to an admin.
2. The admin modifies an event after it has been submitted but before it publishes. The pipeline must re evaluate with the new content.
3. A member tries to create an event. The system must refuse the attempt and log it; only church admin and comms admin can create events.
4. An event is rejected by the pipeline. The admin can edit and resubmit, or discard it.
5. An event is set to publish immediately (no pipeline). It appears on the mobile app as soon as the admin submits it.

## Error and Gap Handling

No one available to approve: the event stays pending and an admin is notified. Admin modifies after submit: the pipeline re evaluates. Non admin create attempt: the attempt is refused and logged. Event rejected: the admin can edit and resubmit or discard.

## Acceptance Criteria

- Church admin or comms admin can create an event with title, description, date, time, location, and optional pipeline.
- If a pipeline is set, the event waits for approval before publishing.
- If no pipeline is set, the event publishes immediately.
- The event appears in the mobile app's events screen.
- Members can view the event details on the mobile app.
- A non admin attempt to create an event is refused and logged.
- An event rejected by the pipeline can be edited and resubmitted.

## Test Scenarios

1. Create event no pipeline. Setup: an admin creates an event with no pipeline. Assertion: the event publishes immediately and appears on the mobile app.
2. Create event with pipeline. Setup: an admin creates an event with a pipeline. Assertion: the event waits for approval and does not appear on the mobile app until approved.
3. Pipeline approval. Setup: an admin creates an event with a pipeline, and a pastor approves. Assertion: the event publishes and appears on the mobile app.
4. Pipeline rejection. Setup: an admin creates an event with a pipeline, and a pastor rejects it. Assertion: the event stays in pending status and the admin can edit and resubmit or discard.
5. Non admin create. Setup: a regular member tries to create an event. Assertion: the attempt is refused and logged.
6. Member view. Setup: a member opens the events screen on mobile. Assertion: the announced events are visible.

## Jira-Ready Seed

User story: As a member, I want to view church events on the mobile app, so that I can know when and where gatherings happen.
Technical tasks: build the event creation screen for admin, wire the pipeline optional configuration, implement the publish flow, build the mobile app events screen, and enforce the admin-only creation gate.
Depends on: `6.2`, `6.5`, `6.6`, and the mobile app content screen.