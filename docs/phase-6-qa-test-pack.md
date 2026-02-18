What device scope should we target for QA: (A) Android only, (B) iOS only, (C) both? **Derive from code/config: C (both)** based on Capacitor Android+iOS dependencies and Playwright mobile projects.

# Phase 6 Pack — Testing & QA (Reverse-Engineered)

## 1) Test Strategy
### 1.1 Goals (what quality means here)
Quality for this app means **financially correct, durable, and explainable transaction data** across manual entry, SMS ingestion, edits, budgets, analytics, and import/export. The highest-quality outcome is not only “no crash,” but “no silent money distortion.” The code shows heavy local persistence (`safeStorage`, local keys), SMS parsing/inference, and FX conversion at save time. Therefore, our quality goals are:
- Prevent data loss/corruption in transaction and budget stores.
- Ensure numeric correctness for amounts, transfer signs, and FX fields.
- Guarantee permission-gated flows do not dead-end users (SMS + notifications).
- Preserve traceability: users can review/edit inferred data before commit.
- Keep background/foreground behavior deterministic for SMS-triggered navigation and notifications.

### 1.2 Scope (in) / Out of Scope
**In scope (Phase 6):**
- Onboarding gate and post-onboarding SMS prompt behavior.
- Transaction CRUD (including transfer dual-entry behavior).
- Smart Paste/SMS parsing pipeline (filter → parse → confidence → review).
- SMS permission lifecycle and auto-import gating.
- Budget calculations and alert triggers with transfer exclusion/FX-awareness.
- Import/export (CSV parse/emit) and storage integrity behaviors.
- FX conversion and missing-rate fallback outcomes.

**Out of scope:**
- Release readiness operations/checklists (Phase 7).
- Architecture redesign proposals.
- Back-end/cloud SLA verification beyond visible code contracts (OPEN QUESTION where required).

### 1.3 Test Levels (unit/integration/e2e/manual)
- **Unit tests:** parser utilities, validators, CSV parsing, FX conversion logic, budget period logic, permission status combiner behavior.
- **Integration tests:** transaction + account + budget interaction, SMS pipeline end-to-end in service layer, context/store synchronization.
- **E2E tests:** user-visible critical journeys (transaction CRUD, transfer flow, budget management, settings flow, smart-paste route behavior).
- **Manual exploratory/UAT:** native permission dialogs, background SMS behavior, notification tap handling, kill/resume scenarios, real-device locale and currency rendering.

### 1.4 Environments & Devices (assumptions)
- Device scope derived from code/config: **Android + iOS**.
- Web/PWA-like environment exists and must be sanity-tested because settings/permissions include web simulation paths.
- Target matrix (minimum):
  - Android 13/14 mid-tier device (native SMS permission flows).
  - iOS 17 device (navigation, storage persistence, notification behavior where applicable).
  - Web Chromium for rapid regression.
- OPEN QUESTION: explicit org device policy and minimum OS versions beyond inferred dependencies.

### 1.5 Risk Areas (ranked)
1. **Data correctness & loss (P0):** local storage writes, validation, overwrite/import behavior, transfer dual-entry, edits.
2. **Financial correctness (P0):** FX conversion locking, missing-rate handling, budget spent totals, transfer exclusion from spend.
3. **Parsing/inference reliability (P0/P1):** confidence thresholds and fallback/manual-review routing.
4. **Permission/platform behavior (P0/P1):** SMS permission races, background listener startup/shutdown, notification tap paths.
5. **Regression-prone routing/state passing (P1):** edit page navigation state payloads from multiple entry points.
6. **Analytics/report consistency (P1/P2):** derived metrics correctness with mixed converted/unconverted data.

### 1.6 Entry/Exit Criteria
**Entry**
- Build/install succeeds in target environment.
- Storage keys/migrations applied without runtime exceptions.
- Seed dataset available (normal + edge).

**Exit**
- No open S1/S2 defects in P0 flows.
- P0 automated suite green; manual smoke/UAT completed.
- Known P1/P2 defects triaged with workaround/decision.
- Evidence bundle attached for each blocked or failed case.

### 1.7 Regression Strategy
- **Tier 0 (every PR):** unit + integration around transaction, CSV, parser confidence, permission service.
- **Tier 1 (daily):** Playwright e2e for transaction CRUD, transfer, settings import/export, budget CRUD.
- **Tier 2 (pre-release):** manual native pass for SMS permissions/background notification flows and locale/currency combinations.
- Use risk triggers for focused reruns: if touching `TransactionService`, rerun transfer + FX + budget integration; if touching parser stack, rerun smart-paste integration and manual review flows.

