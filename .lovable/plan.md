

## Remove SMS Inbox Card from Import Transactions Page

The SMS Inbox card (lines 376-433) showing "New SMS" and "In Review" sections will be completely removed from the Import Transactions page. The SMS review flow has its own dedicated `/sms-review` route, so this duplicate UI is unnecessary.

### Changes

**File: `src/pages/ImportTransactions.tsx`**

1. Remove the entire `<Card ref={smsInboxRef}>` block (lines 376-433) containing the SMS Inbox, New SMS, and In Review sections.
2. Remove now-unused state/refs/callbacks: `smsInboxItems`, `smsInboxRef`, `newItems`, `openedItems`, `loadSmsInbox`, `handleReviewSms`, `handleContinueSms`, `handleIgnoreSms`, and the `scrollToInbox` effect.
3. Remove unused imports: `getInbox`, `markSmsStatus`, `SmsInboxItem`, `buildInferenceDTO`, `isAdminMode`, and `Button` (if no longer used elsewhere — will verify).

This is a deletion-only change; the SmartPaste section and its detection flow remain untouched.

