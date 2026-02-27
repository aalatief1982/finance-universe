# Xpensia Inference — Final Drift Detection Audit

## Scope audited
Entrypoints audited for inferred transaction creation and navigation into `/edit-transaction`:
- Smart Entry / SmartPaste
- Bulk SMS import/review flow
- Background SMS listener foreground event
- Notification tap handler
- Helper/DTO services used by the above
- Additional infer-like entrypoint discovered (`NER` route)

---

## SECTION A: Confirmed unified components

### 1) Canonical parser in active Smart Entry flow
- `SmartPaste.handleSubmit` uses `parseAndInferTransaction(text, senderHint)` as parser orchestrator.
- Parsed output (`transaction`, confidence metadata, origin) is propagated through `onTransactionsDetected`.

### 2) Canonical DTO normalizer for Smart Entry route handoff
- `ImportTransactions.handleTransactionsDetected` wraps state with `normalizeInferenceDTO(...)` and sets `mode: 'create'`, `isSuggested: true`, `origin`, `matchOrigin`, and confidence metadata before navigating to `/edit-transaction`.

### 3) Canonical parser + DTO in bulk SMS review initialization
- `ReviewSmsTransactions` parses each SMS via `parseAndInferTransaction(rawMessage, sender, id)`.
- It then creates route-safe state using `normalizeInferenceDTO(...)` with `mode: 'create'` and `isSuggested: true`.

### 4) Canonical parser + DTO in background SMS listener path
- In `App.tsx`, the `smsReceived` listener calls `buildInferenceDTO({ rawMessage: body, senderHint: sender, source: 'sms' })`.
- `buildInferenceDTO` internally calls `parseAndInferTransaction(...)` and then `normalizeInferenceDTO(...)`.
- Foreground case navigates directly to `/edit-transaction` with normalized DTO state.

### 5) Canonical parser + DTO in notification-tap handler
- `localNotificationActionPerformed` handler in `App.tsx` also uses `buildInferenceDTO(...)` (thus `parseAndInferTransaction` + `normalizeInferenceDTO`) before navigating to `/edit-transaction`.

### 6) Shared DTO contract and normalizer are centralized
- `InferenceDTO` shape and `normalizeInferenceDTO` define and sanitize canonical payload fields (`transaction`, `rawMessage`, `senderHint`, `confidence`, `fieldConfidences`, `mode`, etc.).

---

## SECTION B: Remaining drift

### Drift 1 — Legacy NER SmartPaste path bypasses canonical parser
- **File + function**: `src/components/NERSmartPaste.tsx` → `handleSubmit`
- **Observed drift**:
  - Uses `extractTransactionEntities(text)` instead of `parseAndInferTransaction`.
  - Manually constructs `Transaction` object with ad-hoc defaults/ids.
- **Severity**: **High** (parser unification breach).
- **Fix idea**:
  - Route NER flow through `buildInferenceDTO` (or directly `parseAndInferTransaction` + `normalizeInferenceDTO`) to preserve one parser pipeline and confidence semantics.

### Drift 2 — Legacy NER import page bypasses canonical DTO normalizer
- **File + function**: `src/pages/ImportTransactionsNER.tsx` → `handleTransactionsDetected`
- **Observed drift**:
  - Navigates to `/edit-transaction` with a hand-built state object (not via `normalizeInferenceDTO`).
  - Omits explicit `mode: 'create'` and `origin` field while sending `matchOrigin`.
- **Severity**: **High** (route state shape drift; create/edit mode ambiguity risk).
- **Fix idea**:
  - Replace manual state object with `normalizeInferenceDTO(...)` and enforce `mode: 'create'`, `origin`, `matchOrigin`, and metadata parity.

### Drift 3 — Review “Full Form” hop may lose origin/matchOrigin parity
- **File + function**: `src/pages/ReviewSmsTransactions.tsx` → Full Form button `onClick`
- **Observed drift**:
  - Re-normalizes from `txn.inferenceDTO` + ad-hoc overrides.
  - Explicitly sets `confidence`, `fieldConfidences`, etc., but does not explicitly pass `origin`/`matchOrigin` at this hop.
  - It usually survives via spread of prior `txn.inferenceDTO`, but behavior depends on prior object integrity.
