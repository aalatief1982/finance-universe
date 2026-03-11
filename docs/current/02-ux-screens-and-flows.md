# Xpensia — UX Screens & Flows

> **Status**: Living document — reflects current implemented navigation and workflows  
> **Last synced with codebase**: 2026-03-11

---

## 1. Navigation Model

### Bottom Navigation (4 items)
| Icon | Label | Route |
|---|---|---|
| Home | Home | `/home` |
| Upload | Smart Entry | `/import-transactions` |
| List | Transactions | `/transactions` |
| PieChart | Analytics | `/analytics` |

### Header Bar
- **Left**: Back button (on sub-pages) or hamburger menu
- **Center**: Page title (translated)
- **Right**: SMS inbox icon with pending count badge

### Drawer Menu (hamburger)
| Item | Route | Notes |
|---|---|---|
| Home | `/home` | |
| Smart Entry | `/import-transactions` | |
| Transactions | `/transactions` | |
| Analytics | `/analytics` | |
| Budget | `/budget` | |
| SMS Review | `/sms-review` | Mobile only |
| Exchange Rates | `/exchange-rates` | |
| Settings | `/settings` | |
| Feedback | `__feedback__` | Mobile only, opens email |
| Profile | `/profile` | |
| About | `/about` | Mobile only |

---

## 2. Information Architecture

```
App
├── Onboarding (first launch only)
│   ├── Slide 1: Welcome
│   ├── Slide 2: Features
│   ├── Slide 3: Get started
│   └── → Set Default Currency → Home
├── Home Dashboard
│   ├── Stats cards (income/expense/balance)
│   ├── Charts (category, timeline, net balance)
│   ├── Recent transactions
│   └── FAB → Smart Entry
├── Smart Entry (/import-transactions)
│   ├── SmartPaste component (paste/type/voice)
│   ├── SMS Inbox section (pending items)
│   └── → Edit Transaction
├── SMS Review Inbox (/sms-review)
│   ├── Pending SMS cards with parsed preview
│   ├── Review → Edit Transaction
│   └── Ignore → dismiss
├── Edit Transaction (/edit-transaction)
│   ├── Form with detected/suggested field labels
│   ├── Save with learning
│   └── → Transactions list
├── Transactions (/transactions)
│   ├── Date/type filters
│   ├── Search
│   ├── Edit dialog
│   └── FAB → Smart Entry
├── Analytics (/analytics)
│   ├── Period selector
│   ├── Category breakdown
│   ├── Subcategory drill-down
│   ├── Timeline chart
│   └── Net balance chart
├── Budget (/budget)
│   ├── Budget hub (list)
│   ├── Budget detail
│   ├── Set budget
│   ├── Budget report
│   ├── Budget insights
│   └── Accounts
├── Exchange Rates (/exchange-rates)
├── Settings (/settings)
│   ├── Theme toggle
│   ├── Currency selection
│   ├── Week start day
│   ├── SMS permissions
│   ├── Background SMS toggle
│   ├── Import/Export (CSV/JSON)
│   ├── Data reset
│   └── OTA update check
├── Profile (/profile)
│   ├── Name/email edit
│   ├── Avatar (camera)
│   └── Auth status
└── About (/about)
```

---

## 3. Key Workflow Diagrams

### 3.1 Onboarding Flow

```mermaid
flowchart TD
    A[App Launch] --> B{onboarding done?}
    B -- No --> C[Onboarding Slides]
    C --> D[Set xpensia_onb_done]
    D --> E[Set Default Currency]
    E --> F[Home Dashboard]
    B -- Yes --> G{currency set?}
    G -- No --> E
    G -- Yes --> F
```

### 3.2 Smart Entry — Manual Paste/Type Flow

```mermaid
flowchart TD
    A[User opens Smart Entry] --> B[Paste or type text]
    B --> C[parseAndInferTransaction]
    C --> D[buildInferenceDTO]
    D --> E[Navigate to Edit Transaction]
    E --> F[User reviews/edits fields]
    F --> G[Save with learning]
    G --> H[Transaction added]
    H --> I[Navigate to Transactions]
```

### 3.3 Smart Entry — Voice/Freeform Flow

```mermaid
flowchart TD
    A[User taps microphone] --> B[Voice recording]
    B --> C[Transcript text]
    C --> D[parseAndInferTransaction - freeform path]
    D --> E[buildInferenceDTO]
    E --> F[Navigate to Edit Transaction]
    F --> G[User reviews/edits]
    G --> H[Save with learning]
```

### 3.4 SMS Notification → Review → Save Flow

```mermaid
flowchart TD
    A[SMS received] --> B[BroadcastReceiver]
    B --> C[FinancialSmsClassifier]
    C -- Not financial --> D[Discard]
    C -- Financial --> E[Add to smsInboxQueue]
    E --> F[Show local notification]
    F --> G{User taps notification}
    G --> H[Open SMS Review Inbox]
    H --> I[Cards with parsed preview]
    I --> J{User action}
    J -- Review --> K[buildInferenceDTO]
    K --> L[Navigate to Edit Transaction]
    L --> M[Save with learning]
    J -- Ignore --> N[Mark as ignored]
```

### 3.5 SMS Foreground Flow

```mermaid
flowchart TD
    A[SMS arrives while app open] --> B[Background listener event]
    B --> C[Add to smsInboxQueue]
    C --> D[Update header badge count]
    D --> E[Show toast notification]
    E --> F[User taps badge or toast]
    F --> G[SMS Review Inbox]
```

### 3.6 Transaction Edit & Save with Learning

```mermaid
flowchart TD
    A[Edit Transaction page] --> B[Form with inference labels]
    B --> C{Field tier}
    C -- detected --> D[Green: high confidence]
    C -- suggested --> E[Amber: medium confidence]
    C -- needs_review --> F[Red: low confidence]
    B --> G[User confirms/edits fields]
    G --> H[saveTransactionWithLearning]
    H --> I[Store transaction]
    H --> J[Update learned entries]
    H --> K[Update keyword bank]
    H --> L[Update template hash account map]
```

### 3.7 Share Sheet Intake (Android)

```mermaid
flowchart TD
    A[User shares text from any app] --> B[ShareTargetPlugin receives]
    B --> C[Store as pendingSharedText]
    C --> D[Open Smart Entry page]
    D --> E[Read pending shared text]
    E --> F[Auto-paste into SmartPaste]
    F --> G[Normal parse flow]
```

---

## 4. Page Entry Points Summary

| Page | Entry Points |
|---|---|
| Onboarding | First launch, `xpensia_onb_done` not set |
| Home | Bottom nav, drawer, post-onboarding, app open |
| Smart Entry | Bottom nav, drawer, FAB, share sheet, notification |
| SMS Review Inbox | Header badge, drawer, notification tap |
| Edit Transaction | Smart Entry parse, SMS Review, transaction list edit |
| Transactions | Bottom nav, drawer, post-save redirect |
| Analytics | Bottom nav, drawer |
| Budget | Drawer |
| Settings | Drawer |
| Profile | Drawer |
