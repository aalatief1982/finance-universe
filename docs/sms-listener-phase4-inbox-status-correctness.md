# SMS Listener Phase 4: Inbox Status Correctness

## Goal
Ensure SMS Inbox item status matches user intent and persistence outcome:
- `processed` is set **only after transaction save succeeds**.
- Reviewing an SMS no longer consumes it prematurely.
- Exiting edit without saving restores the item to `new`.

## State transitions
- `new -> opened` when user taps **Review** in Import Transactions.
- `opened -> processed` only after successful save in Edit Transaction.
- `opened -> new` when user leaves Edit Transaction without saving.

## smsInboxId flow
1. User taps **Review** on an inbox item.
2. `ImportTransactions` marks that item `opened` and navigates to `/edit-transaction` with `smsInboxId` in route state.
3. `EditTransaction` reads `smsInboxId` from location state and uses it to update status based on user outcome.

## Why processed is only on save
`processed` should represent confirmed persistence, not navigation intent. Marking on Review created false positives where users could back out and permanently hide un-saved items.

With this change:
- Save success path marks `processed` right before navigating away.
- Any non-save exit path reverts to `new` during component unmount cleanup.

## Rollback steps
1. In `ImportTransactions`, switch Review status update from `opened` back to `processed` and remove `smsInboxId` from navigation state.
2. In `EditTransaction`, remove `smsInboxId` handling:
   - remove `processed` mark-on-save logic
   - remove unmount `opened -> new` revert logic
3. In `smsInboxQueue`, remove `opened` from status type/validation.

