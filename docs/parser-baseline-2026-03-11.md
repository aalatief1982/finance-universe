# Xpensia Parser Baseline Investigation (Stabilize & Harden)

Date: 2026-03-11  
Scope: runtime-active parsing/detection only, no behavior changes.

## A) Runtime component map

### 1) Smart Entry parsing path (current active)
1. `ImportTransactions` renders `SmartPaste` and injects prefilled text (shared text or voice transcript).  
2. `SmartPaste` submit path runs message gate first (`isFinancialTransactionMessage`).  
3. If gate passes: `parseAndInferTransaction` executes structure/template parse (`structureParser.parseSmsMessage`) + confidence + keyword/template scoring.  
4. If structured parse is weak or gate fails: `parseFreeformTransaction` fallback executes.  
5. Result is sent to edit/review flow and later saved via `saveTransactionWithLearning` (template/keyword/vendor/account learning).

### 2) SMS financial message gate (active)
- Gate is `isFinancialTransactionMessage(text)` in `messageFilter.ts`. It applies:
  - OTP exclusion first
  - keyword matching (stored `xpensia_type_keywords` or fallback list)
  - amount regex
  - date regex
  - requires all: keyword + amount + date
- Used in `SmartPaste` submit path and `ProcessSmsMessages` filtering path.

### 3) Regex/template extraction (active)
- `templateUtils.extractTemplateStructure` does regex-based placeholder extraction (amount+currency/date/account) + vendor placeholder insertion and template hashing.
- `structureParser.parseSmsMessage` performs template lookup (`getTemplateByHash`), applies default values, maps learned vendor/account, normalizes date, and calls inference.

### 4) Keyword banks + inference (active)
- `suggestionEngine.inferIndirectFieldsWithDebug` loads `xpensia_keyword_bank`, scores candidates, infers category/subcategory/type/vendor, then applies vendor fallback + income fallback.
- `keywordBankUtils` stores CRUD for `xpensia_keyword_bank`.

### 5) Vendor/category learning (active)
- `saveTransactionWithLearning` updates:
  - template bank (`xpensia_template_bank`)
  - keyword bank (`xpensia_keyword_bank`)
  - vendor fallback bank (`xpensia_vendor_fallbacks`)
  - vendor map and account remaps
  - account preference maps
- `ReviewSmsTransactions` also supports sender-level category rule persistence via `learnVendorCategoryRule`.

### 6) Voice transcript preprocessing (active)
- `useSpeechToText` returns transcript text (native/web recognition); no parser-specific text normalization beyond recognition output and confidence gate.
- Home mic sends transcript to `/import-transactions` state; Import page gives this transcript priority and pre-fills Smart Entry text.

### 7) SMS review/inbox parse path (active)
- Inbox review in `ImportTransactions` builds inference via `buildInferenceDTO` -> `parseAndInferTransaction`.
- Batch SMS review in `ReviewSmsTransactions` parses each message with `parseAndInferTransaction` and allows mapping overrides for vendor/category/subcategory only.

## B) Active vs legacy evidence table

| Component | Status | Evidence | Why it matters |
|---|---|---|---|
| `src/components/SmartPaste.tsx` + `parseAndInferTransaction` path | **ACTIVE** | Imported/rendered by `/import-transactions`; submit calls gate + parser + freeform fallback. | Primary Smart Entry runtime parser path. |
| `src/lib/smart-paste-engine/parseAndInferTransaction.ts` | **ACTIVE** | Called by SmartPaste + `buildInferenceDTO` + `ReviewSmsTransactions`. | Canonical structured parser orchestrator. |
| `src/lib/smart-paste-engine/structureParser.ts` | **ACTIVE** | Called inside `parseAndInferTransaction` and also learning path parse for promotions. | Template-first extractor and inference bridge. |
| `src/lib/smart-paste-engine/messageFilter.ts` | **ACTIVE** | Called in SmartPaste and ProcessSmsMessages. | Financial SMS gate (latency-sensitive). |
| `src/lib/smart-paste-engine/suggestionEngine.ts` | **ACTIVE** | Used by structure parser and SMS processing pages for vendor extraction/inference. | Keyword/fallback inference core. |
| `src/lib/smart-paste-engine/templateUtils.ts` | **ACTIVE** | Used in parse flow and save/learning flow. | Template matching + regex extraction + failure tracking. |
| `src/lib/smart-paste-engine/saveTransactionWithLearning.ts` | **ACTIVE** | Imported by EditTransaction/ReviewSmsTransactions save actions. | Writes all learning stores. |
| `src/lib/freeform-entry/*` | **ACTIVE** | `SmartPaste` imports `parseFreeformTransaction`; save pipeline imports `learnFromFreeformConfirmation`. | Fallback parser for non-structured or weak-structured text. |
| `src/hooks/useSpeechToText.ts` | **ACTIVE** | Used in Home and SmartPaste mic interactions. | Transcript source feeding Smart Entry text. |
| `src/lib/smart-paste-engine/smsParser.ts` | **LEGACY / likely unused runtime** | No non-test imports found; newer pipeline uses `structureParser` + `parseAndInferTransaction`. | Duplicate parser surface; potential confusion risk. |
| `src/lib/sms-parser.ts` | **LEGACY / mostly unused runtime** | Imported by wireframe screen only; not in app route pipeline. | Large older parser with separate logic and custom rules. |
| `src/components/NERSmartPaste.tsx` + `src/pages/ImportTransactionsNER.tsx` | **LEGACY / non-routed** | File exists but no App route to NER page. | Alternate parser UX not in active navigation. |
| `src/hooks/useSmartPaste.ts` | **LEGACY / non-imported** | No imports found in codebase. | Older hook with multi-strategy parser stack. |
| `src/services/SmsProcessingService.ts` + `TransactionService.processTransactionsFromSMS` | **LIMITED / likely non-primary runtime** | Referenced in tests + wireframes; not in current canonical SMS route chain. | Secondary path that can diverge from canonical parser behavior. |

