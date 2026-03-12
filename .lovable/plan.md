

## Findings

### Root Cause

In `templateUtils.ts`, `extractTemplateStructure` (lines 366-408), the amount+currency regex loop has two guards that enforce first-match-wins:

1. **Line 384**: `if (!placeholders.amount && !placeholders.currency && amount && currency)` — skips all subsequent matches once the first is stored
2. **Line 407**: `break;` — exits the regex match loop after the first hit for each field type

For a dual-currency SMS like:
```
عملية شراء دولية بمبلغ 50.00 USD لدى AMAZON في 2026-03-10
المبلغ المحول: 187.50 SAR
سعر الصرف: 3.75
رسوم دولية: 5.63 SAR
الإجمالي: 193.13 SAR
```

The regex matches these amount+currency pairs in order:
1. `50.00 USD` ← wins today (first match)
2. `187.50 SAR`
3. `3.75` (no currency pair — may not match)
4. `5.63 SAR`
5. `193.13 SAR`

**The correct primary amount is `187.50 SAR`** (the local-currency converted amount), not the foreign amount or the total. For some banks the correct amount might be the total. But the fee and the exchange rate should never win.

### What Changed vs What Did Not Change

**Changed** (1 file): `src/lib/smart-paste-engine/templateUtils.ts` — `extractTemplateStructure` function only.

**Not changed**: `structureParser.ts`, `parseAndInferTransaction.ts`, `suggestionEngine.ts`, native Android code, keyword banks, other regex families, template matching, confidence scoring.

### Minimal Patch Design

Replace the first-match-wins logic in `extractTemplateStructure` with a candidate-scoring approach for the `amount+currency` field only. All other fields (date, account, vendor) keep their existing first-match behavior.

**Candidate scoring rules** (applied to each amount+currency regex match):

| Signal | Score modifier | Rationale |
|---|---|---|
| Near transaction keyword (`مبلغ`, `بمبلغ`, `بقيمة`, `Amount`, `purchase`) within ~30 chars before match | +2 | Primary transaction amount |
| Near fee keyword (`رسوم`, `fee`, `commission`, `عمولة`) within ~30 chars before | -3 | Fee — never primary |
| Near total/summary keyword (`إجمالي`, `total`, `المبلغ الإجمالي`) within ~30 chars before | -1 | Total — penalized but not excluded |
| Near FX rate keyword (`سعر الصرف`, `exchange rate`, `سعر التحويل`) within ~30 chars before | -5 | Exchange rate value — never an amount |
| Near converted keyword (`المبلغ المحول`, `converted`, `المحول`) within ~30 chars before | +1 | Converted local amount — slight boost |
| Amount has no currency pair | -4 | Likely a rate or reference number |
| Is SAR (user base currency) | +0.5 | Slight preference for local currency |
| First match position bonus | +0.1 | Tiebreaker preserving existing behavior for simple SMS |

For single-amount SMS: Only one candidate exists, it gets picked regardless of score — **identical behavior to today**.

**Implementation detail**:
- Collect all regex matches into a `candidates[]` array with `{ amount, currency, index, score }`
- Run scoring pass using context window (30 chars before match start)
- Sort by score descending
- Pick top candidate as `placeholders.amount` and `placeholders.currency`
- Only the first candidate generates the `{{currency}} {{amount}}` template replacement (others are left as literal text in template)
- Log candidates array to console in development mode for debugging

### Files Changed

1. `src/lib/smart-paste-engine/templateUtils.ts` — Replace lines 366-408 (the amount+currency extraction loop body) with candidate-collection + scoring logic. ~60 lines added, ~25 lines replaced.

### Regression Risks

- **Low**: Simple single-amount SMS will have exactly one candidate, which wins by default with the position tiebreaker — no behavior change.
- **Medium**: SMS with amount before currency vs currency before amount — both capture groups already handled; scoring doesn't change this.
- **Edge case**: SMS where the fee appears before the transaction amount in text order — scoring should correctly penalize fee context keywords.

### Manual Validation Steps

1. Paste a simple local SMS (e.g., `شراء بمبلغ 45.50 SAR لدى STC PAY في 2026-03-10`) — verify amount = 45.50, currency = SAR (unchanged)
2. Paste a dual-currency international SMS — verify the SAR converted amount wins, not the foreign amount or fee
3. Check Engine Out page for the debug trace showing candidate list and scores
4. Run existing `structureParser.test.ts` and `parseAndInferTransaction.test.ts` — all pass
5. Paste an SMS with only a fee amount (no transaction amount) — verify fee still gets picked as the only candidate

