

## Root Cause

The error **"Cannot access 'Le' before initialization"** is caused by `editedTransaction` being used before its declaration in `TransactionEditForm.tsx`.

- The `fieldTierByField` `useMemo` (around line 370) references `editedTransaction` in both its callback body (line 376) and dependency array (line 382).
- But `editedTransaction` is declared later at **line 456** via `useState`.
- JavaScript's temporal dead zone means block-scoped variables (`const`/`let`) cannot be accessed before their declaration, causing a runtime `ReferenceError`.

The second build error in `App.tsx` (line 555) is a TypeScript type comparison issue — unrelated to this crash but should also be fixed.

## Fix Plan

### 1. Reorder state declarations in TransactionEditForm.tsx
Move the `editedTransaction` (and `initialTransactionState`) `useState` declarations **above** the `fieldTierByField` `useMemo` block. Specifically, move the state declarations currently at lines ~454-480 to before line 360 (before the useMemo that depends on them).

### 2. Fix App.tsx type comparison (line 555)
The comparison `flowDecision.route === IMPORT_ROUTE` has mismatched literal types. This needs the route value or constant type to be widened (e.g., cast to `string`) so the comparison is valid.

Both fixes are straightforward reorderings/type adjustments with no logic changes.

