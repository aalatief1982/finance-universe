

## Task: Fix Dashboard Stats Card Heights + Localize Dropdown Labels

### Problem 1 — Dashboard Stats Cards Unequal Height (Arabic)
The screenshot shows the three stat cards (Income, Expenses, Balance) at different heights. The root cause is:
- The grid uses `grid grid-cols-3` but each `motion.div` and card inside doesn't stretch to fill the row height
- The Balance card sometimes has extra content (the `previousBalance` change indicator), making it taller
- Arabic text labels like "المصروفات [SAR]" vary in width, causing text wrapping differences

**Fix in `DashboardStats.tsx`:**
- Add `items-stretch` to the grid container so all columns stretch equally
- Add `h-full` to `motion.div`, `Card`, and `CardContent` so they fill the available height
- This ensures all three cards match the tallest card's height regardless of language

### Problem 2 — Hardcoded "Expense"/"Income"/"Transfer" in Dropdowns
Translation keys already exist (`form.selectType`, `transactions.expense`, `transactions.income`, `transactions.transfer`) but SelectItem labels are hardcoded English in 4 files:

**Files to update:**
1. **`TransactionEditForm.tsx`** (3 occurrences at lines ~1389, ~1587, ~1710) — Replace `>Expense<`, `>Income<`, `>Transfer<` with `>{t('transactions.expense')}<` etc. Also replace `placeholder="Select type/category/subcategory"` with `t()` equivalents.

2. **`SmsTransactionConfirmation.tsx`** (1 occurrence at line ~360) — Same pattern: replace hardcoded type labels and placeholder strings.

3. **`VendorSelector.tsx`** (1 occurrence at line ~157) — Replace hardcoded type labels.

4. **`TransactionTypeSelector.tsx`** (1 occurrence at line ~65) — Replace hardcoded type labels.

5. **`TransactionAttributesForm.tsx`** (1 occurrence at line ~76) — Replace placeholder and type labels.

### Changes Summary

| File | Change |
|---|---|
| `DashboardStats.tsx` | Add `items-stretch` to grid, `h-full` to motion.div/Card/CardContent |
| `TransactionEditForm.tsx` | Replace 3× hardcoded type labels + placeholders with `t()` |
| `SmsTransactionConfirmation.tsx` | Replace hardcoded type/category/subcategory labels and placeholders with `t()` |
| `VendorSelector.tsx` | Replace hardcoded type labels with `t()` |
| `TransactionTypeSelector.tsx` | Replace hardcoded type labels with `t()` |
| `TransactionAttributesForm.tsx` | Replace hardcoded type labels and placeholder with `t()` |

No new translation keys needed — existing keys (`transactions.expense`, `transactions.income`, `transactions.transfer`, `form.selectType`, `form.selectCategory`, `form.selectSubcategory`) cover all cases.

