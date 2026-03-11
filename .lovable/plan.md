

## Root Cause Findings

**Three distinct problems:**

1. **Notification tap goes nowhere**: The native `SmsBroadcastReceiver.java` hardcodes `targetRoute = "/import-transactions"`. In `App.tsx`, both the cold-start (line 931) and resume (line 531) paths check `pendingRoute?.route === IMPORT_ROUTE` and only navigate if `SMS_AUTO_IMPORT_ENABLED` is true. Since the flag is `false`, navigation is skipped entirely — user stays on whatever page they were on.

2. **Toast suppression incomplete**: The `markNotificationTapFlow` is only called inside the `IMPORT_ROUTE` check blocks (which are skipped when flag is false), so the suppress window is never activated. Additionally, the foreground SMS listener toast (line 681) navigates to `/import-transactions` instead of `/sms-review`.

3. **Inbox card details are poor**: The card only shows `item.sender` (phone number), a regex-extracted amount from raw body, and `receivedAt` timestamp. No payee is shown. The amount regex is simplistic and may extract wrong numbers.

## Changes

### 1. `SmsBroadcastReceiver.java` — Change notification tap route

**Line 97**: Change `"/import-transactions"` to `"/sms-review"`

This is the single source of the route. The SMS Review Inbox page is not behind `ImportDisabledGuard`, so it will always work.

### 2. `src/App.tsx` — Handle `/sms-review` route from notification tap

**Cold-start path (lines 931-948)**: Add handling for `pendingRoute?.route === '/sms-review'` — set pending launch route and mark notification tap flow. Keep existing `/import-transactions` handling unchanged.

**Resume/active path (lines 531-548)**: Add handling for `pendingRoute?.route === '/sms-review'` — navigate and mark notification tap flow. Keep existing `/import-transactions` handling unchanged.

**Foreground toast (line 685)**: Change toast View action from `/import-transactions` to `/sms-review`.

### 3. `src/pages/SmsReviewInboxPage.tsx` — Enrich inbox cards

Replace the simplistic card with richer summary data. On mount, run `buildInferenceDTO` for each pending item to extract payee, amount, and date from the structured parser. Cache results in component state to avoid re-parsing on every render.

Card will show:
- **Sender**: `item.sender` (the phone number / SMS source identifier)
- **Payee**: `dto.transaction.title` or extracted vendor/payee from parsed result, fallback to "—"
- **Amount**: `dto.transaction.amount` formatted with currency if available, fallback to regex extraction from body
- **Date**: `dto.transaction.date` (parsed transaction date), fallback to `item.receivedAt`

This uses `buildInferenceDTO` which already exists and is called when Review is tapped — we're just calling it earlier to preview the data. No new parser logic is introduced.

### 4. `src/App.tsx` — Add `SMS_REVIEW_ROUTE` constant

Add `const SMS_REVIEW_ROUTE = '/sms-review';` alongside existing route constants for clarity.

## Files Changed

| File | Change |
|---|---|
| `SmsBroadcastReceiver.java` | Change `targetRoute` from `"/import-transactions"` to `"/sms-review"` |
| `src/App.tsx` | Handle `/sms-review` pending route in cold-start and resume paths; change toast View action route; add `SMS_REVIEW_ROUTE` constant |
| `src/pages/SmsReviewInboxPage.tsx` | Pre-parse inbox items with `buildInferenceDTO` on mount; show payee, parsed amount, parsed date in cards |

## Why the Fix Is Safe

- `SmsBroadcastReceiver.java`: Only changes the string constant for notification intent route. No classifier, detection, or persistence logic touched.
- `App.tsx`: Adds parallel route handling for `/sms-review` without modifying existing `/import-transactions` handling. Toast suppression mechanism unchanged — just ensuring it activates.
- `SmsReviewInboxPage.tsx`: Uses existing `buildInferenceDTO` (already called on Review tap). No new parser introduced. Fallbacks ensure cards always render even if parsing fails.
- No changes to `messageFilter.ts`, `FinancialSmsClassifier.java`, `structureParser.ts`, `templateUtils.ts`, `parseAndInferTransaction.ts`, or `saveTransactionWithLearning.ts`.

## Remaining Risks

- `buildInferenceDTO` is async and runs the full parser pipeline — for many inbox items this could cause a brief loading state. Mitigated by processing items in parallel and showing a loading skeleton.
- If `consumePendingOpenRoute` returns the old `/import-transactions` value from a notification generated before the Java change is deployed, the existing handling (skip when flag is false) still applies — no regression, just no navigation until the app is rebuilt with the Java change.

