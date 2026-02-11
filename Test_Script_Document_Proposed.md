# QA Test Script: Xpensia Finance Universe — Android Device

**Version**: 1.2.0  
**Date**: 2026-02-11  
**Scope**: Full Regression & Release Validation  
**Target**: Android Native APK (Real Device Required)  
**Estimated Execution Time**: ~4 hours

---

## 1. Getting Started (Freelancer Setup Guide)

### 1.1 App Access

| Item | Details |
|------|---------|
| **APK Download** | _(To be provided by project owner)_ |
| **Web Preview** | https://finance-universe.lovable.app |
| **Base Currency** | SAR (Saudi Riyal) — set during first use |

### 1.2 Device Requirements

- Android 10+ (API level 29+)
- Real device with SIM card (required for SMS tests)
- Minimum 3GB RAM recommended
- Camera access (for future features, not currently tested)

### 1.3 Initial Setup Steps

1. Install the APK on your device
2. Complete the onboarding carousel (3 slides → "Start Your Journey")
3. Grant SMS permissions when prompted
4. Create at least 2 accounts:
   - "Main Bank" (SAR, initial balance: 10,000)
   - "Cash Wallet" (SAR, initial balance: 500)
5. Optionally create a foreign currency account:
   - "USD Account" (USD, initial balance: 1,000)

### 1.4 Seed Test Data (Create Before Testing)

After setup, add these transactions to enable meaningful testing across all sections:

| # | Type | Amount | Currency | Category | Account | Date |
|---|------|--------|----------|----------|---------|------|
| 1 | Expense | 150 | SAR | Food & Dining | Main Bank | Today |
| 2 | Expense | 300 | USD | Shopping | USD Account | Today |
| 3 | Income | 5,000 | SAR | Salary | Main Bank | 1st of month |
| 4 | Transfer | 200 | SAR | — | Main Bank → Cash Wallet | Yesterday |
| 5 | Expense | 80 | SAR | Transport | Cash Wallet | 2 days ago |

### 1.5 Known Limitations on Android

- OTA update checks require network connectivity
- Some chart animations may differ from web preview
- Beta feature codes are provided separately if applicable

### 1.6 Communication Protocol

- **Bug Reports**: Use the template in Section 16
- **Screenshots**: Capture Before / During / After for each failed test
- **Console Logs**: Use Android Studio logcat if available, or note any on-screen errors
- **Severity Levels**: Blocker > Critical > Major > Minor

---

## 2. Test Execution Strategy

### 2.1 Priority Definitions

| Priority | Meaning | Impact on Release |
|----------|---------|-------------------|
| **P0 (Blocker)** | Critical paths — if these fail, release is blocked | App launch, Add Transaction, Dashboard accuracy |
| **P1 (Critical)** | Core features — major functionality must work | Budget creation, SMS parsing, Transfers |
| **P2 (Major)** | Secondary features & edge cases | Settings, visual glitches, data export |
| **P3 (Minor)** | Polish & nice-to-haves | Accessibility, animations |

### 2.2 Status Legend

| Status | Meaning |
|--------|---------|
| **Pass** | Behavior matches expected output exactly |
| **Fail** | Bug found — fill in Actual Output and Notes |
| **Blocked** | Cannot execute due to another failing test |
| **N/A** | Not applicable for current build |

### 2.3 Table Columns Guide

Every test table has these columns:
- **ID**: Unique test case identifier
- **Scenario**: What is being tested
- **Preconditions**: Required state before testing
- **Steps**: Numbered actions to perform
- **Expected Result**: What should happen
- **Actual Output**: _(Tester fills this in)_
- **Status**: Pass / Fail / Blocked / N/A
- **Notes**: Screenshots, console errors, observations

---

## 3. Onboarding Flow (P0)

