

# Complementary Fix Plan: SMS Spinner and Toggle Persistence

## Summary of Findings

After checking the codebase, the previous plan was **partially implemented** but has **critical gaps** causing the two remaining issues:

---

## Issue A: No Loading Spinner

### Current State
| File | LoadingOverlay | State Variables | Issue |
|------|---------------|-----------------|-------|
| SmsPermissionPrompt.tsx | ✅ Imported and rendered | ✅ `isBusy`, `busyMessage` | ❌ `isBusy` not set during main import flow (only in resume listener edge case) |
| Settings.tsx | ❌ Not imported | ❌ None | ❌ No blocking UI at all |

### Root Cause
1. **Settings.tsx (line 719-726)**: SMS import runs inside `setTimeout` with no state tracking - UI remains interactive
2. **SmsPermissionPrompt.tsx (lines 216-233)**: Main grant flow starts import via `setTimeout` without setting `isBusy=true` - spinner only appears for edge case

### Fix Required

**Settings.tsx:**
1. Import `LoadingOverlay` component
2. Add state: `const [smsBusy, setSmsBusy] = useState(false);` and `busyMessage`
3. Render: `<LoadingOverlay isOpen={smsBusy} message={busyMessage} />`
4. Wrap toggle handler logic:
   - Set `smsBusy=true` before permission request
   - Keep it true through import completion
   - Set `smsBusy=false` in finally block

**SmsPermissionPrompt.tsx:**
1. In main grant flow (around line 216), set `setIsBusy(true)` and `setBusyMessage('Importing SMS messages...')` BEFORE starting import
2. Change `setTimeout` to `await` pattern so we can properly track completion
3. Set `setIsBusy(false)` only after import completes or fails

---

## Issue B: Toggle Requires Save to Persist

### Current State
| Location | Calls `updateUserPreferences()` | Issue |
|----------|--------------------------------|-------|
| SmsPermissionPrompt.tsx handleEnable | ✅ Yes (lines 108-116, 194-202) | ✅ Works |
| Settings.tsx toggle onCheckedChange | ❌ No | ❌ Only sets local state |
| Settings.tsx handleBackgroundSmsChange | ❌ No | ❌ Only sets local state |

### Root Cause
The toggle handler at lines 696-753 only calls:
```typescript
setBackgroundSmsEnabled(true);
setAutoImport(true);
```
It does NOT call `updateUserPreferences()` to persist to UserContext. User must press "Save Settings" button.

### Additional Bug Found
Line 721 passes `undefined` instead of `navigate`:
```typescript
await SmsImportService.checkForNewMessages(undefined, { ... });
```
This prevents navigation to vendor-mapping page.

### Fix Required

**Settings.tsx toggle handler (lines 696-753):**
1. After permission granted successfully, immediately call:
```typescript
updateUserPreferences({
  sms: {
    ...user?.preferences?.sms,
    autoImport: true,
    backgroundSmsEnabled: true,
  }
});
```
2. Also update baseline state to prevent "unsaved changes" warning:
```typescript
setBaselineBackgroundSmsEnabled(true);
```
3. Fix line 721 to pass `navigate` instead of `undefined`

---

## Implementation Details

### Change 1: Settings.tsx - Add LoadingOverlay

**Add imports (after line 70):**
```typescript
import { LoadingOverlay } from '@/components/ui/loading-overlay';
```

**Add state (after line 120):**
```typescript
const [smsBusy, setSmsBusy] = useState(false);
const [smsBusyMessage, setSmsBusyMessage] = useState('');
```

**Add render (before closing Layout tag):**
```typescript
<LoadingOverlay isOpen={smsBusy} message={smsBusyMessage} />
```

### Change 2: Settings.tsx - Wrap Toggle Handler with Spinner

**Replace toggle onCheckedChange (lines 696-753):**

