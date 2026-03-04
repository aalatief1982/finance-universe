

## Problem: Slow Permission Flow After Granting

After the user grants SMS permission, the flow takes too long before proceeding. Two causes:

### Cause 1: Sequential permission requests in `SmsPermissionService.requestPermission()`
Lines 256-277: Reader and listener permissions are requested **sequentially** with 8-second timeouts each. If one is slow, the other waits. Then a polling loop runs up to 15 seconds at 1-second intervals. Total worst case: ~31 seconds.

**Fix**: Request reader and listener permissions **in parallel** using `Promise.all`. This cuts the worst-case request phase from 16s to 8s.

### Cause 2: Unnecessary 500ms delay in `completePermissionGrantFlow`
Line 130 in `SmsPermissionPrompt.tsx`: `await new Promise((res) => setTimeout(res, 500))` — an artificial delay with no purpose since `initSmsListener` already awaits properly.

**Fix**: Remove this delay.

### Changes

**`src/services/SmsPermissionService.ts`** (lines 256-277):
- Run `SmsReaderService.requestPermission()` and `smsListener.requestPermission()` in parallel via `Promise.all` instead of sequentially.
- After parallel requests complete, do a single `checkPermissionStatus()` — if granted, skip the polling loop entirely.

**`src/components/SmsPermissionPrompt.tsx`** (line 130):
- Remove `await new Promise((res) => setTimeout(res, 500))`.

No other logic changes. The permission is still verified canonically before proceeding.

