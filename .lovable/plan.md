

## Root Cause Findings

The date `11/3/26` is parsed incorrectly because `structureParser.ts` has its own `normalizeDate` (line 43) that only handles **dash-separated** short dates (`^(\d{2})-(\d{1,2})-(\d{1,2})$`). The slash-separated `11/3/26` does not match this regex.

It falls through to the **native `new Date("11/3/26")`** fallback (line 56), which interprets slashes as **MM/DD/YY** (US locale convention) → **November 3, year 0026**. The `.toISOString()` then produces a UTC date, and timezone offset shifts it back to **November 2** in the user's local timezone (Arabia Standard Time, UTC+3).

Note: line 32 shows `//import { normalizeDate } from './dateUtils';` — the superior `dateUtils.ts` version (which correctly handles slash-separated DD/MM/YY) is **commented out** and unused.

## Date Pipeline Trace

1. **Raw SMS**: `؜11/3/26 2:05`
2. **`extractTemplateStructure`** (templateUtils.ts line 329): date regex captures `11/3/26` as `match[1]` (time stripped by outer group), stored in `placeholders['date'] = "11/3/26"`
3. **`parseSmsMessage`** (structureParser.ts line 266): calls `normalizeDate("11/3/26")`
4. **`normalizeDate`** (structureParser.ts line 47): dash regex `/^(\d{2})-(\d{1,2})-(\d{1,2})$/` → **no match** (slashes, not dashes)
5. **Fallback** (line 56): `new Date("11/3/26")` → JS interprets as **M/D/Y = November 3, year 26** → `.toISOString()` → `"0026-11-02T21:00:00.000Z"` (UTC offset) → `.split('T')[0]` → `"0026-11-02"`
6. **Edit form**: receives `"0026-11-02"` → date picker shows **Mon, Nov 2** (year probably auto-corrected to 2026 by the picker or form normalization)

## First Point of Corruption

**`structureParser.ts` line 47** — the slash format `11/3/26` is not matched by the dash-only regex, causing it to fall into the unsafe `new Date()` fallback which uses MM/DD/YY interpretation.

## Current Date Format Assumption

The SMS messages use **DD/MM/YY** format (Saudi/international convention). The dash regex on line 47 also assumes DD/MM/YY but labeled as `yy-mm-dd` in comments (confusing but the group order `[yy, mm, dd]` actually treats the first group as year — so it's actually YY-MM-DD for dashes). This is a second bug for dash dates but not the one at hand.

For slashes, there is no explicit assumption — it falls through to `new Date()` which uses MM/DD/YY.

## Minimal Safe Fix

**Add slash-format handling** to `structureParser.ts`'s `normalizeDate`, matching the pattern already proven in `dateUtils.ts` line 78.

### File: `src/lib/smart-paste-engine/structureParser.ts`

**Lines 43-58** — Add a slash regex before the fallback:

```typescript
export function normalizeDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined;

  // Match short DD-MM-YY or D-M-YY dash formats like 25-3-26
  const dashMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{2})$/);
  if (dashMatch) {
    const [, dd, mm, yy] = dashMatch;
    const fullYear = parseInt(yy, 10) < 50 ? `20${yy}` : `19${yy}`;
    return `${fullYear}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }

  // Match short DD/MM/YY or D/M/YY slash formats like 11/3/26
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (slashMatch) {
    const [, dd, mm, yy] = slashMatch;
    const fullYear = parseInt(yy, 10) < 50 ? `20${yy}` : `19${yy}`;
    return `${fullYear}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }

  // Fallback to native parsing (safe for ISO and full-year formats)
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? undefined : parsed.toISOString().split('T')[0];
}
```

**Key details:**
- Both dash and slash regexes now use `\d{1,2}` for DD and MM (handles `11/3/26` and `01/03/26`)
- Both assume **DD/MM/YY** order (correct for Saudi bank SMS convention)
- Both avoid `new Date()` constructor (which uses locale-dependent M/D/Y)
- Both avoid `.toISOString()` timezone drift by constructing the string directly
- The existing dash regex had a subtle bug: it used `[yy, mm, dd]` group naming but the comment said `yy-mm-dd` — the fix corrects this to `[dd, mm, yy]` matching the actual DD/MM/YY bank SMS convention

**One file changed.** No parser architecture, template logic, or freeform parser touched.

### Validation

| Input | Expected Output |
|---|---|
| `11/3/26` | `2026-03-11` (March 11) |
| `25-3-26` | `2026-03-25` (March 25) |
| `2024-01-15` | `2024-01-15` (fallback, unchanged) |
| `05/02/24` | `2024-02-05` (Feb 5) |
| `1/1/25` | `2025-01-01` (Jan 1) |

### Risks

- The existing dash regex was treating group 1 as YY (year), not DD (day). This fix changes that interpretation to DD/MM/YY. Any SMS with dash-separated dates in actual YY-MM-DD format would now parse differently. However, bank SMS in the Saudi market consistently uses DD/MM/YY, and the dateUtils.ts already assumes DD/MM/YY, so this aligns the two.

