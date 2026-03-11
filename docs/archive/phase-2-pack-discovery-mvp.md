# Phase 2 Pack — Discovery & MVP Definition
## 1. PRD-Lite (MVP Scope)
### 1.1 Product Summary
Xpensia is a brownfield React + TypeScript + Capacitor mobile-first personal finance app with route-based navigation for Home, Transactions, Import Transactions (Smart Paste), Analytics, Settings, Budget pages, and Exchange Rates. Implemented behavior today centers on transaction capture (manual + SMS-assisted), transaction editing, categorization, analytics views, and settings/preferences. Evidence: app routes are explicitly declared in `AppRoutes` and include `/home`, `/transactions`, `/import-transactions`, `/edit-transaction`, `/analytics`, `/settings`, and budget routes such as `/budget` and `/budget/set` (`src/App.tsx`, `AppRoutes`).

Step 1 repo orientation (top product-defining files):
1. `src/App.tsx` (entry + route map + onboarding gate + SMS listeners)
2. `src/pages/Home.tsx` (dashboard + charts + recent transactions + filters)
3. `src/pages/Transactions.tsx` (list/search/type/date filtering + edit flow)
4. `src/pages/EditTransaction.tsx` (save/edit + learning-aware save)
5. `src/pages/ImportTransactions.tsx` + `src/components/SmartPaste.tsx` (SMS text parsing/import)
6. `src/pages/Analytics.tsx` (budget-vs-actual, category charts, monthly balance)
7. `src/pages/Settings.tsx` (preferences, permissions, import/export/reset)
8. `src/services/TransactionService.ts` (transaction CRUD, transfer dual-entry, FX fields)
9. `src/services/BudgetService.ts` (budget CRUD, progress, alerts, transfer exclusion)
10. `src/services/SmsPermissionService.ts` (permission orchestration for SMS reader/listener)


Implementation status clarification used across this pack:
- **Implemented Today (verified in code):** transaction CRUD, transfer handling, Smart Paste parsing, background SMS listener setup (permission-gated), dashboard analytics tabs, settings save/import/export, and active budget pages/services are all directly wired in routes/components/services.
- **Intended But Not Implemented (stubs/dead/unclear):** a separate legacy settings component still contains placeholder budget copy (“Budget features will be available here”), which conflicts with active budget routes and appears to be stale or non-primary UI.
- **Proposed Next (logical extension only):** stricter guardrails for destructive data actions and explicit high-confidence auto-save policy for parsed SMS are not fully codified as user-facing policy despite underlying technical hooks.

### 1.2 Problem Statement
From a product-definition perspective, current implementation favors pragmatic speed-to-capture over heavy setup, with editable confirmation screens acting as quality control for inferred data.

Users need a fast way to capture personal finance transactions, maintain accurate records (including transfers and multi-currency), and understand spending trends without heavy manual effort. The app currently addresses this by combining manual entry, SMS parsing, and dashboard/analytics summaries. Smart Paste and background SMS listeners reduce friction for transaction capture; transaction services provide persistent CRUD and auto-categorization logic; analytics pages provide periodic filtering and top-category visibility.

### 1.3 Target Users & Primary Use Cases
Primary users (implemented behavior supports these now):
- Individuals tracking day-to-day expenses/income with lightweight interaction (manual add/edit/delete and list filtering).
- Users who receive bank SMS and want semi-automated transaction extraction/review.
- Users monitoring budgets and category-level spending over time.

Primary use cases grounded in code:
- Complete onboarding and land in Home (`safeStorage` onboarding flags in `Onboarding` + onboarding redirect logic in `AppWrapper`).
- Add/edit/delete transactions and review grouped list (`Transactions` page + `TransactionService`).
- Paste bank/SMS text, extract inferred transaction, review/edit before save (`SmartPaste` + `ImportTransactions` -> `/edit-transaction`).
- View trends/category/net charts and recent activity (`Home`, `AnalyticsService` integrations).
- Configure settings such as theme/currency, SMS permissions, import/export data (`Settings`).
- Create and monitor budgets with progress and alerts (`BudgetHubPage`, `BudgetService`).

### 1.4 MVP Scope (In) / (Out)
**MVP Scope (In) — Implemented Today (Verified):**
- Route-based app shell with onboarding gate and error boundaries.
- Transaction management: create/update/delete, filter/search/date range, transfer dual-entry behavior.
- SMS-assisted transaction ingestion: Smart Paste parser/inference and background SMS handling (native).
- Analytics dashboard views: totals, trends, category/subcategory charts, monthly balance.
- Settings: theme/currency/week start, notification toggle, SMS permission handling, import/export/reset actions.
- Budget module baseline: budget hub, set/edit budgets, progress rings/cards, threshold alerts.

