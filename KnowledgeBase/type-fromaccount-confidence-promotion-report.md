# Type + fromAccount confidence promotion safety report

## 1) Where base scores are set (unchanged)

- **Global source score constants remain untouched** in `computeConfidenceScore`:
  - `direct = 1.0`
  - `inferred = 0.7`
  - `default = 0.3`
- File: `src/lib/smart-paste-engine/confidenceUtils.ts`.

- **Base parse values still come from direct/inferred/default sources** in `parseSmsMessage` where field `confidenceScore` values are assigned through `computeConfidenceScore(...)`.
- File: `src/lib/smart-paste-engine/structureParser.ts`.

## 2) Where promotion overlay is applied (post-parse only)

- `parseAndInferTransaction` computes base `fieldConfidences`, then calls `applyFieldPromotionOverlay(...)` and only overwrites selected field scores from `promotedScores`.
- This ensures promotion is an overlay after parsing/inference, not a base-score mutation.
- File: `src/lib/smart-paste-engine/parseAndInferTransaction.ts`.

## 3) Type promotion safety

- Promotion is behind **`PROMOTE_TYPE_CONFIDENCE`** (default false).
- Promotion only triggers when all are true:
  1. base type score is below detected (`<0.8`),
  2. type is `expense` (or empty),
  3. message contains **>=2 POS/purchase markers**,
  4. message contains **0 refund/reversal markers**.
- Promotion target score is fixed at `0.85`, with `sourceKind = promoted_by_rule` and explicit evidence.
- File: `src/lib/smart-paste-engine/fieldPromotionOverlay.ts`.

## 4) fromAccount promotion safety

- Promotion is behind **`PROMOTE_FROMACCOUNT_CONFIDENCE`** (default false).
- Uses reliability stats store key: `xpensia_field_reliability_stats`.
- Context key format:
  - `contextKey = ${senderScope}:${templateHash}:${normalizedVendor}`
  - Reliability key format:
  - `${contextKey}:fromAccount:${value}`
- Learning updates occur in the save path through `recordFieldPromotionLearning(...)` after user-confirmed transaction save.
- File: `src/lib/smart-paste-engine/saveTransactionWithLearning.ts` + `src/lib/smart-paste-engine/fieldPromotionOverlay.ts`.

### Thresholds

- `confirmCount >= 3` and contradiction rate `<= 5%` => warm promotion to `0.60` (`sourceKind = promoted_by_history_warm`).
- `confirmCount >= 7` and contradiction rate `<= 5%` => detected promotion to `0.85` (`sourceKind = promoted_by_history`).

### Blocking rules implemented

- No promotion when contradictions exceed threshold.
- No promotion when reliability confirmation is absent.
- No promotion when extraction path is token/direct-field and account candidates contain garbage-like tokens (year/amount-like).
- Promotion requires deterministic source context and confirmed save history.

## 5) DebugTrace behavior

When promoted, the parser now reflects overlay changes in:

- `debugTrace.fields[*].score`
- `debugTrace.fields[*].tier`
- `debugTrace.fields[*].sourceKind`
- `debugTrace.fields[*].evidence`
- `debugTrace.promotionOverlay.promotedFields`
- `debugTrace.promotionOverlay.evidence`

via existing field trace assembly that consumes promotion evidence returned from overlay.

## 6) Engine Out example (expected)

```json
{
  "fields": [
    {
      "field": "type",
      "score": 0.85,
      "tier": "detected",
      "sourceKind": "promoted_by_rule",
      "evidence": [
        "Inferred suggestion: expense",
        "Promoted by rule: POS markers matched: شراء عبر نقاط البيع, mada, بطاقة; no refund markers detected."
      ]
    },
    {
      "field": "fromAccount",
      "score": 0.3,
      "tier": "needs_review",
      "sourceKind": "template_default",
      "evidence": [
        "Template default: SAB",
        "Derived from account token: ***7413"
      ]
    }
  ],
  "promotionOverlay": {
    "promotedFields": {
      "type": "promoted"
    },
    "evidence": [
      {
        "field": "type",
        "sourceKind": "promoted_by_rule",
        "ruleId": "type_promotion:pos_markers",
        "message": "Promoted by rule: POS markers matched: شراء عبر نقاط البيع, mada, بطاقة; no refund markers detected."
      }
    ]
  }
}
```

If reliability thresholds are met, `fromAccount` changes to warm/detected with history evidence and counts.
