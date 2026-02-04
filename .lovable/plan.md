

# Multi-Currency FX System Health Check & Fix Plan

## Health Check Report

### Executive Summary

The multi-currency FX implementation has **correct data handling** (rates are being saved, converted amounts calculated) but has **critical gaps in data validation and display logic** that cause the issues you're experiencing.

---

## Issues Identified

### Issue 1: Home Page Warning Shows "1 Transaction Missing Exchange Rate"

**Root Cause:** The validation logic in `AnalyticsService.getFxAwareTotals()` checks:
```
const hasValidConversion = t.amountInBase != null && t.fxSource !== 'missing';
```

However, existing transactions that were created **before** the FX migration may have:
- `amountInBase: undefined` (not null, but undefined)
- `fxSource: undefined` (never set)

The migration script (`migrateFxFields.ts`) was created but **never automatically applied** to existing transactions.

**Result:** Base currency transactions without FX fields are counted as "unconverted".

---

### Issue 2: Income/Expense/Balance Cards Show No Data

**Root Cause:** The cards use `fxSummary.income` and `fxSummary.expenses` from `AnalyticsService.getFxAwareTotals()`.

When transactions lack proper FX fields:
- Transactions with `amountInBase === undefined` are treated as unconverted
- They are NOT added to income/expenses totals (only to `unconvertedByNative`)
- Result: Cards show 0 or empty values

This is because the logic only sums `amountInBase` for "valid" conversions, but skips undefined values entirely rather than falling back to `amount`.

---

### Issue 3: Analytics/Dashboard Shows Original Currency Values

**Root Cause:** In `Analytics.tsx`, the following code uses `t.amount` directly without FX conversion:

```typescript
// Line 125 - budgetData calculation
.reduce((sum, t) => sum + Math.abs(t.amount), 0);

// Line 152-154 - monthlyBalance calculation  
grouped[key].income += Math.abs(tx.amount);
grouped[key].expense += Math.abs(tx.amount);
```

This bypasses the `amountInBase` field entirely, showing mixed-currency totals.

---

### Issue 4: Recent Transactions List Shows Original Currency

**Root Cause:** In `Home.tsx` lines 362-371:
```typescript
{transaction.amount < 0 ? "−" : "+"}
{Math.abs(transaction.amount).toLocaleString(...)}
```

The display uses `transaction.amount` (original currency) instead of checking whether to display `amountInBase` (converted) for consistency.

---

## Root Cause Summary

```text
+----------------------------+--------------------------------------+
| Component                  | Problem                              |
+----------------------------+--------------------------------------+
| Existing Transactions      | Missing FX fields (never migrated)   |
| AnalyticsService           | Correct logic, but data is missing   |
| Analytics.tsx              | Uses t.amount instead of amountInBase|
| Home.tsx Recent List       | Uses t.amount instead of amountInBase|
| Validation Check           | Treats undefined same as null        |
+----------------------------+--------------------------------------+
```

---

## Your Recommendation Analysis

> "Keep the main Amount field as the converted amount from non-base currencies"

**Assessment: Partially Agree - Here's the Best Approach:**

| Field | Purpose | Display |
|-------|---------|---------|
| `amount` | Original transaction amount | Keep as-is (audit trail) |
| `amountInBase` | Converted to base currency | **Use for all totals and charts** |
| Display | Show both when currencies differ | "100 USD ≈ 375 SAR" |

**Recommendation:** Keep both fields but ensure:
1. All analytics/totals use `amountInBase`
2. UI shows `amountInBase` for summaries, with original amount as secondary info
3. Fallback: If `amountInBase` is null, use `amount` but flag as unconverted

This preserves audit capability while providing consistent dashboard views.

---

## Fix Plan

### Phase 1: Auto-Migrate Existing Transactions (Critical)

**Goal:** Ensure all transactions have valid FX fields

**Changes:**
1. Create startup migration that runs once on app load
2. For each transaction missing `fxSource`:
   - If `currency === baseCurrency` → set `fxSource: 'identity'`, `amountInBase: amount`
   - If `currency !== baseCurrency` → set `fxSource: 'missing'`, `amountInBase: null`

**File:** `src/utils/migration/runMigrations.ts` (new)
- Auto-run on app initialization
- Track completed migrations in localStorage

---

### Phase 2: Fix AnalyticsService Fallback Logic

**Goal:** Handle undefined FX fields gracefully with smart fallback

**File:** `src/services/AnalyticsService.ts`

