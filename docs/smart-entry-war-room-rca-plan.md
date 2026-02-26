# Smart Entry / SmartPaste War Room RCA (No-Code Investigation)

Scope guardrails respected:
- No fixes implemented.
- No code/dependency/UI/routing changes proposed as applied changes.
- Investigation and execution planning only.

## Findings

### A) Flow map from code

1. **Smart Entry page component and route**
   - Route: `src/App.tsx` → `/import-transactions` renders `ImportTransactions`.
   - Page component: `src/pages/ImportTransactions.tsx` (`ImportTransactions`).
   - Smart Entry feature component: `src/components/SmartPaste.tsx` (`SmartPaste`).

2. **Parsing pipeline when user taps main action**
   - UI entry point: `SmartPaste.handleSubmit`.
   - Main parser orchestrator: `parseAndInferTransaction(rawMessage, senderHint)` in `src/lib/smart-paste-engine/parseAndInferTransaction.ts`.
   - Pipeline sequence:
     - `parseSmsMessage` (`src/lib/smart-paste-engine/structureParser.ts`)
       - template extraction (`extractTemplateStructure`)
       - template lookup (`getTemplateByHash`)
       - direct field hydration + defaults
       - inference handoff (`inferIndirectFields`)
     - `inferIndirectFields` (`src/lib/smart-paste-engine/suggestionEngine.ts`)
       - keyword bank (`xpensia_keyword_bank`)
       - type keywords (`xpensia_type_keywords`)
       - vendor fallback fuzzy matching (`findClosestFallbackMatch`)
     - confidence calculation in `parseAndInferTransaction`
       - `fieldScore`, `templateScore`, `keywordScore`
       - `computeOverallConfidence`

3. **Detected Transaction section**
   - Section location: `src/components/SmartPaste.tsx` under heading “Detected Transaction:”.
   - Component: `src/components/smart-paste/DetectedTransactionCard.tsx`.
   - State source: `detectedTransactions` in `SmartPaste`, populated from parser result (`transaction`).

4. **Insights / Summary sections**
   - Smart Entry summary card: `src/components/SmartPaste.tsx` (“Extraction Summary”).
   - Edit page summary card: `src/components/SmartPasteSummary.tsx`, mounted in `src/pages/EditTransaction.tsx`.
   - Data source:
     - Smart Entry summary uses local state: `confidence`, `matchOrigin`, `matchedCount`, `totalTemplates`, `fieldScore`, `keywordScore`, derived `extractedFieldCount`.
     - Edit summary uses route state passed from Smart Entry.

---

### B) Issue-by-issue findings (exact logic locations)

1. **Insights text tone is technical**
   - Current text is directly metric/internal language in:
     - `src/components/SmartPaste.tsx` (`Confidence`, `Source`, `Templates`, `Field score`, `Keyword score`).
     - `src/components/SmartPasteSummary.tsx` (`Field Completion Score`, `Keyword Match Score`, `Final Confidence Score`).

2. **Add Transaction button position/style feels wrong**
   - Rendered in `DetectedTransactionCard` as compact top-right inline button (`size="sm"`, label “Add”).
   - Layout container is `flex justify-between items-start`, making CTA appear secondary relative to page primary action.

3. **“Not match yet” wording and Detected Transaction meaning**
   - Trigger logic:
     - `SmartPaste` `useEffect` sets `matchStatus = 'No match yet'` when `parseSmsMessage(...).matched` is false or parser throws.
     - `NoTransactionMessage` shows this text when there is typed content, no detection, no error.
   - Meaning of “match”: this is **template match state** (`matchedTemplate`), not complete extraction success.
   - “Detected Transaction” section: parsed transaction preview before save/learning confirmation.

4. **Add Transaction opens edit/update mode instead of create/add mode**
   - Click chain:
     - `DetectedTransactionCard` button → `SmartPaste.handleAddTransaction`.
     - callback to `ImportTransactions.handleTransactionsDetected`.
     - navigates to `/edit-transaction` with `state.transaction` populated.
   - Mode decision:
     - `EditTransaction` computes `isNewTransaction = !transaction`.
     - `saveTransactionWithLearning(..., { isNew: isNewTransaction })` decides add vs update.

5. **Smart paste summary source and expected content gap**
   - Summary currently driven by parser telemetry fields (`matchedCount`, `fieldScore`, `keywordScore`, `origin`) rather than user-goal fields.

6. **Arabic message vendor/category/subcategory failure**
   - Vendor extraction uses `extractVendorName` regex in `src/lib/smart-paste-engine/suggestionEngine.ts`.
   - Regex includes Arabic token `في` without boundary constraints, which can match inside “فيزا”.
   - This may produce an invalid short candidate and block reaching `لدى:bolt.eu` as vendor.
   - Category/subcategory then depend on keyword/fallback mapping; if vendor is blank and `bolt.eu` mapping is absent, inference remains unresolved.

7. **Amount 2-decimal consistency**
   - Canonical data model stores amount as number (`Transaction.amount`).
   - Display layer uses `formatCurrency` with fixed 2 decimals.
   - Edit form amount input keeps raw `amountText` while typing and lacks a blur-normalize-to-2-decimals step.

---

## Why it happens