### 1.8 Traceability Approach (how tests map to flows)
Traceability map anchors each test to a **flow ID** and one or more code symbols (service/page/function). Manual and automated tests use shared IDs (e.g., F3-SMS-07) so failures can be traced back to exact code paths. Evidence appendix lists file + symbol for every flow claim.

**Quality principles used for prioritization**
- **Correctness over convenience:** if UX allows “quick save,” validation still must prevent malformed financial records from persisting.
- **No silent mutation:** every auto-inference path must remain user-reviewable before final commit.
- **Deterministic calculations:** the same record set should always produce the same balances/analytics totals, regardless of session order.
- **Recovery-first behavior:** when parsing, permission, or import fails, the app should recover into a manual path instead of abandoning user intent.

**Brownfield constraints and QA response**
Because this is an existing app with broad feature surface (transactions, SMS, budgets, FX, settings, analytics), test strategy avoids “full retest” and instead uses a **risk-weighted core-flow model**. This means each regression cycle starts from business-critical flows where defects are costly: creating and editing transactions, transfer integrity, and import pathways that can inject many records. Then we expand to adjacent features such as budgets and analytics that consume those records. This sequence catches upstream data defects before they cascade downstream into dashboards and reporting.

**Financial invariants to enforce across all levels**
- A transaction record must always have coherent tuple values (`amount`, `type`, `date`, `currency`, `category`) after save/import.
- Transfer operations must remain balanced by design: one outflow + one inflow with shared linkage metadata.
- FX decisions must be locked at save-time and not silently recomputed on later reads.
- Imported records should be idempotent under repeated attempts when IDs are preserved or remapped safely.
- Budget spending logic must exclude transfer noise and avoid double counting.

**Defect prevention focus by lifecycle stage**
- **During development:** heavy unit/integration checks around pure logic (parser, CSV, FX math, service orchestration).
- **During merge validation:** compact e2e pack proving user journeys and route/state wiring still function.
- **Pre-UAT:** native manual sessions for permission dialogs, background states, notification tap resumes, and app lifecycle transitions (foreground/background/terminated).

**Observability expectations for QA**
Phase 6 evidence collection should capture both UI output and data-layer state. For any candidate defect in financial correctness, testers should preserve: input artifact (SMS/CSV/form fields), resulting persisted object snapshot, and derived view output (list total, budget usage, analytics card). This triangulation prevents false positives caused by presentation-only issues and helps isolate whether the bug lives in parsing, persistence, or aggregation.

**Risk acceptance guidance**
- We can accept minor cosmetic defects (S4/P2) if no confusion in financial interpretation occurs.
- We should not accept unresolved issues that can create incorrect transaction amounts/categories at scale, especially in auto-import flows.
- Any uncertainty in parsing confidence UX or fallback behavior should be treated conservatively as P1 until validated on target devices.


## 2) Test Scope Matrix

| Flow/Feature | Priority (P0/P1/P2) | Test Type | What to verify | Evidence |
|---|---|---|---|---|
| F1 Onboarding gate + completion | P1 | Integration, E2E, Manual | first-run redirect to `/onboarding`, completion flag persistence, post-completion navigation | `src/App.tsx` `showOnboarding` check; `src/pages/Onboarding.tsx` `handleComplete` |
| F2 Transaction CRUD + transfer | P0 | Unit, Integration, E2E, Manual | add/update/delete, transfer creates two linked entries with sign correctness | `src/services/TransactionService.ts` `addTransaction` |
| F3 Smart Paste parse/infer | P0 | Unit, Integration, Manual | parse to transaction fields, confidence thresholds, fallback status behavior | `src/lib/smart-paste-engine/parseAndInferTransaction.ts` `parseAndInferTransaction` |
| F4 SMS permission + background listener | P0 | Unit, Integration, Manual | permission checks/requests, listener setup/teardown, race protection | `src/services/SmsPermissionService.ts` `checkPermissionStatus/requestPermission`; `src/App.tsx` listener setup |
| F5 Auto SMS import and sender/date filtering | P1 | Unit, Integration, Manual | import lock, sender/date filter, confirmation gating, vendor mapping handoff | `src/services/SmsImportService.ts` `checkForNewMessages` |
| F6 CSV import/export | P0 | Unit, Integration, Manual | required field validation, quote/newline escaping, FX fields round-trip | `src/utils/csv.ts` `convertTransactionsToCsv/parseCsvTransactions` |
| F7 Budget calculations + alerts | P0 | Unit, Integration, E2E, Manual | period retrieval, spend calc excluding transfers, FX-aware budget progress | `src/services/BudgetService.ts` budget retrieval + spending responsibilities |
| F8 FX conversion lifecycle | P0 | Unit, Integration, Manual | identity/manual/cached/missing fallback, locked-at behavior at save-time | `src/services/FxConversionService.ts` `applyFxConversion` |