```typescript
onCheckedChange={async (checked) => {
  if (checked) {
    const platform = Capacitor.getPlatform();
    if (platform === 'web') {
      setBackgroundSmsEnabled(true);
      setAutoImport(true);
      // Persist immediately
      updateUserPreferences({
        sms: { ...user?.preferences?.sms, autoImport: true, backgroundSmsEnabled: true }
      });
      setBaselineBackgroundSmsEnabled(true);
      return;
    }
    
    // Show spinner
    setSmsBusy(true);
    setSmsBusyMessage('Requesting SMS permission...');
    
    try {
      await smsPermissionService.requestPermission();
      const canonicalStatus = await smsPermissionService.checkPermissionStatus();
      
      if (canonicalStatus.granted) {
        setBackgroundSmsEnabled(true);
        setAutoImport(true);
        
        // PERSIST IMMEDIATELY - no Save button needed
        updateUserPreferences({
          sms: { ...user?.preferences?.sms, autoImport: true, backgroundSmsEnabled: true }
        });
        setBaselineBackgroundSmsEnabled(true);
        
        // Initialize listener and import
        setSmsBusyMessage('Importing SMS messages...');
        await smsPermissionService.initSmsListener();
        const SmsImportService = (await import('@/services/SmsImportService')).default;
        await new Promise(r => setTimeout(r, 500)); // Small delay
        await SmsImportService.checkForNewMessages(navigate, { auto: false, usePermissionDate: true });
        
        toast({
          title: 'SMS Auto-Import Enabled! 🎉',
          description: 'Your transactions will now be imported automatically.'
        });
      } else {
        if (canonicalStatus.permanentlyDenied) {
          toast({
            title: 'SMS permission permanently denied',
            description: 'Enable in Settings > Apps > Xpensia > Permissions',
            variant: 'destructive',
          });
        }
      }
    } catch (e) {
      console.warn('[Settings] SMS toggle error:', e);
    } finally {
      setSmsBusy(false);
      setSmsBusyMessage('');
    }
  } else {
    setBackgroundSmsEnabled(false);
    setAutoImport(false);
    // Persist immediately
    updateUserPreferences({
      sms: { ...user?.preferences?.sms, autoImport: false, backgroundSmsEnabled: false }
    });
    setBaselineBackgroundSmsEnabled(false);
  }
}}
```

### Change 3: SmsPermissionPrompt.tsx - Fix Main Grant Flow Spinner

**Around line 216, modify to use await instead of setTimeout:**

```typescript
// Initialize listener and trigger initial SMS import
try {
  setIsBusy(true);
  setBusyMessage('Importing SMS messages...');
  
  console.log('[SmsPermissionPrompt] Initializing SMS listener and triggering initial import...');
  await smsPermissionService.initSmsListener();
  await new Promise(r => setTimeout(r, 500)); // Small delay for listener ready
  await SmsImportService.checkForNewMessages(navigate, { 
    auto: false, 
    usePermissionDate: true 
  });
  console.log('[SmsPermissionPrompt] Initial SMS import triggered successfully');
} catch (initErr) {
  console.warn('[SmsPermissionPrompt] Error:', initErr);
} finally {
  setIsBusy(false);
  setBusyMessage('');
}

onOpenChange(false);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Settings.tsx` | 1. Import LoadingOverlay 2. Add smsBusy state 3. Render LoadingOverlay 4. Wrap toggle handler with spinner 5. Call updateUserPreferences immediately 6. Pass navigate to import service |
| `src/components/SmsPermissionPrompt.tsx` | 1. Set isBusy=true before import in main flow 2. Use await instead of setTimeout for import 3. Set isBusy=false in finally |

---

## Testing Checklist

| Test | Steps | Expected |
|------|-------|----------|
| Spinner in Settings | Toggle SMS on → grant permission | Spinner blocks UI until import completes |
| Spinner in Prompt | Complete onboarding → enable SMS | Spinner blocks until import completes |
| Toggle persists without Save | Toggle SMS on → leave Settings → return | Toggle still shows ON |
| Toggle off persists | Toggle SMS off → leave → return | Toggle still shows OFF |
| Navigation works | Toggle on → grant → has messages | Navigates to vendor-mapping |

