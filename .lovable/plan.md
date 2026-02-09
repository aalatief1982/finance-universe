

# Diagnostic Logging + Critical Currency Path Bug Fix

## Critical Bug Found

The app has **two different currency paths** on the User object, and different pages read from different ones:

| Page | Code | Path Used |
|------|------|-----------|
| Home.tsx | `user?.preferences?.currency` | Correct (where Settings page writes) |
| Analytics.tsx | `user?.settings?.currency` | Wrong (likely undefined, falls back to USD) |
| DashboardContent.tsx | `user?.settings?.currency` | Wrong (same issue) |
| FxConversionService.ts | `getUserSettings().currency` | Separate path via storage-utils |

The User type has both `settings.currency` and `preferences.currency` as separate fields. The Settings page writes to `preferences.currency`, but Analytics and DashboardContent read from `settings.currency` which is likely never populated -- so they default to `'USD'` instead of `'SAR'`.

This means:
- `ensureFxFields()` converts correctly using `getUserSettings().currency` (which returns SAR)
- But Analytics reads `baseCurrency = 'USD'` from the wrong path
- The `hasValidConversion` check then compares SAR transactions against USD base, marking them as "unconverted"

## Fix Plan

### Step 1: Standardize baseCurrency access across all pages

Create a single helper or use a consistent path everywhere. Fix these files:

**`src/pages/Analytics.tsx` (line 66):**
```
// Before
const baseCurrency = user?.settings?.currency || 'USD';

// After  
const baseCurrency = user?.preferences?.currency || getUserSettings().currency || 'SAR';
```

**`src/components/dashboard/DashboardContent.tsx` (line 50):**
```
// Before
const baseCurrency = user?.settings?.currency || 'USD';

// After
const baseCurrency = user?.preferences?.currency || getUserSettings().currency || 'SAR';
```

### Step 2: Add diagnostic logging at 4 key checkpoints

All logs prefixed with `[FX-DEBUG]` for easy console filtering.

| # | File | Location | What to Log |
|---|------|----------|-------------|
| 1 | `FxConversionService.ts` | `ensureFxFields()` | currency, baseCurrency, fxSource, amountInBase result |
| 2 | `AnalyticsService.ts` | `getFxAwareTotals()` | baseCurrency used, transaction count, valid/unconverted split, final totals |
| 3 | `Home.tsx` | After fxSummary computation | baseCurrency, income, expenses, unconvertedCount |
| 4 | `Analytics.tsx` | After baseCurrency assignment | baseCurrency value and source |

### Step 3: Remove migration dependency

No migration needed. The `ensureFxFields()` function already correctly populates FX fields for new transactions. The bug is purely in the **reading** side using the wrong currency path.

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Analytics.tsx` | Fix baseCurrency path + add debug log |
| `src/components/dashboard/DashboardContent.tsx` | Fix baseCurrency path |
| `src/services/FxConversionService.ts` | Add debug log in ensureFxFields |
| `src/services/AnalyticsService.ts` | Add debug log in getFxAwareTotals |
| `src/pages/Home.tsx` | Add debug log after fxSummary |

## Expected Result

After this fix:
- All pages read currency from the same correct path (`preferences.currency`)
- SAR transactions are recognized as base currency (identity) and included in totals
- EGP transactions with valid `amountInBase` are included in totals
- Console logs show the complete data pipeline for verification