**MVP Scope (Out) — Proposed Next (Not present as end-user-complete flows):**
- Advanced collaborative budgeting (household/multi-user sync) — no verified in-app collaboration workflow.
- Fully managed cloud sync conflict resolution UX — code references local storage heavily; end-user sync workflow not explicitly complete in the reviewed paths.
- End-to-end automated “zero-touch” SMS import with no review step as default UX — current flow often routes to edit/review before save.

### 1.5 Non-Goals (Explicit)
- Not positioning this MVP as a full accounting suite (double-entry accounting exists mainly for transfer handling, not complete ledger/accounting workflows).
- Not including investment portfolio management (no verified feature in reviewed routes/services).
- Not requiring AI-only capture; manual capture remains first-class.

### 1.6 Assumptions
- App is mobile-first and may run web/native via Capacitor (platform branching exists across SMS/notifications/status bar).
- Transaction persistence is local-first (`storage-utils`/`safeStorage` patterns).
- Budgeting and analytics should remain transfer-aware (exclude transfers for expense/income style calculations where coded).
- User trust depends on editable review before final save for parsed SMS transactions.

### 1.7 Risks
- Permission complexity: SMS and notifications rely on native grants and can degrade silently if denied.
- Parsing confidence: inferred transaction fields may be low confidence and require user correction.
- Multi-currency consistency risk if conversion fields are missing/unconverted.
- Data safety risk around import/reset actions in settings.

### 1.8 Open Questions
1. Should auto-import save directly for high-confidence messages, or always require edit confirmation?
2. What is the expected source of truth for “budget feature availability”: full budget routes are active, while a separate settings component still labels budget area as “will be available here” (potential stale UX copy)?
3. Are cloud backup/sync guarantees part of MVP or intentionally deferred?
4. What is the retention policy for analytics/telemetry events?
5. What rollback UX is expected after destructive data actions (clear/reset/import overwrite)?

## 2. User Journeys
1) **Onboarding to first dashboard view**
1. User opens app.
2. App checks `xpensia_onb_done` from storage.
3. If incomplete, app redirects to `/onboarding`.
4. User swipes through onboarding slides.
5. User taps “Start Your Journey.”
6. App writes onboarding completion flags and navigates to `/home`.
7. Home screen renders stats/charts/recent transactions.
**Success outcome:** User reaches Home with onboarding marked completed.

2) **Manual transaction capture and edit**
1. User goes to Transactions page.
2. User taps add button (FAB) to open edit transaction form.
3. User enters title/amount/type/category and submits.
4. Service persists transaction (and applies FX fields).
5. Transaction appears in transactions list.
6. User opens existing transaction for edit.
7. User updates fields and saves.
8. List reflects updated transaction details.
**Success outcome:** Transaction record is created and editable through full lifecycle.

3) **Smart Paste import flow**
1. User navigates to Import Transactions.
2. User pastes SMS/bank message into Smart Paste input.
3. System rejects non-financial text or proceeds with parse/infer.
4. System computes confidence/origin and forms inferred transaction.
5. App navigates to Edit Transaction with inferred fields + metadata.
6. User reviews/corrects fields.
7. User saves transaction (learning hook invoked).
**Success outcome:** SMS text becomes a saved, user-confirmed transaction.

4) **Background SMS permission to auto-import enablement**
1. User opens Settings.
2. User enables background SMS toggle.
3. App requests native SMS permissions.
4. If denied permanently, app shows remediation guidance.
5. If granted, app enables background SMS and auto-import flags.
6. App initializes SMS listener.
7. App can trigger initial import check for new messages.
**Success outcome:** SMS listener is active with permission-backed auto-import preference.

5) **Budget monitoring journey**
1. User navigates to Budget Hub.
2. App loads budgets with progress summary.
3. User sees overall ring and grouped budgets by scope.
4. Alerts banner appears for threshold breaches.
5. User drills into set/edit flow for a budget.
6. Budget updates persist and progress recalculates.
**Success outcome:** User can create/monitor budget limits and see spend progress.

## 3. Epics & User Stories (Backlog)
- Epic 1: Core Navigation, Onboarding, and App Shell
  - US-01 As a new user, I am redirected to onboarding until completion (Evidence: `src/App.tsx` `showOnboarding`/redirect effect; `src/pages/Onboarding.tsx` `handleComplete`).
  - US-02 As a user, I can access main routes (home, transactions, analytics, settings, budget) from app routing (Evidence: `src/App.tsx` `AppRoutes`).

