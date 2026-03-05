

## Plan: Currency Page Spacing + Header Icon Sizes

### Issue 4: Exchange Rates Page Spacing

The page uses `Layout` with `fullWidth` and then manually wraps content in `<div className="container px-1">`, creating only 4px edge padding — inconsistent with other pages.

**Fix in `src/pages/ExchangeRates.tsx`:**
- Remove `fullWidth` prop from `<Layout>` (so Layout applies its standard `container` + `max-w-[var(--content-max-width)]`)
- Remove the redundant `<div className="container px-1">` wrapper
- Keep `withPadding={false}` and the inner padding div with `px-[var(--page-padding-x)]` for content spacing

This makes the page use the same container constraints as Dashboard, Transactions, etc.

### Issue 5: Header Icon Sizes

Currently the Mail icon is 20px and the hamburger Menu icon is 28px. Both sit inside `size="icon"` buttons which are 32x32px (`h-8 w-8`).

**Fix — increase icon sizes only (no global button changes):**
- `src/components/header/Header.tsx`: Change `Mail` from `size={20}` to `size={26}`, and `ArrowLeft` from `size={20}` to `size={24}`
- `src/components/header/MobileNavigation.tsx`: Keep `Menu` at `size={28}` (already appropriate)

No changes to `button.constants.ts` — the global icon button dimensions stay as-is to avoid ripple effects across the app. The Lucide `size` prop controls the SVG viewBox rendering, so increasing it makes the icon visually larger within the existing touch target.

### Files to change
- `src/pages/ExchangeRates.tsx` — remove `fullWidth`, remove manual container wrapper
- `src/components/header/Header.tsx` — increase Mail to 26px, ArrowLeft to 24px

