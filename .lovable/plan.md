

## Findings

### Current Behavior

The candidate-scoring system in `extractTemplateStructure` (templateUtils.ts, lines 411-424) currently has:
- `convertedKeywords` (المبلغ المحول, converted, etc.) → **+1 boost** — treats conversion amount as desirable
- SAR → **+0.5 boost** — unconditional home-currency preference
- `txnKeywords` (مبلغ, بمبلغ, purchase, etc.) → **+2 boost**

For a dual-currency SMS like:
```
عملية شراء دولية بمبلغ 50.00 USD لدى AMAZON
المبلغ المحول: 187.50 SAR
```

Candidate scores today:
- **50.00 USD**: txnKeyword("بمبلغ") +2, position +0.1 = **2.1**
- **187.50 SAR**: txnKeyword("مبلغ" inside "المبلغ") +2, convertedKeyword +1, SAR +0.5, position +0.05 = **3.55** ← wins

SAR conversion wins because the converted-keyword boost (+1) and SAR bias (+0.5) together outweigh the position bonus.

### Root Cause

Two scoring rules combine to prefer the local conversion amount over the actual foreign purchase amount:
1. `convertedKeywords` gives +1 to the SAR line (should actually mark it as secondary, not primary)
2. SAR bonus +0.5 applied unconditionally, even in multi-currency messages where it creates bias against the original purchase currency

### What This Task Requires (Product Decision)

The previous patch chose SAR as winner. The user now clarifies: for international purchases, the **original foreign currency amount** is the correct primary transaction — the SAR conversion is supporting metadata.

## Minimal Patch

**File: `src/lib/smart-paste-engine/templateUtils.ts`** — ~10 lines changed in the scoring block (lines 411-424).

Changes:
1. **Detect multi-currency**: `const isMultiCurrency = new Set(candidates.map(c => c.currency)).size > 1`
2. **SAR bonus conditional**: Only apply +0.5 SAR bonus when `!isMultiCurrency` (preserves simple SMS behavior)
3. **Flip converted-keyword signal in multi-currency**: Change from +1 to -1 when `isMultiCurrency` — it marks the local conversion, not the purchase amount
4. **Foreign purchase boost**: When `isMultiCurrency` and candidate is non-SAR and near txnKeywords, add +1
5. **Log runner-up in debug**: Add the second-best candidate's amount/currency to the console debug output

Revised scores for the dual-currency example:
- **50.00 USD**: txnKeyword +2, foreign-purchase-boost +1, position +0.1 = **3.1** ← wins
- **187.50 SAR**: txnKeyword +2, converted-keyword -1, no SAR bonus, position +0.05 = **1.05**

Simple single-currency SMS: Only one currency exists → `isMultiCurrency = false` → SAR bonus still applies → identical behavior.

**File: `src/lib/smart-paste-engine/__tests__/templateUtils.test.ts`** — Update existing test (line 99-104) to expect USD instead of SAR. Add 1 new test for "SAR-first dual-currency" pattern.

## What Changed
- Scoring adjustments in `extractTemplateStructure` for multi-currency messages only
- Existing test expectation updated to match new product intent
- 1 new test added

## What Did NOT Change
- Single-currency SMS behavior (unchanged)
- Fee/FX-rate penalties (unchanged)
- structureParser, parseAndInferTransaction, suggestionEngine (untouched)
- Native Android logic (untouched)
- Keyword banks (untouched)

## What Remains a Product-Model Limitation
- The transaction model has a single `amount`/`currency` field — the SAR conversion amount is lost unless exposed via trace/debug
- Exposing a secondary `localAmount`/`localCurrency` field pair is a product-model change, not a parser fix — out of scope for this patch

## Regression Risks
- **Low**: Single-currency messages completely unaffected (guard: `isMultiCurrency` is false)
- **Low**: Fee-only and FX-rate candidates still penalized by existing -3/-5 scores
- **Medium**: The updated test expectation reflects the new product intent — if the team later wants SAR-as-primary, this is easy to revert

## Manual Validation Steps
1. Paste simple local SMS → verify amount/currency unchanged
2. Paste dual-currency international SMS → verify foreign currency wins
3. Check console debug log for candidate scores and runner-up
4. Run `templateUtils.test.ts` — all pass