- Epic 2: Transaction Lifecycle Management
  - US-03 As a user, I can create a transaction from the edit form and save it (Evidence: `src/pages/EditTransaction.tsx` `handleSave`; `src/services/TransactionService.ts` `addTransaction`).
  - US-04 As a user, I can update existing transactions (Evidence: `src/services/TransactionService.ts` `updateTransaction`).
  - US-05 As a user, I can delete transactions from the transactions flow (Evidence: `src/pages/Transactions.tsx` wiring of `handleDeleteTransaction`; e2e delete spec in `e2e/transaction-crud.spec.ts`).
  - US-06 As a user, transfer entries are saved as linked debit/credit records (Evidence: `src/services/TransactionService.ts` transfer branch in `addTransaction`).
  - US-07 As a user, I can filter transactions by date range and type and search term (Evidence: `src/pages/Transactions.tsx` `filteredTransactions`).

- Epic 3: Smart SMS Capture and Parsing
  - US-08 As a user, I can paste SMS text and extract transaction data (Evidence: `src/components/SmartPaste.tsx` `handleSubmit` + `parseAndInferTransaction`).
  - US-09 As a user, non-financial messages are blocked with feedback (Evidence: `src/components/SmartPaste.tsx` `isFinancialTransactionMessage` gate).
  - US-10 As a user, inferred transaction details are passed to edit-review screen before save (Evidence: `src/pages/ImportTransactions.tsx` `handleTransactionsDetected` navigation state).
  - US-11 As a native user, background SMS can trigger transaction review flow (Evidence: `src/App.tsx` background listener `smsReceived` handler and notification tap handler).
  - US-12 As a user, SMS permissions are centrally checked/requested across reader + listener (Evidence: `src/services/SmsPermissionService.ts` `checkPermissionStatus`, `requestPermission`).

- Epic 4: Dashboard and Analytics Insights
  - US-13 As a user, I can view income/expense/balance summaries and recent transactions on Home (Evidence: `src/pages/Home.tsx` dashboard + recent list).
  - US-14 As a user, I can switch trend/net/category/subcategory chart tabs (Evidence: `src/pages/Home.tsx` `TabsContent`).
  - US-15 As a user, I can analyze top categories and monthly balance in Analytics (Evidence: `src/pages/Analytics.tsx` `topCategories`, `monthlyBalance`).
  - US-16 As a user, analytics calculations can exclude transfers and use converted amounts where available (Evidence: `src/pages/Analytics.tsx` comments/logic in `monthlyBalance`; `AnalyticsService` calls in Home).

- Epic 5: Settings, Preferences, and Data Controls
  - US-17 As a user, I can change theme/currency and save preferences (Evidence: `src/pages/Settings.tsx` `handleThemeChange`, `handleCurrencyChange`, `handleSaveSettings`).
  - US-18 As a user, I can configure week-start display preference (Evidence: `src/pages/Settings.tsx` `weekStartsOn` toggle).
  - US-19 As a user, I can export transactions data (Evidence: `src/pages/Settings.tsx` `handleExportData`; `src/pages/Analytics.tsx` `handleExport`).
  - US-20 As a user, I can import transactions from JSON/CSV (Evidence: `src/pages/Settings.tsx` import reader flow + `parseCsvTransactions`).
  - US-21 As a user, unsaved settings changes are detected before leaving (Evidence: `src/pages/Settings.tsx` `isDirty` + `beforeunload`).

- Epic 6: Budget Planning and Tracking
  - US-22 As a user, I can create/update budgets with duplicate-key handling (Evidence: `src/services/BudgetService.ts` `addBudget`, `updateBudget`).
  - US-23 As a user, I can view budget progress and alerts in Budget Hub (Evidence: `src/pages/budget/BudgetHubPage.tsx` progress cards + alerts banner).
  - US-24 As a user, budgets calculate spending with transfer exclusion and FX-awareness (Evidence: `src/services/BudgetService.ts` module responsibilities + spending model comments).
  - US-25 As a user, budgets can be filtered by period parameters (Evidence: `src/pages/budget/BudgetHubPage.tsx` `useBudgetPeriodParams` + `budgetFilter`).

## 4. Acceptance Criteria (Per Epic)
- Epic 1:
  - AC-1 If onboarding flag is absent/false, app redirects to `/onboarding` before other pages.
  - AC-2 Completing onboarding stores completion flag and routes user to `/home`.
  - AC-3 Main routes configured in `AppRoutes` are navigable without app crash.

