# Sub-Feature: Direct messaging

## Header Block

| Field | Value |
|---|---|
| Sub-Feature ID and Name | `6.1` Direct messaging |
| Version | Version one |
| Parent Feature | `6` Custom Modules and Platform Features |
| PRD Source | `PRD-NKST-2026-001`, `Section 3`, `Custom Modules and Platform Features`, `REQ-070` |
| Author | Hirekaan Micheal Hemen |

## Overview

This sub-feature lets every user send and respond to direct messages. The messaging surface is available on both the mobile app and the web portal, and every message is recorded in the audit trail with the sender, recipient, content, and time.

## What the PRD states

> "Every user sends and responds to direct messages."

The PRD assigns this requirement `User Target: Both` and `Priority: High`.

## Why It Exists

The PRD describes a church where members communicate and respond to one another. This sub-feature exists so that any user can initiate a direct message to another user, and the recipient can respond, with the full message history recorded for accountability and audit.

## Detailed Mechanics

1. The user opens the messaging screen on their surface (mobile app or web portal).
2. The user searches for or selects another user to message from the member directory.
3. The user composes a message in the input field.
4. The user taps sends (mobile) or clicks send (web).
5. The system records the message in the database with the sender, recipient, content, and time sent.
6. The recipient receives a notification (as described in `6.8` Notifications) and can open the message.
7. The recipient reads the message and can compose a response.
8. The response follows the same flow: the recipient sends, the system records it, and the original sender is notified.
9. The full message history between any two users is available in the messaging screen, and every message is logged in the audit trail in `5.3`.

The flow runs on both the mobile app and the web portal. The same message store is shared across both surfaces.

## State and Data Impact

Before the message is sent, no message record exists. After it is sent, a message record is written with the sender, recipient, content, and time. The message is immutable once recorded; it cannot be edited or removed. The recipient's notification status is updated, and the audit trail gains an entry for the message creation.

## Interaction With the Rest of the Product

`6.8` generates notifications when a new message arrives. `5.3` logs every message creation in the immutable audit trail. `6.6` gates who can send messages; the default allows any registered user. The member being messaged must be a registered member; the system looks up the recipient by member ID or baptismal number.

## Edge Cases

1. A user tries to message a non registered member. The system must refuse the attempt and log it.
2. A user messages another user who has blocked them. The system must surface the block and refuse to send the message.
3. A message contains content that violates the church's code of conduct. The system must flag the message for review and potentially disable the account of the sender.
4. A user deletes their own message. The system must refuse the deletion and log the attempt; messages are immutable per `5.3`.
5. A user blocks another user. The block must prevent future messages between the two users, and the block action is logged in the audit trail.

## Error and Gap Handling

A non registered recipient is refused and logged. A block is enforced and logged. A code of conduct violation is flagged and the sender's account may be reviewed. A delete attempt is refused and logged.

## Acceptance Criteria

- A registered user can open the messaging screen on mobile or web.
- The user can search for or select another registered user to message.
- The user can compose and send a message.
- The system records the message with the sender, recipient, content, and time.
- The recipient receives a notification of the new message.
- The recipient can open the message and read it.
- The recipient can compose and send a response.
- The full message history between two users is available in the messaging screen.
- Every message is logged in the audit trail.
- A non registered recipient is refused and logged.
- A block prevents future messages and is logged.
- A message violating the code of conduct is flagged.

## Test Scenarios

1. Send message. Setup: a registered user sends a message to another registered user. Assertion: the message is recorded and the recipient receives a notification.
2. Receive notification. Setup: the recipient has not opened the app. Assertion: a notification arrives and the badge count increases.
3. Read message. Setup: the recipient opens the message. Assertion: the message content is displayed.
4. Respond to message. Setup: the recipient sends a response. Assertion: the response is recorded and the original sender is notified.
5. Non registered recipient. Setup: a user tries to message someone who is not a registered member. Assertion: the attempt is refused and logged.
6. Block user. Setup: a user blocks another user. Assertion: future messages between the two are prevented and the block is logged.
7. Message history. Setup: two users have exchanged multiple messages. Assertion: the history renders with all messages in chronological order.

## Jira-Ready Seed

User story: As a registered user, I want to send and respond to direct messages, so that I can communicate with other members.
Technical tasks: build the messaging screen with search/select recipient, compose and send flow, notification wiring, message history render, immutable audit trail logging, and the block and code of conduct flagging features.
Depends on: `6.8`, `5.3`, `6.6`, and the member lookup service.