**Changes to `getFxAwareTotals()`:**
```typescript
// Before
const hasValidConversion = t.amountInBase != null && t.fxSource !== 'missing';

// After - also handle pre-migration data
const hasValidConversion = 
  (t.amountInBase != null && t.fxSource !== 'missing') ||
  (t.fxSource === undefined && t.currency?.toUpperCase() === baseCurrency.toUpperCase());
```

When `fxSource` is undefined but currency matches base, treat as identity conversion using `amount`.

Apply same fix to:
- `getFxAwareCategoryData()`
- `getFxAwareSubcategoryData()`
- `getFxAwareTimelineData()`

---

### Phase 3: Update Analytics.tsx to Use amountInBase

**Goal:** All charts and summaries use converted amounts

**File:** `src/pages/Analytics.tsx`

**Changes:**

1. **Budget data calculation (line 125):**
```typescript
// Before
.reduce((sum, t) => sum + Math.abs(t.amount), 0);

// After
.reduce((sum, t) => sum + Math.abs(t.amountInBase ?? t.amount), 0);
```

2. **Monthly balance calculation (lines 151-154):**
```typescript
// Before
grouped[key].income += Math.abs(tx.amount);

// After  
const effectiveAmount = tx.amountInBase ?? tx.amount;
grouped[key].income += Math.abs(effectiveAmount);
```

---

### Phase 4: Update Home.tsx Recent Transactions Display

**Goal:** Show consistent base currency amounts with original as secondary

**File:** `src/pages/Home.tsx`

**Changes (lines 356-377):**
```typescript
// Get effective display amount
const displayAmount = transaction.amountInBase ?? transaction.amount;
const showOriginal = transaction.currency !== baseCurrency && transaction.amountInBase != null;

// Display
<div className={...}>
  {displayAmount < 0 ? "−" : "+"}
  {formatCurrency(Math.abs(displayAmount), baseCurrency)}
  {showOriginal && (
    <span className="text-xs text-muted-foreground ml-1">
      ({formatCurrency(Math.abs(transaction.amount), transaction.currency)})
    </span>
  )}
</div>
```

---

### Phase 5: Handle Unconverted Warning Logic

**Goal:** Only show warning for truly unconverted transactions

**File:** `src/services/AnalyticsService.ts`

**Enhanced validation:**
```typescript
const isUnconverted = 
  t.fxSource === 'missing' || 
  (t.fxSource !== 'identity' && t.amountInBase == null && t.currency !== baseCurrency);
```

This excludes:
- Base currency transactions (always converted via identity)
- Transactions with valid `amountInBase`

---

## Technical Details

### Startup Migration Logic

```text
runMigrations():
1. Check localStorage for 'xpensia_migrations_applied'
2. If 'fx_backfill_v1' not in list:
   a. Load all transactions
   b. For each without fxSource:
      - Determine if base currency match
      - Apply identity or missing FX fields
   c. Save updated transactions
   d. Add 'fx_backfill_v1' to migrations list
3. Return
```

### Validation Matrix

```text
+------------+-------------+-------------+-------------------+
| fxSource   | amountInBase| currency    | Action            |
+------------+-------------+-------------+-------------------+
| identity   | number      | = base      | Use amountInBase  |
| cached     | number      | != base     | Use amountInBase  |
| manual     | number      | != base     | Use amountInBase  |
| api        | number      | != base     | Use amountInBase  |
| missing    | null        | != base     | Flag unconverted  |
| undefined  | undefined   | = base      | Use amount (fix)  |
| undefined  | undefined   | != base     | Flag unconverted  |
+------------+-------------+-------------+-------------------+
```

---

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/utils/migration/runMigrations.ts` | Create | Auto-run startup migrations |
| `src/utils/migration/migrateFxFields.ts` | Update | Export for startup use |
| `src/App.tsx` or `src/main.tsx` | Modify | Call runMigrations on startup |
| `src/services/AnalyticsService.ts` | Modify | Add fallback for undefined FX |
| `src/pages/Analytics.tsx` | Modify | Use amountInBase for totals |
| `src/pages/Home.tsx` | Modify | Display base currency amounts |

---

## Order of Implementation

1. **Create startup migration** - Fix existing data first
2. **Update AnalyticsService fallback** - Handle edge cases
3. **Fix Analytics.tsx** - Use amountInBase in charts
4. **Fix Home.tsx** - Display converted amounts
5. **Test end-to-end** - Verify all views show correct totals

---

## Testing Checklist

After implementation:

- [ ] Home page warning disappears for base currency transactions
- [ ] Income/Expense/Balance cards show correct totals
- [ ] Recent transactions show base currency amounts
- [ ] Analytics charts use converted amounts
- [ ] Foreign currency transactions show original + converted
- [ ] Truly unconverted transactions still show warning
- [ ] New transactions save with correct FX fields

