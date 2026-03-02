# Startup auto-import: source and trigger conditions

When the app starts, automatic transaction import is triggered from `AppWrapper` in `src/App.tsx`.

## Entry point

- `useEffect(..., [user, location.pathname])` runs `runStartupSmsFlow()`.
- If the flow decision allows auto-import, it calls:

```ts
SmsImportService.checkForNewMessages(navigateRef.current, {
  auto: true,
  usePermissionDate: true,
  sourcePathname: location.pathname,
});
```

## Why it triggers

`getNextSmsFlowStep(...)` returns `shouldTriggerAutoImport: autoImportEnabled` only when:

1. Onboarding is completed.
2. SMS permission is granted.
3. Provider selection is configured (or first-run exception path).
4. User preference `user?.preferences?.sms?.autoImport` is true.

## Additional gates

Even if `shouldTriggerAutoImport` is true, startup import is skipped when:

- `xpensia_sms_startup_import_done === '1'`.
- `SMS_STARTUP_IMPORT_ENABLED` env flag is false.

## Import behavior after trigger

`SmsImportService.handleAutoImportWithPermissionDate(...)`:

- Resolves selected senders.
- Reads SMS from a computed start date.
- Filters financial messages and checkpoints.
- Prompts user confirmation.
- Routes to `/vendor-mapping` with parsed messages.

If no messages are found, it marks startup import done and navigates home.
