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

## Mixed Arabic+Latin regression vectors
Use these exact samples during manual QA to keep parser coverage stable:

- **Financial should be accepted**
  ```
  شراء
  عبر:3965;mada-apple pay
  بـSAR 128.75
  لـMerchant Roasters
  26/3/10 23:49
  ```
- **Financial should be accepted**
  ```
  شراء عبر نقاط البيع
  عبر:3965;مدى-سامسونج باي
  بـSAR 4
  لـSaba Restaurant
  26/3/10 23:49
  ```
- **OTP/non-financial control should be rejected**
  ```
  رمز التحقق: 889911
  شراء
  عبر:3965;mada
  بـSAR 128
  لـMerchant
  26/3/10 23:49
  ```