| ID | Scenario | Preconditions | Steps | Expected Result | Actual Output | Status | Notes |
|:---|:---------|:-------------|:------|:----------------|:-------------|:-------|:------|
| **TC-ONB-001** | **Fresh Install Onboarding** | Fresh install or cleared app data | 1. Launch app for the first time.<br>2. View Slide 1: "Track Expenses Instantly".<br>3. Swipe to Slide 2: "Auto-Categorized for You".<br>4. Swipe to Slide 3: "See Where Your Money Goes".<br>5. Tap "Start Your Journey". | 1. Carousel displays 3 slides with smooth transitions.<br>2. Progress dots indicate current slide.<br>3. Redirects to `/home`.<br>4. `xpensia_onb_done` flag set to `true`. | | | |
| **TC-ONB-002** | **Returning User Bypass** | Onboarding previously completed | 1. Close and relaunch the app. | App directly loads Home screen, skipping onboarding slides. | | | |
| **TC-ONB-003** | **SMS Permission Prompt** | Onboarding just completed, `sms_prompt_shown` not set | 1. Complete onboarding and arrive at Home.<br>2. Wait ~5 seconds.<br>3. Observe "Never Miss a Transaction" prompt.<br>4. Tap "Enable Now" or "Maybe Later". | "Enable Now" → System SMS permission dialog appears.<br>"Maybe Later" → Toast shows settings path, prompt closes.<br>`sms_prompt_shown` flag set. | | | |

---

## 4. Dashboard & Home (P0)

| ID | Scenario | Preconditions | Steps | Expected Result | Actual Output | Status | Notes |
|:---|:---------|:-------------|:------|:----------------|:-------------|:-------|:------|
| **TC-HOME-001** | **View Dashboard Summary** | Transactions exist (seed data) | 1. Navigate to Home.<br>2. View balance card (income, expenses, net).<br>3. Check recent transactions list.<br>4. Check expense chart. | Balance card shows accurate totals.<br>Recent transactions show up to 5 items.<br>Charts render without errors. | | | |
| **TC-HOME-002** | **Dashboard Empty State** | No transactions | 1. Clear all transactions (Settings → Data Management → Clear All).<br>2. Navigate to Home. | Balance shows 0.00 SAR.<br>Empty state message/illustration displayed.<br>Quick action buttons still accessible. | | | |
| **TC-HOME-003** | **Filter by Type** | Mixed income/expense transactions | 1. On Home, observe filter tabs (All, Income, Expense).<br>2. Tap "Income" tab.<br>3. Tap "Expense" tab.<br>4. Tap "All" tab. | Transactions list filters accordingly.<br>Charts update to reflect filtered data. | | | |
| **TC-HOME-004** | **Period Selection** | Transactions span multiple periods | 1. Locate period selector (Week/Month/Year).<br>2. Switch between different periods.<br>3. Observe data changes. | Summary and charts update for selected period only. | | | |

---

## 5. Transaction Management (P0/P1)

| ID | Scenario | Priority | Preconditions | Steps | Expected Result | Actual Output | Status | Notes |
|:---|:---------|:---------|:-------------|:------|:----------------|:-------------|:-------|:------|
| **TC-TXN-001** | **Add Expense** | P0 | — | 1. Tap FAB (+).<br>2. Select "Expense".<br>3. Enter amount: 50.00.<br>4. Select category: "Food & Dining".<br>5. Select subcategory: "Restaurants".<br>6. Enter vendor: "Starbucks".<br>7. Select date: Today.<br>8. Select account: Wallet.<br>9. Tap "Save Transaction". | Toast: "Transaction saved successfully".<br>Redirects to Transactions list.<br>New transaction at top.<br>Account balance updated. | | | |
| **TC-TXN-002** | **Add Income** | P0 | — | 1. Tap FAB (+).<br>2. Select "Income".<br>3. Enter amount: 5000.00.<br>4. Select category: "Salary".<br>5. Select account: Main Bank.<br>6. Tap "Save Transaction". | Transaction saved with positive amount.<br>Income reflected in dashboard totals. | | | |
| **TC-TXN-003** | **Edit Transaction** | P1 | At least 1 transaction exists | 1. Go to Transactions list.<br>2. Tap an existing transaction.<br>3. Modify amount + category.<br>4. Tap "Save Transaction". | Toast: "Transaction updated".<br>OLD values replaced.<br>Dashboard totals recalculate immediately. | | | |
| **TC-TXN-004** | **Delete Transaction** | P1 | At least 1 transaction exists | 1. Open a transaction for editing.<br>2. Tap "Delete".<br>3. Confirm deletion. | Toast: "Transaction deleted".<br>Removed from list.<br>Dashboard totals recalculated. | | | |
| **TC-TXN-005** | **Transaction List Filtering** | P1 | Multiple transactions exist | 1. Open Transactions page.<br>2. Use type filter (All/Income/Expense).<br>3. Use category filter.<br>4. Use date range filter.<br>5. Use search by description. | List updates to show matching transactions.<br>Filter indicators visible.<br>Clear filters restores full list. | | | |
| **TC-TXN-006** | **Transaction Scroll/Pagination** | P2 | 20+ transactions exist | 1. Open Transactions page.<br>2. Scroll to bottom of list. | Smooth infinite scroll or "Load More" button.<br>No duplicate transactions. | | | |

