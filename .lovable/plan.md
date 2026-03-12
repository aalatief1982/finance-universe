

## Remove Transaction Save Toast

The "Transaction created" / "Transaction updated" toast is shown after saving a transaction. Since the UI already navigates back (confirming the action visually), the toast is unnecessary noise.

### Change

**File: `src/lib/smart-paste-engine/saveTransactionWithLearning.ts`** (lines 475-492)

Remove the entire toast block inside the `if (!silent)` conditional — both the `combineToasts` and `else` branches. Keep `navigateBack()` untouched.

### What does NOT change
- The `silent` flag logic remains
- `navigateBack()` call remains
- No other toast sites affected
- Pattern learning logic unaffected

