Question for stakeholder (required): Tell me whether the app is intended to be (A) fully offline/local-only, (B) offline-first with optional sync, or (C) backend-driven. Since no response is available in this run, I will **derive from code**.

# Phase 4 Pack — Technical Architecture & Solution Design (Reverse-Engineered)

## 1) System Overview (HLD)
### 1.1 Goals & Constraints (from codebase reality)
This codebase implements a consumer finance tracker (Xpensia) with strong local-first behavior and optional cloud integrations. The application’s primary user value is fast transaction capture, especially from SMS, followed by user review/edit, local persistence, analytics visualization, and optional export/import. The code is not a greenfield architecture; it is a layered evolution with parallel implementations (legacy and newer Smart Paste pipelines), plus native-capability overlays for Android. The pre-development framing for Phase 4 should therefore be “document current architecture as-is, identify active paths, and mark operational risks where implementation overlap exists.”

The design goal that is clearly implemented is **transaction capture and persistence without mandatory backend dependence**. Transaction state is loaded directly from local storage (`xpensia_transactions`) via `TransactionContext`, with CRUD mutating in-memory React state and then writing back to local storage through storage utilities. This enables the dashboard, transaction list, budget, and analytics pages to remain usable in browser and native shells even without internet. Evidence: `TransactionProvider` initializes from `getStoredTransactions()` and persists with `storeTransactions()`; `safeStorage` falls back to memory when storage errors occur.

A second explicit goal is **Android-native SMS ingestion**. Two native plugins are integrated: one for historical read (`SmsReaderPlugin`) and one for background incoming SMS (`BackgroundSmsListener`). On app startup, `AppWrapper` checks native platform and permission state, starts listening if granted, filters financial messages, parses payloads, and routes users to `/edit-transaction` or schedules a local notification when app is backgrounded. This reflects an ingestion design that favors user confirmation over blind auto-write: parse result is drafted as a transaction object but user lands in edit/confirm flow.

A third goal is **incremental intelligence through learning**. Smart Paste parses messages, computes confidence, and tracks template/keyword learning. `parseAndInferTransaction` calculates confidence from field/template/keyword factors and tags parse status (`success`/`partial`/`failed`). `learnFromTransaction` stores structural templates and keyword mappings from confirmed edits. Architecture implication: inference quality should improve with user-confirmed examples, while still supporting manual correction path.

The major constraints observable in code are:
- **Platform bifurcation**: SMS functionality is native-only; web paths safely no-op (`SmsReaderService` returns empty on non-native).
- **Storage consistency risk**: several migration utilities reference legacy key `transactions`, while primary runtime uses `xpensia_transactions`; this implies migration coverage could be partial depending on historical data location.
- **Optional cloud identity**: Supabase auth/profile sync is guarded by feature flags and config presence. The app can operate without it.
- **Release complexity**: app combines store binaries with Capgo OTA updates, requiring semantic version checks, manifest fetch, pending-bundle apply semantics, and fallback behavior when native bridge is unavailable.

Step 1: Repo Architecture Scan (max 30 lines)
1. Framework/runtime: React + TypeScript + Vite web app, wrapped by Capacitor for Android/iOS targets (`package.json`, `capacitor.config.ts`).
2. UI stack: shadcn/radix + Tailwind + framer-motion.
3. Entry points: `src/main.tsx` initializes storage defaults, migrations, demo seeding, global error handlers, Capacitor init, analytics enablement.
4. App composition: `App.tsx` wraps `ThemeProvider` → `UserProvider` → `TransactionProvider` → `BrowserRouter`.
5. Routing: React Router routes defined in `AppRoutes` for dashboard, transactions, analytics, onboarding, settings, budget, SMS flows.
6. State management: React Context (`UserContext`, `TransactionContext`) plus local component state; no Redux/MobX.
7. Persistence: `safeStorage` (localStorage with in-memory fallback); `safePreferences` for Capacitor preferences.
8. Transaction persistence key: `xpensia_transactions`.
9. Parsing engine: Smart Paste (`parseAndInferTransaction`, `structureParser`, template/keyword banks).
10. SMS integration: `SmsReaderService` for historical read; `BackgroundSmsListener` for incoming listener.
11. Notifications: Capacitor Local Notifications with deep-link handling in `AppWrapper`.
12. Analytics telemetry: Firebase Analytics plugin wrapper (`logAnalyticsEvent`).
13. Auth backend: Supabase client exists; enabled only with flags/vars.
14. OTA update: Capgo `CapacitorUpdater` service with remote manifest and deferred apply.
15. Build tooling: Vite build with plugin preparation script; Capgo publish script generates zip/manifest.
16. Testing: Vitest unit/integration and Playwright e2e specs under `e2e/`.
17. Native Android registration: `MainActivity` registers SMS plugins; manifest includes SMS and boot receivers.
18. Migration strategy: one-time flags in local storage and startup migration runner.
19. Error handling: global `window` handlers + error boundaries per route.
20. Runtime architecture: hybrid client with optional backend services.

