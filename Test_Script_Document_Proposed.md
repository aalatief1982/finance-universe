# QA Test Script: Xpensia Finance Universe

**Version**: 1.2.0-Proposed  
**Date**: 2026-02-11  
**Scope**: Full Regression & Release Validation  
**Target Environments**:
- **Web**: Chrome/Edge (Desktop & Mobile Emulation)
- **Android**: Native APK (Real Device required for SMS/Permissions)

---

## 1. Test Execution Strategy

### Priority Definitions
- **P0 (Blocker)**: Critical paths. If these fail, release is blocked. (e.g., App launch, Add Transaction).
- **P1 (Critical)**: Core features. Major functionality must work. (e.g., Budget creation, SMS parsing).
- **P2 (Major)**: Secondary features & edge cases. (e.g., specific settings, visual glitches).

### Status Legend
- **Pass**: Behavior matches expected output.
- **Fail**: Bug found (Link to issue ticket).
- **Blocked**: Cannot execute due to another issue.
- **N/A**: Not applicable for current build/device.

---

## 2. Test Cases

### 2.1 Onboarding & First-Run (P0)

| ID | Scenario | Preconditions | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ONB-001** | **Fresh Install Onboarding** | App data cleared/Fresh Install | 1. Launch app.<br>2. Complete welcome slides.<br>3. Tap "Get Started". | 1. Slides display correctly.<br>2. User lands on `/home`.<br>3. `onboarding_complete` flag set. | |
| **ONB-002** | **Returning User Bypass** | `onboarding_complete = true` | 1. Relaunch app. | User skips slides and lands directly on `/home`. | |
| **ONB-003** | **SMS Permission (Android)** | Android Native, Post-Onboarding | 1. Navigate to Home.<br>2. Wait for system/app prompt.<br>3. Grant/Deny permission. | 1. Prompt appears once.<br>2. Selection is persisted.<br>3. No crash on interaction. | |

### 2.2 Home & Dashboard (P0)

| ID | Scenario | Preconditions | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DASH-001** | **Summary Cards Accuracy** | Transactions exist | 1. View "Total Balance", "Income", "Expense" cards.<br>2. Sum visible transactions manually. | Dashboard totals match sum of individual transactions exactly. | |
| **DASH-002** | **Empty State** | No transactions (New Profile) | 1. Clear data (`Settings -> Reset`).<br>2. View Home. | 1. Totals show 0.00 / Currency Symbol.<br>2. "No transactions" placeholder visible.<br>3. CTA to add transaction exists. | |
| **DASH-003** | **Period Filtering** | Data across months | 1. Toggle "This Week", "This Month", "All Time". | Metrics and list update to reflect ONLY the selected range. | |

### 2.3 Transaction Management (P0/P1)

| ID | Scenario | Preconditions | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TXN-001** | **Create Expense** (P0) | - | 1. Tap FAB (+).<br>2. Select "Expense".<br>3. Enter Amt: 100, Cat: Food.<br>4. Save. | 1. Transaction saved.<br>2. Home balance decreases by 100.<br>3. Appears in "Recent Activity". | |
| **TXN-002** | **Create Income** (P0) | - | 1. Tap FAB (+).<br>2. Select "Income".<br>3. Enter Amt: 5000.<br>4. Save. | 1. Transaction saved.<br>2. Home balance increases by 5000. | |
| **TXN-003** | **Create Transfer** (P1) | 2 Accounts exist | 1. Tap FAB (+).<br>2. Select "Transfer".<br>3. From: Bank, To: Cash.<br>4. Save. | 1. No change in "Net Worth".<br>2. Bank decreases, Cash increases.<br>3. Excluded from "Expense" reports. | |
| **TXN-004** | **Edit Transaction** (P1) | 1 Transaction exists | 1. Tap transaction.<br>2. Update Amount + Category.<br>3. Save. | OLD values replaced. Dashboard totals recalculate immediately. | |
| **TXN-005** | **Delete Transaction** (P1) | 1 Transaction exists | 1. Tap transaction.<br>2. Select Delete.<br>3. Confirm. | Item removed from list. Dashboard totals revert change. | |
| **TXN-006** | **Validation** (P2) | - | 1. Submit empty form.<br>2. Submit negative amount. | Save button disabled OR error message shown. | |

### 2.4 Smart Import / SMS (P1 - Mobile Priority)

| ID | Scenario | Preconditions | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **IMP-001** | **Manual Paste-Parse** | Clipboard has bank SMS | 1. Go to Import.<br>2. Paste text.<br>3. "Parse". | Fields (Amount, Vendor, Date) extracted correctly into form. | |
| **IMP-002** | **Background SMS Listener** | Android, Permission ON | 1. Receive *real* dummy bank SMS.<br>2. Observe notification/app. | App detects SMS, notifies user "New Transaction Detected". | |
| **IMP-003** | **Bulk Import** | - | 1. Paste 5 SMS messages.<br>2. Parse. | 5 separate draft transactions generated. | |

### 2.5 Budgeting (P1)

| ID | Scenario | Preconditions | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUD-001** | **Create Category Budget** | - | 1. Go to Budget.<br>2. Create "Dining" limit.<br>3. Set amount. | Budget progress bar appears. | |
| **BUD-002** | **Budget Overflow** | Budget exists | 1. Add expense > budget limit. | Budget bar turns Red/Warns user. | |
| **BUD-003** | **Multiple Budgets** | - | 1. Create Overall Limit.<br>2. Create Category Limit. | Both track independently without conflict. | |

### 2.6 Accounts & Multi-Currency (FX) (P2)

| ID | Scenario | Preconditions | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FX-001** | **Multi-Currency Transaction** | Base: USD | 1. Add Expense in EUR.<br>2. Enter FX Rate (or fetch).<br>3. Save. | stored as EUR, amount converted to USD for totals. | |
| **FX-002** | **Exchange Rate Updates** | Network ON | 1. Go to Settings/Rates.<br>2. Refresh Rates. | Rates update to latest API values. | |
| **ACC-001** | **Add Account** | - | 1. Create "Savings" account.<br>2. Initial Balance: 1000. | Account appears in filters and transfer lists. | |

### 2.7 Settings & Data (P2)

| ID | Scenario | Preconditions | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SET-001** | **Theme Switch** | - | 1. Toggle Dark/Light mode. | UI updates immediately. Persists on restart. | |
| **DATA-001** | **Export CSV** | Data exists | 1. Settings -> Data -> Export. | CSV file generated & downloaded/shared. Content matches DB. | |
| **DATA-002** | **Import JSON** | Backup file available | 1. Settings -> Data -> Import. | Data restored. Duplicates handled (merged or skipped). | |

### 2.8 Edge Cases & Errors (P3)

| ID | Scenario | Preconditions | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ERR-001** | **Offline Mode** | Airplane Mode ON | 1. Launch App.<br>2. Add Transaction. | Data saves locally. Syncs/Updates when online (if cloud enabled). | |
| **ERR-002** | **Corrupt Import** | - | 1. Import broken JSON file. | "Invalid File" error. App DOES NOT crash. | |
| **NAV-001** | **404 Handling** | Web | 1. Visit `/random-url`. | "Page Not Found" or Redirect to Home. | |

---

## 3. Sign-off

**Tester Environment**: ___________________  
**Device Model**: ___________________  
**OS Version**: ___________________  
**Run Date**: ___________________  
**Result**: [ ] Pass / [ ] Fail / [ ] Conditional Pass

**Notes**:
