

## Budget Module UI/UX Alignment Plan

### Issues Identified (from screenshots and code)

**1. Header Actions Position**: The `+ Add` button on Accounts and `Export` button on Reports float above the tab bar via `headerActions`, which renders above `BudgetNav`. This is inconsistent with the rest of the app where action buttons are inline with content or in the header bar itself.

**2. FAB Inconsistency**: Budget Hub uses a custom `h-14 w-14 rounded-full` FAB at `bottom-20 right-4`, while the rest of the app (Home, Transactions) uses `ResponsiveFAB` with `h-12 w-12` at `bottom-16 right-4`. Different sizes and positions.

**3. Card Spacing**: Budget Hub uses `space-y-5` for sections, Accounts uses `space-y-3` for cards. The rest of the app (Home, Analytics) uses consistent `space-y-4` / `gap-4` patterns. Summary stat cards in Budget Hub use `grid-cols-3 gap-3` while Insights also uses `grid-cols-3 gap-3` -- these are fine but the `mb-6` on Insights summary vs no margin on Hub summary is inconsistent.

**4. BudgetLayout Padding**: Uses `px-[var(--page-padding-x)]` and `pt-0 pb-1` for the sticky header area. The content area uses `pt-2`. This is mostly aligned with Transactions page but the `pb-1` vs `pb-2` differs slightly.

**5. Tab Bar (`BudgetNav`)**: Uses icon-only on mobile (`hidden sm:inline` for labels). The screenshots show it works but the tab buttons look small/cramped without labels on mobile -- though this is a design choice.

**6. `headerActions` Renders Above Tabs**: On Accounts page, the `+ Add` button appears above the nav tabs (line 36-40 in BudgetLayout), which is inconsistent with the header pattern used elsewhere. It should be positioned inline with the page header or as a FAB.

---

### Changes

**File: `src/components/budget/BudgetLayout.tsx`**
- Move `headerActions` to render **after** `BudgetNav` and `BudgetPeriodSelector`, aligned right, instead of above the tabs. This puts action buttons (Add, Export) in a consistent position below the period filter.
- Standardize FAB to match `ResponsiveFAB`: `h-12 w-12` at `bottom-16 right-4` (matching Home/Transactions).
- Change content area spacing from `pt-2` to match Transactions pattern.
- Remove the `headerActions` above-tabs block; place it as a right-aligned row below the period selector.

**File: `src/pages/budget/BudgetHubPage.tsx`**
- Change `space-y-5` to `space-y-4` to match app-wide spacing.
- Standardize summary stats `gap-3` (already consistent).

**File: `src/pages/budget/BudgetReportPage.tsx`**
- Change `mb-6` on summary cards and charts tabs to `mb-4` for consistency.

**File: `src/pages/budget/BudgetInsightsPage.tsx`**
- Change `mb-6` on summary cards to `mb-4`.

**File: `src/pages/budget/AccountsPage.tsx`**
- Change `mb-6` on unmanaged alert to `mb-4`.

### Files Changed

| File | Changes |
|------|---------|
| `src/components/budget/BudgetLayout.tsx` | Move headerActions below period filter; standardize FAB size/position |
| `src/pages/budget/BudgetHubPage.tsx` | `space-y-5` → `space-y-4` |
| `src/pages/budget/BudgetReportPage.tsx` | `mb-6` → `mb-4` on summary and chart sections |
| `src/pages/budget/BudgetInsightsPage.tsx` | `mb-6` → `mb-4` on summary section |
| `src/pages/budget/AccountsPage.tsx` | `mb-6` → `mb-4` on alert section |