---

## 6. Transfer Management (P1)

| ID | Scenario | Preconditions | Steps | Expected Result | Actual Output | Status | Notes |
|:---|:---------|:-------------|:------|:----------------|:-------------|:-------|:------|
| **TC-TRF-001** | **Create Transfer** | At least 2 accounts exist | 1. Tap FAB (+).<br>2. Select "Transfer".<br>3. Enter amount: 100.00.<br>4. From: Main Bank, To: Cash Wallet.<br>5. Tap "Save Transaction". | Two linked transactions created (outflow + inflow).<br>Both accounts updated correctly.<br>Transfer excluded from income/expense totals. | | | |
| **TC-TRF-002** | **Edit Transfer** | A transfer exists | 1. Find a transfer in Transactions list.<br>2. Tap to edit.<br>3. Change the amount.<br>4. Save changes. | Both linked transactions updated.<br>Account balances reflect new amount. | | | |
| **TC-TRF-003** | **Delete Transfer** | A transfer exists | 1. Open a transfer for editing.<br>2. Delete the transaction.<br>3. Confirm deletion. | Both linked transactions removed.<br>Account balances restored. | | | |

---

## 7. Smart Import — Paste & Parse (P1)

| ID | Scenario | Preconditions | Steps | Expected Result | Actual Output | Status | Notes |
|:---|:---------|:-------------|:------|:----------------|:-------------|:-------|:------|
| **TC-SIP-001** | **Parse Valid Bank SMS** | — | 1. Navigate to Paste & Parse.<br>2. Paste: "Your account XXX1234 has been debited with SAR 150.00 at CARREFOUR on 25-Jan-2025".<br>3. Tap "Extract Transaction". | Amount: 150.00 SAR.<br>Vendor: CARREFOUR.<br>Type: Expense.<br>Date parsed correctly. | | | |
| **TC-SIP-002** | **Parse Credit/Income SMS** | — | 1. Navigate to Paste & Parse.<br>2. Paste: "Your account XXX5678 has been credited with SAR 5000.00 - Salary".<br>3. Tap "Extract Transaction". | Type: Income.<br>Amount: 5000.00.<br>Category suggestion based on keywords. | | | |
| **TC-SIP-003** | **Parse Multi-Currency SMS** | — | 1. Paste: "Payment of USD 25.99 at Amazon.com".<br>2. Extract transaction. | Currency: USD detected.<br>Amount: 25.99.<br>Vendor: Amazon.com. | | | |
| **TC-SIP-004** | **Handle Non-Financial Text** | — | 1. Paste: "Hello, this is just a regular text message".<br>2. Tap "Extract Transaction". | "No match" indicator shown.<br>Option to manually enter details.<br>No crash or error. | | | |
| **TC-SIP-005** | **Save Parsed Transaction** | Successfully parsed a message | 1. Parse a valid SMS.<br>2. Review extracted details.<br>3. Make any edits.<br>4. Tap "Save" or "Add Transaction". | Transaction saved.<br>Appears in transactions list.<br>Template learning triggered if applicable. | | | |
| **TC-SIP-006** | **Batch Import** | — | 1. Paste multiple SMS messages separated by newlines.<br>2. Tap "Extract Transaction".<br>3. Review parsed transactions. | Multiple transactions detected.<br>Each shown with confidence score.<br>Batch save option available. | | | |

---

## 8. SMS Import — Native Android (P1)

> **⚠️ Requires real Android device with SIM card and SMS permissions granted.**

