

## RTL Alignment Fix for Dashboard Charts Section

The tabs and chart headings on the Home page don't respect RTL layout in Arabic mode. The `TabsList` uses `inline-flex` which defaults to left alignment, and heading text isn't right-aligned.

### Changes

**File: `src/pages/Home.tsx`** (lines 250-284)

1. Add `text-start` to the chart card container (`div` at line 250) so all text content aligns to the start edge (right in RTL, left in LTR).

2. Add `w-full` and `flex-row-reverse` for RTL on the `TabsList` (line 256) — actually, since the document `dir` is already set to `rtl`, `inline-flex` should auto-reverse. The real issue is the `TabsList` has `inline-flex` making it shrink-to-fit and left-aligned. Change to `flex w-full` to span full width so tabs flow from the right edge in RTL.

Update line 256:
```
<TabsList className="mb-4 border-b w-full justify-start">
```

This makes the tabs list full-width with `justify-start`, which in RTL means right-aligned.

3. Add `text-start` to chart headings (lines 284, 291) — these `h2` elements should align to the start edge. Since they're block elements, adding `text-start` ensures right-alignment in RTL:
```
<h2 className="text-lg font-semibold text-start">
```

**File: `src/components/charts/TimelineChart.tsx`**, **`NetBalanceChart.tsx`**, **`CategoryBreakdownChart.tsx`** — The "No data available" empty state text is not translated. Add `t('home.noData')` and add the key to both `en.ts` and `ar.ts`.

### Translation keys to add

- `en.ts`: `'home.noData': 'No data available'`
- `ar.ts`: `'home.noData': 'لا تتوفر بيانات'`

### Files changed
1. `src/pages/Home.tsx` — TabsList gets `w-full justify-start`, headings get `text-start`
2. `src/components/charts/TimelineChart.tsx` — translate empty state
3. `src/components/charts/NetBalanceChart.tsx` — translate empty state
4. `src/components/charts/CategoryBreakdownChart.tsx` — translate empty state
5. `src/i18n/en.ts` — add `home.noData`
6. `src/i18n/ar.ts` — add `home.noData`

