# Xpensia — Technical Architecture

> **Status**: Living document — reflects current implemented architecture  
> **Last synced with codebase**: 2026-03-11

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────┐
│                    React SPA (Vite)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Pages    │  │ Context  │  │  Services        │  │
│  │  (routes) │  │ (state)  │  │  (business logic)│  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│  ┌──────────────────────────────────────────────┐   │
│  │         Smart Paste / Inference Engine        │   │
│  │  parseAndInferTransaction → buildInferenceDTO │   │
│  └──────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│                Capacitor Bridge                      │
├──────────┬──────────┬──────────┬───────────────────┤
│ SMS      │ SMS      │ Local    │ Camera, FS,       │
│ Listener │ Reader   │ Notif.   │ StatusBar, etc.   │
│ (native) │ (native) │          │                    │
└──────────┴──────────┴──────────┴───────────────────┘
│                  Android OS                          │
└─────────────────────────────────────────────────────┘
```

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| UI framework | React 18 + TypeScript | SPA with react-router-dom v7 |
| Build | Vite 4 | Dev: `npx vite`, Build: `vite build` |
| Styling | Tailwind CSS + shadcn/ui | HSL design tokens in index.css |
| Animation | Framer Motion | Page transitions, micro-interactions |
| Charts | Recharts | Bar, line, category charts |
| Mobile runtime | Capacitor 6 | Android primary, iOS shell |
| State management | React Context | TransactionContext, UserContext, LanguageContext |
| Persistence | localStorage (web) / Preferences (native) | via `safeStorage` / `safePreferences` wrappers |
| Auth (optional) | Supabase JS client | Not mandatory, local-first |
| Analytics | Firebase Analytics | Via `@capacitor-firebase/analytics` |
| OTA | Capgo Updater | Pending bundle apply on startup |
| i18n | Custom LanguageContext | Arabic (RTL) + English |

## 3. Directory Structure (Key Areas)

```
src/
├── pages/                  # Route-level page components
├── components/             # Reusable UI components
│   ├── ui/                 # shadcn/ui primitives
│   ├── header/             # Header, drawer, route constants
│   ├── dashboard/          # Dashboard-specific components
│   ├── transactions/       # Transaction list/edit components
│   ├── charts/             # Chart components
│   └── budget/             # Budget components
├── context/                # React context providers
│   ├── TransactionContext   # Transaction CRUD + state
│   ├── user/UserContext     # User profile state
│   └── ...
├── services/               # Business logic services
│   ├── AnalyticsService     # Chart data aggregation
│   ├── TransactionService   # Transaction persistence
│   ├── smsQueueService      # SMS queue persistence
│   ├── BudgetAlertService   # Budget threshold alerts
│   └── SmsPermissionService # Runtime SMS permissions
├── lib/
│   ├── smart-paste-engine/  # Core parsing engine
│   │   ├── parseAndInferTransaction  # Main entry point
│   │   ├── saveTransactionWithLearning
│   │   └── template bank, keyword bank, vendor map
│   ├── inference/           # Inference DTO layer
│   │   ├── buildInferenceDTO
│   │   ├── createInferenceDTOFromDetection
│   │   ├── inferenceDTO (normalize)
│   │   └── fieldConfidence scoring
│   ├── sms-inbox/           # SMS inbox queue
│   │   ├── smsInboxQueue    # In-memory queue + subscribers
│   │   └── inbox status management
│   └── share-target/        # Share sheet text handling
├── hooks/                   # Custom React hooks
│   ├── useLearningEngine
│   ├── useSmsInboxPendingCount
│   ├── useTransactionsState
│   └── ...
├── types/                   # TypeScript interfaces
│   ├── transaction.ts
│   ├── inference.ts
│   ├── learning.ts
│   ├── template.ts
│   └── locale.ts
├── utils/                   # Utility functions
│   ├── safe-storage.ts      # Storage abstraction
│   ├── firebase-analytics.ts
│   ├── syncKeywordsToNative.ts
│   └── ...
└── i18n/                    # Translations
```

## 4. Parsing Pipeline

### Overview

All text input (paste, voice, SMS) flows through the same parsing pipeline:

```
Raw text + senderHint
    ↓
parseAndInferTransaction(message, sender, smsId)
    ├── Template matching (templateBank)
    ├── Structure-based extraction (regex patterns)
    ├── Keyword bank lookups
    └── Freeform parsing (if no template match)
    ↓
Detection result: { transaction, confidence, parsingStatus, origin, fieldConfidences, debugTrace }
    ↓
buildInferenceDTO({ rawMessage, senderHint, smsId, source })
    ↓
createInferenceDTOFromDetection(detectionResult)
    ↓
normalizeInferenceDTO(rawDTO)
    ↓
