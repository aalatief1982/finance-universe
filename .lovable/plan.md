

## Plan: SMS Detection Logic Enrichment (4 Parts)

### Part 1 — JS Fallback Keyword Enrichment (`messageFilter.ts` L50)

Add English and Arabic high-signal financial keywords to the fallback list. The normalization at L53-56 strips whitespace and lowercases, so multi-word terms like "cash withdrawal" collapse to "cashwithdrawal" — meaning multi-word phrases must be included as their collapsed form to match. Single words are safe as-is.

**Current list (8 Arabic terms):**
```
"مبلغ", "حوالة", "رصيد", "بطاقة", "شراء", "تحويل", "دفع", "إيداع"
```

**New list — add English terms + additional Arabic terms:**
- English: `transaction`, `purchase`, `debit`, `debited`, `credit`, `credited`, `withdrawal`, `withdraw`, `deposit`, `deposited`, `payment`, `paid`, `transfer`, `transferred`, `remittance`, `charged`, `balance`, `fee`, `fees`
- Arabic: `عملية`, `مشتريات`, `سحب`, `استلام`, `رسوم`, `الرسوم`, `خصم`, `الرصيد`, `مدفوعات`

Excluded: generic terms like "card", "pos", multi-word phrases that collapse oddly. Existing terms preserved.

### Part 2 — JS Date Pattern Enrichment (`messageFilter.ts` L69-77)

Add one new pattern to the date regex array for compact bank-style dates:
```
\d{2}[\s-]?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s-]?\d{2,4}
```
This covers: `09MAR26`, `09MAR2026`, `09-Mar-26`, `09 Mar 26`, `09MAR 26`. The regex is already case-insensitive (`gi` flag). Existing patterns unchanged.

### Part 3 — Native Amount Pattern Enrichment (`FinancialSmsClassifier.java` L12)

The current second branch `\d+(?:[.,]\d{1,2})?\s*\b(?:sar|...)\b` fails on `56,325.00 SAR` because `\d+` can't consume past commas.

Fix: change second branch from `\d+(?:[.,]\d{1,2})?` to `\d{1,3}(?:,\d{3})*(?:[.,]\d{1,2})?` — same pattern already used in the third branch for Arabic currency words.

### Part 4 — Build Fix (`BudgetInsightsPage.tsx` L74)

Replace `.replaceAll(...)` with `.replace(new RegExp(..., 'g'), ...)` — local fix, no tsconfig change needed.

### Part 5 — Tests

Add test cases to existing `messageFilter.test.ts`:
- HSBC sample with `09MAR26` + English keyword "payment" → should pass
- International transfer sample with Arabic keywords + standard date → should pass
- Existing tests remain unchanged

### Files Changed
1. `src/lib/smart-paste-engine/messageFilter.ts` — keywords + date pattern
2. `capacitor-background-sms-listener/.../FinancialSmsClassifier.java` — amount regex
3. `src/pages/budget/BudgetInsightsPage.tsx` — replaceAll fix
4. `src/lib/smart-paste-engine/messageFilter.test.ts` — new test cases

