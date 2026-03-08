

## Plan: Remove Back Buttons & Resize Header Icons

### What We're Doing

1. **Remove all back buttons** from the app — rely on Android's native back gesture and the Xpensia logo (which already navigates to `/home`).
2. **Increase hamburger menu icon and mail/envelope icon** by ~30% within their existing touch targets.

### Changes

**File: `src/components/header/Header.tsx`**
- Remove the `showBack` prop, `onBack` prop, and the entire back button `<Button>` block (lines 53-68).
- Remove `ArrowLeft` import and `navigateBackSafely` import.
- Change Mail icon from `size={24}` to `size={30}`.
- Remove `showBack`/`onBack` from the `HeaderProps` interface.

**File: `src/components/header/MobileNavigation.tsx`**
- Change Menu icon from `size={24}` to `size={30}`.

**File: `src/components/Layout.tsx`**
- Remove `showBack` and `onBack` props from `LayoutProps` interface.
- Remove passing `showBack`/`onBack` to `<Header>`.

**File: `src/components/layout/PageHeader.tsx`**
- Remove `showBack` prop and the back button block entirely.
- Remove `ArrowLeft`, `navigateBackSafely`, `useNavigate` imports.

**All consumer pages** (14 files that pass `showBack`):
- Remove `showBack` prop from `<Layout>` calls in: `BudgetLayout.tsx`, `ImportTransactions.tsx`, `ExchangeRates.tsx`, `ImportTransactionsNER.tsx`, `Settings.tsx`, `ProcessSmsMessages.tsx`, `ReviewSmsTransactions.tsx`, `SetBudgetPage.tsx`, `Analytics.tsx`, `Transactions.tsx`, `SmsReviewInboxPage.tsx`, `About.tsx`, `EngineOutPage.tsx`, `BudgetDetailPage.tsx`.
- Remove `onBack` prop where passed.

### Icon Sizing Detail

Current: `Menu size={24}` in `h-11 w-11` button, `Mail size={24}` in `h-11 w-11` button.
New: Both at `size={30}` — a 25% increase that stays well within the 44px touch target. This avoids overflow on smaller screens while being noticeably larger.

### Files Changed Summary

| File | Change |
|------|--------|
| `src/components/header/Header.tsx` | Remove back button, increase Mail to 30 |
| `src/components/header/MobileNavigation.tsx` | Increase Menu to 30 |
| `src/components/Layout.tsx` | Remove showBack/onBack props |
| `src/components/layout/PageHeader.tsx` | Remove back button entirely |
| 14 page files | Remove `showBack` prop usage |

