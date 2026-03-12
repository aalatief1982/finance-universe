

## Findings

### Root Cause

In `structureParser.ts` line 57, `normalizeDate("26/3/12")` matches via:
```js
const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
// dd=26, mm=3, yy=12 → fullYear=2012 (since 12 < 50) → "2012-03-26"
```

The parser **always assumes DD/MM/YY** — never considers YY/M/DD. For `26/3/12` received in March 2026, the correct reading is `YY/M/DD → 2026-03-12`, but it produces `2012-03-26` (14 years in the past).

The identical bug exists in `dateUtils.ts` line 78 (same logic, used by the standalone `normalizeDate` export).

### Date Flow Path
```text
SMS "26/3/12 17:36"
  → templateUtils.ts regex captures group1 = "26/3/12"
  → structureParser.ts normalizeDate("26/3/12")
  → slashMatch: dd=26, mm=3, yy=12 → "2012-03-26" ← BUG
  → stored in transaction.date
```

### Display Issue
Dates currently display as `"EEE, MMM dd"` (Home), `"MMM d, yyyy"` (BudgetDetail), or raw ISO via `<input type="date">`. No consistent `dd-MMM-yyyy` format exists.

---

## Plan

### A. Fix ambiguous date parsing — `structureParser.ts` normalizeDate (primary) + `dateUtils.ts` normalizeDate (secondary)

Replace the single DD/MM/YY assumption with multi-candidate scoring:

1. For any `A/B/C` or `A-B-C` where C is 2-digit:
   - Generate up to 3 candidates: `DD/MM/YY`, `YY/M/DD`, `MM/DD/YY`
   - Validate each (month 1-12, day 1-31)
   - Score by proximity to anchor date (default: `Date.now()`)
   - Penalize dates >1 year in the past or any date in the future beyond +7 days
   - Return the highest-scoring valid candidate

2. Add an optional `anchorDate?: number` parameter to `normalizeDate` so callers can pass SMS received timestamp when available.

3. Apply the same fix to `dateUtils.ts` normalizeDate for consistency.

**Example for `26/3/12` with anchor=2026-03-12:**
| Candidate | Interpretation | Result | Distance | Valid |
|-----------|---------------|--------|----------|-------|
| DD/MM/YY  | day=26, month=3, year=2012 | 2012-03-26 | ~14 years | Valid but far |
| YY/M/DD   | year=2026, month=3, day=12 | 2026-03-12 | 0 days | **Winner** |
| MM/DD/YY  | month=26 — invalid | — | — | No |

### B. Add display formatter — new `formatDisplayDate` in `src/lib/formatters.ts`

```ts
export const formatDisplayDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).format(date);
  // Output: "12 Mar 2026"
};
```

### C. Apply display formatter to key UI surfaces

- `Home.tsx` `formatTxnDate` — use `formatDisplayDate`
- `TransactionsByDate.tsx` `formatDate` — use `formatDisplayDate`
- `BudgetDetailPage.tsx` line 364 — replace inline `format()` with `formatDisplayDate`
- `SmsReviewInboxPage.tsx` `formatDate` — use `formatDisplayDate`

### D. Update tests

- `structureParser.test.ts` — add case for `26/3/12` → `2026-03-12`
- `dateUtils.test.ts` — add case for `26/3/12` → `2026-03-12`

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/smart-paste-engine/structureParser.ts` | Replace `normalizeDate` with candidate-scoring logic, add `anchorDate` param |
| `src/lib/smart-paste-engine/dateUtils.ts` | Same candidate-scoring fix for consistency |
| `src/lib/formatters.ts` | Add `formatDisplayDate` returning `dd-MMM-yyyy` |
| `src/pages/Home.tsx` | Use `formatDisplayDate` in `formatTxnDate` |
| `src/components/transactions/TransactionsByDate.tsx` | Use `formatDisplayDate` |
| `src/pages/budget/BudgetDetailPage.tsx` | Use `formatDisplayDate` |
| `src/pages/SmsReviewInboxPage.tsx` | Use `formatDisplayDate` |
| `src/lib/smart-paste-engine/__tests__/structureParser.test.ts` | Add ambiguous date test |
| `src/lib/smart-paste-engine/dateUtils.test.ts` | Add ambiguous date test |

## Explicit Non-Changes

- **No change** to `templateUtils.ts` date regex extraction — it correctly captures `26/3/12` as group 1
- **No change** to native Android code
- **No change** to `<input type="date">` bindings — those require `yyyy-MM-dd` and will keep working
- **No change** to ISO storage format
- **No change** to `normalizeSmsDate` in `src/utils/dateParser.ts` (separate legacy utility)
- **No change** to `normalizeDraftTransactionForSave.ts`

## Validation Plan

1. Paste SMS with `26/3/12 17:36` into Smart Entry → verify date resolves to `2026-03-12`
2. Verify transaction list shows `12 Mar 2026`
3. Verify edit screen date picker shows correct date
4. Paste SMS with unambiguous date like `2026-03-12` → verify unchanged behavior
5. Paste SMS with `12/3/26` → verify resolves to `2026-03-12` (not `2026-12-03`)