### 1.2 Tech Stack Summary
- Frontend: React 18, TypeScript, Vite, React Router, Tailwind, shadcn/radix.
- Native bridge: Capacitor core/plugins + custom local plugins (`capacitor-sms-reader`, `capacitor-background-sms-listener`).
- Data/state: local storage + context providers + service layer abstractions.
- Optional cloud: Supabase auth/profile sync; Firebase analytics; cloud URL config constants.
- Update channel: Capgo OTA manifest and bundle application service.

### 1.3 Runtime Architecture (client-only / client-server / hybrid)
**Derived classification: B) offline-first with optional sync (HIGH CONFIDENCE).**
- Offline-first evidence: core entities (transactions/categories/settings/templates) stored locally and loaded without server requirement.
- Optional sync evidence: Supabase integration is behind config and flags; app functions even with placeholder credentials.
- Hybrid native extensions: on Android, runtime extends to OS SMS and notification channels.
- OPEN QUESTION: which production cohorts run with Supabase auth enabled by default is not derivable from repository alone.


Additional reverse-engineered architecture notes (HLD depth):

From a runtime-control perspective, startup order is intentional and materially impacts behavior. `main.tsx` performs storage default initialization and migration invocation before rendering the root application tree. This means downstream route components and contexts observe post-migration storage state on first paint (subject to migration key correctness). The same startup block also seeds demo transactions and initializes background vendor sync, indicating the app expects “operational bootstrap work” to occur optimistically and tolerate failure. The try/catch around initialization includes fallback behavior (seed + error handlers + vendor sync), which implies a resilience preference over strict startup correctness: the app should render even when some initialization subsystems fail.

The composition model in `App.tsx` places user and transaction providers above the router, making session/profile and transaction state globally addressable across routes without per-page data fetching. This is a classic SPA composition pattern, but in this implementation it also centralizes cross-cutting native integrations (SMS listener setup, notification action handling, status bar setup, app update state checks) into a wrapper component rather than distributing lifecycle logic into feature pages. Architectural consequence: lower duplication and easier lifecycle coordination, but a heavier root component with many side effects.

For ingestion architecture, the system effectively has two channels that converge into a common transaction-edit confirmation path:
1) **Historical pull channel** (SmsReaderService + SmsImportService), and
2) **Realtime push channel** (BackgroundSmsListener + local notifications).
Both channels ultimately package parse output for `/edit-transaction` route state, preserving UX consistency. This convergent design is a strength because it minimizes divergent post-parse behavior and keeps validation human-in-the-loop.

The parsing/inference subsystem demonstrates layered inference rather than monolithic regex extraction. Structure parsing yields direct/inferred/default fields; confidence scoring then combines field coverage, template match confidence, and keyword correlation into weighted final confidence; status thresholds map confidence to actionable UX categories. This architecture is explainable and tunable. It also allows operational telemetry: failed template matches can increment counters, and failed parse IDs can be logged. These hooks provide practical surfaces for iterative parser improvement without replacing the full pipeline.

Data ownership is mostly client-resident. Transactions, categories, rules, settings, locale, templates, keyword mappings, and sender watermark state are all persisted locally. Supabase exists but is not architecture-critical for core ledger behavior in observed code. Therefore, if backend availability drops, primary transaction operations can continue. The tradeoff is data portability and multi-device consistency: without explicit sync, users rely on manual export/import or optional cloud-auth workflows not deeply coupled to transaction persistence.

