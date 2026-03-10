## Plan: Non-Template Freeform Fallback Parser

### Status: ✅ Implemented

### Summary
Added a completely isolated freeform fallback parser for Smart Entry that activates only when the existing structured/template parser produces weak results (confidence < 0.5 and no template match) or when input doesn't pass the SMS triple-gate filter.

### Architecture
- **Two learning domains**: SMS (existing, unchanged) and Freeform (new, isolated)
- **Routing**: Structured first → if weak → freeform fallback
- **Learning gate**: `source` field (`smart-paste-freeform` / `voice-freeform`) controls which store gets updated at save time

### Files Added
- `src/lib/freeform-entry/freeformTypes.ts` — Type definitions
- `src/lib/freeform-entry/freeformParser.ts` — Core extraction logic (amount, type, date, vendor, category, counterparty)
- `src/lib/freeform-entry/freeformLearningStore.ts` — Isolated localStorage store (`xpensia_freeform_learned_mappings`)
- `src/lib/freeform-entry/index.ts` — Barrel exports
- `src/lib/freeform-entry/__tests__/freeformParser.test.ts` — 11 tests (EN/AR expense, income, transfer, edge cases)

### Files Changed
- `src/types/transaction.ts` — Added `smart-paste-freeform` | `voice-freeform` to `TransactionSource`
- `src/types/inference.ts` — Added `'freeform'` to `InferenceOrigin`
- `src/lib/inference/inferenceDTO.ts` — Added `'freeform'` to normalizeOrigin
- `src/lib/inference/buildInferenceDTO.ts` — Added freeform source types
- `src/components/SmartPaste.tsx` — Freeform fallback routing after structured path
- `src/components/NERSmartPaste.tsx` — Same freeform fallback routing
- `src/lib/smart-paste-engine/saveTransactionWithLearning.ts` — Learning branch by source (freeform → isolated store, SMS → existing stores)

### Storage Keys
| Domain | Key |
|--------|-----|
| SMS | `xpensia_template_bank`, `xpensia_keyword_bank`, `xpensia_vendor_map`, `xpensia_fromaccount_map`, `xpensia_template_account_map` |
| Freeform | `xpensia_freeform_learned_mappings` |

### What Was NOT Changed
- SMS parser (`structureParser.ts`, `parseAndInferTransaction.ts`)
- SMS template extraction / matching
- SMS keyword bank logic
- Native SMS listener / OTP / sender allow-list
- `messageFilter.ts` triple-gate logic
- Template failure tracking
- Field promotion overlay

### Verification
- 11/11 unit tests pass
- No build errors
- SMS learning path unchanged (gated by `isLearningSource` check)
- Freeform learning path isolated (gated by `isFreeformSource` check)
