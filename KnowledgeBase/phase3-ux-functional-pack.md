# Phase 3 Pack — UX & Functional Design (Reverse-Engineered)

Assumption used: **derive MVP screens from code** (no externally supplied MVP list).

## 1) Information Architecture & Navigation
### 1.1 Navigation Model (tabs/stack/drawer/etc.)
- Router model: `BrowserRouter` + flat `Routes` map (no drawer).
- Mobile primary nav: bottom navigation with 4 items (`Home`, `Paste SMS`, `Transactions`, `Analytics`).
- Page shell: shared `Layout` with optional header, back button, and conditional bottom nav on mobile.
- Onboarding gate: app redirects to `/onboarding` unless `xpensia_onb_done === 'true'`.
- Secondary navigation: button/link-driven transitions (e.g., Home -> View All, FAB -> Edit Transaction, SmartPaste -> Edit Transaction).

### 1.2 IA Map (text tree)
- App Root
  - Onboarding
    - Onboarding Slides (3 slides)
  - Main (mobile bottom nav)
    - Home (`/home`)
      - Date range selector
      - Charts tabs (Trends / Net / Category / Subcategory)
      - Recent transactions list
      - FAB -> New/Edit transaction
    - Paste SMS (`/import-transactions`)
      - SmartPaste form
      - Detection result -> Edit Transaction
    - Transactions (`/transactions`)
      - Range/type/search filters
      - Grouped transaction list
      - Delete confirmation dialog
      - FAB -> New/Edit transaction
    - Analytics (`/analytics`)
      - Range selector
      - Budget/category/balance cards
      - Export JSON report
  - Secondary screens
    - Edit Transaction (`/edit-transaction`, `/edit-transaction/:id`)
    - Settings (`/settings`)
    - Profile (`/profile`)
    - About (`/about`)
  - Non-MVP/advanced routes present in code (SMS processing, budgets, model training, templates, exchange rates, vendor mapping)

### 1.3 Route List (if applicable)
- `/`, `/home`, `/transactions`, `/analytics`, `/profile`, `/onboarding`
- `/import-transactions`, `/edit-transaction`, `/edit-transaction/:id`
- `/settings`, `/about`
- Additional implemented routes (likely beyond MVP scope): `/train-model`, `/build-template`, `/custom-parsing-rules`, `/process-sms`, `/sms/process-vendors`, `/sms/vendors`, `/vendor-mapping`, `/review-sms-transactions`, `/exchange-rates`, `/budget`, `/budget/:budgetId`, `/budget/accounts`, `/budget/set`, `/budget/report`, `/budget/insights`

## 2) Screen Catalog (MVP)
### Onboarding
- Purpose: First-run education and activation before entering app.
- Primary user actions: Swipe slides, tap **Start Your Journey**.
- Entry points: Forced redirect when onboarding flag not completed.
- Exit points: Completion sets `xpensia_onb_done` and navigates to `/home`.
- Key UI states: Slide progress indicators.
- Validations/rules: No skip action detected; completion action is explicit on final slide.
- Evidence: `Onboarding` `handleComplete`, storage flags + navigation; `OnboardingSlides` final button behavior.

### Home
- Purpose: Dashboard overview (summary, charts, recent transactions).
- Primary user actions: Change date range, switch chart tabs, open transaction details, view all transactions, add transaction (FAB).
- Entry points: `/` and `/home`, bottom nav Home.
- Exit points: To `/transactions`, `/edit-transaction/:id`, `/edit-transaction`.
- Key UI states: Unconverted FX warning banner; empty message for no transactions in range.
- Validations/rules: Date range filtering includes custom start/end; analytics calculations wrapped in try/catch fallback to empty arrays.
- Evidence: `Home.tsx` range/tabs/recent list/FAB/empty state.

### Import Transactions (SmartPaste)
- Purpose: Parse SMS/bank message into draft transaction.
- Primary user actions: Paste/type message, extract transaction, proceed to edit.
- Entry points: Bottom nav **Paste SMS**, route `/import-transactions`.
- Exit points: Navigates to `/edit-transaction` with inferred transaction state.
- Key UI states: Processing spinner on button; detected transaction card; no-match message.
- Validations/rules: Requires non-empty input; rejects non-financial messages; parsing errors show destructive toast.
- Evidence: `ImportTransactions.tsx` `handleTransactionsDetected`; `SmartPaste.tsx` submit validation and toasts.

### Edit Transaction
- Purpose: Create/update transaction with smart suggestions and FX handling.
- Primary user actions: Edit fields, save transaction, optionally adjust exchange rate.
- Entry points: Home item click, Transactions item click, Import flow, SMS notification flow.
- Exit points: Save triggers persistence + back navigation.
- Key UI states: Loading overlay while saving; optional source message and confidence summary.
- Validations/rules: Required fields (`title`, amount, category, date, account); amount sign normalized by type; date normalized to ISO; FX conversion recalculated.
- Evidence: `EditTransaction.tsx` save flow and overlays; `TransactionEditForm.tsx` `handleSubmit` + required inputs.

