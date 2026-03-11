# Xpensia Demand Pack (Reverse-Engineered)

**Version:** v0.1  
**Date:** 2026-02-17  
**Author:** Codex

## 1) Demand Brief

### 1. Problem Statement
Users who receive financial transaction SMS alerts struggle to maintain a complete, up-to-date view of personal finances because manual expense logging is slow, inconsistent, and easy to abandon. The current app implementation indicates a core intent to automate transaction capture from SMS, then let users review/edit results before analysis, which suggests the product is designed to reduce logging friction while preserving user control over data quality. This is reinforced by SMS parsing, background SMS listener setup, and edit flows that route users to transaction review when parsing is uncertain. The product also appears to target broader money management beyond logging: dashboard summaries, analytics, budgeting routes, and exchange-rate handling indicate a need for multi-dimensional financial visibility (spend trends, category breakdowns, balance, budget performance) rather than simple bookkeeping.

### 2. Who Has This Problem (Personas)
**Primary Persona: Mobile-first salaried user with frequent card/bank SMS alerts (inferred).** This user needs passive capture of expenses/income and quick confirmation, especially when on the go. Evidence: Android SMS listener permission flows, local notifications for detected transactions, and onboarding flow that prompts SMS permissions.

**Secondary Persona: Financially engaged user who wants insights and controls (inferred).** This user is likely to classify/edit transactions, inspect trends, and monitor budget/accounts. Evidence: dedicated analytics and budget routes, transaction editing pages, vendor categorization/mapping flows, and model-training/custom parsing pages.

**Tertiary Persona: Multi-currency or cross-border spender (inferred).** This user needs consistent reporting in a base currency and visibility into unconverted transactions. Evidence: FX migration logic, exchange-rate page, and dashboard unconverted-warning behavior.

### 3. Current Workarounds & Why They Fail
1. **Manual transaction entry only** fails because it introduces delay and omissions; the app already includes import, auto-parse, and edit-review paths that imply manual-only mode is insufficient for sustained use.
2. **Bank app hopping / SMS inbox scanning** fails because it lacks consolidated categorization and trend reporting; the app’s home dashboard and analytics pages exist to aggregate this fragmented data.
3. **Spreadsheet tracking** (assumption) fails in mobile contexts due to high effort for classification, correction, and currency normalization; in-app vendor mapping, categorization, and FX utilities suggest these are recurring pain points.
4. **Unstructured note-taking** (assumption) fails because it cannot support budget workflows or reliable weekly/monthly analytics.

### 4. Proposed Solution (High Level)
Build/continue a cross-platform personal finance app (web + mobile shell) that combines:
- **Automated ingestion:** Parse incoming and imported SMS messages into draft transactions.
- **Human-in-the-loop validation:** Route uncertain parses to edit/review screens, preserving user trust.
- **Unified transaction model:** Store transactions with type, category, account context, date, currency, and metadata for downstream analytics.
- **Insight layer:** Home dashboard + analytics with timeline/category/subcategory trends and net balance.
- **Money planning layer:** Budget hub, account management, budget detail/report/insights pages.
- **Data quality layer:** Vendor processing/categorization/mapping and optional model-training/custom parsing tooling.
- **FX resilience:** Base-currency reporting, cache/migration support, and clear surfacing of unconverted records.

### 5. Scope (In) / Scope (Out)
**Scope (In)**
- SMS-driven transaction detection/parsing for supported mobile environments.
- Transaction review/edit/confirmation workflows.
- Dashboard + analytics summaries and trend exploration.
- Budget and account modules currently represented in route structure.
- User onboarding/profile/settings and app update prompts.
- FX-aware totals and exchange-rate management UX.

**Scope (Out)**
- Full bank-account API integrations/open-banking connections (no direct evidence in routing/core flow).
- Guaranteed iOS SMS auto-read parity (assumption based on Android-specific SMS plugin config).
- Fully autonomous categorization without user correction (current design shows review/categorization tools).
- Back-office operations tooling for enterprise finance teams.
- Tax filing/compliance features.

