# Phase 5 Pack — Development Execution (Reverse-Engineered)

**Shipping target:** Closed testing on Play Store (provided by stakeholder).

## 1) Current State Snapshot (Verified in Code)

### App shell, routing, initialization
- App boots through `AppWithLoader`, initializes storage defaults, migrations, demo seeding, global error handlers, and background vendor sync before rendering. — Evidence: `src/main.tsx` (`AppWithLoader`, `initializeXpensiaStorageDefaults`, `runMigrations`, `demoTransactionService.seedDemoTransactions`, `backgroundVendorSyncService.initialize`).
- App registers global `unhandledrejection` and `window.error` handlers that pass through `handleError`. — Evidence: `src/main.tsx` (`setupGlobalErrorHandlers`).
- Capacitor initialization is attempted before React mount; failures are swallowed in non-dev modes. — Evidence: `src/main.tsx` (`initializeCapacitor` invocation wrapper).
- Native-only Firebase Analytics enablement + device ID user binding exists on app launch. — Evidence: `src/main.tsx` (`FirebaseAnalytics.enable`, `Device.getId`, `setUserId`).
- Routing is React Router based with an explicit page map for Home, Transactions, Analytics, Profile, Onboarding, Import/Edit, Smart-Paste training, SMS flows, budget flows, Settings, Exchange rates, and About. — Evidence: `src/App.tsx` (`AppRoutes`).
- Most major pages are wrapped with `ErrorBoundary` at route-level. — Evidence: `src/App.tsx` (`<ErrorBoundary name=...>` wrappers).

### Core transaction data path
- Transactions are managed by `TransactionContext` and persisted in local storage via `storage-utils`. — Evidence: `src/context/TransactionContext.tsx` (`getStoredTransactions`, `storeTransactions`).
- `addTransaction`/`addTransactions`/`updateTransaction` ensure FX fields via `ensureFxFields` before persistence. — Evidence: `src/context/TransactionContext.tsx` (`ensureFxFields` in CRUD methods).
- Summary and grouping helpers exist in context for income/expense/balance/category/time. — Evidence: `src/context/TransactionContext.tsx` (`getTransactionsSummary`, `getTransactionsByCategory`, `getTransactionsByTimePeriod`).
- `processTransactionsFromSMS` in context is currently mock logic with random amounts and placeholder values. — Evidence: `src/context/TransactionContext.tsx` (`// This is a mock implementation`).
- Storage layer dispatches synthetic `StorageEvent` after writes for sync behavior. — Evidence: `src/utils/storage-utils.ts` (`storeTransactions`, `window.dispatchEvent(new StorageEvent(...))`).
- Single-transaction storage path validates payloads through `validateTransactionForStorage`. — Evidence: `src/utils/storage-utils.ts` (`storeTransaction`).
- Another `updateTransaction` function bypasses validation and writes directly to `xpensia_transactions`. — Evidence: `src/utils/storage-utils.ts` (`updateTransaction` function docstring + implementation).

### Capture/import → parse/infer → review/edit
- Manual import entry page is wired to `SmartPaste` and navigates to `/edit-transaction` with parsing metadata. — Evidence: `src/pages/ImportTransactions.tsx` (`handleTransactionsDetected`, `navigate('/edit-transaction', { state: ... })`).
- `SmartPaste` blocks non-financial messages before parsing and surfaces toast feedback. — Evidence: `src/components/SmartPaste.tsx` (`isFinancialTransactionMessage` gate).
- Smart parsing uses `parseAndInferTransaction` (template + structure + inference + confidence). — Evidence: `src/components/SmartPaste.tsx` (`await parseAndInferTransaction(...)`).
- Confidence and match origin are propagated to edit flow and used for UX messaging. — Evidence: `src/components/SmartPaste.tsx` (`setConfidence`, `setMatchOrigin`, `onTransactionsDetected`).
- Failed repeated template parses trigger train-model redirection after threshold. — Evidence: `src/components/SmartPaste.tsx` (`getTemplateFailureCount`, `if (failCount >= 3) navigate('/train-model...')`).
- Parsing pipeline constructs a transaction, computes field/template/keyword scores, and classifies status (`success/partial/failed`). — Evidence: `src/lib/smart-paste-engine/parseAndInferTransaction.ts` (`computeOverallConfidence`, `parsingStatus`).
- Template failure counters increment when template matched but parse fails. — Evidence: `src/lib/smart-paste-engine/parseAndInferTransaction.ts` (`incrementTemplateFailure` branch).
- Structure parser supports template hash matching, inferred fields, and date normalization. — Evidence: `src/lib/smart-paste-engine/structureParser.ts` (`getTemplateByHash`, `inferIndirectFields`, `normalizeDate`).

