

# Multi-Currency FX Support - Implementation Plan

## Implementation Status

### ✅ Phase 1: Core Data Model (COMPLETED)
- [x] Created `src/types/fx.ts` with FX type definitions
- [x] Updated `src/types/transaction.ts` - Added required `currency` field and FX fields
- [x] Updated `src/types/user.ts` - Added `FxUserPreferences`
- [x] Created `src/utils/fx/fx-cache.ts` - FX rate cache with offline-first design
- [x] Created `src/services/FxConversionService.ts` - Core conversion logic
- [x] Created `src/utils/migration/migrateFxFields.ts` - Migration for existing data
- [x] Updated `src/App.tsx` - Added FX migration and cache cleanup on startup
- [x] All tests passing

### ✅ Phase 2: TransactionService Integration (COMPLETED)
- [x] Updated `src/services/TransactionService.ts`
  - `addTransaction()` now applies FX conversion at save time
  - `updateTransaction()` recalculates FX when amount/currency changes
  - `updateTransfer()` applies FX to both legs with correct signs
  - Added optional `manualFxRate` parameter for manual rate entry
- [x] All 13 TransactionService tests passing

### 🔲 Phase 3: Transaction Entry UI (NEXT)
### 🔲 Phase 4: Dashboard & Analytics
### 🔲 Phase 5: Budget & Account Integration
### 🔲 Phase 6: Export & Final Polish

---

## Executive Summary

Your plan is **well-architected and thorough**. After reviewing your existing codebase, I have some refinements and considerations that will make implementation smoother and avoid potential issues.

---

## Review: What's Already in Place

| Component | Current State | Impact on Plan |
|-----------|---------------|----------------|
| **User Settings** | `user.settings?.currency` exists | Good foundation for `baseCurrency` |
| **Account.currency** | Already has `currency: string` | No change needed |
| **Transaction.currency** | Optional `currency?: string` | Needs upgrade to required + FX fields |
| **Dual-entry Transfers** | Fully implemented with `transferId` + `transferDirection` | FX must handle both legs |
| **Budget.currency** | Already exists | Works with your base-currency plan |
| **Analytics/Dashboard** | Excludes transfers, sums in single currency | Needs FX-aware aggregation |
| **CSV Export** | Basic - has `currency`, `originalCurrency` | Needs FX fields |

---

## Critical Refinements to Your Plan

### Decision Lock-Ins (Confirmed)

| Decision | Your Choice | Verdict |
|----------|-------------|---------|
| Base currency per user | Single currency (Settings) | Agreed - sensible MVP |
| Account currency rule | Single currency per account | Agreed - prevents complexity |
| FX lock at save time | Store rate + converted amount | Agreed - essential for audit |
| Historical immutability | Use locked conversion always | Agreed - critical for integrity |
| Offline-first | Allow `fxSource="missing"` saves | Agreed - necessary for mobile |

### 1. Data Model Refinements

**Transaction Fields** - Your proposed fields are good, with one adjustment:

```text
PROPOSED CHANGES TO src/types/transaction.ts

Required additions:
- currency: string (make required, not optional)
- baseCurrency: string (snapshot from user settings at save)
- amountInBase: number | null
- fxRateToBase: number | null
- fxSource: 'manual' | 'cached' | 'api' | 'missing' | 'identity'
- fxLockedAt: string | null (ISO timestamp)
- fxPair: string | null (e.g., 'USD->SAR')

REFINEMENT: Add 'identity' to fxSource for same-currency transactions 
(cleaner than 'manual' which implies user input)
```

**User Settings** - Add to existing structure:

```text
PROPOSED CHANGES TO src/context/user/types.ts

Add to User.preferences:
- fx?: {
    provider?: string;
    fallbackMode: 'manual' | 'cachedOnly' | 'allowMissing';
    showUnconvertedWarning: boolean;
  }
```

**Minor Unit Storage** - Your recommendation to store in minor units is sound but would require a significant migration. For MVP, I recommend:

```text
DECISION: Keep decimal storage BUT enforce currency-specific 
rounding at calculation time using CURRENCY_INFO.decimalPlaces
```

### 2. FX Rate Cache Structure

```text
NEW FILE: src/utils/fx/fx-cache.ts

Storage key: 'xpensia_fx_cache_v1'
Structure: {
  rates: {
    'YYYY-MM-DD:USD:SAR': { 
      rate: 3.75, 
      provider: 'manual' | 'exchangerate-api',
      fetchedAt: ISO string,
      expiresAt: ISO string 
    }
  },
  lastUpdated: ISO string
}

Functions:
- getCachedRate(date, from, to): { rate, source } | null
- setCachedRate(date, from, to, rate, provider): void
- cleanExpiredRates(): void (run on app startup)
```