Cross-cutting concern handling is present but uneven:
- **Error handling** is robust at shell level (global promise/error listeners and route boundaries), reducing white-screen failure risk.
- **Migration handling** exists but has potential key mismatch risks across old/new storage keys, creating uncertainty about full data normalization in legacy installs.
- **Observability** is event-oriented via Firebase analytics wrappers, but not full distributed tracing.
- **Security posture** includes runtime permission checks and native manifest declarations, but local data encryption-at-rest is not apparent in storage utility paths.

Release/runtime delivery architecture is hybrid: native binaries are distributed through store channels while web-layer updates can be delivered OTA via Capgo manifests/bundles. The app update service has explicit non-blocking behaviors, timeout wrappers, and pending bundle apply semantics (often on app background transition). This provides deployment agility and risk containment (avoid foreground reload disruption), but requires disciplined version compatibility governance between native shell capabilities and OTA bundle expectations.

Operationally, this codebase should be treated as a brownfield with active and legacy seams. Multiple migration files, mixed storage keys, and broad root-level side effects indicate ongoing evolution. For Phase 4 planning purposes, architecture work should prioritize (a) key unification and migration verification, (b) clarifying cloud vs local source-of-truth boundaries, and (c) codifying module boundary contracts to reduce accidental coupling growth.

## 2) Logical Architecture
### 2.1 Module Breakdown (Responsibilities)
Step 2: Module Boundary Map
- **Bootstrap layer** (`main.tsx`, `App.tsx`): startup order, providers, migrations, plugin setup, OTA init.
- **Presentation/pages** (`src/pages/*`): route-level composition and orchestration.
- **Context state layer** (`TransactionContext`, `UserContext`): global state contracts and mutation APIs.
- **Domain services** (`TransactionService`, `BudgetService`, analytics-related services): business rules and cross-entity operations.
- **Ingestion/parsing layer** (`SmsReaderService`, `SmsImportService`, `SmsProcessingService`, Smart Paste engine): collect, filter, parse, infer transaction data.
- **Persistence utilities** (`storage-utils`, `safe-storage`, template/keyword utilities): canonical storage operations and schema-ish defaults.
- **Native plugin boundary** (`src/plugins/*`, Android plugin classes): JS-native API contracts.
- **Observability/update layer** (`firebase-analytics`, `AppUpdateService`, error utils/boundaries): telemetry and runtime update management.

### 2.2 Dependency Boundaries (What can call what)
- Pages/components call context hooks and service facades.
- Context calls storage utilities directly.
- Service layer calls storage utilities and specialized helper libs (FX, parsing, analytics).
- Plugin wrappers are consumed by services/app bootstrap, not by deep presentation components (mostly respected).
- Native-only behavior guarded by `Capacitor.isNativePlatform()` checks.
- INFERRED (LOW CONFIDENCE): no strict architectural enforcement (e.g., lint layering rules) exists; boundaries are convention-based.

### 2.3 Key Interfaces / Services
- `TransactionContextType` for CRUD + summaries.
- `UserContextType` for auth/profile/preferences.
- `SmsReaderService` permission/read API.
- `SmsImportService.checkForNewMessages` orchestration API.
- `parseAndInferTransaction` inference contract returning confidence metadata.
- `AppUpdateService` OTA lifecycle API (`initialize`, `checkForUpdates`, `downloadUpdate`, `applyPendingBundle`).

## 3) Data Model & Storage
### 3.1 Core Entities (tables/objects)
Step 3: Data Model Extraction
- **Transaction**: rich object with amount/category/type/date/source plus FX snapshot (`baseCurrency`, `amountInBase`, `fxRateToBase`, `fxSource`, etc.) and transfer pairing (`transferId`, `transferDirection`).
- **Category** and **CategoryRule**: user/system categories and pattern-based mapping rules.
- **TransactionCategoryChange**: audit/history of category reclassification.
- **User/User preferences**: profile/auth/theme/currency/sms settings.
- **Smart Paste template + keyword banks**: learned parser structures and vendor/category mappings.
- **SMS sender import map**: per-sender import date watermark.

### 3.2 Persistence Mechanism (where data lives)
Primary persistence is local storage via `safeStorage` wrapper, with keys such as:
- `xpensia_transactions`
- `xpensia_categories`
- `xpensia_category_rules`
- `xpensia_user_settings`
- `xpensia_locale_settings`
- `xpensia_structure_templates`
- `xpensia_sms_sender_import_map`
Plus migration/OTA/session keys. Native queueing uses `safePreferences` for certain buffers.