## 3) Manual Test Cases (25–50)
### TC-001: First launch routes to onboarding
- Priority: P1
- Preconditions: clean storage (`xpensia_onb_done` absent)
- Steps: Launch app.
- Expected Result: App redirects to `/onboarding`.
- Evidence: `src/App.tsx` (`showOnboarding` + redirect effect)

### TC-002: Onboarding completion sets flags and navigates home
- Priority: P1
- Preconditions: Onboarding screen open.
- Steps: Complete onboarding flow.
- Expected Result: `xpensia_onb_done=true`, `xpensia_onb_just_completed=true`, route `/home`.
- Evidence: `src/pages/Onboarding.tsx` (`handleComplete`)

### TC-003: Add expense transaction stores correctly
- Priority: P0
- Preconditions: none
- Steps: Create expense in UI and save.
- Expected Result: Single transaction persisted with generated ID.
- Evidence: `src/services/TransactionService.ts` (`addTransaction` non-transfer branch)

### TC-004: Add income transaction stores correctly
- Priority: P0
- Preconditions: none
- Steps: Create income and save.
- Expected Result: Stored with positive amount and selected category.
- Evidence: `src/services/TransactionService.ts` (`addTransaction`)

### TC-005: Add transfer creates debit+credit pair
- Priority: P0
- Preconditions: source and destination accounts exist
- Steps: Save transfer amount 100.
- Expected Result: Two entries share `transferId`; debit is -100, credit is +100.
- Evidence: `src/services/TransactionService.ts` (`debitEntry`, `creditEntry`)

### TC-006: Transfer category forced to Transfer
- Priority: P0
- Preconditions: none
- Steps: Save transfer with custom category set in form.
- Expected Result: Saved entries have category `Transfer`.
- Evidence: `src/services/TransactionService.ts` (transfer category assignment)

### TC-007: Edit transaction updates existing ID
- Priority: P0
- Preconditions: existing transaction
- Steps: Edit amount/category and save.
- Expected Result: Same ID updated; no duplicate added.
- Evidence: `src/utils/storage-utils.ts` (`storeTransaction` existingIndex path)

### TC-008: Invalid transaction payload is rejected
- Priority: P0
- Preconditions: malformed input path available (manual import/simulated)
- Steps: Attempt save missing required fields.
- Expected Result: validation error surfaced; not persisted.
- Evidence: `src/utils/storage-utils.ts` (`storeTransaction` + validation call)

### TC-009: Smart Paste sends first detected transaction to edit screen
- Priority: P0
- Preconditions: Import Transactions page open
- Steps: Paste parseable message.
- Expected Result: Navigate to `/edit-transaction` with inferred state payload.
- Evidence: `src/pages/ImportTransactions.tsx` (`handleTransactionsDetected`)

### TC-010: Parser defaults missing type to expense
- Priority: P1
- Preconditions: message without obvious type keyword
- Steps: Parse message.
- Expected Result: inferred `type=expense`.
- Evidence: `src/lib/smart-paste-engine/parseAndInferTransaction.ts` (`type` fallback)

### TC-011: Confidence >=0.8 marks success
- Priority: P1
- Preconditions: high-quality template-matching SMS
- Steps: Parse SMS.
- Expected Result: `parsingStatus=success`.
- Evidence: `src/lib/smart-paste-engine/parseAndInferTransaction.ts` (threshold logic)

### TC-012: Confidence <0.4 marks failed
- Priority: P1
- Preconditions: noisy/unstructured SMS
- Steps: Parse SMS.
- Expected Result: `parsingStatus=failed` and routed for manual correction.
- Evidence: `src/lib/smart-paste-engine/parseAndInferTransaction.ts` (threshold logic)

