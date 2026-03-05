

## Plan: Remove the "30 days" Import Scope Dialog

The popup at lines 468-482 in `SmsPermissionPrompt.tsx` is a secondary `AlertDialog` that appears after SMS permission is granted, telling the user "Xpensia will now read financial SMS from the last 30 days" with a "Continue" button.

### Change

**In `src/components/SmsPermissionPrompt.tsx`:**

1. In `completePermissionGrantFlow` (line 70-80): instead of closing the main dialog and opening the import scope dialog, directly call the import logic currently inside `handleConfirmImportScope`. Essentially merge the two steps — when permission is granted, immediately proceed to import without showing the intermediate popup.

2. Remove the `showImportScopeDialog` state variable (line 60).

3. Remove the second `AlertDialog` block (lines 468-482).

4. Remove the now-unused `handleConfirmImportScope` function — its body gets merged into `completePermissionGrantFlow`.

The flow becomes: permission granted → close main dialog → show loading overlay → run import logic → navigate. No intermediate popup.