- **Severity**: **Medium** (soft drift / implicit dependency).
- **Fix idea**:
  - Pass `origin` and `matchOrigin` explicitly in this re-normalization call to remove implicit reliance on spread order/existing payload.

### Drift 4 — Double normalization in App listener/tap paths (non-breaking)
- **File + function**: `src/App.tsx` listener and notification-tap handlers
- **Observed drift**:
  - Calls `normalizeInferenceDTO(await buildInferenceDTO(...))` even though `buildInferenceDTO` already returns normalized DTO.
- **Severity**: **Low** (redundant but functionally aligned).
- **Fix idea**:
  - Use `const inferenceDTO = await buildInferenceDTO(...)` directly for clarity and reduced churn.

---

## SECTION C: Parity invariants checklist

### Invariant 1: Parser unification
- **Target**: Every inferred transaction entrypoint must use `parseAndInferTransaction`.
- **Status**: ⚠️ **Not fully satisfied** (NER path bypasses parser).

### Invariant 2: DTO normalization unification
- **Target**: Route payload to `/edit-transaction` must pass through `normalizeInferenceDTO` (or helper returning it).
- **Status**: ⚠️ **Not fully satisfied** (ImportTransactionsNER manual payload).

### Invariant 3: Create-mode enforcement for inferred drafts
- **Target**: Every inferred-entry navigation sets `mode: 'create'`.
- **Status**: ⚠️ **Mostly satisfied** in canonical paths; **not guaranteed** in NER path.

### Invariant 4: Payload metadata parity
- **Target**: `origin`, `matchOrigin`, `confidence`, `fieldConfidences`, `matchedCount`, `totalTemplates`, `fieldScore`, `keywordScore`, `isSuggested` preserved end-to-end.
- **Status**: ⚠️ **Mostly satisfied**; Review Full Form hop has implicit carry-forward of `origin`/`matchOrigin`.

### Invariant 5: Notification/background parity with interactive flows
- **Target**: Background/notification inferred transactions should produce the same DTO contract as Smart Entry and SMS review.
- **Status**: ✅ **Satisfied** (uses `buildInferenceDTO` -> canonical parser and normalized DTO).

---

## Entrypoint trace matrix

| Entrypoint | Parser used | DTO/normalizer used | `/edit-transaction` payload shape summary |
|---|---|---|---|
| Smart Entry (`SmartPaste` -> `ImportTransactions`) | `parseAndInferTransaction` | `normalizeInferenceDTO` | Full `InferenceDTO` incl. `transaction`, `rawMessage`, `senderHint`, confidence metrics, `origin`/`matchOrigin`, `mode:'create'`, `isSuggested:true` |
| Bulk SMS review init (`ReviewSmsTransactions.parseAll`) | `parseAndInferTransaction` | `normalizeInferenceDTO` | Stored as `txn.inferenceDTO` with create-mode and confidence metadata |
| Bulk SMS review “Full Form” | No re-parse | `normalizeInferenceDTO` (re-normalize existing DTO + edits) | `InferenceDTO`-like payload; origin fields implicit unless explicitly re-sent |
| Background SMS listener (foreground active) | `buildInferenceDTO` -> `parseAndInferTransaction` | `buildInferenceDTO` + extra `normalizeInferenceDTO` | Normalized `InferenceDTO` navigated directly |
| Notification tap handler | `buildInferenceDTO` -> `parseAndInferTransaction` | `buildInferenceDTO` + extra `normalizeInferenceDTO` | Normalized `InferenceDTO` navigated directly |
| Additional: NER route (`ImportTransactionsNER`) | `extractTransactionEntities` (non-canonical) | Manual object (non-canonical) | Partial/manual state object; lacks strict DTO parity and create-mode enforcement |

