# Test Script Document

## App Name: Xpensia Finance Universe

**Version Baseline**: Current mainline (post Jan 2025 updates, including FX + Exchange Rates + About + budget/account refinements)  
**Date**: 2026-02-10  
**Document Type**: End-to-End QA Test Script (Manual + Regression)

---

## Table of Contents

1. [Execution Notes](#execution-notes)
2. [Test Case Template](#test-case-template)
3. [Onboarding & First-Run](#1-onboarding--first-run)
4. [Home Dashboard](#2-home-dashboard)
5. [Transaction Management](#3-transaction-management)
6. [Smart Import & SMS Flows](#4-smart-import--sms-flows)
7. [Budget & Accounts](#5-budget--accounts)
8. [Analytics & Insights](#6-analytics--insights)
9. [Settings & Preferences](#7-settings--preferences)
10. [Data Management](#8-data-management)
11. [FX / Exchange Rate Flows](#9-fx--exchange-rate-flows)
12. [OTA & App Update](#10-ota--app-update)
13. [About, Navigation, and Fallbacks](#11-about-navigation-and-fallbacks)
14. [Error Handling & Edge Cases](#12-error-handling--edge-cases)

---

## Execution Notes

- Use this document for full regression and release validation.
- Execute on both:
  - **Web (desktop browser)**
  - **Android native build** (required for SMS/background/permissions behavior)
- Capture runtime values in **Actual Output** and set **Status** as `Pass`, `Fail`, or `Blocked`.
- This refreshed version intentionally excludes screenshot placeholders.

---

## Test Case Template

| Field           | Description                         |
| --------------- | ----------------------------------- |
| TC-ID           | Unique identifier                   |
| Scenario        | Functional behavior being validated |
| Preconditions   | Required setup/state                |
| Navigation      | Route/screen path                   |
| Steps           | Numbered verification actions       |
| Expected Output | Required system behavior            |
| Actual Output   | Tester entry                        |
| Status          | Pass / Fail / Blocked               |

---

## 1. Onboarding & First-Run

### TC-ONB-001: First Launch Shows Onboarding

- **Preconditions**: Fresh install or clear local storage keys related to onboarding
- **Navigation**: `/` → onboarding flow
- **Steps**:
  1. Launch app from clean state.
  2. Observe initial screen sequence.
  3. Complete onboarding CTA.
- **Expected Output**:
  - Onboarding flow appears for first-run user.
  - Completion redirects to `/home`.
  - Completion flag is persisted.
- **Actual Output**:
- **Status**:

### TC-ONB-002: Returning User Skips Onboarding

- **Preconditions**: Onboarding completion flag exists
- **Navigation**: `/` → `/home`
- **Steps**:
  1. Relaunch app.
  2. Observe landing route.
- **Expected Output**: User bypasses onboarding and lands directly on Home.
- **Actual Output**:
- **Status**:

### TC-ONB-003: Post-Onboarding SMS Permission Prompt Timing

- **Preconditions**: Android native build; onboarding just completed
- **Navigation**: `/home`
- **Steps**:
  1. Complete onboarding.
  2. Wait for delayed prompt behavior.
  3. Interact with SMS prompt action.
- **Expected Output**:
  - Prompt appears once after onboarding completion window.
  - Prompt state prevents repeated immediate re-open.
- **Actual Output**:
- **Status**:

---

## 2. Home Dashboard

### TC-HOME-001: Dashboard Totals Render Correctly

- **Preconditions**: Dataset contains income, expense, and transfer transactions
- **Navigation**: `/home`
- **Steps**:
  1. Open Home.
  2. Validate total cards/summary values.
  3. Compare against seeded dataset math.
- **Expected Output**:
  - Income/expense/net totals are accurate.
  - Transfer amounts do not inflate income/expense metrics.
- **Actual Output**:
- **Status**:

### TC-HOME-002: Empty State Dashboard

- **Preconditions**: No transaction records
- **Navigation**: `/home`
- **Steps**:
  1. Ensure data store is empty.
  2. Open Home.
- **Expected Output**:
  - Zero-value summary shown.
  - Empty-state content appears without crash.
- **Actual Output**:
- **Status**:

### TC-HOME-003: Period Switch Refreshes Metrics

- **Preconditions**: Transactions distributed across different dates/months
- **Navigation**: `/home`
- **Steps**:
  1. Switch period selector values (e.g., week/month/year where available).
  2. Observe cards/charts/list.
- **Expected Output**: Visible metrics update according to selected period.
- **Actual Output**:
- **Status**:

---

## 3. Transaction Management

### TC-TXN-001: Create Expense Transaction

- **Preconditions**: User session active
- **Navigation**: `/edit-transaction`
- **Steps**:
  1. Start new transaction.
  2. Set type = expense.
  3. Enter amount/category/date/account/vendor.
  4. Save.
- **Expected Output**:
  - Save succeeds.
  - Entry appears in lists and affects balances/analytics.
- **Actual Output**:
- **Status**:

### TC-TXN-002: Create Income Transaction

- **Preconditions**: User session active
- **Navigation**: `/edit-transaction`
- **Steps**:
  1. Add transaction with type = income.
  2. Enter valid amount and destination account.
  3. Save.
- **Expected Output**: Income is persisted and reflected in dashboards.
- **Actual Output**:
- **Status**:

### TC-TXN-003: Create Transfer Transaction

- **Preconditions**: At least two accounts exist
- **Navigation**: `/edit-transaction`
- **Steps**:
  1. Set type = transfer.
  2. Select from-account and to-account.
  3. Save.
- **Expected Output**:
  - Transfer persists with account balance movement.
  - Transfer excluded from income/expense analytics.
- **Actual Output**:
- **Status**:

### TC-TXN-004: Edit Existing Transaction

- **Preconditions**: Existing transaction
- **Navigation**: `/transactions` → `/edit-transaction/:id`
- **Steps**:
  1. Open transaction.
  2. Modify amount/category/vendor.
  3. Save.
- **Expected Output**: Updated values persist and dependent totals refresh.
- **Actual Output**:
- **Status**:

### TC-TXN-005: Delete Transaction

- **Preconditions**: Existing transaction
- **Navigation**: `/edit-transaction/:id`
- **Steps**:
  1. Open transaction detail/edit form.
  2. Trigger delete action.
  3. Confirm deletion.
- **Expected Output**: Item is removed and balances/analytics recalculate.
- **Actual Output**:
- **Status**:

### TC-TXN-006: Form Validation Guards

- **Preconditions**: Transaction form open
- **Navigation**: `/edit-transaction`
- **Steps**:
  1. Submit with missing required fields.
  2. Submit with invalid amount/date combinations.
- **Expected Output**: Validation messages prevent invalid save.
- **Actual Output**:
- **Status**:

---

## 4. Smart Import & SMS Flows

### TC-IMP-001: Manual Paste-and-Parse Import

- **Preconditions**: Valid sample bank SMS text available
- **Navigation**: `/import-transactions`
- **Steps**:
  1. Paste message content.
  2. Trigger parse/import flow.
  3. Review parsed output.
- **Expected Output**:
  - Transaction fields are inferred (amount/type/date/vendor where available).
  - User can continue to review/save.
- **Actual Output**:
- **Status**:

### TC-IMP-002: Bulk Import Mixed Valid/Invalid Lines

- **Preconditions**: Batch input containing parseable and malformed entries
- **Navigation**: `/import-transactions`
- **Steps**:
  1. Submit batch messages.
  2. Observe result handling.
- **Expected Output**:
  - Valid items parse successfully.
  - Invalid items are skipped or flagged gracefully.
- **Actual Output**:
- **Status**:

### TC-SMS-001: Enable Background SMS + Auto-Import

- **Preconditions**: Android native build; SMS permission not yet granted
- **Navigation**: `/settings`
- **Steps**:
  1. Enable SMS auto-import toggle.
  2. Grant platform SMS permission.
  3. Return to app and re-check state.
- **Expected Output**:
  - Permission flow completes.
  - Background SMS listener/auto-import state becomes active.
- **Actual Output**:
- **Status**:

### TC-SMS-002: Disable SMS Auto-Import

- **Preconditions**: SMS auto-import currently enabled
- **Navigation**: `/settings`
- **Steps**:
  1. Turn off SMS auto-import.
  2. Save settings (if required).
- **Expected Output**: SMS auto-import is disabled and persisted.
- **Actual Output**:
- **Status**:

### TC-SMS-003: Review SMS-Driven Transaction Draft

- **Preconditions**: SMS message captured by app (foreground/background path)
- **Navigation**: notification or import flow → `/edit-transaction`
- **Steps**:
  1. Open generated draft from SMS event.
  2. Validate mapped fields.
  3. Save or edit before save.
- **Expected Output**: Draft transaction opens correctly and can be finalized.
- **Actual Output**:
- **Status**:

---

## 5. Budget & Accounts

### TC-BUD-001: Open Budget Hub

- **Preconditions**: User profile initialized
- **Navigation**: `/budget`
- **Steps**:
  1. Navigate to Budget Hub.
  2. Verify summary widgets/load state.
- **Expected Output**: Budget hub loads without runtime errors.
- **Actual Output**:
- **Status**:

### TC-BUD-002: Create Budget Plan

- **Preconditions**: No blocking validation issues
- **Navigation**: `/budget/set`
- **Steps**:
  1. Create a budget amount/category/period.
  2. Save.
- **Expected Output**: Budget is created and appears in hub/report pages.
- **Actual Output**:
- **Status**:

### TC-BUD-003: Budget Detail Drilldown

- **Preconditions**: Existing budget
- **Navigation**: `/budget/:budgetId`
- **Steps**:
  1. Open budget detail.
  2. Review spend/progress data.
- **Expected Output**: Detail page shows correct budget utilization metrics.
- **Actual Output**:
- **Status**:

### TC-BUD-004: Accounts CRUD and Balance Effect

- **Preconditions**: Accounts module accessible
- **Navigation**: `/budget/accounts`
- **Steps**:
  1. Add account.
  2. Edit account metadata.
  3. Delete account (where allowed).
- **Expected Output**: Account actions persist and maintain valid references.
- **Actual Output**:
- **Status**:

### TC-BUD-005: Budget Report and Insights Pages

- **Preconditions**: Transaction + budget data present
- **Navigation**: `/budget/report`, `/budget/insights`
- **Steps**:
  1. Open report page.
  2. Open insights page.
  3. Compare values against source data.
- **Expected Output**: Reports/insights render accurate and consistent numbers.
- **Actual Output**:
- **Status**:

---

## 6. Analytics & Insights

### TC-ANL-001: Analytics Page Loads and Segments Data

- **Preconditions**: Mixed transaction dataset available
- **Navigation**: `/analytics`
- **Steps**:
  1. Open analytics page.
  2. Validate totals, category breakdown, and trends.
- **Expected Output**:
  - Analytics loads without crash.
  - Transfer exclusion rules are honored.
- **Actual Output**:
- **Status**:

### TC-ANL-002: Analytics Updates After Transaction CRUD

- **Preconditions**: Analytics page accessible
- **Navigation**: `/edit-transaction` + `/analytics`
- **Steps**:
  1. Create transaction.
  2. Update transaction.
  3. Delete transaction.
  4. Re-open analytics after each action.
- **Expected Output**: Analytics values update deterministically after each change.
- **Actual Output**:
- **Status**:

---

## 7. Settings & Preferences

### TC-SET-001: Save Theme/Currency/Week Start Preferences

- **Preconditions**: Settings page loaded
- **Navigation**: `/settings`
- **Steps**:
  1. Change theme.
  2. Change currency.
  3. Change week start day.
  4. Save settings.
- **Expected Output**:
  - Success feedback shown.
  - Preferences persist across reload/app restart.
- **Actual Output**:
- **Status**:

### TC-SET-002: Unsaved Changes Detection

- **Preconditions**: Settings page loaded
- **Navigation**: `/settings`
- **Steps**:
  1. Modify one or more settings.
  2. Attempt to navigate away without saving.
- **Expected Output**: Unsaved changes warning/prompt appears as designed.
- **Actual Output**:
- **Status**:

### TC-SET-003: Notification Toggle Behavior

- **Preconditions**: Notification control visible
- **Navigation**: `/settings`
- **Steps**:
  1. Toggle app notifications on/off.
  2. Validate persisted value.
- **Expected Output**: Notification preference changes are reflected and stored.
- **Actual Output**:
- **Status**:

### TC-SET-004: Beta Feature Activation Code Flow

- **Preconditions**: Beta feature section enabled
- **Navigation**: `/settings`
- **Steps**:
  1. Open beta activation dialog.
  2. Submit invalid code.
  3. Submit valid code.
- **Expected Output**:
  - Invalid code yields controlled failure feedback.
  - Valid code enables beta state.
- **Actual Output**:
- **Status**:

---

## 8. Data Management

### TC-DATA-001: Export Transactions (CSV)

- **Preconditions**: Transactions exist (including newer FX-related fields)
- **Navigation**: `/settings` → Data Management
- **Steps**:
  1. Trigger export.
  2. Open output file.
- **Expected Output**:
  - Export succeeds.
  - Export includes expected transaction fields and FX columns when present.
- **Actual Output**:
- **Status**:

### TC-DATA-002: Export with Empty Dataset

- **Preconditions**: No transactions
- **Navigation**: `/settings` → Data Management
- **Steps**:
  1. Trigger export.
- **Expected Output**: Controlled response shown (no crash; user feedback displayed).
- **Actual Output**:
- **Status**:

### TC-DATA-003: Import Valid JSON/CSV Payload

- **Preconditions**: Valid import file prepared
- **Navigation**: `/settings` → Data Management
- **Steps**:
  1. Start import.
  2. Confirm replacement/merge prompt if presented.
- **Expected Output**: Data imports successfully and appears across relevant screens.
- **Actual Output**:
- **Status**:

### TC-DATA-004: Import Invalid File Format

- **Preconditions**: Corrupt/unsupported file
- **Navigation**: `/settings` → Data Management
- **Steps**:
  1. Attempt import with invalid file.
- **Expected Output**: Import fails gracefully with clear error feedback.
- **Actual Output**:
- **Status**:

---

## 9. FX / Exchange Rate Flows

### TC-FX-001: Transaction with FX Fields Persists Correctly

- **Preconditions**: Multi-currency transaction entry path available
- **Navigation**: `/edit-transaction`
- **Steps**:
  1. Create/update transaction containing FX metadata.
  2. Save and reload app/page.
  3. Re-open transaction.
- **Expected Output**:
  - FX fields remain intact after persistence and reload.
  - No silent FX-field stripping.
- **Actual Output**:
- **Status**:

### TC-FX-002: Dashboard Uses Correct Base Currency Logic

- **Preconditions**: Transactions contain multiple currencies with conversion data
- **Navigation**: `/home`
- **Steps**:
  1. Load dashboard totals.
  2. Compare computed totals against expected converted values.
- **Expected Output**: Totals align with current base-currency conversion behavior.
- **Actual Output**:
- **Status**:

### TC-FX-003: Exchange Rate Lookup Screen

- **Preconditions**: Network available
- **Navigation**: `/exchange-rates`
- **Steps**:
  1. Open Exchange Rates page.
  2. Select currency pair.
  3. Trigger lookup/update action.
- **Expected Output**: Exchange rate UI responds correctly and displays valid data/state.
- **Actual Output**:
- **Status**:

### TC-FX-004: FX Unconverted/Warning State

- **Preconditions**: Dataset includes at least one unconverted transaction
- **Navigation**: `/home` and/or relevant transaction list/detail screens
- **Steps**:
  1. Load data containing unconverted FX record.
  2. Observe warning/banner behavior.
- **Expected Output**: User-visible warning state appears for unconverted FX conditions.
- **Actual Output**:
- **Status**:

---

## 10. OTA & App Update

### TC-OTA-001: Check for OTA/App Updates in Settings

- **Preconditions**: OTA debug/update controls enabled for build
- **Navigation**: `/settings`
- **Steps**:
  1. Trigger update check action.
  2. Observe response status.
- **Expected Output**: Current and available update states are shown without error.
- **Actual Output**:
- **Status**:

### TC-OTA-002: Update Dialog Behavior from App-Level Check

- **Preconditions**: Build/environment where update check can return state
- **Navigation**: app launch flow
- **Steps**:
  1. Start app.
  2. Observe auto-check behavior.
  3. Interact with update dialog if shown.
- **Expected Output**: App-level update state and dialog behavior are stable.
- **Actual Output**:
- **Status**:

---

## 11. About, Navigation, and Fallbacks

### TC-NAV-001: About Page Access

- **Preconditions**: App launched
- **Navigation**: `/about`
- **Steps**:
  1. Navigate to About page from nav entry.
  2. Validate content render and back navigation.
- **Expected Output**: About page loads correctly and navigation remains functional.
- **Actual Output**:
- **Status**:

### TC-NAV-002: Route Not Found Fallback

- **Preconditions**: App running
- **Navigation**: Unknown route (e.g., `/does-not-exist`)
- **Steps**:
  1. Open invalid path.
- **Expected Output**: NotFound view renders without app crash.
- **Actual Output**:
- **Status**:

### TC-NAV-003: Core Route Smoke Test

- **Preconditions**: App running
- **Navigation**: `/home`, `/transactions`, `/analytics`, `/profile`, `/settings`, `/budget`
- **Steps**:
  1. Open each route sequentially.
  2. Confirm primary UI renders.
- **Expected Output**: All core routes load and remain interactive.
- **Actual Output**:
- **Status**:

---

## 12. Error Handling & Edge Cases

### TC-ERR-001: Malformed SMS Parse Fallback

- **Preconditions**: SMS parsing path available
- **Navigation**: SMS ingestion path
- **Steps**:
  1. Inject malformed financial-like SMS.
  2. Observe app response.
- **Expected Output**: Controlled fallback (manual review/edit flow) is used; no crash.
- **Actual Output**:
- **Status**:

### TC-ERR-002: Storage Migration Startup Safety

- **Preconditions**: App data includes legacy currency/fx shape variants
- **Navigation**: App launch
- **Steps**:
  1. Launch app with legacy-like stored data.
  2. Observe startup and resulting data integrity.
- **Expected Output**: Migrations run safely; app remains usable; data normalized.
- **Actual Output**:
- **Status**:

### TC-ERR-003: Error Boundary Recovery

- **Preconditions**: Controlled environment capable of triggering render error
- **Navigation**: Any route wrapped by error boundary
- **Steps**:
  1. Trigger component-level runtime error (test harness/mocked fault).
  2. Observe fallback behavior.
- **Expected Output**: Error boundary catches fault and preserves app stability.
- **Actual Output**:
- **Status**:

---

## Revision Summary

- Rebuilt from prior settings-focused version to a complete product-wide QA script.
- Updated scope to include post-Jan-2025 additions and refinements (FX, exchange rates, about page, budget/account routing, app update checks, SMS prompt behavior).
- Removed screenshot placeholders per request.