### 6. Value Hypothesis (Why This Will Work)
If users can capture most transactions passively from SMS and correct only edge cases, then activation and ongoing engagement will improve because the app reduces effort at the moment of financial events. Adding clear analytics and budget modules should increase repeat usage by converting raw transaction data into decisions (where money is going, whether spending aligns to budgets). FX-aware handling and visible warnings for unconverted data should preserve trust in totals for users with mixed currencies. Finally, explicit review/edit loops and vendor mapping should improve data quality over time, making insights progressively more useful.

### 7. Risks & Unknowns
- **Permission friction risk:** SMS permissions may reduce activation on Android.
- **Platform asymmetry risk:** If SMS auto-capture is Android-first, value proposition may differ by platform.
- **Parser precision risk:** Misclassification or extraction errors can reduce trust.
- **Cold-start data risk:** Users without enough SMS history may not reach first-value quickly.
- **FX coverage risk:** Missing/stale rates can undermine dashboard totals.
- **Complexity risk:** Too many advanced flows (training/template/vendor mapping) could overwhelm mainstream users unless progressively disclosed.
- **Backend dependency risk (assumption):** Cloud function reliance for advanced inference may affect reliability/latency offline.

### 8. OPEN QUESTIONS
1. Which persona is priority at launch: passive SMS auto-capture users, budgeting power users, or both equally?
2. What is the target geography and dominant banks/SMS formats for v1 parsing quality?
3. Is iOS expected to have equivalent auto-ingestion, or a different primary ingestion path?
4. Are budget features in MVP success criteria, or phase-2 after core capture + analytics stabilization?
5. What minimum classification accuracy is acceptable before broad release?
6. What offline behavior is required for parsing, editing, and analytics views?
7. What privacy promise is explicit to users (on-device only vs cloud-assisted parsing)?
8. Which north-star metric takes precedence initially: activation speed, 30-day retention, or correction-rate reduction?

## 2) Success Metrics
- **Activation (first value moment):** % of new users who complete onboarding and confirm their first transaction (imported or auto-detected) within 24 hours.
- **Activation (first value moment):** Median time from first app open to first confirmed transaction.
- **Engagement (weekly):** Weekly active users who review analytics/dashboard at least 2 sessions per week.
- **Engagement (weekly):** Average number of transaction confirmations/edits per active user per week.
- **Retention (30 days):** D30 retention for users who reached first confirmed transaction in week 1.
- **Retention (30 days):** % of users with at least one transaction event in 3 of 4 weeks after signup.
- **Data Quality (classification accuracy / correction rate):** Auto-classification acceptance rate (no user category change before save).
- **Data Quality (classification accuracy / correction rate):** Parser correction rate (share of auto-parsed transactions requiring amount/category/date edits).
- **Operational (crash-free sessions, app start time):** Crash-free sessions rate by platform.
- **Operational (crash-free sessions, app start time):** p90 cold app start time on Android and iOS.

## 3) Constraints & Assumptions

### Platform constraints
- Android has explicit SMS listener plugin support in current configuration.
- Web build exists and is routable for core pages.
- iOS support exists at platform dependency level, but SMS ingestion parity is unconfirmed (assumption).

### Privacy & security constraints
- SMS access requires explicit runtime permissions and clear user consent UX.
- Financial data sensitivity implies conservative handling of raw message content (assumption).
- Auth and analytics integrations indicate third-party service dependencies requiring privacy disclosure.
- Local transaction handling is present; cloud processing boundaries are not fully explicit (assumption).

### Technical constraints
- Parser quality depends on message format variability across senders/banks.
- FX totals depend on rate availability/freshness and migration consistency.
- Background listener behavior is platform-dependent and lifecycle-sensitive.
- Route surface is broad; feature completeness may vary by module maturity.

### UX constraints
- Initial user value depends on minimizing setup and permission fatigue.
- Overly technical features (model training/template building) should be hidden from novice users (assumption).
- Review/edit UX must be fast enough to avoid dropping auto-detected transactions.
- Warning states (e.g., unconverted transactions) must be clear but non-blocking.