### TC-013: Matched-but-failed template increments failure counter
- Priority: P1
- Preconditions: crafted SMS that matches template hash but fails confidence
- Steps: Parse and inspect template bank stats.
- Expected Result: template failure incremented once.
- Evidence: `src/lib/smart-paste-engine/parseAndInferTransaction.ts` (`incrementTemplateFailure` path)

### TC-014: Non-financial SMS ignored by listener
- Priority: P0
- Preconditions: SMS listener enabled
- Steps: Receive non-financial SMS.
- Expected Result: no transaction navigation/notification.
- Evidence: `src/App.tsx` (`isFinancialTransactionMessage` guard)

### TC-015: Parse exception routes to manual edit
- Priority: P0
- Preconditions: SMS causes parser throw
- Steps: Receive SMS in foreground.
- Expected Result: toast shown; navigates to edit with raw message.
- Evidence: `src/App.tsx` (parse error catch inside `smsReceived`)

### TC-016: Background SMS schedules local notification
- Priority: P0
- Preconditions: listener enabled, app backgrounded
- Steps: Receive financial SMS.
- Expected Result: local notification scheduled with sms payload.
- Evidence: `src/App.tsx` (`LocalNotifications.schedule`)

### TC-017: Notification tap opens edit flow with parsed payload
- Priority: P0
- Preconditions: notification with smsData exists
- Steps: Tap notification.
- Expected Result: parse+infer executes; opens `/edit-transaction` with confidence metadata.
- Evidence: `src/App.tsx` (`localNotificationActionPerformed` handler)

### TC-018: Permission status combines reader+listener correctly
- Priority: P0
- Preconditions: mixed permission states mocked
- Steps: Trigger permission check.
- Expected Result: granted only when both granted; rationale/permanentDenied consistent.
- Evidence: `src/services/SmsPermissionService.ts` (`combinePermissionStatuses`)

### TC-019: Concurrent permission check uses cached result
- Priority: P1
- Preconditions: rapid repeated status checks
- Steps: invoke check multiple times.
- Expected Result: no native flood; returns last known or fallback while in-flight.
- Evidence: `src/services/SmsPermissionService.ts` (`permissionCheckInProgress` branch)

### TC-020: Permission request serialization reuses in-flight promise
- Priority: P1
- Preconditions: trigger simultaneous requests
- Steps: request permission from two UI actions.
- Expected Result: one native request; both callers receive same result.
- Evidence: `src/services/SmsPermissionService.ts` (`permissionRequestPromise`)

### TC-021: Auto-import lock prevents duplicate import runs
- Priority: P1
- Preconditions: auto import trigger twice quickly
- Steps: call checkForNewMessages concurrently.
- Expected Result: second run skipped until first completes.
- Evidence: `src/services/SmsImportService.ts` (`importLock`)

### TC-022: Auto-import filters to financial messages
- Priority: P1
- Preconditions: mixed message set
- Steps: run auto import.
- Expected Result: only financial messages processed.
- Evidence: `src/services/SmsImportService.ts` (`isFinancialTransactionMessage` filter)

### TC-023: CSV export includes FX columns by default
- Priority: P0
- Preconditions: transactions include fx fields
- Steps: export CSV.
- Expected Result: `baseCurrency, amountInBase, fxRateToBase, fxSource, fxLockedAt, fxPair` headers included.
- Evidence: `src/utils/csv.ts` (`fxHeaders`, `includeFxFields`)

### TC-024: CSV parser skips rows missing required fields
- Priority: P0
- Preconditions: CSV with invalid rows
- Steps: import CSV.
- Expected Result: only valid rows returned; invalid rows skipped.
- Evidence: `src/utils/csv.ts` (required field validation in `parseCsvTransactions`)

### TC-025: CSV parser unescapes quotes/newlines
- Priority: P1
- Preconditions: quoted multiline fields in CSV
- Steps: import CSV.
- Expected Result: text restored with real newlines/quotes.
- Evidence: `src/utils/csv.ts` (`splitRow` unescape logic)

### TC-026: FX identity conversion when currencies match
- Priority: P0
- Preconditions: base currency = transaction currency
- Steps: save transaction.
- Expected Result: fxRate=1, amountInBase set, fxSource=identity.
- Evidence: `src/services/FxConversionService.ts` (Step 1 identity branch)

### TC-027: Manual FX rate is applied and cached
- Priority: P0
- Preconditions: non-base transaction, manual rate entered
- Steps: save transaction.
- Expected Result: converted value uses manual rate; cache write executed.
- Evidence: `src/services/FxConversionService.ts` (manual rate branch + `setCachedRate`)

