
# Demo Mode Namespace Refactor -- Best Practice Implementation

## What the Current Code Does (and Why It's Confusing)

The current implementation mixes demo and real transactions in the same storage key (`xpensia_transactions`), distinguished only by an `isSample: true` flag on individual records. This creates several problems:

- "Clear Sample Data" in Settings is confusing -- users don't know what it does or when they need it
- If a user adds real transactions, demo transactions still appear mixed in the list
- The "Clear Sample Data" button calls `window.location.reload()`, causing a jarring WebView restart
- There is no visual cue telling the user they are looking at demo/sample data
- The button appears even after sample data is already cleared (no state awareness)

---

## The Solution: Two Separate Storage Namespaces + App Mode Flag

### Storage architecture

| Key | Purpose |
|---|---|
| `xpensia_tx_demo` | Demo/sample transactions (read-only display namespace) |
| `xpensia_transactions` | Real user transactions (write namespace) |
| `xpensia_app_mode` | `"demo"` or `"real"` (session/mode flag) |
| `xpensia_demo_transactions_initialized` | Seed guard (kept as-is) |

The `isSample` field on the `Transaction` type is kept -- it is already whitelisted in `validateTransactionForStorage` in `storage-utils-fixes.ts` -- but demo transactions now live in their own key and are never mixed into the real key.

### Mode switching logic

```text
App launch
  |
  v
Is xpensia_app_mode = "real"?
  |         |
 Yes        No (first launch, or mode = "demo")
  |         |
Read from   Read from xpensia_tx_demo (display only)
xpensia_    Show Demo Banner
transactions
```

When the user adds their first real transaction:
- `xpensia_app_mode` is set to `"real"`
- TransactionContext switches to reading/writing `xpensia_transactions`
- A one-time prompt appears: "Exit demo and start fresh?" (default: yes)
- Demo data stays in `xpensia_tx_demo` but is never shown again

---

## Files to Create

| File | Purpose |
|---|---|
| `src/utils/app-mode.ts` | Tiny utility: get/set `xpensia_app_mode`, check if demo |
| `src/utils/demo-storage.ts` | Read/write helpers for `xpensia_tx_demo` key |
| `src/components/DemoBanner.tsx` | Sticky banner shown in demo mode with "Exit Demo" button |
| `src/hooks/useDemoMode.ts` | React hook exposing `isDemoMode`, `exitDemoMode`, `hasDemoTransactions` |

---

## Files to Modify

### 1. `src/services/DemoTransactionService.ts`
- `seedDemoTransactions()`: write to `xpensia_tx_demo` instead of `xpensia_transactions`
- `clearDemoTransactions()`: clear `xpensia_tx_demo` and set mode to `"real"`
- Add `getDemoTransactions()`: read from `xpensia_tx_demo`
- Add `hasDemoData()`: returns `true` if `xpensia_tx_demo` has entries

### 2. `src/context/TransactionContext.tsx`
- On load, check `xpensia_app_mode`
- If `"demo"`: load from `xpensia_tx_demo` for display, but all writes go to `xpensia_transactions` (which switches mode to `"real"` on first write)
- If `"real"`: load/write `xpensia_transactions` only (current behavior, unchanged)
- Expose `appMode` and `exitDemoMode` from context

### 3. `src/main.tsx`
- After `seedDemoTransactions()`, if no mode flag exists, set `xpensia_app_mode = "demo"`

### 4. `src/pages/Settings.tsx` and `src/components/settings/DataManagementSettings.tsx`
- Remove the `handleClearSampleData` button entirely from real mode
- In demo mode: show "Reset Demo Data" (calls `DemoTransactionService.clearDemoTransactions()` and reseeds)
- Replace both `setTimeout(() => window.location.reload(), 1500)` calls with a `StorageEvent` dispatch (same pattern already used by `storeTransactions`) so `TransactionContext` re-reads and the UI updates without a page reload

### 5. `src/App.tsx`
- Wrap the app with `DemoBanner` so it appears globally when in demo mode

---

## UX Flow Detail

### First launch (new user)
1. `seedDemoTransactions()` seeds `xpensia_tx_demo`
2. `xpensia_app_mode` is set to `"demo"`
3. `TransactionContext` loads from `xpensia_tx_demo`
4. `DemoBanner` renders at the top: **"You're viewing demo data -- Add your first transaction to get started"** with an **"Exit Demo"** button
5. Settings shows: **"Reset Demo Data"** (not "Clear Sample Data")

### User adds first real transaction
1. `addTransaction()` is called in TransactionContext
2. Before writing, check mode: if `"demo"`, switch to `"real"` (`xpensia_app_mode = "real"`)
3. Write to `xpensia_transactions`
4. `DemoBanner` disappears automatically (mode is now `"real"`)
5. TransactionContext re-reads from `xpensia_transactions` (empty except new transaction) -- no reload needed
6. Optional one-time toast: "Great! Demo data has been hidden. You're now tracking your real transactions."

### User clicks "Exit Demo" on the banner
1. Sets `xpensia_app_mode = "real"`
2. Dispatches `StorageEvent` on `xpensia_transactions` key
3. TransactionContext re-reads (empty `xpensia_transactions`)
4. Banner disappears
5. User sees empty state with "Add your first transaction" prompt

### User in real mode -- Settings
- "Clear Sample Data" button is **hidden entirely**
- Data Management section looks clean, no confusing options

### User in demo mode -- Settings
- Shows **"Reset Demo Data"** with description "Restore the original demo transactions"
- No "Clear Sample Data" wording

---

## The `window.location.reload()` Fix (Issue 4 from previous plan)

The existing `TransactionContext` already listens for `StorageEvent` on key `xpensia_transactions`:

```typescript
// Already exists in TransactionContext.tsx (line 85-94)
const handleStorage = (event: StorageEvent) => {
  if (event.key === 'xpensia_transactions') {
    setTransactions(getStoredTransactions());
  }
};
```

And `storeTransactions()` already dispatches that event (line 121-128 in `storage-utils.ts`). So replacing `window.location.reload()` is as simple as calling `storeTransactions(filteredTransactions)` which already fires the event -- the context will re-render automatically. No reload needed.

---

## Implementation Order

1. Create `src/utils/app-mode.ts` (pure utility, no dependencies)
2. Create `src/utils/demo-storage.ts` (thin wrapper over `safeStorage` for `xpensia_tx_demo`)
3. Update `src/services/DemoTransactionService.ts` (use new keys)
4. Update `src/main.tsx` (set initial mode flag)
5. Update `src/context/TransactionContext.tsx` (mode-aware reads/writes)
6. Create `src/hooks/useDemoMode.ts`
7. Create `src/components/DemoBanner.tsx`
8. Update `src/App.tsx` (mount DemoBanner)
9. Update `src/pages/Settings.tsx` and `src/components/settings/DataManagementSettings.tsx` (conditional button, remove reload)

---

## Technical Notes

- The `isSample` field on `Transaction` is preserved and already whitelisted in `validateTransactionForStorage` -- no changes needed to the validation layer
- `xpensia_tx_demo` uses the same `Transaction[]` shape as `xpensia_transactions`, so no type changes are needed
- The demo-to-real switch on first write is a single `safeStorage.setItem('xpensia_app_mode', 'real')` call inside `addTransaction` in `TransactionContext` -- it is intentionally a one-liner with no complex logic
- The `StorageEvent` pattern is already established and tested in the codebase -- this plan reuses it rather than introducing new reactivity mechanisms
