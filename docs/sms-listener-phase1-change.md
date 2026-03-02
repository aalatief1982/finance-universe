# SMS Listener Phase 1 Change

## Behavior changes (before vs after)

| Scenario | Before | After |
| --- | --- | --- |
| Foreground `smsReceived` for financial SMS | Parsed SMS immediately and navigated to `/edit-transaction` with inferred payload. | Stays on current page and shows a lightweight in-app toast banner: **"New SMS transaction detected"** with action **"View"**. The action routes to `/import-transactions`. |
| Background `smsReceived` (app not active) | Scheduled local notification containing raw SMS in extras. | Unchanged scheduling behavior; notification still appears and carries SMS extras. |
| `localNotificationActionPerformed` tap | Parsed SMS and navigated to `/edit-transaction` (fallback to `/import-transactions` on parse failure). | Does **not** parse and does **not** navigate to `/edit-transaction`; routes directly to safe page `/import-transactions`. |

## Changed call sites

- `src/App.tsx` → `setupSmsListener` → `BackgroundSmsListener.addListener('smsReceived', ...)`
  - Removed foreground auto-navigation to `/edit-transaction`.
  - Replaced with in-app toast and `ToastAction` button to `/import-transactions`.
- `src/App.tsx` → `setupSmsListener` → `LocalNotifications.addListener('localNotificationActionPerformed', ...)`
  - Removed SMS parsing and `/edit-transaction` routing.
  - Added consistent safe routing to `/import-transactions`.
- `src/App.tsx` imports
  - Removed `buildInferenceDTO` import (no longer used in listener flow for this phase).
  - Added `ToastAction` import for in-app CTA.

## UX explanation

This phase removes disruptive context switching triggered by inbound SMS events. Instead of forcing users into `/edit-transaction`, the app now:

1. **Foreground**: informs users with a non-blocking toast they can act on when ready.
2. **Background notification tap**: lands users on a safe review/import page (`/import-transactions`) rather than a pre-filled edit form.

This preserves user intent and reduces accidental interruption while keeping a clear path to review detected transactions.

## Risks and rollback

### Risks
- Users expecting direct edit flow may need one extra tap from import/review UI.
- If import page availability changes, toast CTA and notification routing may need retargeting (`/process-sms` fallback option in future phase).

### Rollback
- Revert this commit to restore previous behavior:
  - Foreground auto-navigation to `/edit-transaction`.
  - Notification-tap parse-and-edit behavior.

## Validation steps

1. Ensure no foreground SMS auto-navigation remains in `smsReceived` handler.
2. Ensure notification tap handler no longer calls parse/inference and no longer routes to `/edit-transaction`.
3. Confirm toast message and `View` action route to `/import-transactions`.
4. Confirm local notification scheduling path remains unchanged for background app state.

## Screenshots

- Attempted to provide a Codex preview screenshot for the toast/banner state. (See task run notes for environment constraints if unavailable.)