### TC-028: Missing FX rate allowMissing stores null conversion safely
- Priority: P0
- Preconditions: no available rate, fallback mode allowMissing
- Steps: save transaction.
- Expected Result: save succeeds; amountInBase/fxRate null; warning present.
- Evidence: `src/services/FxConversionService.ts` (allowMissing branch)

### TC-029: Budget retrieval de-duplicates logical key
- Priority: P1
- Preconditions: duplicate logical budgets in storage
- Steps: load budgets.
- Expected Result: single latest active record retained.
- Evidence: `src/services/BudgetService.ts` (`getBudgets` map by `getBudgetKey`)

### TC-030: Budget spend excludes transfer transactions
- Priority: P0
- Preconditions: period contains expenses + transfers
- Steps: open budget report.
- Expected Result: transfer amounts do not inflate spend.
- Evidence: `src/services/BudgetService.ts` (responsibility/checklist: transfer exclusion)

## 4) Automation Plan
### 4.1 Automate Now (highest ROI)
- TransactionService critical invariants: transfer pair/sign/category, non-transfer save, update idempotence.
- CSV roundtrip: export→import fidelity including FX fields, escaped strings, invalid row skip.
- Parser confidence classification (success/partial/failed) and template failure increment behavior.
- Permission service concurrency/serialization behavior.
- Budget spend calculations and transfer exclusion.
- E2E smoke: add/edit/delete transaction, create transfer, import via Smart Paste, settings CSV import/export.

### 4.2 Automate Later
- Native-specific background SMS behavior (best on device farm/manual until stable harness exists).
- Notification tap deep-link payload validation across OS versions.
- Long-haul reliability (storage volume, thousands of transactions, app restart cycles).

### 4.3 Tooling Assumptions (only if visible in repo; otherwise OPEN QUESTION)
- Unit/integration: **Vitest** (`npm run test`, `test:coverage`).
- Browser e2e: **Playwright** (`e2e/*.spec.ts`, mobile emulation profiles).
- OPEN QUESTION: native device farm (Firebase Test Lab/BrowserStack) not explicitly configured in repo.

### 4.4 Flakiness Controls (timeouts, deterministic data, retries)
- Freeze time/date in parser/FX tests.
- Seed deterministic storage fixture per test; clear local storage between runs.
- Avoid shared mutable state in permission and import-lock tests.
- Use Playwright retry-on-CI policy (already configured), and capture trace on first retry.

## 5) Test Data Plan
- **Baseline datasets (normal):**
  - 50 mixed income/expense transactions, 10 transfers, 3 currencies (SAR, USD, EUR), realistic categories.
- **Edge datasets (ugly):**
  - Amounts: 0, 0.01, very large, negative signs in unexpected positions.
  - Dates: leap day, DST boundary, malformed date strings.
  - Text: emojis, Arabic+English mixed vendor names, multiline notes.
- **Corrupted/invalid cases:**
  - Missing required CSV fields, wrong delimiters, duplicated IDs, invalid type/category values.
  - Broken JSON in storage keys to confirm safe fallback behavior.
- **Locale/currency/date variations:**
  - `en-US`, `ar-SA`, `fr-FR`; different decimal separators and date ordering.

**Example SMS/messages/records (15):**
1. "Debit card purchase SAR 23.50 at JARIR on 2025-02-01"
2. "تم خصم ١٢٠٫٧٥ ريال من بطاقتك في STC"
3. "Salary credited SAR 8500 to account XXXX1234"
4. "Transfer of USD 100.00 to account 9988"
5. "POS 45,67 EUR CARREFOUR 01/03/2025"
6. "Payment failed for SAR 99 at AMAZON"
7. "CARD PURCHASE 0.00 SAR test message"
8. "Your OTP is 123456" (non-financial control)
9. "Debit SAR 9999999.99 LUXURY STORE"
10. "Refund received SAR 32.10 from NOON"
11. "ATM withdrawal SAR 200.00 on 29-02-2024"
12. "USD card charge 15.25 @ APPLE.COM/BILL"
13. "Subscription charge €9.99 monthly"
14. "Transfer completed from Wallet A to Wallet B amount 50"
15. CSV row with embedded newline in notes field.