### 3.3 Data Versioning / Migrations (if any)
- Migration runner tracks applied IDs in `xpensia_migrations_applied`.
- Separate one-off migrations exist for FX field backfill and currency code normalization.
- Risk: key mismatch (`transactions` vs `xpensia_transactions`) in some migration scripts may skip active data store.
- OPEN QUESTION: whether legacy key is still populated in production installs cannot be confirmed from code alone.

### 3.4 Data Integrity Rules (validation, dedupe, ids)
- Validation utilities enforce required fields before writes (`validateTransactionForStorage`, etc.).
- `storeTransaction` performs upsert by id; `addTransaction` prevents duplicate IDs.
- Transfer rules implemented in `TransactionService` (paired entries, signs, transfer IDs).
- Smart Paste confidence scoring and parse status provide soft validation before user confirmation.

## 4) Key Technical Flows
Step 4: Flow Tracing

### SMS background receive → parse draft → notification/deep link
- Trigger: Native SMS received while app is running/backgrounded.
- Steps:
  1. `BackgroundSmsListener` emits `smsReceived` in `AppWrapper`.
  2. Message filtered by `isFinancialTransactionMessage`.
  3. Parsed with `parseSmsMessage`; fallback navigates to manual edit if parse error.
  4. Draft transaction object assembled.
  5. If app active: navigate to `/edit-transaction`; else schedule local notification with payload.
  6. On notification tap, `parseAndInferTransaction` runs then navigates to `/edit-transaction` with confidence metadata.
- Data touched: transient navigation state, notification extras, generated `Transaction` object.
- Failure handling: parse errors route to manual review; notification parse failure navigates to import screen.
- Evidence: `src/App.tsx` (`setupSmsListener`, notification listener).

### Manual/auto SMS import → sender/date filtering → vendor mapping screen
- Trigger: startup auto-import or manual action invoking `SmsImportService.checkForNewMessages`.
- Steps:
  1. Import lock prevents concurrent runs.
  2. Determine sender scope and start date (sender watermark or permission date).
  3. Read SMS via `SmsReaderService.readSmsMessages`.
  4. Filter financial messages.
  5. Build `vendorMap` and `keywordMap` via suggestion engine.
  6. Navigate to `/vendor-mapping` with mapped payload.
- Data touched: sender import map keys, permission-date tracking keys, analytics events.
- Failure handling: catch/log and unlock in finally.
- Evidence: `src/services/SmsImportService.ts`, `src/services/SmsReaderService.ts`.

### Smart Paste parse/infer → confidence scoring → review screen
- Trigger: Smart Paste input from import UI or notification flow.
- Steps:
  1. `parseAndInferTransaction` parses structure.
  2. Computes field/template/keyword confidence and overall score.
  3. Assigns parse status by threshold (>=0.8 success, >=0.4 partial, else failed).
  4. Returns transaction + metadata to caller for review UI.
  5. Failed matched templates increment failure counters; optional failure logging by SMS ID.
- Data touched: template bank, keyword bank, parsing failure logs.
- Failure handling: confidence-based degradation and template failure accounting.
- Evidence: `src/lib/smart-paste-engine/parseAndInferTransaction.ts`.

### Edit transaction save → persistence + learning feedback
- Trigger: user saves in Edit Transaction page.
- Steps:
  1. `handleSave` calls `saveTransactionWithLearning` with add/update callbacks.
  2. Transaction persisted through context/storage path.
  3. If raw SMS context exists, learning engine captures template/keyword associations.
  4. Navigate back and show user feedback.
- Data touched: `xpensia_transactions`, template/keyword learning stores.
- Failure handling: save wrapper and error toasts/logging.
- Evidence: `src/pages/EditTransaction.tsx`, `src/utils/storage-utils.ts` (`learnFromTransaction`).

### Dashboard/analytics load → aggregate → render
- Trigger: landing on Home/Analytics pages.
- Steps:
  1. `TransactionContext` loads transactions from storage.
  2. Summary/grouping functions compute income/expense/balance and category/time groups.
  3. Analytics components/charts render derived datasets.
