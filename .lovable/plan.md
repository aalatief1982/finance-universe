

## Plan: Make Notification Toggle Grant-Only, Disabled Once Granted

### Concept
The toggle becomes a one-way "grant permission" button:
- **OFF + no permission**: Toggle is enabled — user can tap to grant
- **ON (permission granted)**: Toggle is disabled/greyed out — user cannot revoke from within the app
- **Permission revoked externally**: Toggle returns to OFF and becomes enabled again (via app resume listener already in place)

### Changes in `src/pages/Settings.tsx`

**1. Disable the Switch when permission is granted**

Add `disabled={notificationsEnabled}` to the `<Switch>` component. This prevents interaction when notifications are already granted.

**2. Simplify the `onCheckedChange` handler**

Since the toggle can only go from OFF → ON (it's disabled when ON), remove the `!checked` branch entirely. The handler only needs to handle granting:
- Request permission via `LocalNotifications.requestPermissions()`
- Check if granted, update state accordingly
- Show toast on success/failure

**3. Add helper text when disabled**

Update the description text dynamically:
- When granted (disabled): "Notifications are enabled. To disable, go to your phone's Settings > Apps > Xpensia > Notifications"
- When not granted: "Get notified when new expenses are detected from SMS"

**4. No changes needed to the app resume listener**

The existing `appStateChange` listener already re-syncs `notificationsEnabled` from system permission when the user returns, so if they revoke externally, the toggle will flip back to OFF and become interactive again.

### Files to change
- `src/pages/Settings.tsx` — add `disabled` prop, simplify handler, dynamic description

