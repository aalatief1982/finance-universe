

## Vendor Extraction Quality — Investigation & Minimal Patch Plan

### A. Findings

**Vendor extraction path** (canonical active):
1. `templateUtils.ts` line 353 calls `extractVendorName(message)` during template structure extraction
2. `suggestionEngine.ts` line 388 calls it again during inference if no vendor was provided by direct fields
3. `structureParser.ts` line 287 applies vendor mapping post-extraction but doesn't validate the candidate itself

**`extractVendorName`** (lines 671-728) has two anchor pattern families:

- **Arabic anchors** (line 699): Uses a lazy capture `([^\n]+?)` with a smart lookahead that stops at keywords like `في` (in). This mostly works — for `لدى GITHUB, INC في UNITED STATES`, the comma delimiter or `في` lookahead stops capture before the country.

- **English anchors** (line 700): Uses a greedy capture `([^\n,؛;:-]+)` with NO location-keyword stop. For `purchased from GITHUB INC in UNITED STATES`, it captures the entire `GITHUB INC in UNITED STATES` because there's no comma/semicolon delimiter.

**`captureCandidate`** (lines 676-688) validates the result but only checks:
- Length > 2
- Not purely numeric
- Not a 4-digit number
- Doesn't contain "sar"
- Doesn't start with `**`
- Not a decimal number

It does NOT reject country names, location fragments, or strip trailing location phrases.

### B. Root Cause

Two gaps in `extractVendorName`:

1. **English anchor regex has no location stop** — unlike the Arabic pattern which stops at `في`, the English pattern `([^\n,؛;:-]+)` greedily captures through `in COUNTRY` / `at LOCATION` fragments.

2. **`captureCandidate` has no location/country rejection** — it passes through tokens like `UNITED STATES`, `SAUDI ARABIA`, `BAHRAIN` as valid vendors.

### C. Minimal Patch Proposal

**File**: `src/lib/smart-paste-engine/suggestionEngine.ts` — `extractVendorName` function only (~15 lines added/changed).

**Change 1**: In `captureCandidate`, strip trailing location phrases before validation:
```
// Strip trailing " in LOCATION" / " في LOCATION" patterns
.replace(/\s+(?:in|at|في)\s+[A-Z][A-Z\s]+$/i, '')
```

**Change 2**: Add a small blocklist of obvious non-vendor tokens — country names, currency words, bank system words — and reject if the final candidate matches:
```typescript
const NON_VENDOR_TOKENS = new Set([
  'united states', 'united kingdom', 'saudi arabia', 'united arab emirates',
  'bahrain', 'kuwait', 'qatar', 'oman', 'egypt', 'jordan', 'lebanon',
  'india', 'china', 'japan', 'germany', 'france', 'italy', 'spain',
  'canada', 'australia', 'brazil', 'mexico', 'turkey', 'singapore',
  'hong kong', 'south korea', 'netherlands', 'sweden', 'switzerland',
  'ireland', 'us', 'uk', 'uae', 'ksa',
]);
```
Check: `if (NON_VENDOR_TOKENS.has(candidate.toLowerCase())) return '';`

**Change 3**: Add a similar trailing-strip to the English anchor regex lookahead — add `in|at` as stop words:
```
/(?:\b)(?:at|from|paid to|purchased from)\s*[:\s]*([^\n,؛;:-]+?)(?=\s+(?:in|at)\s+[A-Z]|\s*$)/i
```

Actually, modifying the regex is riskier. The `captureCandidate` post-processing approach (changes 1+2) is safer because it applies uniformly to all anchor patterns.

**Change 4**: Add 2-3 unit tests:
- `extractVendorName('purchased from GITHUB INC in UNITED STATES')` → `'GITHUB INC'`
- `extractVendorName('لدى AMAZON في UNITED STATES بمبلغ 50 USD')` → `'AMAZON'`
- `extractVendorName('at UNITED STATES')` → `''` (country rejected as standalone vendor)

### D. Exact Changed Files

1. `src/lib/smart-paste-engine/suggestionEngine.ts` — `captureCandidate` function inside `extractVendorName` (~10 lines added)
2. `src/lib/smart-paste-engine/__tests__/suggestionEngine.test.ts` — 3 new test cases

### E. What Did NOT Change

- `structureParser.ts` — untouched
- `templateUtils.ts` — untouched
- `parseAndInferTransaction.ts` — untouched
- Keyword banks — untouched
- Vendor fallback matching — untouched
- Native Android logic — untouched
- Arabic anchor regex — untouched
- English anchor regex — untouched (fix is in post-processing, not regex rewrite)

### F. Cases Intentionally Unresolved

- Vendor names that legitimately contain country names (e.g., "United States Postal Service") — these are rare and can be handled via vendor mapping/learning
- Ambiguous cases where the location IS the vendor (e.g., "Dubai Mall") — prefer blank over wrong

### G. Regression Risks

- **Low**: The trailing location strip only fires when `\s+(in|at|في)\s+[A-Z]` is at the end of the candidate — won't affect vendors like "Plug In Digital" where "in" is mid-string and not followed by all-caps
- **Low**: The country blocklist only rejects exact full-match — won't affect "India Gate Restaurant" since that's not an exact match to "india"
- **None**: Simple local SMS with no location suffix are completely unaffected

### H. Manual Validation Steps

1. Paste `عملية شراء دولية لدى GITHUB, INC بمبلغ 9.99 USD في UNITED STATES` — verify vendor = `GITHUB, INC` or `GITHUB`
2. Paste `purchased from AMAZON in UNITED STATES for 50.00 USD` — verify vendor = `AMAZON`, not `AMAZON in UNITED STATES`
3. Paste simple local SMS like `شراء بمبلغ 45.50 SAR لدى STC PAY في 2026-03-10` — verify vendor = `STC PAY` (unchanged)
4. Run existing `suggestionEngine.test.ts` — all pass