- Data touched: `xpensia_transactions` read only.
- Failure handling: route-level `ErrorBoundary` wrappers prevent full app crash.
- Evidence: `src/context/TransactionContext.tsx`, `src/App.tsx` route wrappers.

### Data export/import (CSV/JSON)
- Trigger: Settings → Data Management actions.
- Steps:
  1. Export: load stored transactions, convert to CSV, create blob, trigger browser download.
  2. Import: choose file, parse CSV/JSON, user confirms merge volume, append + store, reload app.
- Data touched: `xpensia_transactions`.
- Failure handling: destructive toast on parse/export errors.
- Evidence: `src/components/settings/DataManagementSettings.tsx`, `src/utils/csv.ts`.

## 5) Non-Functional Requirements (NFRs)
- Performance:
  - SMS read hard-capped at 2000 messages per fetch to avoid OOM in JSON serialization.
  - Startup defers non-critical OTA operations and uses timeouts to avoid blocking launch.
- Reliability:
  - `safeStorage` and `safePreferences` provide in-memory fallback on storage failures.
  - Import lock avoids duplicate concurrent SMS import jobs.
  - Global error handlers and route boundaries reduce fatal crash propagation.
- Offline-first behavior:
  - Core CRUD and analytics operate from local store without network.
  - Network-dependent features (Supabase auth, OTA manifest, vendor sync) degrade gracefully.
- Observability:
  - Firebase analytics events emitted for screen/actions/import/update flows.
  - Development logs include migration/SMS/OTA tracing.
- Accessibility (if visible in code):
  - OPEN QUESTION: no explicit accessibility auditing tooling/config was identified in scanned files.

## 6) Security & Privacy Notes
### 6.1 Data sensitivity classification
- Sensitive local data: transaction amounts, merchants, accounts, SMS message content, user profile fields.
- Moderate sensitivity: template/keyword learning banks (can encode merchant behavior).
- Telemetry: event metadata to Firebase analytics (extent depends on payloads).

### 6.2 Threats & mitigations
- Threat: unauthorized SMS ingestion or excessive permission scope.
  - Mitigation: explicit permission checks and request flows; non-native no-op behavior.
- Threat: data loss/corruption in local storage.
  - Mitigation: validation before writes, safe storage wrappers, migration flags.
- Threat: OTA supply-chain risk.
  - Mitigation: manifest version checks and pending-apply semantics exist; checksum field exists in interface but enforcement path is not fully evidenced.
- INFERRED (LOW CONFIDENCE): at-rest encryption for local transaction payloads is not present in scanned storage layer.

### 6.3 Permissions and platform considerations
- Android permissions declared: `READ_SMS`, `RECEIVE_SMS`, foreground service, internet/network state.
- Boot receiver and SMS receiver are registered for background workflow.
- Plugin permission aliases enforce runtime gating (`SmsReaderPlugin`, `BackgroundSmsListenerPlugin`).

## 7) Release Strategy
### 7.1 Environments (dev/test/prod)
- Dev/prod variants driven by Vite env variables (`VITE_*`) and feature flags.
- Test coverage via Vitest and Playwright exists.
- OPEN QUESTION: separate staging backend/project IDs are not explicitly represented in committed env config.

### 7.2 Versioning strategy
- `package.json` has app package version placeholder; runtime app version derived from native `App.getInfo()` and OTA bundle metadata.
- OTA manifest contains semver and URL; comparison logic normalizes `v` prefixes and partial semver.

### 7.3 Distribution (internal/closed/public)
- Native store distribution implied by Android package and Play Store URL in `public/update.xml`.
- OTA bundle distribution via hosted manifest/zip (`xpensia-505ac.web.app`) and Capgo updater.

### 7.4 Rollback strategy
- OTA strategy supports pending bundle application and built-in fallback when OTA fetch/apply fails.
- Store-level rollback not automated in repo; likely managed externally (OPEN QUESTION).

## 8) Architecture Decision Records (ADR Index)
- ADR-001: Local-first persistence as default
  - Decision: Keep transactions/categories/settings in local storage via storage utils.
  - Rationale: Fast offline UX and reduced backend dependency.
  - Consequences: Device-bound data unless user exports/imports; migration complexity.
  - Evidence: `src/context/TransactionContext.tsx`, `src/utils/storage-utils.ts`.
