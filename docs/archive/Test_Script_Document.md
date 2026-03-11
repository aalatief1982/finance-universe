# Test Script Document

## App Name: Xpensia Finance Universe
**Version**: 1.0.x  
**Date**: January 2025  
**Document Type**: QA Test Script with Scenarios, Steps, and Navigation Screenshots

---

## Table of Contents

1. [Onboarding Flow](#1-onboarding-flow)
2. [Dashboard & Home](#2-dashboard--home)
3. [Transaction Management](#3-transaction-management)
4. [Transfer Management](#4-transfer-management)
5. [Smart Import (Paste & Parse)](#5-smart-import-paste--parse)
6. [SMS Import](#6-sms-import)
7. [Budget Management](#7-budget-management)
8. [Accounts Management](#8-accounts-management)
9. [Analytics & Reports](#9-analytics--reports)
10. [Settings & Preferences](#10-settings--preferences)
11. [Data Management](#11-data-management)
12. [OTA Updates](#12-ota-updates)
13. [Error Handling & Edge Cases](#13-error-handling--edge-cases)
14. [Accessibility](#14-accessibility)

---

## Test Case Template

| Field | Description |
|-------|-------------|
| **TC-ID** | Unique test case identifier |
| **Scenario** | Brief description of what's being tested |
| **Preconditions** | Required state before testing |
| **Steps** | Numbered list of actions |
| **Navigation** | Route/screen path |
| **Expected Output** | What should happen |
| **Actual Output** | (Leave blank for tester entry) |
| **Status** | Pass/Fail/Blocked |

---

## 1. Onboarding Flow

### TC-ONB-001: Complete Onboarding Carousel
- **Scenario**: New user completes the 3-slide onboarding walkthrough
- **Preconditions**: Fresh app install or cleared localStorage
- **Navigation**: `/` → Onboarding Carousel
- **Steps**:
  1. Launch the app for the first time
  2. View Slide 1: "Track Expenses Instantly" with SMS parsing description
  3. Swipe or tap to proceed to Slide 2: "Auto-Categorized for You"
  4. Swipe or tap to proceed to Slide 3: "See Where Your Money Goes"
  5. Tap "Start Your Journey" button
- **Expected Output**: 
  - Carousel displays 3 slides with smooth transitions
  - Progress dots indicate current slide
  - After completion, redirects to `/home`
  - localStorage flag `xpensia_onb_done` is set to `true`
- **Actual Output**: 
- **Status**: 
- **Screenshot Reference**: Onboarding Slide 1 → Slide 2 → Slide 3 → Home

---

### TC-ONB-002: Skip Onboarding for Returning Users
- **Scenario**: Returning user bypasses onboarding
- **Preconditions**: `xpensia_onb_done` = `true` in localStorage
- **Navigation**: `/` → `/home`
- **Steps**:
  1. Launch the app with onboarding already completed
  2. Observe the landing page
- **Expected Output**: App directly loads the Home/Dashboard screen
- **Actual Output**: 
- **Status**: 

---

### TC-ONB-003: SMS Permission Prompt (Android Native)
- **Scenario**: Post-onboarding SMS permission request
- **Preconditions**: 
  - Native Android device
  - Onboarding just completed
  - `sms_prompt_shown` not set
- **Navigation**: `/home` → SMS Permission Dialog
- **Steps**:
  1. Complete onboarding and arrive at Home
  2. Wait 5 seconds
  3. Observe the "Never Miss a Transaction" prompt
  4. Tap "Enable Now" or "Maybe Later"
- **Expected Output**: 
  - "Enable Now": System permission dialog appears
  - "Maybe Later": Toast shows settings path, prompt closes
  - `sms_prompt_shown` flag set in storage
- **Actual Output**: 
- **Status**: 

---

## 2. Dashboard & Home

### TC-HOME-001: View Dashboard Summary
- **Scenario**: View financial summary on home screen
- **Preconditions**: User has transactions in the system
- **Navigation**: `/home`
- **Steps**:
  1. Navigate to Home
  2. View the balance card showing income, expenses, and net balance
  3. Observe the recent transactions list
  4. Check the expense distribution chart
- **Expected Output**: 
  - Balance card displays accurate totals
  - Recent transactions show up to 5 items
  - Charts render without errors
- **Actual Output**: 
- **Status**: 

---

### TC-HOME-002: Dashboard with No Transactions
- **Scenario**: View empty dashboard state
- **Preconditions**: No transactions exist
- **Navigation**: `/home`
- **Steps**:
  1. Clear all transactions
  2. Navigate to Home
  3. Observe empty state UI
- **Expected Output**: 
  - Balance shows $0.00
  - Empty state message or illustration displayed
  - Quick action buttons still accessible
- **Actual Output**: 
- **Status**: 

---

### TC-HOME-003: Filter Transactions by Type
- **Scenario**: Toggle between All/Income/Expense views
- **Preconditions**: Mixed transactions exist
- **Navigation**: `/home`
- **Steps**:
  1. On Home screen, observe filter tabs (All, Income, Expense)
  2. Tap "Income" tab
  3. Tap "Expense" tab
  4. Tap "All" tab
- **Expected Output**: 
  - Transactions list filters accordingly
  - Charts update to reflect filtered data
- **Actual Output**: 
- **Status**: 

---

### TC-HOME-004: Period Selection
- **Scenario**: Change time period for dashboard view
- **Preconditions**: Transactions span multiple periods
- **Navigation**: `/home`
- **Steps**:
  1. Locate period selector (Week/Month/Year)
  2. Switch between different periods
  3. Observe data changes
- **Expected Output**: 
  - Summary updates for selected period
  - Charts reflect period-specific data
- **Actual Output**: 
- **Status**: 

---

## 3. Transaction Management

### TC-TXN-001: Add New Expense Transaction
- **Scenario**: Manually add an expense
- **Preconditions**: User is logged in
- **Navigation**: `/home` → FAB/Add → `/edit-transaction`
- **Steps**:
  1. Tap the floating action button or "Add Transaction"
  2. Select "Expense" type
  3. Enter amount: 50.00
  4. Select category: "Food & Dining"
  5. Select subcategory: "Restaurants"
  6. Enter vendor: "Starbucks"
  7. Select date: Today
  8. Select "From Account": Wallet
  9. Add notes (optional)
  10. Tap "Save Transaction"
- **Expected Output**: 
  - Toast: "Transaction saved successfully"
  - Redirects to Transactions list
  - New transaction appears at top
  - Account balance updated
- **Actual Output**: 
- **Status**: 

---

### TC-TXN-002: Add New Income Transaction
- **Scenario**: Manually add income
- **Preconditions**: User is logged in
- **Navigation**: `/edit-transaction`
- **Steps**:
  1. Navigate to Add Transaction
  2. Select "Income" type
  3. Enter amount: 5000.00
  4. Select category: "Salary"
  5. Select "To Account": Bank Account
  6. Enter date
  7. Tap "Save Transaction"
- **Expected Output**: 
  - Transaction saved with positive amount
  - Income reflected in dashboard totals
- **Actual Output**: 
- **Status**: 

---

### TC-TXN-003: Edit Existing Transaction
- **Scenario**: Modify a saved transaction
- **Preconditions**: At least one transaction exists
- **Navigation**: `/transactions` → Tap transaction → `/edit-transaction/:id`
- **Steps**:
  1. Go to Transactions list
  2. Tap on an existing transaction
  3. Modify the amount
  4. Change the category
  5. Tap "Save Transaction"
- **Expected Output**: 
  - Toast: "Transaction updated"
  - Changes reflected in list and dashboard
- **Actual Output**: 
- **Status**: 

---

### TC-TXN-004: Delete Transaction
- **Scenario**: Remove a transaction
- **Preconditions**: At least one transaction exists
- **Navigation**: `/edit-transaction/:id`
- **Steps**:
  1. Open an existing transaction for editing
  2. Tap "Delete" button
  3. Confirm deletion in dialog
- **Expected Output**: 
  - Toast: "Transaction deleted"
  - Transaction removed from list
  - Dashboard totals recalculated
- **Actual Output**: 
- **Status**: 

---

### TC-TXN-005: Transaction List Filtering
- **Scenario**: Filter transactions by various criteria
- **Preconditions**: Multiple transactions exist
- **Navigation**: `/transactions`
- **Steps**:
  1. Open Transactions page
  2. Use type filter (All/Income/Expense)
  3. Use category filter
  4. Use date range filter
  5. Use search by description
- **Expected Output**: 
  - List updates to show matching transactions
  - Filter indicators visible
  - Clear filters restores full list
- **Actual Output**: 
- **Status**: 

---

### TC-TXN-006: Transaction Pagination/Scroll
- **Scenario**: Load more transactions on scroll
- **Preconditions**: More than 20 transactions exist
- **Navigation**: `/transactions`
- **Steps**:
  1. Open Transactions page
  2. Scroll to bottom of list
  3. Observe loading of additional transactions
- **Expected Output**: 
  - Smooth infinite scroll or "Load More" button
  - No duplicate transactions
- **Actual Output**: 
- **Status**: 

---

## 4. Transfer Management

### TC-TRF-001: Create Account-to-Account Transfer
- **Scenario**: Transfer money between accounts
- **Preconditions**: At least 2 accounts exist
- **Navigation**: `/edit-transaction` (Transfer mode)
- **Steps**:
  1. Navigate to Add Transaction
  2. Select "Transfer" type
  3. Enter amount: 100.00
  4. Select "From Account": Wallet
  5. Select "To Account": Bank Account
  6. Enter date
  7. Tap "Save Transaction"
- **Expected Output**: 
  - Two linked transactions created (outflow + inflow)
  - Both accounts updated correctly
  - Transfer excluded from income/expense totals
- **Actual Output**: 
- **Status**: 

---

### TC-TRF-002: Edit Transfer Updates Both Sides
- **Scenario**: Editing transfer updates linked transactions
- **Preconditions**: A transfer exists
- **Navigation**: `/transactions` → Transfer item → Edit
- **Steps**:
  1. Find a transfer transaction
  2. Tap to edit
  3. Change the amount
  4. Save changes
- **Expected Output**: 
  - Both linked transactions updated
  - Account balances reflect new amount
- **Actual Output**: 
- **Status**: 

---

### TC-TRF-003: Delete Transfer Removes Both Sides
- **Scenario**: Deleting transfer removes linked pair
- **Preconditions**: A transfer exists
- **Navigation**: `/edit-transaction/:id`
- **Steps**:
  1. Open a transfer for editing
  2. Delete the transaction
  3. Confirm deletion
- **Expected Output**: 
  - Both linked transactions removed
  - Account balances restored
- **Actual Output**: 
- **Status**: 

---

## 5. Smart Import (Paste & Parse)

### TC-SIP-001: Parse Valid Bank SMS
- **Scenario**: Successfully parse a standard bank SMS
- **Preconditions**: None
- **Navigation**: `/import-transactions`
- **Steps**:
  1. Navigate to "Paste & Parse"
  2. Paste: "Your account XXX1234 has been debited with SAR 150.00 at CARREFOUR on 25-Jan-2025"
  3. Tap "Extract Transaction"
- **Expected Output**: 
  - Transaction preview appears
  - Amount: 150.00 SAR
  - Vendor: CARREFOUR
  - Type: Expense
  - Date parsed correctly
- **Actual Output**: 
- **Status**: 

---

### TC-SIP-002: Parse Credit Transaction SMS
- **Scenario**: Parse an incoming money SMS
- **Preconditions**: None
- **Navigation**: `/import-transactions`
- **Steps**:
  1. Navigate to "Paste & Parse"
  2. Paste: "Your account XXX5678 has been credited with SAR 5000.00 - Salary"
  3. Tap "Extract Transaction"
- **Expected Output**: 
  - Type detected as Income
  - Amount: 5000.00
  - Category suggestion based on keywords
- **Actual Output**: 
- **Status**: 

---

### TC-SIP-003: Parse Multi-Currency SMS
- **Scenario**: Handle foreign currency transactions
- **Preconditions**: None
- **Navigation**: `/import-transactions`
- **Steps**:
  1. Paste: "Payment of USD 25.99 at Amazon.com"
  2. Extract transaction
- **Expected Output**: 
  - Currency: USD detected
  - Amount: 25.99
  - Vendor: Amazon.com
- **Actual Output**: 
- **Status**: 

---

### TC-SIP-004: Handle Invalid/Non-Financial Text
- **Scenario**: Graceful handling of non-parseable text
- **Preconditions**: None
- **Navigation**: `/import-transactions`
- **Steps**:
  1. Paste: "Hello, this is just a regular text message"
  2. Tap "Extract Transaction"
- **Expected Output**: 
  - "No match" indicator shown
  - Option to manually enter details
  - No crash or error
- **Actual Output**: 
- **Status**: 

---

### TC-SIP-005: Save Parsed Transaction
- **Scenario**: Complete the save flow after parsing
- **Preconditions**: Successfully parsed message
- **Navigation**: `/import-transactions` → `/review-sms-transactions` → `/edit-transaction`
- **Steps**:
  1. Parse a valid SMS
  2. Review extracted details
  3. Make any necessary edits
  4. Tap "Save" or "Add Transaction"
- **Expected Output**: 
  - Transaction saved to database
  - Appears in transactions list
  - Template learning triggered (if applicable)
- **Actual Output**: 
- **Status**: 

---

### TC-SIP-006: Batch Import Multiple Messages
- **Scenario**: Import multiple SMS at once
- **Preconditions**: None
- **Navigation**: `/import-transactions`
- **Steps**:
  1. Paste multiple SMS messages separated by newlines
  2. Tap "Extract Transaction"
  3. Review parsed transactions
- **Expected Output**: 
  - Multiple transactions detected
  - Each shown with confidence score
  - Batch save option available
- **Actual Output**: 
- **Status**: 

---

## 6. SMS Import

### TC-SMS-001: Read SMS History (Android)
- **Scenario**: Import historical SMS from device
- **Preconditions**: 
  - Android native app
  - SMS permission granted
- **Navigation**: Header → "Import SMS" → `/process-sms`
- **Steps**:
  1. Navigate to "Import SMS"
  2. Grant SMS permission if prompted
  3. Select date range for import
  4. Tap "Scan Messages"
  5. Review detected transactions
- **Expected Output**: 
  - Messages filtered for financial keywords
  - Transactions extracted and displayed
  - Option to select/deselect items
- **Actual Output**: 
- **Status**: 

---

### TC-SMS-002: Background SMS Auto-Import
- **Scenario**: Automatic processing of incoming SMS
- **Preconditions**: 
  - Android native app
  - SMS auto-import enabled in settings
  - Background SMS listener active
- **Navigation**: Runs in background
- **Steps**:
  1. Enable SMS auto-import in Settings
  2. Receive a bank SMS on device
  3. If app is in foreground: Navigate to edit screen
  4. If app is backgrounded: Receive notification
- **Expected Output**: 
  - Financial SMS detected automatically
  - Transaction pre-filled for review
  - Notification shown if app backgrounded
- **Actual Output**: 
- **Status**: 

---

### TC-SMS-003: Train Model with Correction
- **Scenario**: User corrects a misclassified transaction
- **Preconditions**: A transaction was parsed with wrong category
- **Navigation**: `/edit-transaction` → Save → Template learning
- **Steps**:
  1. Import an SMS that was wrongly categorized
  2. Correct the category to proper value
  3. Save the transaction
- **Expected Output**: 
  - Template bank updated with new pattern
  - Future similar messages categorized correctly
- **Actual Output**: 
- **Status**: 

---

## 7. Budget Management

### TC-BUD-001: Navigate to Budget Hub
- **Scenario**: Access the budget dashboard
- **Preconditions**: None
- **Navigation**: Header → "Budget" → `/budget`
- **Steps**:
  1. From any page, tap "Budget" in navigation
  2. View the Budget Hub dashboard
- **Expected Output**: 
  - Budget Hub loads with tabs: Dashboard, Reports, Insights, Accounts
  - Period selector visible
  - Existing budgets displayed as cards
- **Actual Output**: 
- **Status**: 

---

### TC-BUD-002: Create Overall Yearly Budget
- **Scenario**: Set an annual spending limit
- **Preconditions**: None
- **Navigation**: `/budget` → FAB → `/budget/set`
- **Steps**:
  1. On Budget Hub, tap "+" or "Create Budget"
  2. Select scope: "Overall"
  3. Select period: "Yearly"
  4. Select year: Current year
  5. Enter amount: 50000
  6. Tap "Save Budget"
- **Expected Output**: 
  - Budget saved successfully
  - Appears on Budget Hub as card
  - Shows allocated vs remaining
- **Actual Output**: 
- **Status**: 

---

### TC-BUD-003: Create Category Budget
- **Scenario**: Set budget for specific category
- **Preconditions**: None
- **Navigation**: `/budget/set`
- **Steps**:
  1. Create new budget
  2. Select scope: "Category"
  3. Select category: "Food & Dining"
  4. Select period: "Monthly"
  5. Enter amount: 500
  6. Save
- **Expected Output**: 
  - Category budget created
  - Independent of overall budget
  - Tracked separately in reports
- **Actual Output**: 
- **Status**: 

---

### TC-BUD-004: Yearly to Quarterly Cascade
- **Scenario**: Distribute yearly budget to quarters
- **Preconditions**: Overall yearly budget exists
- **Navigation**: `/budget/set`
- **Steps**:
  1. Edit an existing yearly budget
  2. Enable "Cascade to periods"
  3. Review distribution preview
  4. Confirm distribution
- **Expected Output**: 
  - 4 quarterly budgets created automatically
  - Each quarter gets proportional amount
  - Total matches yearly budget
- **Actual Output**: 
- **Status**: 

---

### TC-BUD-005: View Budget vs Actual Report
- **Scenario**: Compare budgeted amounts to actual spending
- **Preconditions**: Budgets and transactions exist
- **Navigation**: `/budget/report`
- **Steps**:
  1. Navigate to Budget → Reports tab
  2. Select period for comparison
  3. View budget vs actual breakdown
- **Expected Output**: 
  - Each budget shows allocated, spent, remaining
  - Visual indicators for over/under budget
  - Progress bars or charts
- **Actual Output**: 
- **Status**: 

---

### TC-BUD-006: Budget Insights & Suggestions
- **Scenario**: View AI-generated budget insights
- **Preconditions**: Sufficient transaction history
- **Navigation**: `/budget/insights`
- **Steps**:
  1. Navigate to Budget → Insights tab
  2. Review spending pattern analysis
  3. View optimization suggestions
- **Expected Output**: 
  - Insights based on spending patterns
  - Actionable recommendations
  - Comparison to previous periods
- **Actual Output**: 
- **Status**: 

---

### TC-BUD-007: Edit Existing Budget
- **Scenario**: Modify a saved budget
- **Preconditions**: Budget exists
- **Navigation**: `/budget` → Budget card → Edit
- **Steps**:
  1. Tap on a budget card
  2. Tap "Edit"
  3. Modify the amount
  4. Save changes
- **Expected Output**: 
  - Budget updated
  - Reports reflect new amount
- **Actual Output**: 
- **Status**: 

---

### TC-BUD-008: Delete Budget
- **Scenario**: Remove a budget
- **Preconditions**: Budget exists
- **Navigation**: `/budget/set/:id`
- **Steps**:
  1. Open budget for editing
  2. Tap "Delete Budget"
  3. Confirm deletion
- **Expected Output**: 
  - Budget removed
  - No longer appears in hub or reports
- **Actual Output**: 
- **Status**: 

---

## 8. Accounts Management

### TC-ACC-001: View All Accounts
- **Scenario**: See list of financial accounts
- **Preconditions**: None
- **Navigation**: `/budget/accounts`
- **Steps**:
  1. Navigate to Budget → Accounts tab
  2. View list of accounts
- **Expected Output**: 
  - All accounts displayed with names and balances
  - Account types indicated (Bank, Cash, Credit Card, etc.)
  - Transaction count per account shown
- **Actual Output**: 
- **Status**: 

---

### TC-ACC-002: Create New Account
- **Scenario**: Add a new financial account
- **Preconditions**: None
- **Navigation**: `/budget/accounts` → Add button
- **Steps**:
  1. On Accounts page, tap "Add Account"
  2. Enter name: "Savings Account"
  3. Select type: "Bank"
  4. Enter initial balance: 10000
  5. Select currency
  6. Tap "Save"
- **Expected Output**: 
  - Account created
  - Appears in accounts list
  - Available in transaction dropdowns
- **Actual Output**: 
- **Status**: 

---

### TC-ACC-003: Edit Account Details
- **Scenario**: Modify account information
- **Preconditions**: Account exists
- **Navigation**: `/budget/accounts` → Account → Edit
- **Steps**:
  1. Tap on an account
  2. Tap "Edit"
  3. Change the name
  4. Update the type
  5. Save changes
- **Expected Output**: 
  - Account updated
  - Changes reflected everywhere account is shown
- **Actual Output**: 
- **Status**: 

---

### TC-ACC-004: Delete Account (No Transactions)
- **Scenario**: Remove an unused account
- **Preconditions**: Account exists with 0 transactions
- **Navigation**: `/budget/accounts` → Account → Delete
- **Steps**:
  1. Select an account with no linked transactions
  2. Tap "Delete"
  3. Confirm deletion
- **Expected Output**: 
  - Account deleted successfully
  - No longer in list or dropdowns
- **Actual Output**: 
- **Status**: 

---

### TC-ACC-005: Delete Account (Has Transactions) - Blocked
- **Scenario**: Prevent deletion of account with transactions
- **Preconditions**: Account has linked transactions
- **Navigation**: `/budget/accounts`
- **Steps**:
  1. Attempt to delete an account that has transactions
- **Expected Output**: 
  - Deletion blocked
  - Error message: "Cannot delete account with linked transactions"
  - User advised to reassign or delete transactions first
- **Actual Output**: 
- **Status**: 

---

### TC-ACC-006: Unmanaged Accounts Detection
- **Scenario**: Identify account names in transactions not yet formalized
- **Preconditions**: Transactions exist with account names not in formal accounts list
- **Navigation**: `/budget/accounts`
- **Steps**:
  1. View Accounts page
  2. Check "Unmanaged Accounts" section
- **Expected Output**: 
  - List of account names found in transactions but not formally created
  - Option to "Create Account" for each
- **Actual Output**: 
- **Status**: 

---

## 9. Analytics & Reports

### TC-ANA-001: View Monthly Trends
- **Scenario**: Analyze spending over time
- **Preconditions**: Transactions span multiple months
- **Navigation**: `/analytics`
- **Steps**:
  1. Navigate to Analytics
  2. View the monthly trend chart
  3. Toggle between income/expense views
- **Expected Output**: 
  - Line or bar chart showing trends
  - Data points for each month
  - Tooltip on hover/tap
- **Actual Output**: 
- **Status**: 

---

### TC-ANA-002: Category Breakdown Pie Chart
- **Scenario**: View spending by category
- **Preconditions**: Categorized transactions exist
- **Navigation**: `/analytics`
- **Steps**:
  1. On Analytics page, locate category chart
  2. View expense distribution by category
  3. Tap on a segment for details
- **Expected Output**: 
  - Pie or donut chart with category segments
  - Legend with amounts
  - Drill-down to transactions
- **Actual Output**: 
- **Status**: 

---

### TC-ANA-003: Net Balance Timeline
- **Scenario**: Track net worth over time
- **Preconditions**: Transactions exist over time
- **Navigation**: `/analytics`
- **Steps**:
  1. View the net balance chart
  2. Observe cumulative balance trend
- **Expected Output**: 
  - Running total visualization
  - Positive/negative areas distinguished
- **Actual Output**: 
- **Status**: 

---

### TC-ANA-004: Transfers Excluded from Totals
- **Scenario**: Verify transfers don't inflate income/expense
- **Preconditions**: Transfers and regular transactions exist
- **Navigation**: `/analytics`
- **Steps**:
  1. Note total income and expense values
  2. Verify transfers are not counted
- **Expected Output**: 
  - Transfer amounts excluded from income/expense totals
  - Only actual income/expenses counted
- **Actual Output**: 
- **Status**: 

---

### TC-ANA-005: Export Analytics Data
- **Scenario**: Download analytics as file
- **Preconditions**: Analytics data exists
- **Navigation**: `/analytics` or `/budget/report`
- **Steps**:
  1. Navigate to analytics or budget report
  2. Tap "Export" button
  3. Select format (CSV)
  4. Download file
- **Expected Output**: 
  - File downloaded successfully
  - Data matches on-screen values
- **Actual Output**: 
- **Status**: 

---

## 10. Settings & Preferences

### TC-SET-001: Change App Theme
- **Scenario**: Switch between Light/Dark/System themes
- **Preconditions**: None
- **Navigation**: `/settings`
- **Steps**:
  1. Navigate to Settings
  2. Locate "Appearance" section
  3. Select "Dark" theme
  4. Observe UI change
  5. Select "Light" theme
  6. Select "System" theme
- **Expected Output**: 
  - Theme changes immediately
  - Setting persisted across app restarts
- **Actual Output**: 
- **Status**: 

---

### TC-SET-002: Change Default Currency
- **Scenario**: Set preferred currency for display
- **Preconditions**: None
- **Navigation**: `/settings`
- **Steps**:
  1. Open Settings
  2. Find "Currency" dropdown
  3. Change from SAR to USD
  4. Save settings
- **Expected Output**: 
  - Currency symbol updates throughout app
  - Setting saved and persists
- **Actual Output**: 
- **Status**: 

---

### TC-SET-003: Change Week Start Day
- **Scenario**: Configure first day of week
- **Preconditions**: None
- **Navigation**: `/settings`
- **Steps**:
  1. Open Settings
  2. Find "Week Start Day" option
  3. Change to Monday (or Sunday/Saturday)
  4. Save settings
- **Expected Output**: 
  - Calendar views reflect new week start
  - Weekly reports adjust accordingly
- **Actual Output**: 
- **Status**: 

---

### TC-SET-004: Save Settings Confirmation
- **Scenario**: Save all settings at once
- **Preconditions**: Settings modified but not saved
- **Navigation**: `/settings`
- **Steps**:
  1. Make changes to multiple settings
  2. Tap "Save Settings" button
- **Expected Output**: 
  - Toast: "Settings saved successfully"
  - All changes persisted
- **Actual Output**: 
- **Status**: 

---

### TC-SET-005: Enable/Disable Notifications
- **Scenario**: Toggle push notifications
- **Preconditions**: Native app
- **Navigation**: `/settings` → Notifications
- **Steps**:
  1. Open Settings
  2. Navigate to Notification Settings
  3. Toggle "Enable Notifications"
  4. Grant/deny system permission if prompted
- **Expected Output**: 
  - Setting saved
  - System permission requested if enabling
  - Toast confirms change
- **Actual Output**: 
- **Status**: 

---

### TC-SET-006: Enable/Disable SMS Auto-Import
- **Scenario**: Toggle automatic SMS processing
- **Preconditions**: Android native app
- **Navigation**: `/settings` → SMS Settings
- **Steps**:
  1. Open Settings
  2. Find "SMS Auto-Import" toggle
  3. Toggle ON → Permission requested
  4. Toggle OFF → Listener stopped
- **Expected Output**: 
  - Background SMS listener starts/stops
  - Setting persisted
- **Actual Output**: 
- **Status**: 

---

### TC-SET-007: Activate Beta Features
- **Scenario**: Unlock beta features with code
- **Preconditions**: Valid beta code
- **Navigation**: `/settings` → Beta Features
- **Steps**:
  1. Open Settings
  2. Scroll to "Beta Features"
  3. Tap "Activate Beta Features"
  4. Enter valid code
  5. Tap "Activate"
- **Expected Output**: 
  - Toast: "Beta features activated"
  - Beta features now visible in app
- **Actual Output**: 
- **Status**: 

---

### TC-SET-008: View App Version
- **Scenario**: Check current app version
- **Preconditions**: None
- **Navigation**: `/settings`
- **Steps**:
  1. Open Settings
  2. Scroll to bottom or "About" section
  3. Locate version number
- **Expected Output**: 
  - Version displayed (e.g., "Version 1.0.2")
  - Build number if applicable
- **Actual Output**: 
- **Status**: 

---

## 11. Data Management

### TC-DAT-001: Export All Data
- **Scenario**: Export complete transaction data
- **Preconditions**: Transactions exist
- **Navigation**: `/settings` → Data Management
- **Steps**:
  1. Open Settings
  2. Navigate to "Data Management"
  3. Tap "Export Data"
  4. Wait for file generation
- **Expected Output**: 
  - JSON file downloaded
  - Contains all transactions, accounts, budgets
  - Toast: "Export successful"
- **Actual Output**: 
- **Status**: 

---

### TC-DAT-002: Export with No Data
- **Scenario**: Attempt export when no data exists
- **Preconditions**: No transactions
- **Navigation**: `/settings` → Data Management
- **Steps**:
  1. Clear all data
  2. Attempt export
- **Expected Output**: 
  - Toast: "No data to export" or empty file generated
  - No crash
- **Actual Output**: 
- **Status**: 

---

### TC-DAT-003: Import Valid JSON Data
- **Scenario**: Restore data from backup
- **Preconditions**: Valid export file available
- **Navigation**: `/settings` → Data Management
- **Steps**:
  1. Open Settings → Data Management
  2. Tap "Import Data"
  3. Select valid JSON file
  4. Confirm import
- **Expected Output**: 
  - Data imported successfully
  - Toast: "Import successful"
  - Transactions appear in list
- **Actual Output**: 
- **Status**: 

---

### TC-DAT-004: Import Invalid File
- **Scenario**: Handle corrupt/invalid import file
- **Preconditions**: Invalid file available
- **Navigation**: `/settings` → Data Management
- **Steps**:
  1. Tap "Import Data"
  2. Select a non-JSON file or corrupted file
- **Expected Output**: 
  - Error message displayed
  - Toast: "Failed to parse file"
  - No data corruption
- **Actual Output**: 
- **Status**: 

---

### TC-DAT-005: Clear Sample Data
- **Scenario**: Remove demo transactions
- **Preconditions**: Sample data exists
- **Navigation**: `/settings` → Data Management
- **Steps**:
  1. Open Settings
  2. Tap "Clear Sample Data"
  3. Confirm in dialog
- **Expected Output**: 
  - Sample/demo transactions removed
  - User transactions preserved
  - Toast: "Sample data cleared"
- **Actual Output**: 
- **Status**: 

---

### TC-DAT-006: Clear All Data
- **Scenario**: Factory reset all user data
- **Preconditions**: Data exists
- **Navigation**: `/settings` → Data Management
- **Steps**:
  1. Find "Clear All Data" option
  2. Tap and read warning
  3. Type confirmation text
  4. Confirm deletion
- **Expected Output**: 
  - All transactions, accounts, budgets deleted
  - Settings preserved
  - Redirected to clean state
- **Actual Output**: 
- **Status**: 

---

## 12. OTA Updates

### TC-OTA-001: Check for Updates
- **Scenario**: Manually check for app updates
- **Preconditions**: Native app
- **Navigation**: `/settings` → OTA Debug Section
- **Steps**:
  1. Open Settings
  2. Scroll to "OTA Debug" section
  3. View current version info
  4. Tap "Check for Updates"
- **Expected Output**: 
  - Current version displayed
  - Manifest fetched
  - Result shown (update available or up to date)
- **Actual Output**: 
- **Status**: 

---

### TC-OTA-002: Download Available Update
- **Scenario**: Download a new version
- **Preconditions**: Update available
- **Navigation**: Update dialog
- **Steps**:
  1. Trigger update check
  2. When update dialog appears, tap "Download"
  3. Wait for download to complete
- **Expected Output**: 
  - Progress indicator shown
  - Download completes successfully
  - Bundle marked as pending
- **Actual Output**: 
- **Status**: 

---

### TC-OTA-003: Apply Update on App Background
- **Scenario**: Update applied when app backgrounded
- **Preconditions**: Bundle downloaded and pending
- **Navigation**: N/A (system behavior)
- **Steps**:
  1. After download, continue using app
  2. Press home or switch apps
  3. Return to app
- **Expected Output**: 
  - New version active on next foreground
  - Version number updated in settings
- **Actual Output**: 
- **Status**: 

---

### TC-OTA-004: Clear Pending Bundle
- **Scenario**: Cancel a pending update
- **Preconditions**: Pending bundle exists
- **Navigation**: `/settings` → OTA Debug
- **Steps**:
  1. View pending bundle info
  2. Tap "Clear Pending Bundle"
  3. Confirm action
- **Expected Output**: 
  - Pending bundle cleared
  - App remains on current version
- **Actual Output**: 
- **Status**: 

---

### TC-OTA-005: Handle Network Failure During Update
- **Scenario**: Network disconnects during download
- **Preconditions**: Update available
- **Navigation**: Update dialog
- **Steps**:
  1. Start update download
  2. Disconnect network mid-download
- **Expected Output**: 
  - Error shown gracefully
  - Option to retry
  - No app crash
- **Actual Output**: 
- **Status**: 

---

## 13. Error Handling & Edge Cases

### TC-ERR-001: Invalid Amount Entry
- **Scenario**: Enter non-numeric amount
- **Preconditions**: On transaction form
- **Navigation**: `/edit-transaction`
- **Steps**:
  1. In amount field, type "abc"
  2. Attempt to save
- **Expected Output**: 
  - Validation error shown
  - Save blocked until corrected
- **Actual Output**: 
- **Status**: 

---

### TC-ERR-002: Negative Amount Handling
- **Scenario**: Enter negative amount
- **Preconditions**: On transaction form
- **Navigation**: `/edit-transaction`
- **Steps**:
  1. Enter amount: -50
  2. Observe behavior
- **Expected Output**: 
  - Either prevented or auto-converted to positive
  - Type (income/expense) handles sign logic
- **Actual Output**: 
- **Status**: 

---

### TC-ERR-003: Unsaved Changes Warning
- **Scenario**: Navigate away with unsaved changes
- **Preconditions**: Form with unsaved changes
- **Navigation**: `/settings` or `/edit-transaction`
- **Steps**:
  1. Modify settings or transaction
  2. Attempt to navigate away without saving
- **Expected Output**: 
  - Warning dialog appears
  - Options: Save, Discard, Cancel
- **Actual Output**: 
- **Status**: 

---

### TC-ERR-004: Offline Mode Behavior
- **Scenario**: Use app without network
- **Preconditions**: Network disabled
- **Navigation**: Any page
- **Steps**:
  1. Disconnect from network
  2. Continue using app
  3. Add/edit transactions
- **Expected Output**: 
  - Local storage operations work
  - Appropriate offline indicators
  - No crashes
- **Actual Output**: 
- **Status**: 

---

### TC-ERR-005: 404 Page Not Found
- **Scenario**: Navigate to invalid route
- **Preconditions**: None
- **Navigation**: `/invalid-route`
- **Steps**:
  1. Enter an invalid URL in browser/app
- **Expected Output**: 
  - 404 page displayed
  - Link to return to home
- **Actual Output**: 
- **Status**: 

---

### TC-ERR-006: Error Boundary Recovery
- **Scenario**: Component crash recovery
- **Preconditions**: None
- **Navigation**: Any page
- **Steps**:
  1. If a component crashes, observe error boundary
- **Expected Output**: 
  - Friendly error message shown
  - "Show Details" reveals error info
  - App remains usable
- **Actual Output**: 
- **Status**: 

---

## 14. Accessibility

### TC-A11Y-001: Keyboard Navigation
- **Scenario**: Navigate app using keyboard only
- **Preconditions**: Desktop browser or keyboard connected
- **Navigation**: All pages
- **Steps**:
  1. Use Tab to navigate between elements
  2. Use Enter to activate buttons/links
  3. Use Escape to close modals
- **Expected Output**: 
  - All interactive elements focusable
  - Focus indicators visible
  - Logical tab order
- **Actual Output**: 
- **Status**: 

---

### TC-A11Y-002: Screen Reader Compatibility
- **Scenario**: Use app with screen reader
- **Preconditions**: Screen reader enabled
- **Navigation**: All pages
- **Steps**:
  1. Navigate through app with screen reader
  2. Verify labels announced correctly
  3. Check form field announcements
- **Expected Output**: 
  - All elements have appropriate labels
  - Buttons announce their purpose
  - Forms have associated labels
- **Actual Output**: 
- **Status**: 

---

### TC-A11Y-003: Color Contrast Compliance
- **Scenario**: Verify text readability
- **Preconditions**: None
- **Navigation**: All pages
- **Steps**:
  1. Use contrast checking tool
  2. Verify all text meets WCAG AA standards
- **Expected Output**: 
  - Contrast ratio ≥ 4.5:1 for normal text
  - Contrast ratio ≥ 3:1 for large text
- **Actual Output**: 
- **Status**: 

---

### TC-A11Y-004: Touch Target Size
- **Scenario**: Verify button/link sizes on mobile
- **Preconditions**: Mobile device
- **Navigation**: All pages
- **Steps**:
  1. Check all interactive elements
  2. Verify touch targets are at least 44x44 pixels
- **Expected Output**: 
  - All buttons/links easily tappable
  - No tiny hit areas
- **Actual Output**: 
- **Status**: 

---

## Navigation Reference

| Page | Route | Access From |
|------|-------|-------------|
| Onboarding | `/` (first launch) | App launch |
| Home/Dashboard | `/home` | Navigation menu |
| Transactions List | `/transactions` | Navigation menu |
| Add/Edit Transaction | `/edit-transaction/:id?` | FAB, transaction tap |
| Paste & Parse | `/import-transactions` | Navigation menu |
| Review SMS Transactions | `/review-sms-transactions` | After parsing |
| Process SMS (Android) | `/process-sms` | Import SMS menu |
| Analytics | `/analytics` | Navigation menu |
| Budget Hub | `/budget` | Navigation menu |
| Set Budget | `/budget/set/:id?` | Budget FAB |
| Budget Report | `/budget/report` | Budget tab |
| Budget Insights | `/budget/insights` | Budget tab |
| Accounts | `/budget/accounts` | Budget tab |
| Settings | `/settings` | Navigation menu |
| Profile | `/profile` | Navigation menu |

---

## Test Execution Summary

| Category | Total Tests | Passed | Failed | Blocked |
|----------|-------------|--------|--------|---------|
| Onboarding | 3 | | | |
| Dashboard | 4 | | | |
| Transactions | 6 | | | |
| Transfers | 3 | | | |
| Smart Import | 6 | | | |
| SMS Import | 3 | | | |
| Budgets | 8 | | | |
| Accounts | 6 | | | |
| Analytics | 5 | | | |
| Settings | 8 | | | |
| Data Management | 6 | | | |
| OTA Updates | 5 | | | |
| Error Handling | 6 | | | |
| Accessibility | 4 | | | |
| **TOTAL** | **73** | | | |

---

## Appendix: Screenshot Capture Guide

For each test case, capture screenshots at these points:

1. **Before** - Initial state before action
2. **During** - Mid-action state (dialogs, loading)
3. **After** - Final state showing result

### Screenshot Naming Convention
```
TC-{ID}_{step}_{description}.png
Example: TC-TXN-001_03_category-selection.png
```

### Recommended Screenshot Locations per Flow

| Flow | Key Screens to Capture |
|------|----------------------|
| Onboarding | Slide 1, Slide 2, Slide 3, CTA button, Home arrival |
| Transaction Add | Form empty, Form filled, Save toast, List with new item |
| Budget Create | Form options, Amount entry, Period selection, Saved card |
| Settings | Theme toggle, Currency change, Save confirmation |
| OTA Update | Version info, Update available dialog, Download progress, Success |

---

*Document Version: 1.0*  
*Last Updated: January 2025*  
*Prepared for: Xpensia QA Team*