| ID | Scenario | Preconditions | Steps | Expected Result | Actual Output | Status | Notes |
|:---|:---------|:-------------|:------|:----------------|:-------------|:-------|:------|
| **TC-SMS-001** | **Read SMS History** | SMS permission granted | 1. Navigate to "Import SMS".<br>2. Select date range for import.<br>3. Tap "Scan Messages".<br>4. Review detected transactions. | Messages filtered for financial keywords.<br>Transactions extracted and displayed.<br>Option to select/deselect items. | | | |
| **TC-SMS-002** | **Background SMS Auto-Import** | SMS auto-import enabled, Background listener active | 1. Enable SMS auto-import in Settings.<br>2. Receive a bank SMS on device (real or test).<br>3. If app foreground: check for navigation to edit screen.<br>4. If app backgrounded: check for notification. | Financial SMS detected automatically.<br>Transaction pre-filled for review.<br>Notification shown if app backgrounded. | | | |
| **TC-SMS-003** | **Train Model with Correction** | A transaction was parsed with wrong category | 1. Import an SMS that was wrongly categorized.<br>2. Correct the category.<br>3. Save the transaction. | Template bank updated with new pattern.<br>Future similar messages categorized correctly. | | | |

---

## 9. Budget Management (P1)

| ID | Scenario | Preconditions | Steps | Expected Result | Actual Output | Status | Notes |
|:---|:---------|:-------------|:------|:----------------|:-------------|:-------|:------|
| **TC-BUD-001** | **Navigate to Budget Hub** | — | 1. Tap "Budget" in navigation. | Budget Hub loads with tabs: Dashboard, Reports, Insights, Accounts.<br>Period selector visible.<br>Existing budgets displayed as cards. | | | |
| **TC-BUD-002** | **Create Overall Yearly Budget** | — | 1. On Budget Hub, tap "+" or "Create Budget".<br>2. Scope: "Overall".<br>3. Period: "Yearly".<br>4. Year: Current year.<br>5. Amount: 50000.<br>6. Tap "Save Budget". | Budget saved.<br>Appears on Budget Hub as card.<br>Shows allocated vs remaining. | | | |
| **TC-BUD-003** | **Create Category Budget** | — | 1. Create new budget.<br>2. Scope: "Category".<br>3. Category: "Food & Dining".<br>4. Period: "Monthly".<br>5. Amount: 500.<br>6. Save. | Category budget created.<br>Independent of overall budget.<br>Tracked separately in reports. | | | |
| **TC-BUD-004** | **Yearly to Quarterly Cascade** | Overall yearly budget exists | 1. Edit a yearly budget.<br>2. Enable "Cascade to periods".<br>3. Review distribution preview.<br>4. Confirm. | 4 quarterly budgets created automatically.<br>Each quarter proportional.<br>Total matches yearly budget. | | | |
| **TC-BUD-005** | **Budget vs Actual Report** | Budgets + transactions exist | 1. Navigate to Budget → Reports tab.<br>2. Select period for comparison.<br>3. View budget vs actual breakdown. | Each budget shows allocated, spent, remaining.<br>Visual indicators for over/under budget.<br>Progress bars or charts. | | | |
| **TC-BUD-006** | **Budget Insights** | Sufficient transaction history | 1. Navigate to Budget → Insights tab.<br>2. Review spending patterns.<br>3. View suggestions. | Insights based on spending patterns.<br>Actionable recommendations.<br>Comparison to previous periods. | | | |
| **TC-BUD-007** | **Edit Budget** | Budget exists | 1. Tap a budget card → Edit.<br>2. Modify amount.<br>3. Save. | Budget updated.<br>Reports reflect new amount. | | | |
| **TC-BUD-008** | **Delete Budget** | Budget exists | 1. Open budget for editing.<br>2. Tap "Delete Budget".<br>3. Confirm. | Budget removed.<br>No longer in hub or reports. | | | |

---

## 10. Accounts Management (P1)

