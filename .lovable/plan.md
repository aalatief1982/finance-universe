

## Plan: Remove Notification Permission Popup, Direct Toggle

The "Disable Permission" popup appears when the user toggles notifications OFF because Android doesn't allow apps to revoke notification permissions programmatically — it must be done in system settings. Currently this is gated behind a confirmation dialog.

### Changes in `src/pages/Settings.tsx`

**1. Notification toggle OFF — skip popup, go directly to system settings**

In the `onCheckedChange` handler for the notifications toggle (line 557-574), when `checked` is `false`:
- Instead of `setDisablePermissionTarget('notifications')` (which shows the AlertDialog), directly call `openAndroidNotificationSettings()` and optimistically set `notificationsEnabled(false)` + update preferences.
- On non-native platforms, just toggle the state directly without opening settings.

**2. Keep the AlertDialog only for SMS**

Update the `disablePermissionTarget` state to only handle `'sms' | null` (remove `'notifications'` from the union). The AlertDialog stays for SMS permission revocation only (since that's a separate concern). If SMS also shouldn't show the popup, we can remove the dialog entirely and have both go directly to settings.

**3. Re-sync on resume**

The existing `syncPermissionToggles` effect already re-checks notification permission status, so when the user returns from system settings after revoking/granting, the toggle will update automatically.

### Result
- Toggle ON: requests permission via `LocalNotifications.requestPermissions()` (unchanged, no popup)
- Toggle OFF: opens Android notification settings directly without the intermediate "Disable Permission" dialog
- State syncs when user returns from settings