## C) Proposed golden sample fixture schema

```json
{
  "id": "ar_expense_001",
  "category": "arabic_expense_sms",
  "rawInput": "شراء بمبلغ 45.50 SAR لدى STC PAY في 2026-03-10",
  "expected": {
    "financialClassification": "financial",
    "amount": 45.5,
    "vendor": "STC PAY",
    "date": "2026-03-10",
    "type": "expense",
    "category": "Bills",
    "subcategory": "Mobile",
    "primaryEvidenceSource": "structured_template"
  },
  "notes": {
    "senderHint": "STCPAY",
    "flow": "smart_entry"
  }
}
```

### Required dataset categories
1. `arabic_expense_sms`
2. `arabic_transfer_sms`
3. `arabic_income_salary_sms`
4. `english_purchase_sms`
5. `mixed_ar_en_sms`
6. `otp_or_non_financial`
7. `ambiguous_merchant_message`
8. `voice_transcript_freeform`

### Required fields per fixture
- `rawInput`
- `expected.financialClassification` (financial / non_financial / ambiguous)
- `expected.amount`
- `expected.vendor`
- `expected.date`
- `expected.type`
- `expected.category`
- `expected.subcategory`
- `expected.primaryEvidenceSource` (`structured_template` / `keyword_bank` / `vendor_fallback` / `freeform` / `none`)

## D) Risk list (no fixes yet)

1. **Dual OTP filtering logic**: gate-level OTP in `messageFilter`, plus additional OTP checks in `ProcessSmsMessages` can drift and create inconsistent inclusion/exclusion.
2. **Multiple parser surfaces**: canonical (`parseAndInferTransaction`) coexists with legacy parser files (`smsParser.ts`, `lib/sms-parser.ts`) raising regression risk if accidentally reused.
3. **Storage-read hot path**: parse path repeatedly reads localStorage-backed stores (keyword bank, template bank, type keywords, fallback vendors) per submit/parse.
4. **Template similarity cost**: `parseAndInferTransaction` computes Levenshtein similarity against all templates when no exact match.
5. **Keyword scoring cost**: `inferIndirectFieldsWithDebug` scans keyword bank and sorts candidates per field.
6. **Vendor fuzzy matching cost**: `string-similarity.findBestMatch` over all fallback vendors can be expensive with growth.
7. **Route chain divergence risk**: SMS inbox review and batch review both parse with same core engine, but ProcessSmsMessages applies additional filtering/mapping logic before review.

## E) Suggested next-step files for instrumentation only

1. `src/components/SmartPaste.tsx` (submit timing markers around gate, parser, freeform fallback).
2. `src/lib/smart-paste-engine/parseAndInferTransaction.ts` (phase-level timing: parse, template scan, confidence scoring).
3. `src/lib/smart-paste-engine/structureParser.ts` (timing around extractTemplateStructure, template lookup, inference).
4. `src/lib/smart-paste-engine/suggestionEngine.ts` (keyword bank size, candidate counts, vendor fallback timings).
5. `src/lib/smart-paste-engine/messageFilter.ts` (gate decision trace counters).
6. `src/pages/ProcessSmsMessages.tsx` (gate pass/fail counts and OTP split reason tracking).
7. `src/pages/ReviewSmsTransactions.tsx` (batch parse latency percentile logging).

## Inspected file list (exact)

- `src/App.tsx`
- `src/pages/ImportTransactions.tsx`
- `src/components/SmartPaste.tsx`
- `src/lib/smart-paste-engine/parseAndInferTransaction.ts`
- `src/lib/smart-paste-engine/structureParser.ts`
- `src/lib/smart-paste-engine/messageFilter.ts`
- `src/lib/smart-paste-engine/suggestionEngine.ts`
- `src/lib/smart-paste-engine/templateUtils.ts`
- `src/lib/smart-paste-engine/keywordBankUtils.ts`
- `src/lib/smart-paste-engine/vendorFallbackUtils.ts`
- `src/lib/smart-paste-engine/saveTransactionWithLearning.ts`
- `src/lib/smart-paste-engine/senderCategoryRules.ts`
- `src/pages/ReviewSmsTransactions.tsx`
- `src/pages/ProcessSmsMessages.tsx`
- `src/hooks/useSpeechToText.ts`
- `src/pages/Home.tsx`
- `src/lib/inference/buildInferenceDTO.ts`
- `src/lib/freeform-entry/freeformParser.ts`
- `src/lib/smart-paste-engine/smsParser.ts`
- `src/lib/sms-parser.ts`
- `src/hooks/useSmartPaste.ts`
- `src/pages/ImportTransactionsNER.tsx`
- `src/components/NERSmartPaste.tsx`
- `src/services/SmsProcessingService.ts`
- `src/services/TransactionService.ts`
- `src/components/wireframes/screens/SMSTransactionScreen.tsx`
