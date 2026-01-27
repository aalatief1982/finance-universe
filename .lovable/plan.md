# SMS Spinner and Toggle Persistence - COMPLETED ✅

## Summary

Fixed two critical SMS issues:

### Issue A: No Loading Spinner - FIXED ✅
- Added `LoadingOverlay` import and state (`smsBusy`, `smsBusyMessage`) to Settings.tsx
- Wrap toggle handler with spinner that shows during permission request and import
- Fixed SmsPermissionPrompt.tsx to use `await` instead of `setTimeout` for blocking import

### Issue B: Toggle Requires Save to Persist - FIXED ✅
- Toggle now calls `updateUserPreferences()` immediately on change
- Also updates baseline state to prevent "unsaved changes" warning
- Fixed `navigate` being passed correctly to import service

## Changes Made

| File | Changes |
|------|---------|
| `src/pages/Settings.tsx` | Added LoadingOverlay, smsBusy state, immediate persistence via updateUserPreferences, pass navigate to import |
| `src/components/SmsPermissionPrompt.tsx` | Changed setTimeout to await pattern for blocking spinner during import |

## Testing

Test on Android device:
1. Toggle SMS on → grant permission → spinner should block until import completes
2. Toggle SMS on → leave Settings → return → toggle should still show ON
3. Toggle SMS off → toggle should persist without Save button
