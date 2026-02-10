

# Root Cause Found: `validateTransactionForStorage()` Strips All FX Fields

## The Bug

The function `validateTransactionForStorage()` in `src/utils/storage-utils-fixes.ts` (lines 30-75) creates a **brand new object** with only a whitelist of fields. It completely **drops** all FX fields:

- `amountInBase` -- DROPPED
- `fxSource` -- DROPPED
- `fxRateToBase` -- DROPPED
- `baseCurrency` -- DROPPED
- `fxLockedAt` -- DROPPED
- `fxPair` -- DROPPED

### Data Flow Proving the Bug

```text
1. User saves transaction
2. ensureFxFields() adds FX fields          --> amountInBase: -1125, fxSource: 'manual'  (CORRECT)
3. contextAddTransaction() stores in state  --> FX fields present in React state          (CORRECT)
4. storeTransaction() persists to storage   --> validateTransactionForStorage() STRIPS FX (BUG)
5. On next render/reload, getStoredTransactions() loads from localStorage WITHOUT FX     (BROKEN)
6. AnalyticsService sees amountInBase: undefined, fxSource: undefined                    (BROKEN)
7. Cards show 0, warnings appear, foreign amounts unconverted                            (BROKEN)
```

The console logs confirm this exactly:
- `ensureFxFields SKIP (already has FX) | USD -> SAR | fxSource: manual | amountInBase: -1125` -- Fields exist in memory
- `getFxAwareTotals TX | Electricity | amountInBase: undefined | fxSource: undefined` -- Fields missing when read back

## Fix Plan

### Step 1: Add FX fields to `validateTransactionForStorage()` (THE FIX)

**File:** `src/utils/storage-utils-fixes.ts`

Add FX field preservation to the validated transaction object. After line 43 (`currency`), add:

```typescript
// FX conversion fields (preserve if present)
baseCurrency: getString(record.baseCurrency) || undefined,
amountInBase: typeof record.amountInBase === 'number' ? record.amountInBase : (record.amountInBase === null ? null : undefined),
fxRateToBase: typeof record.fxRateToBase === 'number' ? record.fxRateToBase : (record.fxRateToBase === null ? null : undefined),
fxSource: getString(record.fxSource) || undefined,
fxLockedAt: getString(record.fxLockedAt) || (record.fxLockedAt === null ? null : undefined),
fxPair: getString(record.fxPair) || (record.fxPair === null ? null : undefined),
```

Also preserve transfer fields and other missing optional fields:
```typescript
transferId: getString(record.transferId) || undefined,
transferDirection: record.transferDirection === 'out' || record.transferDirection === 'in' ? record.transferDirection : undefined,
account: getString(record.account) || undefined,
isSample: typeof record.isSample === 'boolean' ? record.isSample : undefined,
createdAt: getString(record.createdAt) || undefined,
```

### Step 2: Add a diagnostic log to confirm fields survive storage round-trip

**File:** `src/utils/storage-utils.ts`

In `storeTransaction()`, after validation, log:

```typescript
console.log('[FX-DEBUG] storeTransaction | id:', validatedTransaction.id, '| fxSource:', validatedTransaction.fxSource, '| amountInBase:', validatedTransaction.amountInBase);
```

### Step 3: No other changes needed

All the other code is correct:
- `ensureFxFields()` correctly computes FX fields
- `AnalyticsService.getFxAwareTotals()` correctly reads `amountInBase` and `fxSource`
- `Home.tsx` correctly displays `amountInBase` with fallback
- `Analytics.tsx` correctly uses `amountInBase ?? amount`

The ONLY problem is that FX fields are stripped during storage validation.

## Files to Modify

| File | Change |
|------|--------|
| `src/utils/storage-utils-fixes.ts` | Add FX fields and other missing fields to validation whitelist |
| `src/utils/storage-utils.ts` | Add diagnostic log in `storeTransaction()` |

## Expected Result

After this single fix:
- FX fields survive the storage round-trip
- `amountInBase` is present when transactions are loaded
- Cards show correct converted totals
- Analytics uses converted amounts
- Foreign currency transactions display properly with original amount as secondary
- The "missing exchange rate" warning only appears for truly unconverted transactions