### 3. Conversion Service Design

```text
NEW FILE: src/services/FxConversionService.ts

CRITICAL ALGORITHM (at transaction save time):

1. Get baseCurrency from user settings
2. Get transactionCurrency from form/SMS

3. IF transactionCurrency === baseCurrency:
   - fxRateToBase = 1
   - amountInBase = amount
   - fxSource = 'identity'
   - fxLockedAt = now()

4. ELSE:
   a. Check cache for today's rate (or tx date if backdated)
   b. IF cached: use it, fxSource = 'cached'
   c. ELSE IF online: fetch and cache, fxSource = 'api'
   d. ELSE (offline):
      - Check user's fxFallbackMode:
        - 'manual': Prompt for rate input
        - 'cachedOnly': Block save with error
        - 'allowMissing': Save with null values, fxSource = 'missing'

5. Round amountInBase to baseCurrency's decimalPlaces

IMPORTANT: Never mutate historical transactions unless 
user explicitly triggers "Recalculate FX"
```

### 4. Transfer FX Handling

**Your plan needs clarification here.** With dual-entry transfers:

```text
SCENARIO: Transfer $100 USD from Account A to Account B (base currency SAR)

Current System Creates:
- Debit: { amount: -100, currency: USD, fromAccount: A, transferDirection: 'out' }
- Credit: { amount: 100, currency: USD, toAccount: B, transferDirection: 'in' }

WITH FX:
- Both entries share the SAME fxRateToBase and amountInBase
- The FX is applied to the absolute amount
- Signs are preserved for direction

CROSS-CURRENCY TRANSFER (Account A in USD, Account B in SAR):
- This creates TWO separate currency contexts
- RECOMMENDATION for MVP: Treat as two transactions + fee entry
- OR: Store both currencies on transfer record:
  - amount: 100, currency: USD (source)
  - receivedAmount: 375, receivedCurrency: SAR (destination)
  - fxRateUsed: 3.75
```

### 5. Dashboard FX Aggregation

```text
CHANGES TO: src/pages/Home.tsx, src/services/AnalyticsService.ts

AGGREGATION RULES:
1. DEFAULT: Sum only amountInBase values
2. IF any transaction has amountInBase === null:
   - Show warning banner: "X transactions unconverted"
   - Option A: Exclude from totals (show separate native breakdown)
   - Option B: Use latest cached rate as estimate (mark as "estimated")

3. ADD: View toggle - "Base Currency" vs "Native Breakdown"

NEW FUNCTION: getAggregatedTotals(transactions, mode):
  mode = 'base' | 'native'
  Returns { totals, unconvertedCount, currencies[] }
```

### 6. Budget Integration

Your plan is correct:

```text
CHANGES TO: src/services/BudgetService.ts

RULE: Budget.currency should always equal user's baseCurrency
- Spending calculations use amountInBase
- Transactions with amountInBase === null:
  - OPTION 1: Exclude with warning (recommended)
  - OPTION 2: Force conversion before period close

ADD to getBudgetProgress():
  - unconvertedTransactionCount: number
  - unconvertedAmount: { [currency]: number }
```

### 7. Account Balance Calculation

```text
CHANGES TO: src/services/AccountService.ts

CRITICAL: Account balance is in ACCOUNT'S currency, not base currency

getAccountBalance(accountId):
  - Only sum transactions WHERE tx.currency === account.currency
  - For net worth view: apply current FX rates to convert to base

ADD: getAccountBalanceInBase(accountId):
  - Uses latest cached rate for live conversion
  - Marked as "estimated" if rate is stale
```

---

## Implementation Phases

### Phase 1: Core Data Model (Low Risk)
**Files to modify:**
- `src/types/transaction.ts` - Add FX fields
- `src/context/user/types.ts` - Add FX preferences
- `src/models/account.ts` - No changes needed (already has currency)

**New files:**
- `src/types/fx.ts` - FX-related type definitions
- `src/utils/fx/fx-cache.ts` - Rate cache management
- `src/utils/fx/fx-constants.ts` - Currency minor units, precision rules

### Phase 2: FX Service Layer (Medium Risk)
**New files:**
- `src/services/FxConversionService.ts` - Core conversion logic
- `src/services/FxRateProviderService.ts` - API integration (optional)

**Modified files:**
- `src/services/TransactionService.ts` - Add FX fields at save time
- `src/utils/locale/data.ts` - Expand currency info with `minorUnits`