### SMS native ingestion and permission flows
- Background SMS listener setup runs in app wrapper for native platforms, checks permission, starts listening, and handles `smsReceived`. — Evidence: `src/App.tsx` (`setupSmsListener`, `BackgroundSmsListener.addListener('smsReceived', ...)`).
- Incoming SMS is filtered by financial relevance and parsed via legacy `parseSmsMessage` before edit navigation/notification fallback. — Evidence: `src/App.tsx` (`isFinancialTransactionMessage`, `parseSmsMessage` from `@/lib/sms-parser`).
- Notification tap handler reparses message with `parseAndInferTransaction` and navigates to edit with confidence metadata. — Evidence: `src/App.tsx` (`LocalNotifications.addListener('localNotificationActionPerformed', ...)`).
- SMS auto-import trigger exists and can run based on user preferences with permission-date lookback. — Evidence: `src/App.tsx` (`SmsImportService.checkForNewMessages(...usePermissionDate: true)`).
- Canonical SMS permission orchestration service exists with combined checks (reader + listener), request serialization, timeout/polling strategy, and grant-date tracking. — Evidence: `src/services/SmsPermissionService.ts` (`combinePermissionStatuses`, `requestPermission`, `setSmsPermissionGrantDate`).
- SMS import service has import lock, filtering, sender map, optional auto prompt, and route handoff to vendor mapping. — Evidence: `src/services/SmsImportService.ts` (`importLock`, `isFinancialTransactionMessage`, `navigate('/vendor-mapping', ...)`).

### Dashboard/reporting and budgets
- Home dashboard provides range filtering, FX-aware totals/charts, and unconverted FX warnings. — Evidence: `src/pages/Home.tsx` (`AnalyticsService.getFxAwareTotals`, `UnconvertedWarningBanner`, chart components).
- Dedicated analytics page and budget pages are routed and implemented in main route table. — Evidence: `src/App.tsx` (`/analytics`, `/budget*` routes).
- Analytics event taxonomy exists in docs and runtime logging utility usage appears across pages. — Evidence: `docs/ANALYTICS_EVENTS.md`, `src/utils/firebase-analytics.ts`, `src/pages/Home.tsx` (`logFirebaseOnlyEvent`).

### Export/backup, migration, OTA
- Settings supports CSV export (web download or native Documents write) and JSON/CSV import merge flow. — Evidence: `src/pages/Settings.tsx` (`handleExportData`, `handleImportData`).
- Startup migrations include currency code fix and FX field migration; expired FX cache cleanup also runs. — Evidence: `src/App.tsx` (`fixCorruptedCurrencyCodes`, `migrateFxFields`, `cleanExpiredRates`).
- OTA updater service initialized on startup; pending bundle applied on app background. — Evidence: `src/App.tsx` (`appUpdateService.initialize`, `hasPendingBundle`, `applyPendingBundle`).
- Capacitor config has Capgo updater endpoint and native plugin toggles for SMS listener/reader + Firebase Analytics. — Evidence: `capacitor.config.ts` (`plugins` config).

### Build/release and test assets
- Android release signing config and minified release build are configured (`versionCode 6`, `versionName 1.0.6`). — Evidence: `android/app/build.gradle` (`signingConfigs.release`, `buildTypes.release`).
- Playwright E2E test suite exists for CRUD, budgets, analytics, transfer flow, settings, smart paste, and error handling. — Evidence: `e2e/*.spec.ts`, `playwright.config.ts`.
- Unit/integration tests exist (Vitest) across context, storage, parser, and smart-paste engine modules. — Evidence: `src/context/__tests__`, `src/lib/smart-paste-engine/__tests__`, `src/utils/__tests__`.

