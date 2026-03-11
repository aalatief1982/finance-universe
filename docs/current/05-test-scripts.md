# Xpensia — Manual Test Scripts

> **Status**: Living document  
> **Last synced with codebase**: 2026-03-11

---

## TS-01: Onboarding

| Step | Action | Expected Result |
|---|---|---|
| 1 | Clear app data, launch app | Onboarding slides appear |
| 2 | Swipe through 3 slides | Each slide renders correctly with content |
| 3 | Tap "Get Started" on last slide | `xpensia_onb_done` set, navigate to Set Default Currency |
| 4 | Select currency | Currency saved, navigate to Home |
| 5 | Close and reopen app | Onboarding skipped, goes to Home |

## TS-02: Home Dashboard

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to Home | Stats cards show income/expense/balance |
| 2 | Check charts tab | Category and timeline charts render |
| 3 | Verify recent transactions section | Shows up to 5 recent items |
| 4 | Tap FAB button | Navigates to Smart Entry |
| 5 | Check unconverted FX warning | Banner appears if multi-currency transactions exist without rates |

## TS-03: Smart Entry — Paste

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to Smart Entry | SmartPaste component visible |
| 2 | Paste bank SMS text (Arabic) | Text appears in input |
| 3 | Submit | Parsing runs, navigates to Edit Transaction |
| 4 | Verify parsed fields | Amount, currency, type, category populated |
| 5 | Check field confidence labels | Detected/suggested/needs_review labels shown |

## TS-04: Smart Entry — Voice

| Step | Action | Expected Result |
|---|---|---|
| 1 | Tap microphone icon | Voice recording starts |
| 2 | Speak transaction description | Transcript appears |
| 3 | Submit | Freeform parsing runs |
| 4 | Verify Edit Transaction | Fields populated from voice input |
| 5 | Source shows `voice-freeform` | Origin field correct |

## TS-05: SMS Review Inbox

| Step | Action | Expected Result |
|---|---|---|
| 1 | Receive financial SMS (or simulate) | Item appears in SMS inbox queue |
| 2 | Navigate to SMS Review (`/sms-review`) | Pending items shown as cards |
| 3 | Card shows parsed preview | Amount, date, payee displayed |
| 4 | Tap "Review" | Navigates to Edit Transaction with parsed data |
| 5 | Tap "Ignore" | Item removed from inbox |
| 6 | Check header badge | Count decrements after review/ignore |

## TS-06: SMS Notification Tap (Android Only)

| Step | Action | Expected Result |
|---|---|---|
| 1 | App in background, receive financial SMS | Local notification appears |
| 2 | Tap notification | App opens to SMS Review Inbox |
| 3 | SMS item visible in inbox | Parsed preview shown |
| 4 | Review item | Normal edit flow works |

## TS-07: Transaction Edit & Save

| Step | Action | Expected Result |
|---|---|---|
| 1 | Arrive at Edit Transaction (from any source) | Form populated with parsed data |
| 2 | Check field labels (detected/suggested) | Confidence indicators visible |
| 3 | Edit amount field | Value updates |
| 4 | Change category | Category updates |
| 5 | Save transaction | Transaction persisted to storage |
| 6 | Verify learning | Learned entry created with confirmed fields |
| 7 | Parse similar message again | Higher confidence on matched fields |

## TS-08: Transaction List

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to Transactions | List grouped by date |
| 2 | Use search | Results filter by search term |
| 3 | Apply type filter (income/expense) | List filters correctly |
| 4 | Apply date range filter | Only transactions in range shown |
| 5 | Tap transaction | Edit dialog opens |
| 6 | Delete transaction | Item removed from list |

## TS-09: Analytics

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to Analytics | Charts render |
| 2 | Change period (week/month/year) | Data updates |
| 3 | View category breakdown | Categories with amounts shown |
| 4 | Expand subcategory | Drill-down data correct |
| 5 | Check FX totals | Amounts aggregated in default currency |

## TS-10: Budget Management

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to Budget hub | Budget list shown |
| 2 | Create new budget | Form works, budget saved |
| 3 | View budget report | Spending vs budget displayed |
| 4 | Check budget insights | Analysis/recommendations shown |
| 5 | Manage accounts | Account list editable |

## TS-11: Settings

| Step | Action | Expected Result |
|---|---|---|
| 1 | Toggle theme (light/dark) | Theme changes immediately |
| 2 | Change default currency | Currency updates across app |
| 3 | Export data as CSV | File downloaded/shared |
| 4 | Export data as JSON | File downloaded/shared |
| 5 | Import data from CSV | Transactions loaded correctly |
| 6 | Reset all data | Confirmation dialog, data cleared |
| 7 | Toggle background SMS (Android) | Permission requested, setting saved |

## TS-12: Profile

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to Profile | User info displayed |
| 2 | Edit name | Name updates |
| 3 | Change avatar (camera) | Photo captured and saved |
| 4 | Delete avatar | Fallback initials shown |

## TS-13: Exchange Rates

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate to Exchange Rates | Rate list displayed |
| 2 | Edit a rate | Rate updates |
| 3 | Verify dashboard totals | FX conversion uses updated rate |

## TS-14: Share Sheet (Android Only)

| Step | Action | Expected Result |
|---|---|---|
| 1 | Share text from any app to Xpensia | App opens to Smart Entry |
| 2 | Shared text auto-populated | Text appears in SmartPaste input |
| 3 | Submit | Normal parse flow |

## TS-15: Data Persistence

| Step | Action | Expected Result |
|---|---|---|
| 1 | Add several transactions | Data persisted |
| 2 | Close and reopen app | All data preserved |
| 3 | Check on web (localStorage) | Data accessible |
| 4 | Check on Android (Preferences) | Data accessible via Capacitor |