### Phase 3: Transaction Entry UI (Medium Risk)
**Modified files:**
- `src/components/TransactionEditForm.tsx` - Show converted estimate
- `src/components/SmsTransactionConfirmation.tsx` - FX warning badges
- `src/lib/smart-paste-engine/parseAndInferTransaction.ts` - Infer currency

**New components:**
- `src/components/fx/FxRateInput.tsx` - Manual rate entry dialog
- `src/components/fx/UnconvertedBadge.tsx` - Warning indicator

### Phase 4: Dashboard & Analytics (Medium Risk)
**Modified files:**
- `src/pages/Home.tsx` - Add view toggle, unconverted warnings
- `src/services/AnalyticsService.ts` - FX-aware aggregation
- `src/components/DashboardStats.tsx` - Handle multiple currencies

### Phase 5: Budget & Account Integration (Medium Risk)
**Modified files:**
- `src/services/BudgetService.ts` - Use amountInBase for comparisons
- `src/services/AccountService.ts` - Separate balance vs net worth
- `src/pages/budget/*.tsx` - Show unconverted transaction warnings

### Phase 6: Export & Migration (Low Risk)
**Modified files:**
- `src/utils/csv.ts` - Add FX columns to export
- New migration file in `src/utils/migration/migrateFxFields.ts`

### Phase 7: Testing & Edge Cases
- All edge cases from your list
- Focus on offline scenarios and rate precision

---

## Migration Strategy

```text
NEW FILE: src/utils/migration/migrateFxFields.ts

ON APP LOAD (one-time migration):

1. Check migration flag: 'xpensia_migration_fx_v1'

2. For each transaction:
   a. IF !tx.currency:
      - tx.currency = user.baseCurrency || 'USD'
   
   b. IF tx.currency === user.baseCurrency:
      - tx.baseCurrency = tx.currency
      - tx.amountInBase = tx.amount
      - tx.fxRateToBase = 1
      - tx.fxSource = 'identity'
      - tx.fxLockedAt = tx.createdAt || now()
   
   c. ELSE (foreign currency, no rate available):
      - tx.baseCurrency = user.baseCurrency
      - tx.amountInBase = null
      - tx.fxRateToBase = null
      - tx.fxSource = 'missing'
      - tx.fxLockedAt = null

3. Set migration flag to 'true'

SPECIAL HANDLING:
- Transfers: Apply same FX to both linked entries
- SMS transactions: Use tx.details?.smsDetails?.timestamp for rate date
```

---

## Acceptance Criteria Mapping

| Criteria | Implementation Location |
|----------|------------------------|
| Saving tx always stores currency | `TransactionService.addTransaction()` |
| amountInBase stable over time | Never recalculate unless explicit action |
| No mixed-currency totals | `AnalyticsService.getTotals()` uses amountInBase |
| Base totals exclude/warn unconverted | `Home.tsx` unconverted banner |
| Budget in single currency | `BudgetService` enforces baseCurrency |
| Account statement in account currency | `AccountService.getAccountBalance()` |
| Cross-currency transfer not income/expense | Already handled by type='transfer' exclusion |
| Export includes native + base fields | `csv.ts` column additions |

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Migration corrupts data | HIGH | Backup before migration, atomic writes |
| Rate precision drift | MEDIUM | Store 8 decimal places, round only at display |
| Offline save then rate available | LOW | Background job to fill nulls (optional) |
| User changes baseCurrency | HIGH | Add confirmation dialog, recalc option |
| Chart rendering with mixed currencies | MEDIUM | Filter to single currency or show warning |

---

## Recommended Order of Implementation

1. **Types and interfaces** (no runtime risk)
2. **FX cache utility** (isolated, testable)
3. **Migration script** (run once, sets defaults)
4. **TransactionService FX integration** (core change)
5. **UI components** (user-visible changes)
6. **Dashboard aggregation** (depends on above)
7. **Budget integration** (depends on aggregation)
8. **Export updates** (low priority)
9. **Edge case handling** (ongoing)

---

## Technical Notes

### Precision Rules by Currency

| Currency | Minor Units | Example |
|----------|-------------|---------|
| USD, EUR, GBP, SAR | 2 | 100.00 |
| JPY, KRW | 0 | 100 |
| BHD, KWD, OMR | 3 | 100.000 |

### FX Rate Precision

Store rates with **8 decimal places** to handle small currencies:
- USD/JPY: 150.12345678
- EUR/USD: 1.08765432

### Storage Size Estimation

Each transaction adds ~200 bytes for FX fields. With 10,000 transactions:
- Additional storage: ~2MB
- Well within localStorage limits (5-10MB)

