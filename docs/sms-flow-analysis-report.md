# SMS Flow Analysis Report

> **Generated**: 2026-02-28  
> **Scope**: Navigation loop root cause, bulk import flow, real-time listener flow, inference rules, Smart Entry intersection, guardrails inventory, UX/UI consultancy

---

## Table of Contents

1. [Navigation Loop Root Cause](#1-navigation-loop-root-cause)
2. [Bulk Import Flow](#2-bulk-import-flow)
3. [Real-Time SMS Listener Flow](#3-real-time-sms-listener-flow)
4. [Inference Rules](#4-inference-rules)
5. [Smart Entry Intersection](#5-smart-entry-intersection)
6. [Guardrails Inventory](#6-guardrails-inventory)
7. [UX/UI Consultancy](#7-uxui-consultancy)

---

## 1. Navigation Loop Root Cause

### Location

- **File**: `src/App.tsx`
- **Effect**: `useEffect` starting at **line 487**
- **Dependency array**: `[user, location.pathname]` at **line 554**

### Mechanism

```
┌──────────────────────────────────────────────────────────────┐
│  useEffect fires (line 487)                                  │
│  ↓                                                           │
│  runStartupSmsFlow() runs                                    │
│  ↓                                                           │
│  resolveProviderSelectionState() returns non-'configured'    │
│  ↓                                                           │
│  getNextSmsFlowStep() returns route: '/process-sms'          │
│  ↓                                                           │
│  navigateRef.current('/process-sms')  (line 537)             │
│  ↓                                                           │
│  location.pathname changes → re-triggers useEffect           │
│  ↓                                                           │
│  LOOP REPEATS                                                │
└──────────────────────────────────────────────────────────────┘
```

### Why It Persists

The guard at **line 536** checks `location.pathname !== flowDecision.route` to avoid re-navigating, but React Router's `navigate()` call still updates the location object reference, which triggers the effect again. Even when the pathname matches and navigation is skipped, the effect body re-evaluates `resolveProviderSelectionState()` and `getNextSmsFlowStep()` on every cycle.

When `providerSelectionState` never resolves to `'configured'` (e.g., storage is `'invalid'`, `'empty'`, or `'missing'`), the coordinator keeps returning `route_sender_discovery` with `route: '/process-sms'`. Combined with `location.pathname` in the dependency array, this creates an infinite re-render loop.

### SmsFlowCoordinator Decision Tree

```
SmsFlowCoordinator.ts (line 84-129)

IF onboarding not completed OR permission not granted:
  → wait_for_permission_or_onboarding (no route, no import)

ELSE IF providerSelectionState !== 'configured':
  IF smsSenderFirstFlowV2Enabled AND NOT rollbackToLegacyRoutingOnce:
    → route_sender_discovery → /process-sms          ← LOOP TRIGGER
  ELSE IF first_run_post_onboarding AND (missing OR empty):
    → continue_existing_flow (auto import if enabled)
  ELSE:
    → route_sender_discovery → /process-sms          ← LOOP TRIGGER

ELSE (configured):
  → continue_existing_flow (auto import if enabled)
```

### resolveProviderSelectionState Logic

```
SmsFlowCoordinator.ts (lines 45-78)

1. If user.smsProviders is non-empty string[] → 'configured'
2. If localStorage 'sms_providers' is missing → 'missing'
3. Parse 'sms_providers' from localStorage:
   a. Not an array → 'invalid'
   b. Empty array → 'empty'
   c. smsProviderSelectionService.hasConfiguredProviders() → 'configured'
   d. Has non-empty strings OR selected objects → 'invalid'
   e. Otherwise → 'empty'
```

### Recommended Fix

1. **Remove `location.pathname` from the dependency array** — the flow should only re-evaluate when `user` changes, not on every navigation.
2. **Add a `useRef` guard** (`hasRunStartupFlow`) set to `true` after the first execution, preventing re-runs.
3. **Move `isCancelled` to a ref** so it survives across re-renders.

---

## 2. Bulk Import Flow

### End-to-End Route Sequence

```
App.tsx startup
  → SmsFlowCoordinator.getNextSmsFlowStep()
    → SmsImportService.checkForNewMessages()
      → /vendor-mapping (with messages + vendorMap + keywordMap)
        → /review-sms-transactions
```

### 2.1 Sender Selection & Legacy Migration

**File**: `src/services/SmsImportService.ts`, lines 78-109

```
getConfiguredSendersFromSelection(availableSenders):
  1. Check getSelectedSmsSenders() → if non-empty, use directly
  2. Else try getLegacySelectedProviderCandidates():
     - Parse 'sms_providers' from localStorage as LegacySmsProviderSelection[]
     - Extract .id and .name from entries where isSelected === true
  3. Match legacy candidates against availableSenders (case-insensitive)
  4. If matches found → persist via setSelectedSmsSenders() (migration)
  5. If no matches → return empty (routes to /process-sms)
```

### 2.2 Scan Window & Checkpoint Dates

**File**: `src/services/SmsImportService.ts`, lines 141-167

| Concept | Implementation |
|---------|---------------|
| Default lookback | 6 months (`getDefaultStartDate()`, line 142) |
| Per-sender checkpoint | `getSmsSenderImportMap()` returns `Record<sender, ISO-date>` |
| Scan start | `Math.min()` across all sender checkpoint dates |
| Permission-date flow | `Math.min(permissionStartDate, senderCheckpointStartDate)` |

> **Note**: The memory context mentions a 1-month (30-day) default lookback, but the code at line 143 uses `setMonth(getMonth() - 6)` (6 months). This inconsistency suggests the startup migration (`xpensia_sms_period_months`) may override the default at a higher level, but `SmsImportService` itself still falls back to 6 months.

### 2.3 Financial Message Filtering (Triple-Gate)

**File**: `src/lib/smart-paste-engine/messageFilter.ts`, lines 29-84

All three must pass for `isFinancialTransactionMessage()` to return `true`:

| Gate | Regex/Logic | Notes |
|------|------------|-------|
| **Keyword** | User-defined `xpensia_type_keywords` or fallback Arabic keywords (`مبلغ`, `حوالة`, `رصيد`, etc.) | Normalized NFC, whitespace-stripped, lowercased |
| **Amount** | `currencyAmountRegex` matching `SAR 100`, `100 SAR`, `ر.س 100`, `جنيه مصري 100`, etc. | Supports 13 currencies + Arabic currency names |
| **Date** | Multiple date formats: `DD/MM/YYYY`, `YYYY-MM-DD`, `DD-Mon-YY`, `DD Month YYYY`, `YYDDD`, `YYYYMMDD` | Optional time suffix `HH:MM:SS` |

### 2.4 Vendor Mapping & Keyword Map Construction

**File**: `src/services/SmsImportService.ts`, lines 266-282 (and 368-384 for permission-date flow)

For each filtered message:
1. `extractVendorName(msg.message)` → raw vendor (or fallback to `msg.sender`)
2. `inferIndirectFields(msg.message, { vendor })` → category, subcategory, type
3. Build `vendorMap: Record<vendor, vendor>` (identity mapping)
4. Build `keywordMap[]` with `{ keyword: vendor, mappings: [{field, value}] }`

### 2.5 Sender-Vendor Mapping Filter

**File**: `src/services/SmsImportService.ts`, lines 111-137

`isSenderAllowedByConfiguredSenders()` enforces a two-level filter:
1. Sender must be in the allowed set
2. If `senderVendorMappings` exist globally:
   - Sender must have a non-empty mapping entry, OR
   - The extracted vendor from the message body must exist in the sender's mapping

### 2.6 Session-Level Prompt Guards

**File**: `src/services/SmsImportService.ts`, lines 42-47

| Flag | Purpose | Scope |
|------|---------|-------|
| `autoPromptShown` | Prevents `window.confirm()` from showing more than once per session | Module-level static |
| `autoPromptAccepted` | Caches user's confirm/decline decision | Module-level static |
| `autoAlertShown` | Prevents `window.alert()` from showing more than once | Module-level static |

---

## 3. Real-Time SMS Listener Flow

### Architecture

**File**: `src/App.tsx`, lines 370-485

```
BackgroundSmsListener.addListener('smsReceived')
  ↓
  sender, body received from native plugin
  ↓
  isFinancialTransactionMessage(body)          ← Same filter as bulk import
  ↓ (passes)
  buildInferenceDTO({ rawMessage: body, senderHint: sender, source: 'sms' })
  ↓
  parseAndInferTransaction(rawMessage, senderHint, smsId)
  ↓
  normalizeInferenceDTO(...)
  ↓
  IF app is active:
    navigate('/edit-transaction', { state: inferenceDTO })
  ELSE:
    LocalNotifications.schedule({ extra: { smsData: { sender, body } } })
```

### Notification Tap Handler

**File**: `src/App.tsx`, lines 430-459

When the user taps a notification:
1. Extract `smsData` from `event.notification.extra`
2. Re-run `buildInferenceDTO()` (full re-parse)
3. Navigate to `/edit-transaction`
4. On error: fallback to `/import-transactions`

### Key Differences from Bulk Import

| Aspect | Bulk Import | Real-Time Listener |
|--------|------------|-------------------|
| Sender allow-list | ✅ Uses configured senders | ❌ Accepts ANY sender |
| Checkpoint dates | ✅ Per-sender cutoff | ❌ No cutoff |
| Vendor mapping filter | ✅ `isSenderAllowedByConfiguredSenders()` | ❌ No filter |
| User confirmation | ✅ `window.confirm()` | ❌ Auto-navigates |
| Deduplication | ❌ None | ❌ None |
| Parsing pipeline | `smsParser.ts` (simpler regex) via `SmsImportService` | `structureParser.ts` (template system) via `buildInferenceDTO` |

---

## 4. Inference Rules

### 4.1 Amount Extraction

| Pipeline | Implementation |
|----------|---------------|
| **smsParser.ts** (bulk) | Simple regex: `/(\d+[.,]\d{2})|\d+/g`, takes first match (line 19) |
| **structureParser.ts** (real-time) | Template placeholder extraction — amount comes from `placeholders.amount` resolved by `extractTemplateStructure()` |

### 4.2 Date Extraction & Normalization

| Pipeline | Implementation |
|----------|---------------|
| **smsParser.ts** | Regex `/\d{4}-\d{2}-\d{2}/g` (ISO only), then `normalizeDate()` supporting DD-MM-YY (lines 22-40) |
| **structureParser.ts** | `normalizeDate()` at line 38: matches `yy-mm-dd` with century pivot at 50, fallback to `new Date()` |
| **messageFilter.ts** | 7 date format patterns for gate check only (not extraction) |

### 4.3 Vendor Extraction

**File**: `src/lib/smart-paste-engine/suggestionEngine.ts`, lines 286-342

Extraction cascade:
1. **Explicit label**: `/(?:لدى|merchant|vendor)\s*[:：]\s*([^\n,؛;]+)/i`
2. **Anchor patterns** (Arabic): `/(?:من عند|تم الدفع لـ|تم الشراء من|لدى|من|عند)\s*[:\s]\s*([^\n,؛;:-]+)/i`
3. **Anchor patterns** (English): `/(?:at|from|paid to|purchased from)\s*[:\s]*([^\n,؛;:-]+)/i`
4. **Domain-like**: `([a-z0-9][a-z0-9.-]*\.[a-z]{2,})/i`
5. **Salary fallback**: If text contains `راتب` or `salary` → return `'Company'`

Validation rejects: length ≤ 2, pure numbers, 4-digit years, contains \"SAR\", starts with `**`, pure decimal.

Post-extraction: `applyVendorMapping()` (structureParser.ts line 389) remaps via `xpensia_vendor_map`.

### 4.4 Type Inference

**File**: `src/lib/smart-paste-engine/suggestionEngine.ts`, lines 212-228

```
xpensia_type_keywords storage format:
{
  "expense": ["شراء", "purchase", "دفع", "payment", ...],
  "income": ["راتب", "salary", "إيداع", "deposit", ...],
  "transfer": ["تحويل", "transfer", ...]
}

Matching: For each type, iterate keywords; first match wins.
```

### 4.5 Category & Subcategory Inference

**File**: `src/lib/smart-paste-engine/suggestionEngine.ts`, lines 184-259

Inference cascade:
1. **Keyword bank** (`xpensia_keyword_bank`): Array of `{ keyword, mappings: [{ field, value }] }`. Text scanned for keyword substring match → apply field mappings.
2. **Vendor fallback** (`findClosestFallbackMatch`):
   - Fuzzy match via `string-similarity` with **70% threshold** (line 138)
   - Falls back to substring match if fuzzy fails
   - Returns `{ vendor, category, subcategory, type }`
   - Only applies if inferred type matches fallback type (or type is unknown)
3. **Income default**: If type is `'income'` and both category + subcategory are still missing → `Earnings > Benefits` (line 253-256)

### 4.6 Account Inference (fromAccount / toAccount)

**File**: `src/lib/smart-paste-engine/structureParser.ts`, lines 253-333

Resolution cascade (each account independently):

| Priority | Source | Storage Key | Code Lines |
|----------|--------|-------------|------------|
| 1 | Direct field from template | Template placeholder | 253-258 |
| 2 | Token remap | `xpensia_fromaccount_map` | 260-272 |
| 3 | Template-hash map | `xpensia_template_account_map` (`{templateHash}::{role}`) | 274-300 |
| 4 | Template default values | Template `.defaultValues.fromAccount` | 302-322 |
| 5 | senderHint fallback | Passed from caller | parseAndInferTransaction.ts lines 141-153 |

senderHint fallback rules:
- `fromAccount`: Used when type is `expense` or `transfer`
- `toAccount`: Used when type is `income`

---

## 5. Smart Entry Intersection

### Shared Pipeline

Both bulk import and real-time listener ultimately use:
- `suggestionEngine.ts` → `extractVendorName()`, `inferIndirectFields()`
- `structureParser.ts` → `parseSmsMessage()` (template-based)

### Divergent Entry Points

```
┌─────────────────────────┐    ┌─────────────────────────────┐
│   BULK IMPORT           │    │   REAL-TIME LISTENER        │
│   (SmsImportService)    │    │   (BackgroundSmsListener)   │
├─────────────────────────┤    ├─────────────────────────────┤
│ smsParser.ts            │    │ buildInferenceDTO.ts        │
│ parseSmsMessage()       │    │ ↓                           │
│ - Own regex for amount  │    │ parseAndInferTransaction.ts │
│ - Own regex for date    │    │ ↓                           │
│ - extractVendorName()   │    │ structureParser.ts          │
│ - inferIndirectFields() │    │ parseSmsMessage()           │
│                         │    │ - Template extraction       │
│ Returns: TransactionDraft    │ - Template matching         │
│ (flat object)           │    │ - extractVendorName()       │
│                         │    │ - inferIndirectFields()     │
│                         │    │                             │
│                         │    │ Returns: InferenceDTO       │
│                         │    │ (rich with confidence)      │
└─────────────────────────┘    └─────────────────────────────┘
```

### Key Inconsistencies

| Aspect | smsParser.ts (Bulk) | structureParser.ts (Real-time/Smart Entry) |
|--------|--------------------|--------------------------------------------|
| Amount regex | `/(\d+[.,]\d{2})|\d+/g` — first numeric match | Template placeholder extraction |
| Date regex | `/\d{4}-\d{2}-\d{2}/g` — ISO only | Template placeholder + `normalizeDate()` (yy-mm-dd support) |
| Confidence scoring | None | Full pipeline: field (50%) + template (30%) + keyword (20%) |
| Account inference | Not supported | Full 5-level cascade |
| Vendor mapping | Not applied | `applyVendorMapping()` applied |
| Output format | `TransactionDraft` (flat) | Structured with `directFields`, `inferredFields`, `defaultValues` |
| Currency detection | Hardcoded `'SAR'` | Extracted from template placeholder |

### Storage Access Inconsistency

**File**: `src/lib/smart-paste-engine/confidenceScoring.ts`, lines 63, 87

`confidenceScoring.ts` uses raw `localStorage.getItem()` instead of `safeStorage.getItem()` for:
- `xpensia_vendor_map` (line 63)
- `xpensia_fromaccount_map` (line 87)

All other files consistently use `safeStorage`. This creates a potential failure point in environments where `localStorage` is unavailable.

---

## 6. Guardrails Inventory

| Guard | File | Line(s) | Purpose |
|-------|------|---------|---------|
| `importLock` | SmsImportService.ts | 139, 196-201 | Prevents concurrent import executions |
| `MAX_SAFE_LIMIT` | SmsReaderService.ts | — | Caps bulk SMS reads at 2,000 messages |
| `isCancelled` flag | App.tsx | 489, 534, 552 | Prevents stale async results from acting after effect cleanup |
| Platform check | SmsProviderSelectionService.ts | 419 | `Capacitor.isNativePlatform()` gates native-only features |
| `autoPromptShown` | SmsImportService.ts | 43 | Ensures confirm dialog shown at most once per session |
| `autoPromptAccepted` | SmsImportService.ts | 44 | Caches user's confirm/decline decision for the session |
| `autoAlertShown` | SmsImportService.ts | 46 | Ensures alert dialog shown at most once per session |
| Empty-string guard | suggestionEngine.ts | 120 | Prevents `string-similarity` crash on empty vendor name |
| Empty vendor-list guard | suggestionEngine.ts | 128-130 | Prevents `findBestMatch` crash on empty comparison set |
| Template extraction error | structureParser.ts | 159-163 | Re-throws to let upstream handle parsing failures |
| Empty message guard | structureParser.ts | 128-139 | Returns empty parse result instead of throwing |
| Invalid date guard | structureParser.ts | 39 | Returns `undefined` for unparseable dates |
| Provider validation | SmsProviderSelectionService.ts | 58-70 | Type guard ensures stored providers match `SmsProvider` shape |
| Storage parse fallback | SmsFlowCoordinator.ts | 75-77 | Catches JSON parse errors → returns `'invalid'` |
| Pathname guard | App.tsx | 536 | `location.pathname !== flowDecision.route` (insufficient — see §1) |

### Missing Guardrails

| Gap | Risk | Recommendation |
|-----|------|----------------|
| No transaction deduplication | Same SMS processed by both bulk import and real-time listener | Hash `sender + body + date`, check before insert |
| No sender allow-list in real-time listener | Any SMS sender triggers processing | Apply configured sender filter to listener |
| No rate limiting on listener | Burst of SMS could overwhelm parser | Debounce or queue incoming messages |
| No staleness check on notification tap | Re-parsed SMS may produce different results | Cache inferenceDTO in notification extra instead of raw SMS |

---

## 7. UX/UI Consultancy

### 7.1 Critical: Fix the Navigation Loop

**Priority**: P0 — app is currently unusable for users without configured providers.

**Recommendation**:
```typescript
// App.tsx — replace dependency array at line 554
const hasRunStartupFlow = useRef(false);

useEffect(() => {
  if (!ENABLE_SMS_INTEGRATION) return;
  if (hasRunStartupFlow.current) return;
  hasRunStartupFlow.current = true;

  // ... existing runStartupSmsFlow logic ...
}, [user]); // Remove location.pathname
```

### 7.2 Replace Native Dialogs with Themed Components

**Current**: `window.confirm()` and `window.alert()` in `SmsImportService.ts` (lines 247-263, 358-362).

**Problem**: These are blocking, unstyled, and jarring on mobile. They break the app's visual identity and cannot be customized.

**Recommendation**: Use the existing `AlertDialog` component from Radix UI (already installed). Create a `SmsImportConfirmDialog` component that:
- Shows message count and sender list
- Has \"Import\" and \"Skip\" buttons styled with the app's design system
- Returns a Promise resolved by user action (non-blocking)

### 7.3 Queue Real-Time SMS as Non-Blocking Notifications

**Current**: App immediately navigates to `/edit-transaction` when a financial SMS arrives while the app is active (line 398). This interrupts whatever the user is doing.

**Problem**: If the user is editing a transaction, filling a form, or reviewing data, they lose their context.

**Recommendation**:
- Show a toast/snackbar: \"New transaction detected from [sender]. Tap to review.\"
- Queue the inferenceDTO in local state
- Let the user tap the toast to navigate when ready
- Badge the navigation icon with pending count

### 7.4 Add Sender Allow-List to Real-Time Listener

**Current**: The listener at line 370 processes SMS from **any** sender. Only `isFinancialTransactionMessage()` gates it.

**Problem**: Non-bank senders that happen to mention amounts and dates (e.g., delivery confirmations, appointment reminders) trigger false positives.

**Recommendation**: After the financial message check, add:
```typescript
const configuredSenders = getSelectedSmsSenders();
if (configuredSenders.length > 0 && !configuredSenders.includes(sender)) {
  return; // Skip non-configured senders
}
```

### 7.5 Add Transaction Deduplication

**Current**: No deduplication exists between bulk import and real-time listener.

**Problem**: The same SMS can be processed twice — once by the real-time listener and once by the next bulk import — creating duplicate transactions.

**Recommendation**: Generate a hash from `sender + body + date` (or use the SMS ID from the native plugin). Check against a local Set/Map before processing. Persist the dedup set in storage with a TTL (e.g., 30 days).

### 7.6 Collapse the Import Flow

**Current**: 4-step flow: `/process-sms` → `/vendor-mapping` → `/review-sms-transactions` → `/edit-transaction`

**Problem**: Too many screens for a mobile flow. Users lose context between steps.

**Recommendation**:
- Merge sender selection and vendor mapping into a single screen with tabs or accordion sections
- Auto-navigate to review screen after import, skipping vendor mapping when all vendors are already mapped
- Allow inline editing on the review screen instead of navigating to a separate edit page

### 7.7 Unify Parsing Pipelines

**Current**: Two parallel parsers — `smsParser.ts` (bulk) and `structureParser.ts` (real-time/Smart Entry) — with different capabilities.

**Problem**: Bulk import users get inferior parsing (no template matching, no account inference, no confidence scoring, hardcoded SAR currency).

**Recommendation**: Route bulk import through `buildInferenceDTO()` → `parseAndInferTransaction()` → `structureParser.ts`, the same pipeline used by real-time and Smart Entry. This ensures consistent parsing quality and eliminates the maintenance burden of two divergent parsers.

### 7.8 Fix `confidenceScoring.ts` Storage Access

**Current**: Uses raw `localStorage` (lines 63, 87) while the rest of the codebase uses `safeStorage`.

**Recommendation**: Replace `localStorage.getItem(...)` with `safeStorage.getItem(...)` for consistency and to prevent crashes in restricted storage environments.

---

## Appendix: File Reference Index

| File | Lines | Key Function |
|------|-------|-------------|
| `src/App.tsx` | 370-485 | BackgroundSmsListener setup |
| `src/App.tsx` | 487-554 | Startup SMS flow effect (loop source) |
| `src/services/SmsFlowCoordinator.ts` | 45-78 | `resolveProviderSelectionState()` |
| `src/services/SmsFlowCoordinator.ts` | 84-129 | `getNextSmsFlowStep()` |
| `src/services/SmsImportService.ts` | 78-109 | Sender selection + legacy migration |
| `src/services/SmsImportService.ts` | 141-167 | Scan window computation |
| `src/services/SmsImportService.ts` | 169-190 | Message filtering by sender + cutoff |
| `src/services/SmsImportService.ts` | 192-297 | `checkForNewMessages()` |
| `src/services/SmsImportService.ts` | 302-406 | `handleAutoImportWithPermissionDate()` |
| `src/services/SmsProviderSelectionService.ts` | 254-269 | `hasConfiguredProviders()` |
| `src/lib/smart-paste-engine/messageFilter.ts` | 29-84 | `isFinancialTransactionMessage()` |
| `src/lib/smart-paste-engine/smsParser.ts` | 43-120 | `parseSmsMessage()` (bulk) |
| `src/lib/smart-paste-engine/structureParser.ts` | 117-385 | `parseSmsMessage()` (template-based) |
| `src/lib/smart-paste-engine/suggestionEngine.ts` | 184-265 | `inferIndirectFields()` |
| `src/lib/smart-paste-engine/suggestionEngine.ts` | 286-342 | `extractVendorName()` |
| `src/lib/smart-paste-engine/suggestionEngine.ts` | 115-159 | `findClosestFallbackMatch()` |
| `src/lib/smart-paste-engine/parseAndInferTransaction.ts` | 130-354 | `parseAndInferTransaction()` |
| `src/lib/smart-paste-engine/confidenceScoring.ts` | 27-110 | Confidence scoring functions |
| `src/lib/inference/buildInferenceDTO.ts` | 11-67 | `buildInferenceDTO()` |
