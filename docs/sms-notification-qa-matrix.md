# SMS Notification Manual QA Matrix

## Preconditions
- App installed on Android device with SMS permission granted.
- Notification permission granted (Android 13+).
- Test sender can send a **financial** SMS (contains transaction keyword + amount).

## Scenarios

| Scenario | App state setup | Action | Expected result |
| --- | --- | --- | --- |
| Foreground | Launch app and keep it visible on screen. | Send qualifying financial SMS. | Native notification appears immediately. In-app inbox queue is updated; app can navigate to `/import-transactions` from notification tap. |
| Background (process alive) | Launch app, then press Home (do not swipe away). | Send qualifying financial SMS. | Native notification appears immediately. Tapping notification opens app and routes to `/import-transactions`. |
| Swiped away / killed | Launch app once, then remove from recents (force-killed/swiped away). | Send qualifying financial SMS. | Static SMS receiver persists message and shows native notification. Tapping notification opens app and routes to `/import-transactions`. After launch, `drainPersistedMessages()` syncs inbox data. |

## Negative check
- Send a clearly non-financial SMS (no financial keyword/amount): no transaction notification should appear.