| ID | Scenario | Preconditions | Steps | Expected Result | Actual Output | Status | Notes |
|:---|:---------|:-------------|:------|:----------------|:-------------|:-------|:------|
| **TC-ACC-001** | **View All Accounts** | — | 1. Navigate to Budget → Accounts tab. | All accounts displayed with names and balances.<br>Account types indicated.<br>Transaction count per account shown. | | | |
| **TC-ACC-002** | **Create Account** | — | 1. Tap "Add Account".<br>2. Name: "Savings Account".<br>3. Type: "Bank".<br>4. Balance: 10000.<br>5. Select currency.<br>6. Save. | Account created.<br>Appears in accounts list.<br>Available in transaction dropdowns. | | | |
| **TC-ACC-003** | **Edit Account** | Account exists | 1. Tap on an account → Edit.<br>2. Change name + type.<br>3. Save. | Account updated.<br>Changes reflected everywhere account is shown. | | | |
| **TC-ACC-004** | **Delete Account (No Transactions)** | Account with 0 transactions | 1. Select unused account.<br>2. Tap "Delete".<br>3. Confirm. | Account deleted.<br>No longer in list or dropdowns. | | | |
| **TC-ACC-005** | **Delete Account (Has Transactions)** | Account has linked transactions | 1. Attempt to delete an account with transactions. | Deletion blocked.<br>Error: "Cannot delete account with linked transactions". | | | |
| **TC-ACC-006** | **Unmanaged Accounts Detection** | Transactions with unlisted account names | 1. View Accounts page.<br>2. Check "Unmanaged Accounts" section. | List of account names from transactions not formally created.<br>Option to "Create Account" for each. | | | |

---

## 11. Analytics & Reports (P1)

| ID | Scenario | Preconditions | Steps | Expected Result | Actual Output | Status | Notes |
|:---|:---------|:-------------|:------|:----------------|:-------------|:-------|:------|
| **TC-ANA-001** | **Monthly Trends Chart** | Transactions span multiple months | 1. Navigate to Analytics.<br>2. View monthly trend chart.<br>3. Toggle income/expense views. | Line or bar chart showing trends.<br>Data points for each month.<br>Tooltip on tap. | | | |
| **TC-ANA-002** | **Category Breakdown** | Categorized transactions exist | 1. On Analytics, locate category chart.<br>2. View expense distribution.<br>3. Tap on a segment. | Pie/donut chart with category segments.<br>Legend with amounts.<br>Drill-down to transactions. | | | |
| **TC-ANA-003** | **Net Balance Timeline** | Transactions over time | 1. View net balance chart.<br>2. Observe cumulative trend. | Running total visualization.<br>Positive/negative areas distinguished. | | | |
| **TC-ANA-004** | **Transfers Excluded from Totals** | Transfers + regular transactions exist | 1. Note total income and expense values.<br>2. Verify transfers are not counted. | Transfer amounts excluded from income/expense totals. | | | |
| **TC-ANA-005** | **Export Analytics Data** | Analytics data exists | 1. Navigate to Analytics or Budget Report.<br>2. Tap "Export".<br>3. Select CSV format.<br>4. Download/share file. | File generated successfully.<br>Data matches on-screen values. | | | |

---

## 12. FX / Multi-Currency (P1)

> **These tests target recent FX bug fixes. Pay close attention to converted amounts.**

| ID | Scenario | Preconditions | Steps | Expected Result | Actual Output | Status | Notes |
|:---|:---------|:-------------|:------|:----------------|:-------------|:-------|:------|
| **TC-FX-001** | **SAR Expense — Base Currency** | Base currency: SAR | 1. Add expense: 200 SAR, category: Food.<br>2. Save.<br>3. Check Home dashboard cards. | Dashboard cards show correct SAR total (decreased by 200). | | | |
| **TC-FX-002** | **USD Expense with Manual FX Rate** | Base: SAR | 1. Add expense: 100 USD.<br>2. Enter manual FX rate (e.g., 3.75).<br>3. Save.<br>4. Check Home dashboard. | Stored as USD 100.<br>Dashboard shows SAR 375 deducted from totals.<br>Transaction shows "USD 100" with SAR equivalent. | | | |
| **TC-FX-003** | **Foreign Expense in Analytics** | USD expense exists | 1. Navigate to Analytics.<br>2. Check total expense amount. | USD expenses included in totals using converted (amountInBase) value, not raw foreign amount. | | | |
| **TC-FX-004** | **Dashboard Tab Totals with FX** | Multiple currency transactions | 1. View Home dashboard.<br>2. Switch between All / Income / Expense tabs.<br>3. Verify totals. | All tabs show amounts converted to base currency (SAR).<br>No raw foreign amounts shown in totals. | | | |
| **TC-FX-005** | **Edit FX Rate on Existing Transaction** | Foreign currency transaction exists | 1. Open a USD transaction.<br>2. Change the FX rate.<br>3. Save.<br>4. Check dashboard + analytics. | Totals recalculate with new rate immediately. | | | |
| **TC-FX-006** | **Delete Foreign Currency Transaction** | Foreign transaction exists | 1. Delete a USD transaction.<br>2. Check dashboard totals. | Totals revert correctly (converted amount removed). | | | |
| **TC-FX-007** | **Exchange Rates Page** | Network ON | 1. Navigate to Exchange Rates page (via menu or header).<br>2. View rates list.<br>3. Verify Xpensia logo in header. | Rates page loads.<br>Logo present and tapping it navigates to Home.<br>Rates display for common currency pairs. | | | |

