# SMS Listener Phase 3 — Inbox UI

## Where the UI is shown
- The SMS inbox is rendered at the top of `src/pages/ImportTransactions.tsx` in a dedicated `SMS Inbox` card above the existing SmartPaste section.
- The list pulls from `xpensia_sms_inbox_queue` via `getInbox()` and shows only items with `status === "new"`, sorted by `receivedAt` descending.

## Actions and functions used
- **Review** button:
  1. Calls `buildInferenceDTO({ rawMessage: item.body, senderHint: item.sender, source: "sms" })`.
  2. Navigates to `/edit-transaction` with normalized inference state and enforced `{ mode: "create", isSuggested: true }`.
  3. Marks the SMS as processed using `markSmsStatus(item.id, "processed")` after navigation call.
- **Ignore** button:
  1. Calls `markSmsStatus(item.id, "ignored")`.
  2. Refreshes local inbox state so ignored rows disappear from the "new" list immediately.

## Status transitions
- New SMS begin as `new` (written by the existing listener queue behavior).
- Inbox actions transition status as:
  - `new -> processed` on **Review**
  - `new -> ignored` on **Ignore**
- No deletion is performed by this UI; it only updates status.

## Rollback notes
- To rollback Phase 3 UI safely, revert the ImportTransactions page inbox section and remove this doc:
  - `src/pages/ImportTransactions.tsx`
  - `docs/sms-listener-phase3-inbox-ui.md`
- This rollback does not affect listener enqueueing logic or SmartPaste parser internals.