### Multiple implementations / legacy paths
- `src/lib/sms-parser.ts` (regex parser) and `src/lib/smart-paste-engine/*` (template/structure parser) both exist and are both active in different flows. — Evidence: `src/App.tsx` imports legacy parser; `src/components/SmartPaste.tsx` uses smart-paste parser.
- `src/context/UserContext.tsx` is compatibility re-export to `src/context/user/UserContext.tsx`. — Evidence: `src/context/UserContext.tsx` (re-export comments).
- Several pages exist but are not routed in `AppRoutes` (e.g., `ImportTransactionsNER`, `SmsProviderSelection`, `KeywordBankManager`). — Evidence: `src/pages/*.tsx` presence vs `src/App.tsx` route list.

## 2) Gap Analysis to Shippable MVP

### 2.1 Missing
- Crash reporting backend integration is missing; critical path only comments “could also send to error reporting service”. — Evidence: `src/utils/error-utils.ts` (`For critical errors, could also send...`).
- No explicit offline-safe backup restore integrity checks (hash/checksum/versioned backup metadata) on import. — Evidence: `src/pages/Settings.tsx` (`handleImportData` merges raw parsed array directly).
- No visible Play closed-testing build automation script (assemble + upload) in repo scripts. — Evidence: `package.json` scripts, `android` folder (OPEN QUESTION: CI may handle externally).
- Route-level access controls/feature gating for admin-like pages are not centralized (OPEN QUESTION for release policy). — Evidence: `src/App.tsx` direct route exposure.

### 2.2 Partial / Unreliable
- Background static SMS receiver currently logs messages but does not persist/forward due commented-out processing lines. — Evidence: `capacitor-background-sms-listener/.../SmsBroadcastReceiver.java` (commented `persistMessage` and service start).
- Context SMS processing method is still mock/random and should not be used in production path. — Evidence: `src/context/TransactionContext.tsx` (`mock implementation`, random amount generation).
- Two transaction update code paths have inconsistent validation guarantees (`storeTransaction` validated vs `updateTransaction` non-validated). — Evidence: `src/utils/storage-utils.ts`.
- Import merge path accepts any array and casts to `any` without per-item validation prior to store. — Evidence: `src/pages/Settings.tsx` (`const merged = [...existing, ...(data as any[])]`).
- SMS parsing architecture is split between legacy regex parser and smart-paste parser, increasing inconsistent outcomes across entry points. — Evidence: `src/App.tsx` vs `src/components/SmartPaste.tsx` parser imports.
- Auto-import prompt uses `window.confirm`, which is brittle UX on mobile webview and hard to standardize. — Evidence: `src/services/SmsImportService.ts` (`window.confirm(...)`).
- Supabase defaults to placeholder URL/key if env missing, masking misconfiguration in staging runs. — Evidence: `src/lib/supabase.ts` (placeholder fallback constants).
- Background SMS setup and notification listeners are dense inside `App.tsx`, increasing lifecycle complexity/risk for leaks and regressions. — Evidence: `src/App.tsx` (`AppWrapper` long effect chains).
- Logging noise includes plain `console.log` in some production paths (not consistently dev-gated). — Evidence: `src/App.tsx` (`console.log('[App] SMS prompt check...')`).

### 2.3 Tech Debt That Blocks Release (must-fix)
- **Release blocker:** Static receiver path appears incomplete (no persistence/foreground service call), risking missed SMS when app/plugin inactive. — Evidence: `SmsBroadcastReceiver.java` commented processing.
- **Release blocker:** Data import bypasses transaction validation, risking corrupt local dataset in closed testing. — Evidence: `src/pages/Settings.tsx` import path + `storeTransactions` call.
- **Release blocker:** Inconsistent parser usage across background listener vs SmartPaste may produce conflicting transaction extraction behavior. — Evidence: `src/App.tsx` legacy parser + `SmartPaste.tsx` smart parser.
- **Release blocker:** No production crash telemetry sink makes closed-test crash triage weak. — Evidence: `src/utils/error-utils.ts` TODO-like comment for critical reporting.

