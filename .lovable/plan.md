
# Complementary Plan: Fix Remaining SMS Issues

## Summary of Current State

After reviewing the codebase, several items from the original plan were implemented, but **4 critical gaps remain** that are causing the SMS issues:

---

## Issue 1 & 2: Toggle Not Synced With Permission Status

### Problem
The SMS toggle state (`backgroundSmsEnabled`) is only set from `user.preferences.sms.backgroundSmsEnabled` on initial load. It does NOT consider the actual native permission status from `hasSmsPermission`.

**Current code (lines 152-169):**
```typescript
useEffect(() => {
  if (user?.preferences) {
    // Only reads from preferences, ignores actual permission status
    const initialBg = user.preferences.sms.backgroundSmsEnabled || false;
    setBackgroundSmsEnabled(initialBg);
    // ...
  }
}, [user]);
```

### Fix
Add a **separate effect** that syncs toggle state when `hasSmsPermission` changes:

```typescript
// Sync toggle with both permission status AND user preferences
useEffect(() => {
  const platform = Capacitor.getPlatform();
  if (platform === 'web') return; // Skip on web
  
  const prefEnabled = user?.preferences?.sms?.backgroundSmsEnabled || false;
  
  // If preference says enabled but permission is actually denied, update toggle to OFF
  if (prefEnabled && !hasSmsPermission) {
    setBackgroundSmsEnabled(false);
    setAutoImport(false);
  }
  // If permission just got granted and preference was enabled, ensure toggle shows ON
  else if (hasSmsPermission && prefEnabled) {
    setBackgroundSmsEnabled(true);
    setAutoImport(true);
  }
}, [hasSmsPermission, user?.preferences?.sms?.backgroundSmsEnabled]);
```

---

## Issue 3: Automatic Import Passing `undefined` for navigate

### Problem
In `Settings.tsx` line 276, the import is called with `undefined` instead of `navigate`:

```typescript
await SmsImportService.checkForNewMessages(undefined, { auto: false, usePermissionDate: true });
```

### Fix
Change to use the `navigate` function that's already available in the component:

```typescript
await SmsImportService.checkForNewMessages(navigate, { auto: false, usePermissionDate: true });
```

---

## Issue 3 (Part 2): autoImport Not Set When Toggle Enabled

### Problem
When the SMS toggle is enabled, `setBackgroundSmsEnabled(true)` is called but `setAutoImport(true)` is NOT, leaving the auto-import preference incomplete.

**Current code (line 267):**
```typescript
setBackgroundSmsEnabled(true);
// setAutoImport(true) is MISSING!
```

### Fix
Add `setAutoImport(true)` after setting `backgroundSmsEnabled`:

```typescript
setBackgroundSmsEnabled(true);
setAutoImport(true);  // Add this line
```

---

## Issue 4: SMS Prompt May Not Appear After Onboarding

### Problem
The current logic clears the `xpensia_onb_just_completed` flag BEFORE the timeout triggers, meaning if the effect re-runs (due to route change), the flag is already gone:

**Current code flow:**
1. Onboarding completes → sets `xpensia_onb_just_completed = 'true'`
2. Navigate to `/home` → triggers useEffect (location changed)
3. Effect checks flag → `justCompleted = true`
4. Effect clears flag immediately (line 330)
5. Effect schedules `setTimeout(3000)` to show prompt
6. If user navigates before 3s, effect re-runs, `justCompleted = false`, timeout never shows prompt

### Fix
Move the flag clearing INSIDE the setTimeout, after the prompt is shown:

```typescript
if (justCompleted) {
  setTimeout(() => {
    // Only clear flag after we actually show the prompt
    safeStorage.removeItem('xpensia_onb_just_completed');
    console.log('[App] Showing SMS permission prompt');
    setShowSmsPrompt(true);
  }, 3000);
  return; // Exit early to prevent re-checking
}
```

Also add a `hasScheduledPrompt` ref to prevent double-scheduling.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Fix flag clearing timing in SMS prompt useEffect |
| `src/pages/Settings.tsx` | 1. Add permission-sync effect for toggle state 2. Pass `navigate` to import service 3. Set `autoImport(true)` when toggle enabled |

---

## Technical Implementation Details

### Change 1: App.tsx - Fix SMS Prompt Timing

**Location:** Lines 324-370

**Before:**
```typescript
useEffect(() => {
  const checkAndMaybeShowSmsPrompt = async () => {
    const justCompleted = safeStorage.getItem('xpensia_onb_just_completed') === 'true';

    if (justCompleted) {
      safeStorage.removeItem('xpensia_onb_just_completed'); // ❌ Clears too early
    }
    // ... later ...
    if (justCompleted) {
      setTimeout(() => {
        setShowSmsPrompt(true);
      }, 3000);
    }
  };
  checkAndMaybeShowSmsPrompt();
}, [location.pathname]);
```

**After:**
```typescript
const hasScheduledSmsPrompt = React.useRef(false);

useEffect(() => {
  const checkAndMaybeShowSmsPrompt = async () => {
    // Prevent double-scheduling
    if (hasScheduledSmsPrompt.current) return;
    
    const justCompleted = safeStorage.getItem('xpensia_onb_just_completed') === 'true';
    if (!justCompleted) return;

    const isNative = Capacitor.isNativePlatform();
    const isAndroid = Capacitor.getPlatform() === 'android';
    const alreadyPrompted = safeStorage.getItem('sms_prompt_shown') === 'true';

    if (!isNative || !isAndroid || alreadyPrompted) {
      safeStorage.removeItem('xpensia_onb_just_completed');
      return;
    }

    // Check if permission already granted
    try {
      const { smsPermissionService } = await import('@/services/SmsPermissionService');
      const permissionStatus = await smsPermissionService.checkPermissionStatus();
      if (permissionStatus.granted) {
        safeStorage.setItem('sms_prompt_shown', 'true');
        safeStorage.removeItem('xpensia_onb_just_completed');
        return;
      }
    } catch (e) {
      console.warn('[App] Error checking permission:', e);
    }

    // Mark as scheduled to prevent double-triggering
    hasScheduledSmsPrompt.current = true;
    
    setTimeout(() => {
      // Clear flag only when actually showing prompt
      safeStorage.removeItem('xpensia_onb_just_completed');
      setShowSmsPrompt(true);
    }, 3000);
  };

  checkAndMaybeShowSmsPrompt();
}, [location.pathname]);
```

---

### Change 2: Settings.tsx - Add Permission Sync Effect

**Location:** After line 177 (after the focus listener effect)

**Add new effect:**
```typescript
// Sync toggle state with actual permission status
useEffect(() => {
  const platform = Capacitor.getPlatform();
  if (platform === 'web') return;
  
  const prefEnabled = user?.preferences?.sms?.backgroundSmsEnabled || false;
  const prefAutoImport = user?.preferences?.sms?.autoImport || false;
  
  // Permission denied but preference says enabled → turn off toggle
  if (!hasSmsPermission && (prefEnabled || backgroundSmsEnabled)) {
    setBackgroundSmsEnabled(false);
    setAutoImport(false);
  }
  // Permission granted and preference enabled → ensure toggle is on
  else if (hasSmsPermission && prefEnabled) {
    setBackgroundSmsEnabled(true);
    setAutoImport(prefAutoImport || true);
  }
}, [hasSmsPermission, user?.preferences?.sms?.backgroundSmsEnabled, user?.preferences?.sms?.autoImport]);
```

---

### Change 3: Settings.tsx - Pass navigate to import service

**Location:** Line 276

**Before:**
```typescript
await SmsImportService.checkForNewMessages(undefined, { auto: false, usePermissionDate: true });
```

**After:**
```typescript
await SmsImportService.checkForNewMessages(navigate, { auto: false, usePermissionDate: true });
```

---

### Change 4: Settings.tsx - Set autoImport when toggle enabled

**Location:** Line 267 (inside handleBackgroundSmsChange)

**Before:**
```typescript
setBackgroundSmsEnabled(true);
```

**After:**
```typescript
setBackgroundSmsEnabled(true);
setAutoImport(true);
```

---

## Testing Checklist

After implementation, verify all 4 issues are resolved:

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Post-onboarding prompt | Fresh install → Complete onboarding → Wait 3s on Home | SMS prompt appears |
| Toggle refresh after permission | Settings → Toggle OFF → Grant SMS permission in system settings → Return to app | Toggle shows ON |
| Import from prompt | SMS prompt → Enable → Grant permission | Navigates to vendor-mapping if messages found |
| Import from toggle | Settings → Toggle SMS on → Grant permission | Navigates to vendor-mapping if messages found |
| Permission revoked | Revoke SMS permission in system settings → Return to app | Toggle shows OFF |

---

## Summary

4 changes across 2 files will complete the SMS permission fix:

1. **App.tsx**: Move flag clearing inside timeout + add ref to prevent double-scheduling
2. **Settings.tsx**: Add effect to sync toggle with permission status
3. **Settings.tsx**: Pass `navigate` instead of `undefined` to import service  
4. **Settings.tsx**: Set `autoImport(true)` when toggle is enabled
