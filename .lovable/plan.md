

## Summary

The freeform parser provenance is flattened: `matchOrigin` is hardcoded to `'fallback'` in SmartPaste.tsx line 341, even though `InferenceOrigin` already includes `'freeform'` as a valid value. The callback type signatures in SmartPaste and ImportTransactions don't include `'freeform'` in their union, so even if the value were set correctly it would be a type mismatch.

The fix is surgical: update the `matchOrigin` union types in the callback signatures and set `'freeform'` instead of `'fallback'` in the freeform branch.

## Changes

### 1. `src/components/SmartPaste.tsx`

**Line 81** — Add `'freeform'` to `matchOrigin` union in `SmartPasteProps.onTransactionsDetected`:
```
matchOrigin?: 'template' | 'structure' | 'ml' | 'fallback' | 'freeform',
```

**Line 108-109** — Add `'freeform'` to `matchOrigin` state type:
```
const [matchOrigin, setMatchOrigin] = useState<
  'template' | 'structure' | 'ml' | 'fallback' | 'freeform' | null
>(null);
```

**Line 341** — Change freeform branch from `setMatchOrigin('fallback')` to:
```
setMatchOrigin('freeform');
```

**Lines 135-151** — Add `'freeform'` case to `getOriginLabel` and `getOriginShortLabel`:
- `getOriginLabel`: add `case 'freeform': return t('smartEntry.originFreeform');` (fall back to `t('smartEntry.originFallback')` if key missing)
- `getOriginShortLabel`: add `case 'freeform': return t('smartEntry.originFreeformShort');` (fall back to same)

### 2. `src/pages/ImportTransactions.tsx`

**Line 268** — Add `'freeform'` to `matchOrigin` union in `handleTransactionsDetected`:
```
matchOrigin?: 'template' | 'structure' | 'ml' | 'fallback' | 'freeform',
```

No other changes needed — `createInferenceDTOFromDetection` already accepts `InferenceOrigin` which includes `'freeform'`, and `normalizeInferenceDTO` already validates it. The learning isolation in `saveTransactionWithLearning` gates on `transaction.source.includes('freeform')`, which is already set correctly to `'smart-paste-freeform'`.

### 3. `src/components/NERSmartPaste.tsx` (alignment)

**Line 48** — Add `'freeform'` to `matchOrigin` union in `NERSmartPasteProps.onTransactionsDetected`:
```
matchOrigin?: "template" | "structure" | "ml" | "fallback" | "freeform",
```

## What is NOT changed

- `messageFilter.ts` — untouched
- `FinancialSmsClassifier.java` — untouched
- `saveTransactionWithLearning.ts` — untouched (isolation already works via `source.includes('freeform')`)
- `parseAndInferTransaction.ts` — untouched
- `inferenceDTO.ts` / `inference.ts` — untouched (`'freeform'` already in `InferenceOrigin` enum)

## Validation

| Scenario | Result |
|---|---|
| SMS bank message | Structured parser used, origin = template/structure, freeform not triggered |
| "coffee 18 riyals" | Freeform parser, origin = `freeform`, source = `smart-paste-freeform` |
| "قهوة 18 ريال" | Freeform parser, origin = `freeform`, provenance preserved through DTO |
| "حولت 500 لأحمد" | Freeform parser, save writes only to `xpensia_freeform_learned_mappings` |
| SMS save | Template/keyword/vendor learning fires normally |
| Freeform save | Only freeform learning store written (gated by `source.includes('freeform')`) |

## Risks

- Missing i18n keys `smartEntry.originFreeform` / `smartEntry.originFreeformShort` — will add fallback to existing `originFallback` labels if keys don't exist yet.

