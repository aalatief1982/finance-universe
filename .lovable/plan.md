

## Investigation Summary

The **CategoryChart.tsx** and **SubcategoryChart.tsx** components inside `src/components/charts/` contain hardcoded English strings and lack RTL support. These are the chart cards rendered inside the Category and Subcategory tabs on the Home dashboard.

### Issues Found

**1. Hardcoded English in CategoryChart.tsx (lines 78, 86, 130, 133)**
- `"Category"` — card title
- `"Expenses by category donut chart"` — aria-label
- `"Not enough data to show a meaningful breakdown"` — empty state
- `"No data available yet. Try adding a few transactions first."` — empty state

**2. Hardcoded English in SubcategoryChart.tsx (lines 112, 135, 140, 179)**
- `"Subcategory"` — card title
- `"Unable to render chart"` — error fallback
- `"Expenses by subcategory bar chart"` — aria-label
- `"No data available yet. Try adding a few transactions first."` — empty state
- Pagination labels: `"Previous"`, `"Next"`, `"Page ${i + 1}"`

**3. RTL issues in SubcategoryChart.tsx**
- Line 144: `space-x-2` on pagination container — should use `gap-2`
- Line 153: `space-x-1` on dot indicators — should use `gap-1`

**4. Translation keys** — `chart.byCategory`, `chart.subcategories`, `chart.notEnoughData`, `chart.noDataAvailable` already exist in both `en.ts` and `ar.ts`. We can reuse them. We need to add a few new keys for aria-labels and pagination.

### Plan

**File 1: `src/components/charts/CategoryChart.tsx`**
- Import `useLanguage`
- Replace all hardcoded strings with `t()` calls using existing keys:
  - Title → `t('home.category')`
  - Empty states → `t('chart.notEnoughData')`, `t('chart.noDataAvailable')`
  - aria-label → `t('chart.byCategory')`

**File 2: `src/components/charts/SubcategoryChart.tsx`**
- Import `useLanguage`
- Replace all hardcoded strings with `t()` calls:
  - Title → `t('home.subcategory')`
  - Empty/error states → `t('chart.noDataAvailable')`, new key for "Unable to render chart"
  - aria-label → `t('chart.subcategories')`
  - Pagination aria-labels → new keys
- Fix RTL: replace `space-x-2` → `gap-2`, `space-x-1` → `gap-1`

**File 3: `src/i18n/en.ts`** — Add missing keys:
- `'chart.unableToRender': 'Unable to render chart'`
- `'chart.previous': 'Previous'`
- `'chart.next': 'Next'`
- `'chart.pageN': 'Page {n}'`

**File 4: `src/i18n/ar.ts`** — Add Arabic translations for the new keys.