- Epic 2:
  - AC-1 User can create a valid expense/income transaction and it persists to storage.
  - AC-2 Editing a transaction updates existing stored record by ID.
  - AC-3 Deleting a transaction removes it from list views.
  - AC-4 Creating a transfer results in exactly two linked entries with same `transferId` and opposite directions/signs.
  - AC-5 Filter order behaves deterministically (date range then type/search logic as coded).

- Epic 3:
  - AC-1 Smart Paste rejects non-transactional text with explicit user feedback.
  - AC-2 Smart Paste parsing returns inferred transaction with confidence/origin metadata.
  - AC-3 Import flow passes parsed transaction into edit screen state before save.
  - AC-4 Background SMS listener only starts when permission is granted.
  - AC-5 Notification tap for SMS routes user into review/import/edit flow.

- Epic 4:
  - AC-1 Home shows summary cards for income, expense, and balance based on selected range.
  - AC-2 Home charts update for selected tab and date range.
  - AC-3 Analytics page renders top categories and monthly balance from filtered transactions.
  - AC-4 Transfer transactions are excluded from monthly balance calculations.

- Epic 5:
  - AC-1 Theme and currency changes are saved and reflected in user preferences.
  - AC-2 Week-start preference is selectable and persisted via save action.
  - AC-3 Export with zero transactions shows “no data to export” feedback.
  - AC-4 Import validates parseability and displays success/failure feedback.
  - AC-5 Unsaved preference changes trigger leave-warning behavior.

- Epic 6:
  - AC-1 Creating a budget with an existing logical key updates existing instead of duplicating.
  - AC-2 Budget hub shows empty state when no budgets exist.
  - AC-3 Budget hub shows progress cards/rings when budgets exist.
  - AC-4 Alert banners render for available budget alerts and can be dismissed.
  - AC-5 Period filter parameters impact retrieved budgets.

## 5. Evidence Appendix
- Routing and onboarding gate → `src/App.tsx` → `AppRoutes`, `showOnboarding` redirect effect.
- Onboarding completion flags and navigation → `src/pages/Onboarding.tsx` → `handleComplete`.
- Onboarding value proposition copy/slides → `src/onboarding/OnboardingSlides.tsx` → `slides` array.
- Home dashboard + charts + recent list + FX warning → `src/pages/Home.tsx` → `filteredTransactions`, `fxSummary`, chart tabs, recent transactions section.
- Transactions list/filter/search/edit flow wiring → `src/pages/Transactions.tsx` → `filteredTransactions`, `EditTransactionDialog`, FAB navigate.
- Transaction CRUD + transfer dual-entry + FX fielding → `src/services/TransactionService.ts` → `addTransaction`, `updateTransaction`.
- Smart Paste parsing/inference/confidence and non-financial guard → `src/components/SmartPaste.tsx` → `handleSubmit`.
- Import route passing inferred transaction to review/edit → `src/pages/ImportTransactions.tsx` → `handleTransactionsDetected`.
- Edit review + save with learning hook → `src/pages/EditTransaction.tsx` → `handleSave`, `SmartPasteSummary` block.
- Background SMS receive + local notification tap processing → `src/App.tsx` → `BackgroundSmsListener.addListener('smsReceived', ...)`, `LocalNotifications.addListener('localNotificationActionPerformed', ...)`.
- SMS permission orchestration across plugins → `src/services/SmsPermissionService.ts` → `checkPermissionStatus`, `requestPermission`.
- Analytics dashboards + monthly balance transfer exclusion → `src/pages/Analytics.tsx` → `topCategories`, `monthlyBalance`, `budgetData`.
- Settings preferences, import/export, SMS toggle handling → `src/pages/Settings.tsx` → `handleBackgroundSmsChange`, `handleSaveSettings`, `handleExportData`, import handler.
- Budget CRUD/progress/alerts foundations → `src/services/BudgetService.ts` → `addBudget`, `updateBudget`, `getBudgets`.
- Budget Hub UI and grouping/alerts/progress cards → `src/pages/budget/BudgetHubPage.tsx` → `groupedBudgets`, alert rendering, empty state.
- Navigation affordance evidence → `src/components/BottomNav.tsx` → `navItems`.
- Intended but not implemented indicator (legacy/alternate settings component) → `src/components/settings/SettingsPage.tsx` → budget tab copy “Budget features will be available here”.
- Implemented CRUD verification via automated flow tests → `e2e/transaction-crud.spec.ts` → create/edit/delete scenarios.