## 6) UAT Checklist (15–25)
- [ ] First-run onboarding appears only once.
- [ ] Completing onboarding lands user on Home.
- [ ] User can add income, expense, transfer without confusion.
- [ ] Transfer creates balanced out/in effect in ledgers.
- [ ] Editing transaction does not duplicate it.
- [ ] Deleting transaction updates totals immediately.
- [ ] Smart Paste suggestion opens editable review before save.
- [ ] Low-confidence parse is visibly reviewable by user.
- [ ] Non-financial SMS is ignored (no noisy prompts).
- [ ] SMS permission flow is understandable and recoverable after denial.
- [ ] Background SMS produces notification and deep-links correctly.
- [ ] CSV export file opens cleanly in spreadsheet apps.
- [ ] CSV import rejects malformed rows safely.
- [ ] Base currency selection reflects in displays.
- [ ] Multi-currency transactions show consistent converted/native amounts.
- [ ] Missing FX rates do not block save when policy allows.
- [ ] Budget values match underlying transactions.
- [ ] Transfers do not inflate budget spending.
- [ ] App retains data after restart.
- [ ] Settings changes persist after relaunch.

## 7) Bug Triage Rules
- **Severity definitions (S1–S4)**
  - **S1 Critical:** data loss/corruption, wrong balances/amounts, app crash on core flow.
  - **S2 Major:** key workflow blocked with workaround absent/poor.
  - **S3 Minor:** functional defect with easy workaround, low financial impact.
  - **S4 Cosmetic:** UI copy/layout issues with no functional impact.
- **Priority definitions (P0–P2)**
  - **P0:** must-fix before release candidate (all S1, core-flow S2).
  - **P1:** fix in current release if capacity permits.
  - **P2:** backlog/non-urgent.
- **Evidence required**
  - Repro steps (numbered), environment (platform/OS/build), expected vs actual.
  - Screenshot/video for UI defects; logs/console traces for logic defects.
  - For data issues: before/after record payload (transaction IDs, CSV snippet, storage key snapshot).
- **SLA targets**
  - S1/P0: triage ≤4h, fix plan ≤24h.
  - S2/P0-P1: triage ≤1 business day.
  - S3/S4: triage ≤3 business days.
- **Duplicate handling**
  - Keep oldest ticket as canonical; link duplicates with shared repro signature (flow ID + platform + build).

## 8) Evidence Appendix
- Onboarding and first-run gating → `src/App.tsx` (`showOnboarding`, onboarding redirect effect), `src/pages/Onboarding.tsx` (`handleComplete`).
- Routing coverage of major screens/flows → `src/App.tsx` (`AppRoutes`, route map including transactions, analytics, settings, import, edit, budgets).
- Transaction correctness and transfer dual-entry → `src/services/TransactionService.ts` (`addTransaction`, `debitEntry`, `creditEntry`).
- Storage integrity and validation-before-write → `src/utils/storage-utils.ts` (`storeTransaction`, `storeTransactions`, `safeSetItem`).
- Smart Paste parse + confidence lifecycle → `src/lib/smart-paste-engine/parseAndInferTransaction.ts` (`parseAndInferTransaction`, thresholds, `incrementTemplateFailure`).
- Import-to-review navigation state contract → `src/pages/ImportTransactions.tsx` (`handleTransactionsDetected`).
- SMS permission orchestration and concurrency controls → `src/services/SmsPermissionService.ts` (`checkPermissionStatus`, `requestPermission`, `permissionRequestPromise`).
- SMS auto-import gating and sender/date filtering → `src/services/SmsImportService.ts` (`checkForNewMessages`, `handleAutoImportWithPermissionDate`, `importLock`).
- Background SMS handling and notification deep-link path → `src/App.tsx` (`setupSmsListener`, `smsReceived` listener, `localNotificationActionPerformed`).
- CSV import/export schema and FX column behavior → `src/utils/csv.ts` (`convertTransactionsToCsv`, `parseCsvTransactions`).
- Budget period and spend logic context → `src/services/BudgetService.ts` (`getBudgets`, budget responsibilities/checklist for transfer exclusion and FX-aware spend).
- FX conversion logic and fallback behavior → `src/services/FxConversionService.ts` (`applyFxConversion`, `getBaseCurrency`, fallback branches).
- Existing automated test footprint → `src/services/__tests__/*`, `src/lib/smart-paste-engine/__tests__/*`, `src/utils/__tests__/*`, `src/pages/__tests__/*`, `src/components/**/__tests__/*`, `e2e/*.spec.ts`, plus test runner config in `package.json` and `playwright.config.ts`.