---

## 13. Settings & Preferences (P2)

| ID | Scenario | Preconditions | Steps | Expected Result | Actual Output | Status | Notes |
|:---|:---------|:-------------|:------|:----------------|:-------------|:-------|:------|
| **TC-SET-001** | **Theme Switch** | — | 1. Open Settings.<br>2. Select "Dark" theme → observe.<br>3. Select "Light" theme → observe.<br>4. Select "System" theme. | Theme changes immediately.<br>Persists after app restart. | | | |
| **TC-SET-002** | **Change Default Currency** | — | 1. Open Settings.<br>2. Change currency from SAR to USD.<br>3. Save. | Currency symbol updates throughout app.<br>Setting persists. | | | |
| **TC-SET-003** | **Change Week Start Day** | — | 1. Open Settings.<br>2. Change "Week Start Day" to Monday.<br>3. Save. | Calendar views reflect new week start.<br>Weekly reports adjust. | | | |
| **TC-SET-004** | **Save Settings Confirmation** | Settings modified | 1. Change multiple settings.<br>2. Tap "Save Settings". | Toast: "Settings saved successfully".<br>All changes persisted. | | | |
| **TC-SET-005** | **Enable/Disable Notifications** | — | 1. Open Settings → Notifications.<br>2. Toggle "Enable Notifications".<br>3. Grant/deny system permission. | Setting saved.<br>System permission requested if enabling.<br>Toast confirms change. | | | |
| **TC-SET-006** | **SMS Auto-Import Toggle** | Android native | 1. Open Settings → SMS Settings.<br>2. Toggle ON → verify permission requested.<br>3. Toggle OFF → verify listener stopped. | Background SMS listener starts/stops.<br>Setting persisted. | | | |
| **TC-SET-007** | **Beta Features Activation** | Valid beta code | 1. Open Settings → Beta Features.<br>2. Tap "Activate Beta Features".<br>3. Enter valid code.<br>4. Tap "Activate". | Toast: "Beta features activated".<br>Beta features now visible. | | | |
| **TC-SET-008** | **View App Version** | — | 1. Open Settings.<br>2. Scroll to "About" section. | Version number displayed (e.g., "Version 1.0.2").<br>Build number if applicable. | | | |

---

## 14. Data Management (P2)

| ID | Scenario | Preconditions | Steps | Expected Result | Actual Output | Status | Notes |
|:---|:---------|:-------------|:------|:----------------|:-------------|:-------|:------|
| **TC-DAT-001** | **Export All Data** | Transactions exist | 1. Settings → Data Management → "Export Data".<br>2. Wait for file generation. | JSON file downloaded/shared.<br>Contains all transactions, accounts, budgets.<br>Toast: "Export successful". | | | |
| **TC-DAT-002** | **Export with No Data** | No transactions | 1. Clear all data.<br>2. Attempt export. | Toast: "No data to export" or empty file.<br>No crash. | | | |
| **TC-DAT-003** | **Import Valid JSON** | Valid export file on device | 1. Settings → Data Management → "Import Data".<br>2. Select valid JSON file.<br>3. Confirm import. | Data imported successfully.<br>Toast: "Import successful".<br>Transactions appear in list. | | | |
| **TC-DAT-004** | **Import Invalid File** | Corrupt/non-JSON file | 1. Tap "Import Data".<br>2. Select invalid file. | Error message displayed.<br>Toast: "Failed to parse file".<br>No data corruption. | | | |
| **TC-DAT-005** | **Clear Sample Data** | Sample data exists | 1. Settings → "Clear Sample Data".<br>2. Confirm in dialog. | Sample transactions removed.<br>User transactions preserved.<br>Toast: "Sample data cleared". | | | |
| **TC-DAT-006** | **Clear All Data** | Data exists | 1. Find "Clear All Data".<br>2. Read warning.<br>3. Type confirmation text.<br>4. Confirm. | All transactions, accounts, budgets deleted.<br>Settings preserved.<br>Redirected to clean state. | | | |