### Transactions
- Purpose: Full transaction history with filtering and quick edit/delete.
- Primary user actions: Change range/type/search, open transaction, delete transaction, add transaction via FAB.
- Entry points: Bottom nav **Transactions**, Home -> View All.
- Exit points: `/edit-transaction/:id`, `/edit-transaction`.
- Key UI states: Empty state "No transactions found".
- Validations/rules: Filter order = date range -> type -> search; custom range uses start/end date.
- Evidence: `Transactions.tsx` filtered memo logic + empty state; `TransactionsByDate.tsx` click/delete behavior.

### Analytics
- Purpose: Deeper financial analysis and lightweight reporting.
- Primary user actions: Change date range; review cards/charts; export JSON.
- Entry points: Bottom nav **Analytics**.
- Exit points: Download action only (no deep route branching).
- Key UI states: Multiple empty placeholders (no budget data, no expense data, no monthly data, etc.).
- Validations/rules: Export blocks when no data and shows toast.
- Evidence: `Analytics.tsx` range filtering, cards, and `handleExport`.

### Settings
- Purpose: Preferences + permissions + data import/export + SMS automation controls.
- Primary user actions: Save settings, toggle notifications/SMS auto-import, export/import data, clear sample data, beta/admin actions.
- Entry points: Route `/settings`.
- Exit points: Remains in screen; some actions cause reload.
- Key UI states: Unsaved changes alert dialog; SMS loading overlay during permission/import flow.
- Validations/rules: beforeunload warning for dirty state; SMS enable requires permission and handles permanently denied case; import requires valid CSV/JSON and user confirmation.
- Evidence: `Settings.tsx` unsaved prompt, permission handling, import/export/clear sample flows.

### Profile
- Purpose: Manage identity fields and avatar.
- Primary user actions: Edit profile modal, save profile, change photo, delete account.
- Entry points: Route `/profile`.
- Exit points: Delete action redirects to `/`.
- Key UI states: Loading overlay while image selection/uploading hook is busy.
- Validations/rules: Full name required before save; delete requires confirmation dialog.
- Evidence: `Profile.tsx` `handleSaveProfile`, AlertDialog delete, `LoadingOverlay` usage.

### Not Found
- Purpose: Fallback when no route matches.
- Primary user actions: INFERRED (LOW CONFIDENCE): likely navigate back/home.
- Entry points: `*` route catch-all.
- Exit points: OPEN QUESTION (depends on component implementation details).
- Key UI states: OPEN QUESTION.
- Validations/rules: OPEN QUESTION.
- Evidence: Route mapping only in `App.tsx`.

## 3) Key Flows (Step-by-step)
### First Launch Onboarding -> Home
1) App boot checks local onboarding flag.
2) If not completed, redirects to `/onboarding`.
3) User swipes onboarding slides.
4) User taps **Start Your Journey**.
5) App stores completion flags and navigates to `/home`.
- Success outcome: User lands on dashboard; onboarding no longer forced.
- Failure modes: OPEN QUESTION for interrupted onboarding persistence edge cases.
- Evidence: `App.tsx` onboarding redirect effect; `Onboarding.tsx` `handleComplete`; `OnboardingSlides.tsx` CTA.

### SmartPaste Import -> Edit -> Save Transaction
1) User opens `/import-transactions`.
2) User pastes message and taps **Extract Transaction**.
3) Validation blocks empty/non-financial text with toast.
4) Parser runs; on success app navigates to `/edit-transaction` with inferred data and confidence metadata.
5) User edits fields and saves.
6) Save normalizes amount/date, applies FX conversion, persists transaction/learning.
- Success outcome: Transaction saved and user navigates back.
- Failure modes: Parse failure toast + error state; fallback path may ask manual review.
- Evidence: `SmartPaste.tsx`, `ImportTransactions.tsx`, `EditTransaction.tsx`, `TransactionEditForm.tsx`.

### Home Review -> Open Transaction Detail
1) User views recent transactions on Home.
2) User taps a transaction card.
3) App navigates to `/edit-transaction/:id` with transaction in route state.
4) User can edit and save.
- Success outcome: Updated transaction reflected across lists/charts.
- Failure modes: INFERRED (LOW CONFIDENCE) if route state missing, form relies on fallback behavior.
- Evidence: `Home.tsx` recent list click handler; `EditTransaction.tsx` route state usage.

### Transactions Filter/Search -> Delete
1) User selects date range (preset/custom), type, and optional search text.
2) List updates with filtered results.
3) User taps trash icon on an item.
4) Confirmation dialog appears.
5) Confirm deletes transaction and shows toast.
- Success outcome: Item removed from grouped list.
- Failure modes: Cancel keeps data unchanged.
- Evidence: `Transactions.tsx` filter memo + empty state; `TransactionsByDate.tsx` delete dialog and toast.