### 2.4 Nice-to-have (explicitly not required for MVP)
- Route cleanup for unrouted utility pages (`ImportTransactionsNER`, `SmsProviderSelection`, `KeywordBankManager`). — Evidence: `src/pages/*` vs `src/App.tsx`.
- Consolidate duplicated context wrappers and deprecated files beyond compatibility exports. — Evidence: `src/context/UserContext.tsx` compatibility note.
- Replace all `window.confirm`/manual dialogs with unified design-system dialogs. — Evidence: `src/services/SmsImportService.ts`, `src/pages/Settings.tsx`.
- Extend analytics events to include parser confidence distributions for product tuning. — Evidence: current logging mostly event-level in `src/components/SmartPaste.tsx` and settings/home.

## 3) Implementation Plan (Milestones)

### Milestone 1: Stabilize core data integrity and parsing consistency
- Objective:
  - Ensure imported/saved transactions are consistently validated and parsing behavior is deterministic across all ingestion points.
- Tasks (ordered):
  - T-1: Introduce a single transaction write facade (validated) and route all write operations (`storeTransaction`, context updates, settings import merge) through it.
  - T-2: Add import sanitation/validation pipeline before merge (reject + report invalid rows).
  - T-3: Align background SMS parse path to `parseAndInferTransaction` (or document/retain legacy parser behind explicit flag).
  - T-4: Remove or deprecate mock SMS processing path in `TransactionContext` from production call sites.
- Dependencies:
  - Existing validators in `storage-utils-fixes`; smart-paste parser contract.
- Risk & mitigation:
  - Risk: Regression in edit flow navigation state. Mitigation: Keep output transaction schema same and verify with smoke flows.
- Verification (how we prove it works):
  - Manual: Import malformed + valid CSV/JSON and verify only valid rows persist.
  - Automated: Existing parser/storage tests + add targeted tests for import validation path.
  - E2E: Run transaction CRUD + smart-paste spec.
- T-shirt size (S/M/L/XL):
  - **L**

### Milestone 2: Harden SMS permission/background ingestion for closed testing
- Objective:
  - Ensure SMS background ingestion is reliable on Android in realistic lifecycle states.
- Tasks (ordered):
  - T-1: Complete static receiver behavior (persist queued messages and flush when app resumes/plugin loads).
  - T-2: Verify manifest/receiver export flags and Android 13+ permission behaviors.
  - T-3: Refactor `AppWrapper` SMS listener setup into isolated service/module with explicit lifecycle hooks.
  - T-4: Replace `window.confirm` auto-import prompts with app dialog component for consistent UX.
- Dependencies:
  - Native plugin module (`capacitor-background-sms-listener`), `SmsPermissionService`, `SmsImportService`.
- Risk & mitigation:
  - Risk: OEM-specific SMS restrictions. Mitigation: Build device matrix in closed test cohort + capture device metadata in logs.
- Verification (how we prove it works):
  - On-device smoke: grant/deny/permanent-deny flows, background receive, notification tap deep-link.
  - Logs: verify queued message delivery after app cold start.
  - E2E/web fallback: ensure graceful no-crash behavior on web.
- T-shirt size (S/M/L/XL):
  - **XL**

### Milestone 3: Closed-testing observability and operational readiness
- Objective:
  - Add enough telemetry + release mechanics to triage issues during Play closed test.
- Tasks (ordered):
  - T-1: Integrate crash reporting sink (e.g., Firebase Crashlytics via Capacitor/native bridge or equivalent).
  - T-2: Standardize error event schema (fatal/non-fatal, flow step, parser confidence context).
  - T-3: Add lightweight “health” diagnostics in Settings/About (app version, plugin status, permission status).
  - T-4: Finalize closed-test build metadata and changelog discipline (version bumps, branch policy).
- Dependencies:
  - Existing `handleError` system, Firebase setup, Android versioning.
