

## Plan: Fix Notification Toggle OFF Not Triggering System Settings

### Problem

When toggling the notification switch OFF, the system notification settings page should open so the user can revoke permission. Based on code analysis, there are two issues:

1. **No app resume re-sync**: The `syncPermissionToggles` effect only runs once on mount (empty dependency array `[]`). When the user returns from system settings, the toggle doesn't update to reflect the actual permission state.

2. **Possible silent failure**: The `openAndroidNotificationSettings()` call may silently fail or not be reached if the Capacitor native bridge isn't resolving properly — there's no user feedback if it fails.

### Changes in `src/pages/Settings.tsx`

**1. Add an App state change listener to re-sync permissions on resume**

Add a `useEffect` that listens to `App.addListener('appStateChange', ...)`. When `isActive` becomes `true` (user returns from system settings), re-run `syncPermissionToggles` to update the toggle state based on actual system permission.

```typescript
useEffect(() => {
  const listener = App.addListener('appStateChange', async ({ isActive }) => {
    if (isActive) {
      const notifGranted = await checkNotificationPermission();
      setNotificationsEnabled(notifGranted);
      updateUserPreferences({ notifications: notifGranted });
    }
  });
  return () => { listener.then(l => l.remove()); };
}, []);
```

**2. Add error handling and toast feedback on the toggle OFF path**

In the `onCheckedChange` handler for `!checked`, wrap the `openAndroidNotificationSettings()` call with a try-catch and show a toast if it fails, so the user knows something went wrong:

```typescript
if (!checked) {
  setNotificationsEnabled(false);
  updateUserPreferences({ notifications: false });
  if (Capacitor.isNativePlatform()) {
    try {
      await openAndroidNotificationSettings();
    } catch {
      toast({ title: "Could not open notification settings", variant: "destructive" });
    }
  }
  return;
}
```

**3. Add a toast confirmation when toggling OFF**

Show a brief toast: "Opening notification settings..." so the user sees immediate feedback that the action was triggered.

### Files to change
- `src/pages/Settings.tsx` — add resume listener, add toast feedback on toggle OFF

