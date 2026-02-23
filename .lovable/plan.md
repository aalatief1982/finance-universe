

# Fix: Amount Validation Fails on Negative Expense Amounts

## Problem

Expenses are stored with **negative** amounts (e.g., `-500`). When `TransactionEditForm` loads an expense:

1. `amountNumber` is initialized as `-500`
2. On submit, `getAmountValidationError(-500)` checks `amountNumber <= 0` and returns the error
3. The sign-flip to `-Math.abs(canonicalAmount)` happens on lines 826-830, **after** validation already rejected the value on line 816

The validation and the sign conversion are in the wrong order.

## Fix

In `TransactionEditForm.tsx`, validate against `Math.abs(canonicalAmount)` instead of the raw `canonicalAmount`. The validation should check whether the **absolute** amount is valid, since the sign is a function of the transaction type, not user input.

### Change 1: Fix `getAmountValidationError` call (line 816)

```
// Before
const amountError = getAmountValidationError(canonicalAmount);

// After
const amountError = getAmountValidationError(
  canonicalAmount !== null ? Math.abs(canonicalAmount) : null
);
```

### Change 2: Fix initial `amountNumber` state (line 379-382)

When initializing from an existing expense transaction, store the absolute value so the display and validation both work with positive numbers:

```
// Before
return parseAmountToNullableNumber(initialState.amount);

// After  
const parsed = parseAmountToNullableNumber(initialState.amount);
return parsed !== null ? Math.abs(parsed) : null;
```

### Change 3: Fix `amountText` initialization (lines 373-377)

Similarly, display the absolute value in the text input:

```
// Before
return Number.isFinite(initialState.amount)
  ? String(initialState.amount)
  : '';

// After
return Number.isFinite(initialState.amount)
  ? String(Math.abs(initialState.amount))
  : '';
```

## Why This Works

- The user always enters/sees **positive** amounts
- The sign is determined by the transaction type (`expense` = negative, `income` = positive) and applied on line 826-830
- Validation now checks the absolute value, which matches what the user entered

## Files Changed

- `src/components/TransactionEditForm.tsx` -- 3 small edits

## Risk

Very low. Only changes how the amount is presented and validated in the edit form -- the final sign conversion logic is untouched.