- ADR-002: Optional backend auth/profile sync
  - Decision: Gate Supabase features behind env flags/config checks.
  - Rationale: Allow standalone local operation and phased cloud rollout.
  - Consequences: Behavior divergence across deployments.
  - Evidence: `src/lib/env.ts`, `src/lib/supabase.ts`, `src/context/user/UserContext.tsx`.
- ADR-003: Native SMS plugin split (reader + listener)
  - Decision: Separate historical read from background receive plugins.
  - Rationale: Distinct permission/runtime concerns.
  - Consequences: More integration points and lifecycle coordination.
  - Evidence: `src/plugins/SmsReaderPlugin.ts`, `src/plugins/BackgroundSmsListenerPlugin.ts`, `src/App.tsx`.
- ADR-004: Smart Paste confidence-gated review
  - Decision: Parse and infer but route user through edit confirmation.
  - Rationale: Balance automation with financial data correctness.
  - Consequences: Extra user step, higher data trust.
  - Evidence: `src/lib/smart-paste-engine/parseAndInferTransaction.ts`, `src/pages/ImportTransactions.tsx`.
- ADR-005: Transfer as dual-entry records
  - Decision: Represent transfer as two linked transactions with shared `transferId`.
  - Rationale: Preserve accounting semantics and account-level reporting.
  - Consequences: CRUD logic must maintain pair consistency.
  - Evidence: `src/types/transaction.ts`, `src/services/TransactionService.ts`.
- ADR-006: OTA updates with deferred apply on background
  - Decision: Use Capgo updater and apply pending bundle when app backgrounds.
  - Rationale: Avoid disruptive foreground reload.
  - Consequences: Update visible after lifecycle transition.
  - Evidence: `src/App.tsx`, `src/services/AppUpdateService.ts`, `capacitor.config.ts`.
- ADR-007: Storage fallbacks over hard failures
  - Decision: Use `safeStorage`/`safePreferences` with memory fallback and warning toast.
  - Rationale: Maintain app continuity under storage exceptions.
  - Consequences: Data may be ephemeral in fallback mode.
  - Evidence: `src/utils/safe-storage.ts`.
- ADR-008: Import size safety cap for SMS reads
  - Decision: Cap native SMS fetch limit at 2000.
  - Rationale: Prevent OOM from huge payload serialization.
  - Consequences: Large inboxes require segmented import windows.
  - Evidence: `src/services/SmsReaderService.ts`.

## 9) Evidence Appendix
- Bootstrap & app composition → `src/main.tsx` (`AppWithLoader`, `setupGlobalErrorHandlers`), `src/App.tsx` (`App`, `AppRoutes`, `AppWrapper`).
- Routing/navigation map → `src/App.tsx` route declarations.
- Global state and storage sync → `src/context/TransactionContext.tsx` (`TransactionProvider`), `src/context/user/UserContext.tsx` (`UserProvider`).
- Entity schema contracts → `src/types/transaction.ts` (`Transaction`, `Category`, `CategoryRule`).
- Persistence keys and storage APIs → `src/utils/storage-utils.ts` (storage key constants and CRUD helpers), `src/utils/safe-storage.ts`.
- SMS read/listen permissions and flows → `src/services/SmsReaderService.ts`, `src/services/SmsImportService.ts`, `src/App.tsx`, `src/plugins/*`, `android/app/src/main/AndroidManifest.xml`.
- Smart Paste inference and confidence model → `src/lib/smart-paste-engine/parseAndInferTransaction.ts`.
- Learning feedback loop → `src/utils/storage-utils.ts` (`learnFromTransaction`).
- Export/import data management → `src/components/settings/DataManagementSettings.tsx`, `src/utils/csv.ts`.
- Migrations/versioning concerns → `src/utils/migration/runMigrations.ts`, `src/utils/migration/migrateFxFields.ts`, `src/utils/migration/fixCurrencyCodes.ts`.
- OTA and release pipeline → `src/services/AppUpdateService.ts`, `capacitor.config.ts`, `scripts/publish-capgo.sh`, `public/manifest.json`, `public/update.xml`.
- Native plugin registration → `android/app/src/main/java/app/xpensia/com/MainActivity.java`, `android/app/src/main/res/xml/plugins.xml`.