- Risk & mitigation:
  - Risk: telemetry adds noise/PII. Mitigation: redact raw SMS content from crash events; log only hashes/metadata.
- Verification (how we prove it works):
  - Force-test non-fatal + fatal reporting in internal build.
  - Confirm versionName/versionCode increments reflected in app and artifacts.
- T-shirt size (S/M/L/XL):
  - **M**

### Milestone 4: UX polish and release-quality hardening of core value path
- Objective:
  - Deliver stable MVP for flow: capture/import → parse/infer → review/edit → save → dashboard/report → export/backup.
- Tasks (ordered):
  - T-1: Resolve high-friction UX points in edit/review flow (errors, empty states, confidence display consistency).
  - T-2: Verify dashboard/report computations for transfers and FX edge cases.
  - T-3: Validate export/import round-trip and rollback messaging.
  - T-4: Freeze scope; only bug fixes and instrumentation improvements.
- Dependencies:
  - Milestones 1–3.
- Risk & mitigation:
  - Risk: hidden regressions in multi-currency totals. Mitigation: targeted regression matrix over sample datasets.
- Verification (how we prove it works):
  - Playwright smoke subset + manual exploratory on Android test devices.
  - No P0/P1 crash/data-loss defects open at milestone exit.
- T-shirt size (S/M/L/XL):
  - **M**

## 4) Definition of Done (DoD)

### 4.1 Global DoD (applies to all work)
- Code path has clear owner module and no duplicated active logic for same responsibility.
- All new writes to persistent transaction storage pass validation before commit.
- Error handling uses structured `AppError` with severity and user-safe messaging.
- No raw sensitive payloads (full SMS bodies) in production analytics/crash logs.
- Feature has verification evidence (unit/integration or e2e where practical + manual notes for native-only flows).
- Any migration/state change is backward-compatible with existing local storage data.
- Docs updated (ADR or changelog entry) for non-trivial technical decisions.

### 4.2 Feature DoD (core flows)
- **Capture/Import:** User can import via SmartPaste/SMS without crash; invalid content is rejected with clear guidance.
- **Parse/Infer:** Parser returns stable transaction object + confidence metadata; low-confidence paths are reviewable/editable.
- **Review/Edit:** User can correct all critical fields (amount, type, category, account, date) and save once.
- **Save:** Saved transaction persists across app restart and appears in Transactions/Home.
- **Dashboard/Report:** Totals/charts reflect saved data accurately, including transfer/FX handling.
- **Export/Backup:** Export succeeds (web/native), and import performs validated merge with clear result summary.

## 5) Coding Standards & Conventions (Project-Specific)

### 5.1 Repo structure & naming
- Keep page-level orchestration in `src/pages/*`; reusable UI in `src/components/*`; logic in `src/services/*` and `src/lib/*`.
- Preserve existing file headers with responsibilities/checklist blocks for maintainability.
- Use `PascalCase` for React components, `camelCase` for functions/variables, and `SCREAMING_SNAKE_CASE` for constants.

### 5.2 Components & UI patterns
- Pages should remain thin: delegate complex business logic to hooks/services.
- Route screens should use `ErrorBoundary` wrappers for resilience.
- Favor existing design system components (`@/components/ui/*`) over ad-hoc DOM dialogs.

### 5.3 Services & business logic placement
- Services orchestrate IO/platform actions (SMS, OTA, analytics).
- Parsing and inference belongs to `lib/smart-paste-engine/*`; avoid duplicating parse heuristics elsewhere.
- Native bridge interaction should be isolated behind service boundaries.

### 5.4 State management rules
- Global user state via `UserContext`; transaction list state via `TransactionContext`.
- Keep derived data memoized at page level (`useMemo`) for expensive analytics computations.
- Avoid duplicating source-of-truth state in page + context unless derived.

### 5.5 Storage rules (single writer, schema versioning, validation)
- Adopt single writer interface for transaction writes; deprecate bypass functions.
- Validate every transaction entering persistent store (`validateTransactionForStorage` class of validators).
- Introduce lightweight schema/version marker for imports and migration idempotency checks.
- Dispatch storage sync events only through standardized storage utilities.