InferenceDTO → passed to EditTransaction via navigation state
```

### InferenceDTO Structure

```typescript
interface InferenceDTO {
  transaction: Transaction;          // Parsed transaction data
  rawMessage: string;                // Original input text
  senderHint?: string;               // SMS sender or user label
  confidence?: number;               // Overall confidence 0-1
  parsingStatus?: 'success' | 'partial' | 'failed';
  origin?: 'template' | 'structure' | 'ml' | 'fallback' | 'freeform' | 'manual';
  matchOrigin?: InferenceOrigin;
  fieldConfidences: Record<string, number>;  // Per-field confidence
  matchedCount?: number;
  totalTemplates?: number;
  fieldScore?: number;
  keywordScore?: number;
  mode: 'create' | 'edit';
  isSuggested: boolean;
  debugTrace?: InferenceDecisionTrace;  // Full decision audit trail
}
```

### Template vs Freeform Parsing

| Aspect | Template Path | Freeform Path |
|---|---|---|
| Trigger | Message matches a known template pattern | No template match found |
| Origin | `'template'` or `'structure'` | `'freeform'` or `'fallback'` |
| Confidence | Typically 0.6–1.0 | Typically 0.1–0.5 |
| Fields | Extracted via regex groups | Inferred via heuristics |
| Learning | Template hash stored for future matches | Keywords/patterns learned |

### Confidence & Field Scoring

Each field in the parsed result gets a confidence score:
- **1.0**: Direct extraction from template regex
- **0.7–0.9**: Keyword bank match or history promotion
- **0.3–0.6**: Heuristic inference
- **0.0**: Default/fallback value

Field tiers in the Edit UI:
- **detected** (score ≥ 0.7): High confidence, shown with green indicator
- **suggested** (score 0.3–0.7): Medium confidence, amber indicator
- **needs_review** (score < 0.3): Low confidence, red indicator

## 5. SMS Ingestion Architecture

### Native Layer (Android)

```
SMS BroadcastReceiver
    ↓
FinancialSmsClassifier.isFinancialTransactionMessage(context, body)
    ├── 0. OTP check → reject if OTP keywords found
    ├── 1. Load keywords from SharedPreferences (fallback: 27 hardcoded)
    ├── 2. Gate 1: keyword match (any financial keyword present)
    ├── 3. Gate 2: amount match (regex for currency amounts)
    ├── 4. Gate 3: date match (date pattern detected)
    └── All 3 gates pass → financial SMS confirmed
    ↓
BackgroundSmsListenerPlugin
    ├── Persist to Capacitor Preferences (newIncomingBuffer)
    ├── Fire local notification
    └── Emit JS event (if app is foregrounded)
```

### JS Layer

```
App startup / foreground event
    ↓
smsQueueService.getQueuedMessages()
    ↓
Add to smsInboxQueue (in-memory reactive queue)
    ↓
useSyncExternalStore → useSmsInboxPendingCount
    ↓
Header badge updates, SMS Review Inbox page re-renders
```

### Keyword Sync Bridge

```
localStorage: xpensia_type_keywords
    ↓ syncKeywordsToNative()
Capacitor Preferences: xpensia_native_financial_keywords
    ↓
SharedPreferences (read by FinancialSmsClassifier)
```

## 6. Learning System

### How Learning Works

1. User confirms/edits a parsed transaction in EditTransaction
2. `saveTransactionWithLearning()` is called
3. Learning engine stores:
   - **LearnedEntry**: Full tokenized message with confirmed field values
   - **Template hash → account mapping**: Associates template patterns with accounts
   - **Keyword bank updates**: New vendor/category/account keywords learned

### LearnedEntry Structure

```typescript
interface LearnedEntry {
  id: string;
  rawMessage: string;
  senderHint: string;
  templateHash?: string;
  confirmedFields: {
    type, amount, category, subcategory, account, currency, person, vendor
  };
  tokens: string[];
  fieldTokenMap: { amount, currency, vendor, account, date, ... };
  timestamp: string;
  confidence?: number;
  userConfirmed: boolean;
  confirmationHistory?: ConfirmationEvent[];
}
```

### Learning Impact on Future Parsing

- Confirmed entries increase confidence for similar future messages
- `sourceKind: 'promoted_by_history'` appears in debug trace when learning influences a field
- Purity score (confirm/contradict ratio) determines promotion strength

## 7. Storage Architecture

| Key | Contents | Platform |
|---|---|---|
| `xpensia_transactions` | Transaction[] | localStorage / Preferences |
| `xpensia_user` | User profile | localStorage / Preferences |
| `xpensia_onb_done` | Onboarding completed flag | localStorage |
| `xpensia_default_currency` | Default currency code | localStorage |
| `xpensia_theme` | Theme preference | localStorage |
| `newIncomingBuffer` | Queued SMS payloads | localStorage / Preferences |
| `xpensia_type_keywords` | Keyword bank data | localStorage |
| `xpensia_native_financial_keywords` | Synced keywords for native | Preferences |
| `xpensia_learned_entries` | Learning engine data | localStorage |
| `xpensia_template_hash_account_map` | Template→account mappings | localStorage |
| `xpensia_exchange_rates` | Custom exchange rates | localStorage |
| `xpensia_budgets` | Budget definitions | localStorage |

## 8. Native Plugin Architecture

### capacitor-background-sms-listener
- **Purpose**: Background SMS reception via BroadcastReceiver
- **Key classes**: `BackgroundSmsListenerPlugin.java`, `FinancialSmsClassifier.java`
- **Registration**: `MainActivity.java` before `super.onCreate()`
- **ProGuard**: `-keep class app.xpensia.** { *; }`

### capacitor-sms-reader
- **Purpose**: Read SMS inbox for bulk import (currently behind ImportDisabledGuard)
- **Key classes**: Android native SMS content resolver

### Other Native Integrations
- `ShareTargetPlugin`: Android share sheet text receiver
- `AndroidSettingsPlugin`: Open Android settings screens
- `@capacitor/local-notifications`: SMS arrival notifications
- `@capacitor/camera`: Profile photo capture
- `@capgo/capacitor-updater`: OTA live updates
- `@capacitor-firebase/analytics`: Event logging

## 9. OTA Update Flow

```
App startup
    ↓
CapacitorUpdater.notifyAppReady()
    ↓
Check for pending bundle
    ↓
If available → apply on next restart
```

## 10. Authentication (Optional)

- Supabase JS client is installed but auth is optional
- App is fully functional without login
- Auth enables future cloud sync features
- No user data leaves the device without explicit auth
