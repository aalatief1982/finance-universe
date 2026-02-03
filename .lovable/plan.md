
# Fix Missing FX Display in Transaction UI

## Problem Summary

The Multi-Currency FX implementation is saving data correctly but **not displaying FX fields** in key locations:

1. **TransactionEditForm.tsx** - The main edit form on `/edit-transaction` lacks FX estimate display
2. **Transaction list items** - Cards don't show converted amount or unconverted warnings
3. **Transaction detail view** - No display of saved FX metadata (rate, source, base amount)

## Implementation Plan

### Phase 3 Completion: Add FX Display to All Transaction Views

---

### Step 1: Add FX Estimate to TransactionEditForm.tsx

**File:** `src/components/TransactionEditForm.tsx`

**Changes:**
- Import `FxEstimateDisplay` and `FxRateInput` components
- Add state for `manualFxRate` and dialog visibility
- Insert `FxEstimateDisplay` below the Amount/Currency fields
- Pass the `manualFxRate` to the save handler for `TransactionService` to use

**Location:** After the Currency field row (around line 620), add:
- `FxEstimateDisplay` component with watched amount, currency, and date values
- Manual rate dialog trigger

---

### Step 2: Add FX Info Display to Transaction Cards

**File:** `src/components/transactions/TransactionsByDate.tsx`

**Changes:**
- Import `UnconvertedBadge` and add helper to check FX status
- For each transaction, show:
  - Base currency amount if converted (e.g., "≈ 375 SAR")
  - `UnconvertedBadge` if `amountInBase` is null
- Add subtle secondary text below the amount showing conversion info

**Example Display:**
```text
-$100.00 USD
≈ -375.00 SAR @ 3.75
```

---

### Step 3: Show FX Metadata in Edit View

**File:** `src/components/TransactionEditForm.tsx` (or new component)

**Changes:**
- When editing an existing transaction with FX data, display a read-only section showing:
  - Original currency and amount
  - Converted base amount
  - Exchange rate used
  - FX source (cached, manual, API)
  - Lock timestamp

**UI Pattern:** Collapsible "FX Details" section at bottom of form

---

### Step 4: Create FxInfoDisplay Component

**New File:** `src/components/fx/FxInfoDisplay.tsx`

**Purpose:** Display saved FX metadata for a transaction

**Props:**
- `transaction: Transaction` - The transaction with FX fields

**Displays:**
- If same currency: "No conversion needed"
- If converted: Rate, base amount, source, lock time
- If unconverted: Warning badge with "Add rate" action

---

### Step 5: Add FX Column to TransactionCard

**File:** `src/components/transactions/TransactionCard.tsx`

**Changes:**
- Add optional display of base currency amount
- Show conversion indicator icon when currency differs from base

---

## Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/TransactionEditForm.tsx` | Modify | Add FxEstimateDisplay, manual rate support |
| `src/components/transactions/TransactionsByDate.tsx` | Modify | Show base amount + FX status on cards |
| `src/components/transactions/TransactionCard.tsx` | Modify | Add FX indicator to amount display |
| `src/components/fx/FxInfoDisplay.tsx` | Create | New component for saved FX metadata |
| `src/components/fx/index.ts` | Modify | Export new FxInfoDisplay |

---

## Technical Details

### FxEstimateDisplay Integration Pattern

```text
TransactionEditForm.tsx:
├── Import FxEstimateDisplay, FxRateInput
├── Add state: manualRateDialogOpen, manualFxRate
├── Watch: amount, currency, date (for estimate)
├── Insert after Currency row:
│   └── <FxEstimateDisplay
│         amount={editedTransaction.amount}
│         currency={editedTransaction.currency}
│         date={editedTransaction.date}
│         onRequestManualRate={() => setManualRateDialogOpen(true)}
│       />
└── Pass manualFxRate to onSave handler
```

### Transaction Card FX Display Pattern

```text
TransactionsByDate.tsx (each card):
├── Show: formatCurrency(amount, currency)
├── If currency !== baseCurrency:
│   ├── If amountInBase exists:
│   │   └── Show: "≈ {formatCurrency(amountInBase, baseCurrency)}"
│   └── Else:
│       └── Show: <UnconvertedBadge size="sm" />
```

### FxInfoDisplay Component Structure

```text
FxInfoDisplay.tsx:
├── Props: transaction, onEditRate?
├── If transaction.fxSource === 'identity':
│   └── Return null (same currency)
├── If transaction.amountInBase !== null:
│   └── Show:
│       ├── "Converted to {baseCurrency}"
│       ├── Rate: {fxRateToBase}
│       ├── Amount: {amountInBase}
│       ├── Source: {fxSource}
│       └── Locked: {fxLockedAt}
└── Else (unconverted):
    └── Show UnconvertedBadge with action
```

---

## Testing Checklist

After implementation, verify:

- [ ] When adding a new transaction in a different currency, FX estimate shows below amount
- [ ] Transaction list shows base currency equivalent for foreign currency transactions
- [ ] Unconverted transactions show warning badge in list
- [ ] Editing a transaction shows its saved FX metadata
- [ ] Manual rate input works and saves correctly
- [ ] Dashboard totals still aggregate correctly using amountInBase

---

## Order of Implementation

1. **FxInfoDisplay.tsx** - Create new component (no dependencies)
2. **TransactionEditForm.tsx** - Add FxEstimateDisplay integration
3. **TransactionsByDate.tsx** - Add FX status to transaction cards
4. **TransactionCard.tsx** - Add FX indicator (if used elsewhere)
5. **Testing** - Verify end-to-end FX visibility
