# Sub-Feature: Notifications

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `6.11` Notifications |
| Version | Version one |
| Parent Feature | `6` Custom Modules and Platform Features |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Custom Modules and Platform Features`, `REQ-080` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature notifies a user of relevant events and requests, for example a contribution request or an approval waiting on them. Notifications are sent to the mobile app and the web portal, and the user can view a summary of pending notifications on both surfaces.

## What the PRD states

> "A user is notified of relevant events and requests (for example a contribution request or an approval waiting on them)."

The PRD assigns this requirement `User Target: Both` and `Priority: Medium`.

## Why It Exists

The PRD describes a church where users need to be aware of pending actions and events. This sub-feature exists so that the system proactively notifies users of relevant events: a new contribution request awaiting their response, an approval pipeline step waiting on them, a new message, an upcoming event, or any other event the church configures. The notifications appear as badges, alerts, or in a dedicated notifications screen.

## Detailed Mechanics

1. The system identifies events that should trigger a notification: a new contribution request assigned to a role, a pipeline step waiting on a role, a new direct message, an upcoming event, or any other event configured by the church admin.
2. For each qualifying event, the system creates a notification record with the event type, the user or role receiving the notification, the event details (for example, contribution request ID, pipeline step ID, message preview), the time the event occurred, and a read status (unread/read).
3. The notification is pushed to the mobile app: the app badge count increases, a push notification (if enabled) appears, and the notification appears in the dedicated notifications screen.
4. The notification is also visible on the web portal: a banner or badge appears on the user's dashboard, and the notification appears in the notifications screen on the portal.
5. The user can open the notification to see the full details and take action (for example, respond to a contribution request, approve a pipeline step, read a message).
6. After the user takes action, the notification's read status is updated to "read" and the badge count decreases.
7. The user can view a history of notifications in the notifications screen, which retains read and unread entries for a configurable period (for example, 30 days).
8. The system admin can configure which event types trigger notifications and which surfaces (mobile, web, or both) receive them.

The flow runs on both the mobile app and the web portal; notifications are generated server side and delivered to both surfaces.

## State and Data Impact

Before the event occurs, no notification record exists for that event. After the event, a notification record is created with the event details, the recipient, and the read status. The notification is delivered to the mobile app and/or web portal. The notification history is stored and persists across sessions for the configured period. The audit trail in `5.3` logs the notification creation.

## Interaction With the Rest of the Product

`6.1` (Direct messaging) generates notifications when a new message arrives. `6.2` (Announcements) generates notifications when a new announcement is published. `6.3` (Events) generates notifications for upcoming events. `6.5` (Approval pipelines) generates notifications when a pipeline step waits on a role. `6.6` (RBAC administration) may gate which roles receive which notifications. `6.10` (Password and session security) ensures the user is authenticated to receive notifications. `6.8` (Notifications) is the feature itself; it is the notification generation and delivery system. `2.6` (Payment gateway integration) and `2.7` (Contribution requests) generate notifications when a new contribution request is created or when a request is awaiting a role's response. `5.3` logs the notification creation in the audit trail.

## Edge Cases

1. The user's phone is offline. The notification is queued and delivered when the phone comes back online.
2. The user disables notifications in the app settings. The system respects the user's preference and does not push notifications, but the notification record is still created and visible in the notifications screen.
3. A notification is created for a role that no longer exists or has been deactivated. The system must handle the orphaned notification gracefully: either remove it or flag it for admin review.
4. A large number of notifications are generated in a short period (for example, during a special event). The system must not overwhelm the user; it should batch notifications or show a summary.
5. The notification history is cleared (for example, the user clears the app data). The notifications are lost and will be regenerated from the event source when the user returns online.

## Error and Gap Handling

Phone offline: the notification is queued and delivered when the phone returns online. Notifications disabled: the system respects the user's preference and does not push, but the record is still created. Orphaned notification: the system either removes it or flags it for admin review. Large volume: the system batches or summarizes notifications. Cache cleared: the notifications are regenerated from the event source when the user returns online.

## Acceptance Criteria

- The system notifies a user of relevant events and requests (contribution request awaiting response, approval pipeline step waiting, new message, upcoming event, or configured events).
- Notifications are sent to the mobile app (badge count, push notification, notifications screen) and the web portal (banner, badge, notifications screen).
- The user can open a notification to see full details and take action.
- After the user takes action, the notification is marked read and the badge count decreases.
- The user can view a history of notifications, retaining read and unread entries for the configured period.
- The admin can configure which event types trigger notifications and which surfaces receive them.
- Notification records are logged in the audit trail.

## Test Scenarios

1. Contribution request notification. Setup: a new contribution request is assigned to a role. Assertion: the role receives a notification on both mobile and web, the badge count increases.
2. Pipeline step notification. Setup: a pipeline step waits on a role. Assertion: the role receives a notification and can open it to approve or reject.
3. New message notification. Setup: a direct message is sent to a user. Assertion: the user receives a notification and the message appears in the messaging screen.
4. Upcoming event notification. Setup: an upcoming event is within 24 hours. Assertion: the user receives a notification about the event.
5. Notification history. Setup: the user views the notifications screen history. Assertion: the history shows retained entries for the configured period.
6. Notifications disabled. Setup: a user disables notifications in the app settings. Assertion: no push notifications are sent, but the notification record is still created and visible in the screen.
7. Phone offline. Setup: the user's phone is offline when a notification is generated. Assertion: the notification is queued and delivered when the phone comes back online.

## Jira-Ready Seed

User story: As a user, I want to be notified of relevant events and requests, so that I can respond to contribution requests, approve approval steps, and stay informed about messages and events.
Technical tasks: build the event detection and notification record creation, implement the push delivery to mobile and banner/badge to web, build the notifications screen with history, implement the read/unread marking and badge count, and implement the admin configuration of event types and surfaces.
Depends on: `6.1`, `6.2`, `6.3`, `6.5`, `6.6`, `6.10`, the SMS/notification service, and the audit trail service.