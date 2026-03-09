

## Plan: Fix Swipe Direction Issue and Untranslated English Text

### Problem 1: Swipe Right Not Working on First Attempt

In `SwipeableTransactionCard.tsx`, the `dragConstraints` is set to the parent `constraintsRef` div. Since the card fills the entire container, the constraint prevents any rightward drag — the card is already at the left edge of its constraint box, so it can't move right initially.

**Fix**: Remove `dragConstraints` and use `dragElastic={0.5}` with `dragSnapToOrigin` behavior via the `onDragEnd` handler (which already resets to `x: 0`). Alternatively, set `dragConstraints={{ left: -150, right: 150 }}` with pixel values so the card can freely move in both directions.

### Problem 2: Hardcoded English Strings

Multiple components have hardcoded English text instead of using `t()` from `useLanguage`. Key offenders:

| File | Hardcoded Text |
|------|---------------|
| `SwipeableTransactionCard.tsx` | `"Transaction deleted"` |
| `TransactionActions.tsx` | `"Transaction deleted"` |
| `TransactionsByDate.tsx` | `"Transaction deleted successfully"` |
| `TransactionList.tsx` | `"Transaction deleted successfully"` |
| `TransactionGrid.tsx` | `"Transaction deleted successfully"` |
| `Home.tsx` line 137 | `"Transaction"`, `"(Expense)"` |
| `EmptyTransactionState.tsx` | `"You haven't added any transactions yet."`, `"No transactions match..."` |
| `TransactionFilters.tsx` | `"Category"`, `"Type"`, `"All Types"`, `"Income"`, `"Expense"`, `"Date Range"`, `"Amount Range"`, `"Sort By"`, `"From"`, `"To"`, `"Min"`, `"Max"` |

### Implementation

**Step 1 — Fix swipe constraints**
- In `SwipeableTransactionCard.tsx`, replace `dragConstraints={constraintsRef}` with `dragConstraints={{ left: -150, right: 150 }}` so the card can be dragged in both directions from the start.

**Step 2 — Add missing translation keys**
- Add keys to both `src/i18n/en.ts` and `src/i18n/ar.ts` for all hardcoded strings above (toast messages, filter labels, empty states, display helpers).

**Step 3 — Replace hardcoded strings with `t()` calls**
- Update `SwipeableTransactionCard.tsx`, `TransactionActions.tsx`, `TransactionsByDate.tsx`, `TransactionList.tsx`, `TransactionGrid.tsx`, `Home.tsx`, `EmptyTransactionState.tsx`, and `TransactionFilters.tsx` to import `useLanguage` and use `t('key')` instead of English literals.

### Files Modified

| File | Change |
|------|--------|
| `src/components/transactions/SwipeableTransactionCard.tsx` | Fix dragConstraints, add `useLanguage`, translate toast |
| `src/components/transactions/TransactionActions.tsx` | Translate toast |
| `src/components/transactions/TransactionsByDate.tsx` | Translate toast |
| `src/components/transactions/TransactionList.tsx` | Translate toast |
| `src/components/transactions/TransactionGrid.tsx` | Translate toast |
| `src/components/transactions/EmptyTransactionState.tsx` | Translate empty state text |
| `src/components/transactions/TransactionFilters.tsx` | Translate filter labels |
| `src/pages/Home.tsx` | Translate `formatDisplayTitle` fallback |
| `src/i18n/en.ts` | Add ~15 new translation keys |
| `src/i18n/ar.ts` | Add ~15 new Arabic translation keys |

