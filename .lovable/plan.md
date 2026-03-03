

## Analysis: Smart Entry vs Notification Review — Field Status Differences

### Build Error (must fix first)

In `ImportTransactions.tsx` line 266, the Smart Entry flow spreads `rawMessage` directly onto the transaction object:
```typescript
transaction: {
  ...transaction,
  rawMessage: rawMessage ?? '',  // ❌ rawMessage is NOT a top-level Transaction property
}
```
`rawMessage` lives inside `transaction.details.rawMessage`, not at the top level. This causes the TS2353 build error.

---

### Root Cause of Different Field Statuses

The two flows pass **different data** to the edit form, causing different "Detected / Suggested / Needs review" labels and colors.

#### Flow 1: Smart Entry (NERSmartPaste)
- `NERSmartPaste.onTransactionsDetected` callback signature does **NOT include `fieldConfidences` or `parsingStatus`** (lines 37-47).
- So `handleTransactionsDetected` in ImportTransactions receives `fieldConfidences` as `undefined` and `parsingStatus` as `undefined`.
- `createInferenceDTOFromDetection` passes these undefined values through → `normalizeInferenceDTO` defaults `fieldConfidences` to `{}`.
- In the edit form, with empty `fieldConfidences`, `resolveFieldTier` falls back to **origin-based heuristics** (e.g., origin='template' gives amount/date 0.75 = medium, vendor/category 0.6 = medium, etc.).

#### Flow 2: Notification Review (handleReviewSms)
- Uses `buildInferenceDTO` which internally calls `parseAndInferTransaction` and gets **real `fieldConfidences`** (per-field scores like 0.92, 0.6, 0.3, etc.) AND **`parsingStatus`** ('success'/'partial'/'failed').
- These real scores are passed to the edit form, producing accurate tier assignments.

#### Result
Same SMS → same parsing engine → but Smart Entry **drops** the field-level confidence data before it reaches the edit form. Notification Review preserves it. This causes different Detected/Suggested/Needs Review labels.

---

### Fix Plan

#### 1. Fix build error — ImportTransactions.tsx line 266
Change `rawMessage` to be placed inside `details` instead of at the top level:
```typescript
transaction: {
  ...transaction,
  details: { ...transaction.details, rawMessage: rawMessage ?? '' },
}
```

#### 2. Pass `fieldConfidences` and `parsingStatus` from NERSmartPaste
Update the `NERSmartPasteProps.onTransactionsDetected` callback signature to include `fieldConfidences` and `parsingStatus` parameters (adding them after `keywordScore`).

In `handleSubmit`, pass `result.fieldConfidences` and `result.parsingStatus` to the callback:
```typescript
onTransactionsDetected(
  [transaction], text, senderHint,
  result.confidence, result.origin, result.parsingStatus,
  result.matchedCount, result.totalTemplates,
  result.fieldScore, result.keywordScore,
  result.fieldConfidences   // ← currently missing
);
```

Also update `handleAddTransaction` similarly.

#### 3. Update `handleTransactionsDetected` parameter order in ImportTransactions.tsx
Ensure the parameter order matches the updated callback from NERSmartPaste (parsingStatus before matchedCount, fieldConfidences at the end — or reorder to match).

These three changes will make Smart Entry pass the same inference data as Notification Review, producing identical field status labels and coloring.