1. **Technical insights**: summary UI reflects parser internals rather than user outcomes.
2. **CTA hierarchy mismatch**: parse action is primary at page level, while commit action is compact and embedded in card header.
3. **“No match yet” ambiguity**: the phrase reports template-match state, but users interpret it as full parse failure.
4. **Wrong mode on add**: passing full `transaction` into `/edit-transaction` makes page infer existing-record edit flow.
5. **Summary content mismatch**: telemetry-first values are surfaced to end users.
6. **Arabic extraction miss**: vendor regex pattern is too permissive for Arabic token boundaries and does not prioritize explicit merchant label extraction.
7. **Decimal inconsistency**: display formatter is strict, but input behavior is permissive without a final formatting pass on blur.

---

## Recommendations (no implementation)

1. **Insights copy rewrite**
   - Replace internals with user outcomes:
     - “We found amount/date/merchant.”
     - “Please confirm category.”
     - “Saving this helps recognize similar messages on this device.”

2. **Add Transaction CTA placement options (minimal diffs later)**
   - Option A: move to card footer as full-width primary button.
   - Option B: section-level primary CTA below detected card.
   - Option C: keep location but change label (“Add Transaction”) and visual weight.

3. **Replace “No match yet” wording**
   - Suggested copy:
     - “No saved pattern found yet. We can still extract details from this message.”
   - Display only during pre-submit typing state.

4. **Guarantee create mode from Smart Entry**
   - Introduce explicit navigation mode contract (e.g., `state.mode = 'create'`) and prioritize it in `EditTransaction`.
   - Keep fallback logic for legacy routes/entry points.

5. **Smart paste summary should contain**
   - Extracted key fields: amount, currency, date, merchant.
   - Non-technical quality indicator (e.g., “Looks good” / “Needs review”).
   - User-action warnings only (uncategorized, missing account/date ambiguity).
   - Next action hint (“Review and add transaction”).
   - Avoid showing template/field/keyword technical scores in user-facing summary.

6. **Arabic parsing robustness improvements (minimal changes later)**
   - Add Arabic boundary-safe matching for vendor anchors (`لدى`, `من`, `عند`, etc.).
   - Pre-normalize Arabic punctuation/zero-width characters.
   - Prefer explicit labeled merchant segment (`لدى:`) before generic preposition matching.
   - Treat domain-like merchant tokens (e.g., `bolt.eu`) as valid vendor candidates.
   - Seed/update local keyword/fallback mappings for common merchants.

7. **Amount formatting consistency rule**
   - Keep canonical storage as number.
   - Continue 2-decimal display formatting via `Intl.NumberFormat`.
   - Input UX: permissive while typing, normalize to 2 decimals on blur.
   - Handle locale separators and negative values safely.

---

## Execution plan

1. **Text-only copy cleanup in Smart Entry + Edit summary cards**
   - Risk: **Low**
   - Dependencies: product copy sign-off.

2. **Choose CTA placement pattern and apply minimal layout update**
   - Risk: **Low-Medium**
   - Dependencies: UX preference decision (A/B/C option above).

3. **Update no-match message content and visibility timing**
   - Risk: **Low**
   - Dependencies: final copy.

4. **Create-mode contract hardening in navigation/state**
   - Risk: **Medium**
   - Dependencies: agreed route-state schema.

5. **Summary payload simplification to user-value fields**
   - Risk: **Low-Medium**
   - Dependencies: accepted final summary model.

6. **Arabic vendor extraction normalization + boundary fix**
   - Risk: **Medium**
   - Dependencies: message sample set for validation.

7. **Amount blur normalization to fixed 2 decimals**
   - Risk: **Medium**
   - Dependencies: locale behavior and negative-value UX decision.

### Verification screenshots required after implementation (no npm build/test)

1. Smart Entry initial screen with user-friendly insights text.
2. Post-“Review Transaction” with updated summary and final Add CTA placement.
3. No-template-match case showing revised user wording.
4. Add Transaction opening transaction page in CREATE/ADD mode.
5. Arabic sample message parse showing merchant detection path (`bolt.eu`) and category/subcategory outcome.
6. Amount field behavior: input `35` then blur => `35.00`, plus 2-decimal list/card display.

---

## Code reference index

- Routing/page composition:
  - `src/App.tsx`
  - `src/pages/ImportTransactions.tsx`
  - `src/pages/EditTransaction.tsx`
- Smart Entry UI and states:
  - `src/components/SmartPaste.tsx`
  - `src/components/smart-paste/DetectedTransactionCard.tsx`
  - `src/components/smart-paste/NoTransactionMessage.tsx`
  - `src/components/SmartPasteSummary.tsx`
- Parsing pipeline:
  - `src/lib/smart-paste-engine/parseAndInferTransaction.ts`
  - `src/lib/smart-paste-engine/structureParser.ts`
  - `src/lib/smart-paste-engine/suggestionEngine.ts`
  - `src/lib/smart-paste-engine/templateUtils.ts`
- Save mode and persistence behavior:
  - `src/lib/smart-paste-engine/saveTransactionWithLearning.ts`
- Amount model/formatting:
  - `src/types/transaction.ts`
  - `src/components/TransactionEditForm.tsx`
  - `src/utils/format-utils.ts`
