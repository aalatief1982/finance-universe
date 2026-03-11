# Xpensia — Gap Tracker & Known Issues

> **Status**: Living document  
> **Last synced with codebase**: 2026-03-11

---

## 1. Undocumented Technical Systems

These systems are implemented in code but lack dedicated documentation.

### 1.1 Inference DTO Pipeline

| Item | Location |
|---|---|
| `buildInferenceDTO` | `src/lib/inference/buildInferenceDTO.ts` |
| `createInferenceDTOFromDetection` | `src/lib/inference/createInferenceDTOFromDetection.ts` |
| `normalizeInferenceDTO` | `src/lib/inference/inferenceDTO.ts` |
| `InferenceDTO` type | `src/types/inference.ts` |
| `InferenceDecisionTrace` | `src/types/inference.ts` |

**Gap**: No dedicated doc explains the DTO normalization pipeline, field scoring logic, or how `debugTrace` is structured. The `03-technical-architecture.md` now covers the basics, but a deep-dive reference for the inference layer would help developers.

### 1.2 SMS Queue & Inbox System

| Item | Location |
|---|---|
| `smsQueueService` | `src/services/smsQueueService.ts` |
| `smsInboxQueue` | `src/lib/sms-inbox/smsInboxQueue.ts` |
| `useSmsInboxPendingCount` | `src/hooks/useSmsInboxPendingCount.ts` |
| `SmsReviewInboxPage` | `src/pages/SmsReviewInboxPage.tsx` |

**Gap**: The two-layer queue architecture (persistent `smsQueueService` → reactive in-memory `smsInboxQueue`) is not documented anywhere. The relationship between native SMS persistence and JS-side reactive updates needs a dedicated flow diagram.

### 1.3 Learning System

| Item | Location |
|---|---|
| `saveTransactionWithLearning` | `src/lib/smart-paste-engine/saveTransactionWithLearning.ts` |
| `useLearningEngine` | `src/hooks/useLearningEngine.ts` |
| `LearnedEntry` type | `src/types/learning.ts` |
| Template hash account map | Storage key `xpensia_template_hash_account_map` |
| Keyword bank | Storage key `xpensia_type_keywords` |

**Gap**: No doc explains:
- How learned entries are created from confirmed transactions
- How `confirmationHistory` and purity scores work
- How `promoted_by_history` sourceKind affects field scoring
- The keyword bank sync bridge to native via `syncKeywordsToNative`

### 1.4 Confidence & Field Scoring

**Gap**: The tiered confidence system (detected/suggested/needs_review) is implemented in the Edit Transaction UI but the scoring thresholds and field-level scoring algorithm are not documented.

| Score Range | Tier | UI Indicator |
|---|---|---|
| ≥ 0.7 | detected | Green |
| 0.3–0.7 | suggested | Amber |
| < 0.3 | needs_review | Red |

### 1.5 Template vs Freeform Parsing Distinction

**Gap**: Two parsing paths exist but there's no doc explaining:
- When template matching is attempted vs freeform
- How `origin` field differentiates the paths (`template`, `structure`, `freeform`, `fallback`)
- What `source` values mean (`smart-paste`, `sms`, `sms-import`, `smart-paste-freeform`, `voice-freeform`)

---

## 2. Dormant/Disabled Features

| Feature | Route | Guard | Status |
|---|---|---|---|
| Bulk SMS auto-import | `/process-sms` | `ImportDisabledGuard` | `SMS_AUTO_IMPORT_ENABLED = false` |
| Vendor mapping | `/vendor-mapping` | `ImportDisabledGuard` | Disabled |
| Bulk SMS review | `/review-sms-transactions` | `ImportDisabledGuard` | Disabled |
| SMS provider selection | `/sms-providers` | `ImportDisabledGuard` | Disabled |
| Vendor categorization | `/sms/process-vendors`, `/sms/vendors` | `ImportDisabledGuard` | Disabled |

**Decision needed**: Should these be re-enabled, refactored, or removed?

---

## 3. Legacy/Dead Code

| Item | Location | Issue |
|---|---|---|
| Wireframe components | `src/components/wireframes/` | Completely disconnected from actual UI |
| `DashboardScreen.tsx` wireframe | `src/components/wireframes/screens/DashboardScreen.tsx` | Not used by any route |
| `processTransactionsFromSMS` | `TransactionContext` | Mock implementation, not connected |
| `wireframes/interfaces/Transaction.ts` | `src/components/wireframes/interfaces/Transaction.ts` | Duplicate of main Transaction type |

**Recommendation**: Archive or delete wireframe components.

---

## 4. Documentation Gaps

| Gap | Priority | Notes |
|---|---|---|
| OTA update flow documentation | P2 | Partially covered in `docs/capgo-ota-investigation.md` |
| Analytics event catalog | P3 | `docs/ANALYTICS_EVENTS.md` exists but may be stale |
| i18n key inventory | P3 | No doc listing all translation keys |
| Storage key migration guide | P2 | No doc explaining how to handle storage schema changes |
| ProGuard rules reference | P3 | Rules exist in `android/app/proguard-rules.pro` but undocumented |

---

## 5. Platform Parity Gaps

| Feature | Web | Android | Gap |
|---|---|---|---|
| SMS detection | ❌ Not possible | ✅ BroadcastReceiver | By design |
| Share sheet intake | ❌ Not possible | ✅ ShareTargetPlugin | By design |
| Local notifications | ❌ Not possible | ✅ Capacitor plugin | By design |
| Camera for avatar | ❌ File picker only | ✅ Camera capture | Minor |
| OTA updates | ❌ N/A | ✅ Capgo | By design |
| Background SMS | ❌ N/A | ✅ BroadcastReceiver | By design |

---

## 6. Known Technical Debt

| Item | Description |
|---|---|
| `safeStorage` wrapper | Good pattern, but error handling on JSON parse failures could be more robust |
| Large page components | Settings.tsx (876 lines), Analytics.tsx (631 lines) should be decomposed |
| `.docx` files in KnowledgeBase | Cannot be diffed in git, should be converted to markdown or archived |
| `KnowledgeBase/updated prd` | Contains only `1` — empty placeholder, should be deleted |
| `KnowledgeBase/test.txt` | Test file, should be deleted |
