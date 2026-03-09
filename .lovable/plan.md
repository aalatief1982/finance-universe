

## Summary of Approach

This plan introduces a **freeform fallback parser** as a completely separate, additive module that activates only when the existing structured/template parser produces weak results or when input clearly is not SMS-shaped. The freeform parser has its own isolated learning store and never touches SMS template banks, keyword banks, or sender-based logic.

The key integration point is in **SmartPaste.tsx** — after the existing `parseAndInferTransaction` call, if the result confidence is low and the input lacks SMS structure, the freeform parser runs as a fallback. The freeform result uses a distinct `source` value (`smart-paste-freeform` or `voice-freeform`) that gates learning at save time.

---

## Routing Design

```text
User Input (Smart Entry)
        │
        ▼
parseAndInferTransaction()  ← existing structured path (unchanged)
        │
        ├── confidence >= 0.5 OR template matched?
        │       YES → use structured result (existing behavior)
        │       NO  ↓
        ▼
parseFreeformTransaction()  ← NEW freeform fallback
        │
        ├── amount found?
        │       YES → build transaction, source='smart-paste-freeform'
        │       NO  → show existing "no transaction" state
        ▼
Route to /edit-transaction (existing review flow)
```

The `isFinancialTransactionMessage()` triple-gate filter in SmartPaste.tsx will be **bypassed for freeform** — freeform phrases like "coffee 18 riyals" don't have dates. Instead, the freeform parser's own internal validation (must find an amount) serves as its gate.

---

## Files Added

### 1. `src/lib/freeform-entry/freeformParser.ts`
Core extraction logic:
- `parseFreeformTransaction(text: string): FreeformParseResult`
- Amount extraction (numbers with optional currency words/codes)
- Intent/type detection via verb/keyword lists (EN + AR)
- Counterparty extraction via "to/from" markers
- Relative date resolution (today/yesterday/اليوم/أمس/امبارح)
- Title/vendor residue extraction (leftover text after removing amount/currency/verbs)
- Per-field confidence scores
- Returns `FreeformParseResult` with transaction fields + confidence breakdown

### 2. `src/lib/freeform-entry/freeformTypes.ts`
Type definitions:
- `FreeformParseResult` — transaction fields + per-field confidences + overall confidence
- `FreeformLearnedEntry` — vendor/phrase → category/type mapping
- `FreeformLearningStore` shape

### 3. `src/lib/freeform-entry/freeformLearningStore.ts`
Isolated localStorage-backed learning:
- Storage key: `xpensia_freeform_learned_mappings`
- `loadFreeformMappings()` / `saveFreeformMappings()`
- `learnFromFreeformConfirmation(phrase, confirmedTransaction)` — stores vendor→category, vendor→type mappings
- `lookupFreeformHint(vendor: string)` — returns previously learned category/type
- Never reads/writes SMS storage keys

### 4. `src/lib/freeform-entry/__tests__/freeformParser.test.ts`
Minimal targeted tests:
- "coffee 18 riyals" → expense, amount 18, vendor "coffee"
- "قهوة 18 ريال" → expense, amount 18, vendor "قهوة"
- "salary 12000" → income, amount 12000
- "حولت 500 لأحمد" → transfer, amount 500, person "أحمد"
- Structured SMS sample still uses structured path (integration test)

---

## Files Changed

### 5. `src/components/SmartPaste.tsx` (small changes)
- Import `parseFreeformTransaction` from freeform module
- After `parseAndInferTransaction` result, check: if `confidence < 0.5 AND !parsed.matched`, run `parseFreeformTransaction(text)` as fallback
- If freeform succeeds (has amount), use its result with `source: 'smart-paste-freeform'` and `origin: 'fallback'`
- **Remove or bypass** the `isFinancialTransactionMessage()` gate only when the freeform path would be attempted (the triple-gate requires a date, which freeform phrases lack). Approach: try structured first, if that fails, try freeform — the freeform parser's own amount-required gate is sufficient.
- Pass freeform-specific `matchOrigin: 'fallback'` so downstream knows provenance

### 6. `src/components/NERSmartPaste.tsx` (same small changes)
- Same freeform fallback routing as SmartPaste.tsx

### 7. `src/lib/smart-paste-engine/saveTransactionWithLearning.ts` (branching at learning section)
- At line ~279, where `isLearningSource` is checked, add a branch:
  - If `source` includes `'freeform'` (e.g., `smart-paste-freeform`, `voice-freeform`): call `learnFromFreeformConfirmation()` instead of SMS template/keyword learning, then **skip** all template bank, keyword bank, vendor map, fromAccount map, and template hash operations
  - If source is existing SMS/smart-paste values: keep current behavior unchanged
- This is the **most critical isolation point**

### 8. `src/types/inference.ts` (tiny addition)
- Add `'freeform'` to `InferenceOrigin` type union

### 9. `src/lib/inference/inferenceDTO.ts` (tiny addition)
- Add `'freeform'` to `normalizeOrigin` check

### 10. `src/lib/inference/buildInferenceDTO.ts` (tiny addition)
- Add `'smart-paste-freeform' | 'voice-freeform'` to source type

---

## Learning Separation Design

| Aspect | SMS Domain | Freeform Domain |
|---|---|---|
| Storage keys | `xpensia_template_bank`, `xpensia_keyword_bank`, `xpensia_vendor_map`, `xpensia_fromaccount_map`, `xpensia_template_account_map` | `xpensia_freeform_learned_mappings` |
| Trigger | `source` in `['smart-paste', 'sms', 'sms-import']` | `source` contains `'freeform'` |
| Template hashing | Yes | Never |
| Sender-based logic | Yes | Never |
| What it learns | template structures, keyword→category, vendor remaps, account preferences | vendor/phrase → category/type only |
| When it learns | On confirmed save | On confirmed save only |

---

## Exact Storage Keys / Data Shapes Added

```typescript
// Key: 'xpensia_freeform_learned_mappings'
// Shape:
interface FreeformLearnedMapping {
  normalizedVendor: string;  // lowercased, trimmed vendor/title
  category: string;
  subcategory?: string;
  type: TransactionType;
  currency?: string;
  confirmedCount: number;
  lastConfirmedAt: string;  // ISO date
}
// Stored as FreeformLearnedMapping[]
```

---

## Why SMS Learning Is Kept Isolated

The save-time branching in `saveTransactionWithLearning.ts` gates on `source`. Freeform sources (`smart-paste-freeform`, `voice-freeform`) skip the entire template extraction, keyword bank update, vendor remap, fromAccount remap, and template-hash-account-map sections. They only call the new `learnFromFreeformConfirmation()` which writes to a completely separate storage key. No code path allows freeform data to enter SMS stores.

---

## Risks / Follow-up Notes

1. **SmartPaste triple-gate bypass**: The `isFinancialTransactionMessage()` filter requires keyword+amount+date. Freeform phrases lack dates. The plan tries structured first (which handles the gate), then falls back to freeform only on failure. The freeform path bypasses this gate intentionally — its own "amount required" check is the safety gate.
2. **Confidence display**: Freeform confidence will display with the existing UI but with `origin: 'fallback'` label. No new UI components needed.
3. **Category inference**: V1 uses a small conservative keyword→category map (coffee→Food, salary→Income, etc.) plus the freeform learning store for previously confirmed mappings. No taxonomy changes.
4. **Voice flow**: The existing voice transcript flow in Home.tsx navigates to ImportTransactions with `voiceTranscript`. The SmartPaste component receives it as `prefillText`. The freeform fallback will naturally activate for voice transcripts that don't match SMS templates. Source can be tagged `voice-freeform` when the input came via voice (detectable from location state).