### 5.6 Error handling & logging
- Use `createError`/`handleError` consistently.
- `console.*` usage in production code should be dev-gated except intentional diagnostics with redaction.
- Critical errors must send to crash reporting sink (to be added in Milestone 3).

### 5.7 Performance guardrails
- Keep transaction aggregation memoized and scoped by filters.
- Avoid repeated native permission checks in tight loops (follow `SmsPermissionService` in-flight guards).
- For large imports, validate in chunks and avoid blocking UI thread.

### 5.8 Security/privacy guardrails
- Never log full SMS body in analytics/crash reporting.
- Treat phone numbers and sender IDs as sensitive metadata; hash or truncate where possible.
- Keep export files user-initiated and local; no implicit cloud sync without explicit consent.

## 6) Architecture Decision Records (ADRs)

### ADR-001: Use local-first storage as primary MVP persistence
- Status: Accepted
- Context:
  - Existing app persists transactions and preferences in local storage with sync events.
- Decision:
  - Keep local-first persistence for MVP and closed testing; cloud sync remains optional feature-flagged.
- Alternatives considered:
  - Supabase-first online persistence.
- Consequences:
  - Faster offline UX; must harden import/validation/migration to prevent local corruption.
- Evidence:
  - `src/context/TransactionContext.tsx`, `src/utils/storage-utils.ts`, `src/lib/env.ts`.

### ADR-002: Standardize parser entrypoint to smart-paste engine
- Status: Proposed
- Context:
  - Two active SMS parser implementations create inconsistent behavior.
- Decision:
  - Promote `parseAndInferTransaction` as canonical parser; legacy regex parser retained only as explicit fallback.
- Alternatives considered:
  - Keep both active by flow (status quo).
- Consequences:
  - Reduced divergence; requires migration and compatibility adapters in background listener flow.
- Evidence:
  - `src/App.tsx`, `src/components/SmartPaste.tsx`, `src/lib/sms-parser.ts`, `src/lib/smart-paste-engine/parseAndInferTransaction.ts`.

### ADR-003: Enforce validated single-writer storage interface
- Status: Proposed
- Context:
  - Direct update path bypasses validators.
- Decision:
  - All transaction writes must call validated storage facade; disallow direct localStorage mutation.
- Alternatives considered:
  - Keep mixed validated/unvalidated paths.
- Consequences:
  - Better data integrity; requires touching multiple call sites.
- Evidence:
  - `src/utils/storage-utils.ts` (`storeTransaction` vs `updateTransaction`), `src/pages/Settings.tsx` import merge.

### ADR-004: Harden background SMS reliability with persisted queue
- Status: Proposed
- Context:
  - Static receiver does not currently persist/forward messages in inactive plugin state.
- Decision:
  - Implement durable queue in plugin receiver path and deliver on app resume/plugin load.
- Alternatives considered:
  - Rely solely on foreground listener.
- Consequences:
  - Better delivery reliability; requires native plugin update + validation.
- Evidence:
  - `capacitor-background-sms-listener/.../SmsBroadcastReceiver.java`, `BackgroundSmsListenerPlugin.java`.

### ADR-005: Introduce crash telemetry before closed test expansion
- Status: Proposed
- Context:
  - Error handler currently logs/toasts without backend sink.
- Decision:
  - Integrate crash reporting and map `AppError` severity to telemetry event levels.
- Alternatives considered:
  - Manual bug reporting only during closed test.
- Consequences:
  - Better triage and prioritization; must enforce PII redaction.
- Evidence:
  - `src/utils/error-utils.ts`, `src/main.tsx` global handlers.

### ADR-006: Keep OTA updates enabled with safe apply-on-background policy
- Status: Accepted
- Context:
  - OTA system already initialized and pending bundles applied only when app backgrounds.
- Decision:
  - Retain this policy to minimize session disruption.
- Alternatives considered:
  - Immediate in-session update apply.
- Consequences:
  - Better user continuity; delayed rollout effect per session lifecycle.
- Evidence:
  - `src/App.tsx`, `capacitor.config.ts` (`CapacitorUpdater`).

