# SMS Listener Phase 5.1 — Background Notification Batching

## Previous behavior
- Each qualifying background SMS scheduled a local notification independently.
- Notification content was message-specific (`New Transaction Detected` + review prompt).
- Notification payload included per-message `extra.smsData`.

## New behavior
- Background SMS notifications are now batched into a single summary notification.
- After `enqueueSms(...)`, unread count is read from inbox queue (`status === "new"`).
- Notification content is count-based:
  - Title: `New transactions detected`
  - Body: `{count} new SMS ready to review`
- Foreground behavior is unchanged (in-app toast with `View` action).
- Notification tap behavior remains routing to `/import-transactions` (queue-driven review path).

## Notification ID strategy
- A constant notification ID is used (`SMS_INBOX_NOTIFICATION_ID = 777`).
- Re-scheduling with the same ID updates/replaces the existing summary notification so users see one up-to-date inbox summary instead of stacked message notifications.

## Count source
- Count source is `getInboxCount({ status: 'new' })` from `smsInboxQueue`.
- The queue is treated as source of truth; no per-message payload is required in local notifications.
- If unread count is `0`, no notification is scheduled.

## Risks and rollback
- **Risk:** If any external code path changes item status from `new` unexpectedly, notification count may under-report.
- **Risk:** OEM-specific local notification behavior may vary in how same-ID updates are displayed.
- **Rollback:** Revert the `App.tsx` background notification block to per-message scheduling and restore `extra.smsData` payload gating in tap handler.

## Manual validation steps (device)
1. Ensure SMS listener permission is granted.
2. Put app in background.
3. Trigger first financial SMS and verify one local notification appears with `1 new SMS ready to review`.
4. Trigger additional financial SMS messages while app stays backgrounded.
5. Verify only one summary notification is visible and text updates (`2 new SMS ready to review`, etc.).
6. Tap notification and verify app routes to `/import-transactions`.
7. Bring app to foreground and trigger financial SMS.
8. Verify toast banner appears with `View` action and no forced navigation.
