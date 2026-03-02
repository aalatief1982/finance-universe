# SMS Listener Phase 5.2 — Inbox UI Improvements (ImportTransactions)

## Scope
- Updated `/import-transactions` inbox rendering to load the **full queue** via `getInbox()` and present two actionable sections:
  - **New SMS** (`status === "new"`)
  - **In review** (`status === "opened"`)
- Kept existing inference/navigation flow and SmartPaste behavior unchanged.

## State model (visual)

```text
                    Review
   +-----+ ------------------------> +--------+
   | new |                           | opened |
   +-----+ <----(none in 5.2)------- +--------+
      |  \                              |
      |   \ Ignore                      | Ignore
      |    v                            v
      |  +---------+                +---------+
      +> | ignored |                | ignored |
         +---------+                +---------+

   opened -> processed (existing downstream flow after successful completion)
```

- `new`: freshly queued SMS not yet opened by user.
- `opened`: user has reviewed and may continue editing later.
- `processed`: handled by downstream processing path (existing behavior).
- `ignored`: explicitly dismissed from inbox.

## User journey
- User opens **Import Transactions** and sees the SMS Inbox card split into:
  - **New SMS** with `Review` + `Ignore`.
  - **In review** with `Continue` + `Ignore`.
- `Review` from **New SMS**:
  - Marks item as `opened`.
  - Navigates to `/edit-transaction` with `buildInferenceDTO(...)` payload.
- Returning to `/import-transactions` shows the reviewed message in **In review** immediately.
- `Continue` from **In review**:
  - Navigates to `/edit-transaction` with same `buildInferenceDTO(...)` payload.
  - Does **not** change status (remains `opened`).
- `Ignore` from either section marks item as `ignored`.
- Inbox list is refreshed from queue after state-changing actions for immediate UI update.

## Rollback steps
1. Revert `src/pages/ImportTransactions.tsx` to previous single-list inbox behavior (`new` only).
2. Remove the `In review` section and restore `No new SMS to review.` empty-state copy.
3. Remove `Continue` action and keep only `Review` + `Ignore` for `new` items.
4. Re-run manual review on `/import-transactions` to verify old UX parity (single list behavior).