### ADR-007: Closed testing release discipline via branch + semantic build increments
- Status: Proposed
- Context:
  - Android build metadata exists; release process details are not codified in repo.
- Decision:
  - Use release branches and mandatory versionCode/versionName bump per closed-test drop.
- Alternatives considered:
  - Ad hoc versioning from main.
- Consequences:
  - Predictable rollouts/rollback; requires process enforcement.
- Evidence:
  - `android/app/build.gradle` (`versionCode`, `versionName`).

### ADR-008: Keep Supabase optional behind explicit runtime flags
- Status: Accepted
- Context:
  - Supabase auth/client has env-based enablement and placeholder fallback.
- Decision:
  - Maintain optional mode for MVP, but require configuration checks in staging/closed test.
- Alternatives considered:
  - Force-enable Supabase in all environments.
- Consequences:
  - Flexible deployments; risk of silent placeholder usage if not monitored.
- Evidence:
  - `src/lib/env.ts`, `src/lib/supabase.ts`, `src/context/user/UserContext.tsx`.

## 7) Branching, Versioning & Change Log

### 7.1 Branch strategy (main/dev/release/hotfix)
- `main`: production-ready code only.
- `dev`: integration branch for upcoming closed-test release.
- `release/x.y.z-rcN`: stabilization branch for Play closed test candidate.
- `hotfix/x.y.z+1`: urgent fixes from closed-test feedback.

### 7.2 Versioning rules
- Android `versionCode`: increment every distributable artifact.
- `versionName`: semantic format `MAJOR.MINOR.PATCH`.
- Closed testing cadence:
  - Feature additions bump MINOR.
  - Bugfix-only drops bump PATCH.
- OTA bundle version should align with app compatibility constraints.

### 7.3 Change log template (keep short)
```markdown
## [x.y.z] - YYYY-MM-DD
### Added
- ...

### Changed
- ...

### Fixed
- ...

### Known Issues
- ...
```

## 8) Evidence Appendix
- Claim: App initializes defaults + migrations + demo data + sync services before render → `src/main.tsx` → `AppWithLoader.initialize`.
- Claim: Rich route map covers core/budget/settings flows → `src/App.tsx` → `AppRoutes`.
- Claim: SMS listener + notification tap pipelines are active in app wrapper → `src/App.tsx` → `setupSmsListener`, `localNotificationActionPerformed`.
- Claim: Transactions persist through storage utils and emit storage events → `src/context/TransactionContext.tsx`, `src/utils/storage-utils.ts` → CRUD helpers + `storeTransactions`.
- Claim: Mock SMS processing remains in transaction context → `src/context/TransactionContext.tsx` → `processTransactionsFromSMS` comment.
- Claim: SmartPaste uses confidence-driven parser pipeline → `src/components/SmartPaste.tsx`, `src/lib/smart-paste-engine/parseAndInferTransaction.ts`.
- Claim: Legacy parser still used in some active paths → `src/App.tsx` (`@/lib/sms-parser` import), `src/lib/sms-parser.ts`.
- Claim: SMS permission orchestration has combined checks/request serialization → `src/services/SmsPermissionService.ts`.
- Claim: SMS import orchestration includes lock + sender filtering + vendor mapping handoff → `src/services/SmsImportService.ts`.
- Claim: Static receiver incomplete for background delivery path → `capacitor-background-sms-listener/.../SmsBroadcastReceiver.java` (commented processing lines).
- Claim: Export/import exists but import lacks strict per-item validation before merge → `src/pages/Settings.tsx` (`handleExportData`, `handleImportData`).
- Claim: Crash sink not implemented in error handler → `src/utils/error-utils.ts` (`critical errors could also send...`).
- Claim: OTA updater is configured and initialized with apply-on-background behavior → `capacitor.config.ts`, `src/App.tsx`.
- Claim: Closed-test build metadata is present (`versionCode/versionName` + release signing) → `android/app/build.gradle`.
- Claim: E2E breadth exists for major flows → `playwright.config.ts`, `e2e/*.spec.ts`.
