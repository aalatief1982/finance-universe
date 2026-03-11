# Xpensia — Screen Inventory

> **Status**: Living document  
> **Last synced with codebase**: 2026-03-11

---

## Active Screens

### Onboarding
| Property | Value |
|---|---|
| **Route** | `/onboarding` |
| **Component** | `src/pages/Onboarding.tsx` |
| **Purpose** | First-launch introduction slides |
| **Entry points** | App launch when `xpensia_onb_done` is not set |
| **Key actions** | Swipe slides, complete onboarding |
| **Dependencies** | OnboardingSlides, safeStorage |
| **Screenshot needed** | ✅ Each slide + completion |

### Set Default Currency
| Property | Value |
|---|---|
| **Route** | `/set-default-currency` |
| **Component** | `src/pages/SetDefaultCurrency.tsx` |
| **Purpose** | Post-onboarding currency selection |
| **Entry points** | After onboarding, or if currency not yet set |
| **Key actions** | Select currency → navigate to Home |
| **Dependencies** | Currency list, safeStorage |
| **Screenshot needed** | ✅ |

### Home Dashboard
| Property | Value |
|---|---|
| **Route** | `/home` |
| **Component** | `src/pages/Home.tsx` (434 lines) |
| **Purpose** | Financial overview with stats, charts, recent transactions |
| **Entry points** | Bottom nav, drawer, post-onboarding, app open |
| **Key actions** | View stats, switch chart tabs, tap FAB for Smart Entry |
| **Dependencies** | TransactionContext, AnalyticsService, charts, DashboardStats |
| **Screenshot needed** | ✅ Full dashboard + chart tabs |

### Smart Entry
| Property | Value |
|---|---|
| **Route** | `/import-transactions` |
| **Component** | `src/pages/ImportTransactions.tsx` (442 lines) |
| **Purpose** | Parse text/voice into transaction via SmartPaste engine |
| **Entry points** | Bottom nav, drawer, FAB, share sheet, notification |
| **Key actions** | Paste/type text, voice input, view SMS inbox items, submit for parsing |
| **Dependencies** | SmartPaste, buildInferenceDTO, smsInboxQueue, share-target |
| **Screenshot needed** | ✅ Empty state, with text, with SMS items |

### SMS Review Inbox
| Property | Value |
|---|---|
| **Route** | `/sms-review` |
| **Component** | `src/pages/SmsReviewInboxPage.tsx` (153 lines) |
| **Purpose** | Review pending SMS-detected transactions |
| **Entry points** | Header badge, drawer, notification tap |
| **Key actions** | Review (→ Edit), Ignore (→ dismiss) |
| **Dependencies** | smsInboxQueue, buildInferenceDTO |
| **Screenshot needed** | ✅ With items, empty state |

### Edit Transaction
| Property | Value |
|---|---|
| **Route** | `/edit-transaction`, `/edit-transaction/:id` |
| **Component** | `src/pages/EditTransaction.tsx` (422 lines) |
| **Purpose** | Review/edit parsed or existing transaction with confidence labels |
| **Entry points** | Smart Entry, SMS Review, Transactions list |
| **Key actions** | Edit fields, view confidence labels, save with learning |
| **Dependencies** | TransactionEditForm, saveTransactionWithLearning, useLearningEngine |
| **Screenshot needed** | ✅ With detected/suggested labels visible |

### Transactions
| Property | Value |
|---|---|
| **Route** | `/transactions` |
| **Component** | `src/pages/Transactions.tsx` (232 lines) |
| **Purpose** | Full transaction list with filters, search, and edit |
| **Entry points** | Bottom nav, drawer |
| **Key actions** | Filter by date/type, search, tap to edit, delete, FAB for new |
| **Dependencies** | useTransactionsState, TransactionsByDate, EditTransactionDialog |
| **Screenshot needed** | ✅ With filters active |

### Analytics
| Property | Value |
|---|---|
| **Route** | `/analytics` |
| **Component** | `src/pages/Analytics.tsx` (631 lines) |
| **Purpose** | Charts and breakdowns for spending analysis |
| **Entry points** | Bottom nav, drawer |
| **Key actions** | Change period, view category/subcategory/timeline/net balance charts |
| **Dependencies** | AnalyticsService, TransactionService, Recharts, formatCurrency |
| **Screenshot needed** | ✅ Each chart type |

### Budget Hub
| Property | Value |
|---|---|
| **Route** | `/budget` |
| **Component** | `src/pages/budget/` directory |
| **Purpose** | Budget management hub |
| **Entry points** | Drawer |
| **Key actions** | View budgets, navigate to detail/set/report/insights/accounts |
| **Sub-routes** | `/budget/:id`, `/budget/accounts`, `/budget/set`, `/budget/report`, `/budget/insights` |
| **Screenshot needed** | ✅ Hub + each sub-page |

### Exchange Rates
| Property | Value |
|---|---|
| **Route** | `/exchange-rates` |
| **Component** | `src/pages/ExchangeRates.tsx` |
| **Purpose** | View and edit currency exchange rates |
| **Entry points** | Drawer |
| **Key actions** | View rates, edit custom rate |
| **Screenshot needed** | ✅ |

### Settings
| Property | Value |
|---|---|
| **Route** | `/settings` |
| **Component** | `src/pages/Settings.tsx` (876 lines) |
| **Purpose** | App preferences, permissions, data management |
| **Entry points** | Drawer |
| **Key actions** | Theme toggle, currency, week start, SMS permissions, export/import, reset |
| **Screenshot needed** | ✅ Full settings page |

### Profile
| Property | Value |
|---|---|
| **Route** | `/profile` |
| **Component** | `src/pages/Profile.tsx` (174 lines) |
| **Purpose** | User profile management |
| **Entry points** | Drawer |
| **Key actions** | Edit name/email, change/delete avatar |
| **Screenshot needed** | ✅ |

### About
| Property | Value |
|---|---|
| **Route** | `/about` |
| **Component** | `src/pages/About.tsx` |
| **Purpose** | App information and version |
| **Entry points** | Drawer |
| **Key actions** | View app info |
| **Screenshot needed** | ✅ |

---

## Dormant Screens (Behind ImportDisabledGuard)

| Screen | Route | Component |
|---|---|---|
| Process SMS | `/process-sms` | `ProcessSmsMessages.tsx` |
| SMS Provider Selection | `/sms-providers` | `SmsProviderSelection.tsx` |
| Vendor Mapping | `/vendor-mapping` | `VendorMapping.tsx` |
| Review SMS Transactions | `/review-sms-transactions` | `ReviewSmsTransactions.tsx` |
| Process Vendors | `/sms/process-vendors` | `sms/` directory |
| Vendors | `/sms/vendors` | `sms/` directory |

---

## Developer/Debug Screens

| Screen | Route | Component | Purpose |
|---|---|---|---|
| Engine Output | `/engine-out` | `EngineOutPage.tsx` | Inspect parsing engine output |
| Train Model | `/train-model` | `TrainModel.tsx` | Train template matching |
| Build Template | `/build-template` | `BuildTemplate.tsx` | Create SMS templates |
| Custom Parsing Rules | `/custom-parsing-rules` | `CustomParsingRules.tsx` | Manage custom rules |
| Keyword Bank | (in settings) | `KeywordBankManager.tsx` | Manage keyword mappings |
