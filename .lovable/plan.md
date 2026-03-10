

## Problem

When you tap **Review** or **Continue** on the SMS Review Inbox page, it navigates to `/review-sms-transactions`. That route is wrapped in `ImportDisabledGuard`, and since `SMS_AUTO_IMPORT_ENABLED = false`, it immediately redirects to `/home`.

## Fix

Change `SmsReviewInboxPage.tsx` to navigate directly to `/edit-transaction` with the inference DTO — the same destination Smart Entry uses. The `/review-sms-transactions` page is a bulk review screen designed for the auto-import flow; for single-SMS review from a notification, going straight to edit is the correct behavior.

### File: `src/pages/SmsReviewInboxPage.tsx`

**Line 40–53** — Change navigation from `/review-sms-transactions` to `/edit-transaction`:

```ts
navigate('/edit-transaction', {
  state: {
    ...dto,
    smsInboxId: item.id,
    returnTo: location.pathname,
  },
});
```

This passes the same `InferenceDTO` shape that Smart Entry and ImportTransactions use, so the Edit Transaction page receives all parsed fields, confidence, origin, etc.

### What is NOT changed
- `ImportDisabledGuard` logic — untouched
- `/review-sms-transactions` route — untouched (still used by bulk auto-import flow)
- `IMPORT_ROUTES` set — untouched
- SMS classifier alignment — untouched
- `buildInferenceDTO` — untouched

### One file changed

| File | Change |
|---|---|
| `src/pages/SmsReviewInboxPage.tsx` | Navigate to `/edit-transaction` instead of `/review-sms-transactions` |