---

## 15. OTA Updates (P2)

> **Requires network connectivity. OTA is managed via Capgo.**

| ID | Scenario | Preconditions | Steps | Expected Result | Actual Output | Status | Notes |
|:---|:---------|:-------------|:------|:----------------|:-------------|:-------|:------|
| **TC-OTA-001** | **Check for Updates** | — | 1. Settings → OTA Debug section.<br>2. View current version info.<br>3. Tap "Check for Updates". | Current version displayed.<br>Manifest fetched.<br>Result: update available or up to date. | | | |
| **TC-OTA-002** | **Download Update** | Update available | 1. Trigger update check.<br>2. Tap "Download" in update dialog.<br>3. Wait for completion. | Progress indicator shown.<br>Download completes.<br>Bundle marked as pending. | | | |
| **TC-OTA-003** | **Apply Update on Background** | Bundle downloaded + pending | 1. After download, continue using app.<br>2. Press Home or switch apps.<br>3. Return to app. | New version active on next foreground.<br>Version number updated in Settings. | | | |
| **TC-OTA-004** | **Clear Pending Bundle** | Pending bundle exists | 1. View pending bundle info.<br>2. Tap "Clear Pending Bundle".<br>3. Confirm. | Pending bundle cleared.<br>App remains on current version. | | | |
| **TC-OTA-005** | **Network Failure During Update** | Update available | 1. Start update download.<br>2. Disconnect network mid-download. | Error shown gracefully.<br>Option to retry.<br>No app crash. | | | |

---

## 16. Error Handling & Edge Cases (P2/P3)

| ID | Scenario | Preconditions | Steps | Expected Result | Actual Output | Status | Notes |
|:---|:---------|:-------------|:------|:----------------|:-------------|:-------|:------|
| **TC-ERR-001** | **Invalid Amount Entry** | On transaction form | 1. In amount field, type "abc".<br>2. Attempt to save. | Validation error shown.<br>Save blocked until corrected. | | | |
| **TC-ERR-002** | **Negative Amount** | On transaction form | 1. Enter amount: -50.<br>2. Observe behavior. | Either prevented or auto-converted to positive.<br>Type handles sign logic. | | | |
| **TC-ERR-003** | **Unsaved Changes Warning** | Form with unsaved changes | 1. Modify a setting or transaction.<br>2. Navigate away without saving. | Warning dialog appears.<br>Options: Save, Discard, Cancel. | | | |
| **TC-ERR-004** | **Offline Mode** | Airplane Mode ON | 1. Enable airplane mode.<br>2. Continue using app.<br>3. Add/edit transactions. | Local storage operations work.<br>Offline indicators shown.<br>No crashes. | | | |
| **TC-ERR-005** | **404 Page Handling** | — | 1. Navigate to an invalid deep link or route. | 404 page displayed or redirect to Home.<br>Link to return to home. | | | |
| **TC-ERR-006** | **Error Boundary Recovery** | — | 1. If a component crashes, observe error boundary behavior. | Friendly error message shown.<br>"Show Details" reveals error info.<br>App remains usable. | | | |

---

## 17. Accessibility — Mobile (P3)

| ID | Scenario | Preconditions | Steps | Expected Result | Actual Output | Status | Notes |
|:---|:---------|:-------------|:------|:----------------|:-------------|:-------|:------|
| **TC-A11Y-001** | **Screen Reader (TalkBack)** | TalkBack enabled | 1. Navigate through app with TalkBack.<br>2. Verify labels announced correctly.<br>3. Check form field announcements. | All elements have appropriate labels.<br>Buttons announce purpose.<br>Forms have associated labels. | | | |
| **TC-A11Y-002** | **Color Contrast** | — | 1. Visually inspect text readability across screens.<br>2. Check both Light and Dark themes. | Text is readable in both themes.<br>No low-contrast text. | | | |
| **TC-A11Y-003** | **Touch Target Size** | — | 1. Check all interactive elements.<br>2. Verify touch targets are at least 44×44 pixels. | All buttons/links easily tappable.<br>No tiny hit areas. | | | |

---

## 18. Bug Report Template

Use this template for each failed test case:

```
## Bug Report

- **Test Case ID**: TC-___-___
- **Severity**: Blocker / Critical / Major / Minor
- **Device Model**: ___________________
- **Android Version**: ___________________
- **App Version**: ___________________
- **Steps to Reproduce**:
  1. ___
  2. ___
  3. ___
- **Expected Result**: ___________________
- **Actual Result**: ___________________
- **Screenshot/Video**: [attach file]
- **Console Errors (if any)**: [paste from logcat or on-screen error]
- **Frequency**: Always / Intermittent / Once
- **Additional Notes**: ___________________
```

---

## 19. Execution Time Estimates

| Section | Test Cases | Est. Time |
|---------|-----------|-----------|
| Onboarding | 3 | 15 min |
| Dashboard & Home | 4 | 20 min |
| Transactions | 6 | 40 min |
| Transfers | 3 | 20 min |
| Smart Import (Paste & Parse) | 6 | 30 min |
| SMS Import (Native) | 3 | 25 min |
| Budget Management | 8 | 35 min |
| Accounts Management | 6 | 25 min |
| Analytics & Reports | 5 | 20 min |
| FX / Multi-Currency | 7 | 30 min |
| Settings & Preferences | 8 | 25 min |
| Data Management | 6 | 20 min |
| OTA Updates | 5 | 20 min |
| Error Handling | 6 | 15 min |
| Accessibility | 3 | 15 min |
| **TOTAL** | **79** | **~5.5 hours** |

---

## 20. Deliverables Checklist

The freelancer must return the following:

- [ ] **Completed test script** — every row has Actual Output, Status, and Notes filled in
- [ ] **Bug reports** — one per failed test case, using the template above
- [ ] **Screenshots** — Before / During / After for every failed scenario
- [ ] **Console log export** — filtered by errors (from logcat if available)
- [ ] **1-paragraph summary** — overall impression of app stability, worst areas, and recommendations
- [ ] **Device info** — exact model, Android version, screen size, and app version tested

---

## 21. Navigation Reference

| Page | Route | Access From |
|------|-------|-------------|
| Onboarding | `/` (first launch) | App launch |
| Home/Dashboard | `/home` | Navigation menu |
| Transactions List | `/transactions` | Navigation menu |
| Add/Edit Transaction | `/edit-transaction/:id?` | FAB, transaction tap |
| Paste & Parse | `/import-transactions` | Navigation menu |
| Review SMS Transactions | `/review-sms-transactions` | After parsing |
| Process SMS (Android) | `/process-sms` | Import SMS menu |
| Exchange Rates | `/exchange-rates` | Header / menu |
| Analytics | `/analytics` | Navigation menu |
| Budget Hub | `/budget` | Navigation menu |
| Set Budget | `/budget/set/:id?` | Budget FAB |
| Budget Report | `/budget/report` | Budget tab |
| Budget Insights | `/budget/insights` | Budget tab |
| Accounts | `/budget/accounts` | Budget tab |
| Settings | `/settings` | Navigation menu |

---

## 22. Test Execution Summary

| Category | Total | Passed | Failed | Blocked | N/A |
|----------|-------|--------|--------|---------|-----|
| Onboarding | 3 | | | | |
| Dashboard & Home | 4 | | | | |
| Transactions | 6 | | | | |
| Transfers | 3 | | | | |
| Smart Import | 6 | | | | |
| SMS Import | 3 | | | | |
| Budget Management | 8 | | | | |
| Accounts | 6 | | | | |
| Analytics & Reports | 5 | | | | |
| FX / Multi-Currency | 7 | | | | |
| Settings | 8 | | | | |
| Data Management | 6 | | | | |
| OTA Updates | 5 | | | | |
| Error Handling | 6 | | | | |
| Accessibility | 3 | | | | |
| **TOTAL** | **79** | | | | |

---

## 23. Sign-off

| Field | Value |
|-------|-------|
| **Tester Name** | ___________________ |
| **Device Model** | ___________________ |
| **Android Version** | ___________________ |
| **App Version** | ___________________ |
| **Screen Size** | ___________________ |
| **Run Date** | ___________________ |
| **Total Time Spent** | ___________________ |
| **Overall Result** | [ ] Pass / [ ] Fail / [ ] Conditional Pass |

**Summary / Notes**:

---

*Document Version: 1.2.0*  
*Last Updated: 2026-02-11*  
*Prepared for: Freelance QA Engagement via Freelancer.com*