### Settings -> Enable SMS Auto-Import
1) User enables SMS auto-import toggle.
2) Native flow requests SMS permission.
3) App checks canonical permission status.
4) If granted: updates SMS preferences, initializes listener, triggers initial import, shows success toast.
5) If permanently denied: destructive guidance toast instructs enabling via OS settings.
- Success outcome: Auto-import enabled and initial import attempted.
- Failure modes: Permission denial, timeout, listener/init errors (logged; toast guidance in some branches).
- Evidence: `Settings.tsx` toggle handler; `SmsPermissionPrompt.tsx` equivalent onboarding prompt flow.

### Settings -> Export/Import Data
1) Export: app fetches stored transactions.
2) If empty: destructive "No data to export" toast.
3) If non-empty: writes CSV (web download or native filesystem), shows success toast.
4) Import: user selects CSV/JSON file; parser validates array data.
5) App confirms merge count; on confirm stores merged data and reloads.
- Success outcome: Data exported or imported with confirmation.
- Failure modes: Parse failure toast; user cancel on confirmation.
- Evidence: `Settings.tsx` `handleExportData` and `handleImportData`.

### Profile Edit + Delete Account Confirmation
1) User opens Profile and taps **Edit Profile**.
2) Dialog opens; user updates fields.
3) Save validates full name non-empty.
4) On success, profile updates and toast confirms save.
5) Delete Account action opens confirmation dialog; confirm triggers destructive toast and redirect.
- Success outcome: Profile updated or account deletion flow executed.
- Failure modes: Missing full name blocks save with destructive toast.
- Evidence: `Profile.tsx` handlers and dialogs.

## 4) Interaction Rules (Global UX Patterns)
- Loading:
  - App-level splash during initialization (`AppLoader`).
  - Blocking loading overlays for long actions (saving transaction, profile image ops, SMS enable/import).
- Empty states:
  - Explicit placeholders in Transactions, Home recent list, Analytics cards, SmartPaste no-match message.
- Errors:
  - Errors surfaced mostly via toast (`destructive` variant for critical failures).
  - SmartPaste parse failures also set inline error state.
- Confirmations:
  - Delete transaction uses dialog confirm.
  - Delete account uses alert dialog confirm.
  - Import and clear sample data use browser `window.confirm`.
  - Unsaved settings prompt offers "Skip without Save" vs "Save and Proceed".
- Notifications (toasts/snackbars):
  - Used for success/failure feedback on parse/save/import/export/permission/account actions.
- Forms & validation:
  - Required fields via HTML `required` and explicit checks (e.g., Profile full name).
  - Transaction amount sign normalized by type and date normalized to ISO before save.
- Permissions:
  - Notification permission requested on toggle.
  - SMS permission checked/requested with canonical re-check and permanently-denied handling.
- Offline behavior:
  - OPEN QUESTION (no explicit user-facing offline banner or retry UX found in reviewed files).

## 5) UX Edge Cases & Recovery
1) Opening app with incomplete onboarding always redirects to `/onboarding`.
2) Onboarding completion sets durable flags before navigating to Home.
3) SmartPaste submit with empty message shows error toast.
4) SmartPaste blocks non-financial messages with informational toast.
5) SmartPaste parser exceptions show destructive error toast and do not navigate.
6) Repeated template failure can redirect to model training route.
7) Edit Transaction save shows blocking loader to prevent duplicate actions.
8) Transaction save auto-fixes amount sign based on type (expense negative, income positive).
9) FX converted amount shows "Rate required" when conversion rate unavailable.
10) Transactions list shows explicit empty state for no matches.
11) Deleting a transaction requires confirmation dialog; cancel is non-destructive.
12) Settings dirty state triggers beforeunload warning on browser leave.
13) SMS auto-import enable handles permanently denied permission with guidance toast.
14) Data export with zero records shows "No data to export" toast.
15) Data import rejects invalid/empty files with destructive toast; merge requires explicit confirmation.

## 6) Evidence Appendix
- Navigation model + route map -> `src/App.tsx` -> `AppRoutes`, onboarding redirect effect.
- Mobile bottom nav IA -> `src/components/BottomNav.tsx` -> `navItems`.
- Shared shell behavior -> `src/components/Layout.tsx` -> conditional header/back/bottom nav.
- Onboarding flow -> `src/pages/Onboarding.tsx` `handleComplete`; `src/onboarding/OnboardingSlides.tsx` final CTA.
- Home behavior -> `src/pages/Home.tsx` (range filters, tabs, recent list, empty state, navigation actions).
- SmartPaste import flow -> `src/pages/ImportTransactions.tsx` + `src/components/SmartPaste.tsx`.
- Transaction edit rules -> `src/pages/EditTransaction.tsx` + `src/components/TransactionEditForm.tsx` (`handleSubmit`, required fields).
- Transactions list/filter/delete -> `src/pages/Transactions.tsx` + `src/components/transactions/TransactionsByDate.tsx`.
- Analytics screen + export + empty states -> `src/pages/Analytics.tsx`.
- Settings permissions/data mgmt/unsaved prompt -> `src/pages/Settings.tsx`.
- Profile validation/delete confirm -> `src/pages/Profile.tsx`.
- Loading/toast primitives -> `src/components/ui/loading-overlay.tsx`; `src/components/ui/use-toast.ts`.
