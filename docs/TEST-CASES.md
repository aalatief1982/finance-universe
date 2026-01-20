# Test Cases Documentation

> **Last Updated:** 2026-01-20  
> **Total Test Cases:** 156+  
> **Test Frameworks:** Vitest (Unit/Integration), Playwright (E2E)

---

## Table of Contents

1. [Summary Statistics](#summary-statistics)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [End-to-End Tests](#end-to-end-tests)

---

## Summary Statistics

| Category | Count | Coverage |
|----------|-------|----------|
| Unit Tests | 45+ | Core services, validation, utilities |
| Integration Tests | 55+ | Cross-service, context providers, forms |
| E2E Tests | 56 | User journeys, accessibility, error handling |
| **Total** | **156+** | |

---

## Unit Tests

### Validation Tests

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 1 | Unit | Validation | fails schema validation for invalid dates | Validates that invalid date formats are rejected by the transaction schema | `src/lib/__tests__/validation.test.ts` | `expect(result.success).toBe(false)` |
| 2 | Unit | Validation | requires toAccount for transfer transactions | Ensures transfer type requires destination account field | `src/lib/__tests__/validation.test.ts` | `validateNewTransaction({...type:'transfer'})` |

### Transaction Validator Tests

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 3 | Unit | Validation | validates amounts, dates, and types | Validates core field validation functions work correctly | `src/lib/__tests__/transaction-validator.test.ts` | `expect(isValidAmount(10)).toBe(true)` |
| 4 | Unit | Validation | validates categories and subcategories | Ensures category/subcategory validation against allowed values | `src/lib/__tests__/transaction-validator.test.ts` | `expect(isValidCategory('expense', 'Food')).toBe(true)` |
| 5 | Unit | Validation | returns false and calls toast for invalid transactions | Verifies toast notification is triggered for validation failures | `src/lib/__tests__/transaction-validator.test.ts` | `expect(toastMock).toHaveBeenCalled()` |

### Text Normalization Tests

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 6 | Unit | Text Processing | converts Arabic-Indic digits to Western digits | Normalizes Arabic numeral formats (١٢٣ → 123) | `src/lib/normalize-utils.test.ts` | `expect(normalizeNumerals('المجموع ١٢٣')).toBe('المجموع 123')` |
| 7 | Unit | Text Processing | converts Eastern Arabic digits to Western digits | Normalizes Eastern Arabic numerals (۴۵۶ → 456) | `src/lib/normalize-utils.test.ts` | `expect(normalizeNumerals('عدد ۴۵۶')).toBe('عدد 456')` |
| 8 | Unit | Text Processing | leaves Western digits unchanged | Ensures Western digits pass through unmodified | `src/lib/normalize-utils.test.ts` | `expect(normalizeNumerals('Total 789')).toBe('Total 789')` |
| 9 | Unit | Text Processing | normalizes Arabic punctuation to ASCII equivalents | Converts Arabic punctuation marks to ASCII | `src/lib/normalize-utils.test.ts` | `expect(normalizePunctuation(input)).toBe(expected)` |
| 10 | Unit | Text Processing | keeps ASCII punctuation intact | Ensures ASCII punctuation is not modified | `src/lib/normalize-utils.test.ts` | `expect(normalizePunctuation(input)).toBe(input)` |
| 11 | Unit | Text Processing | detects RTL scripts | Identifies right-to-left text direction | `src/lib/normalize-utils.test.ts` | `expect(isRTL('مرحبا بالعالم')).toBe(true)` |

### Analytics Service Tests

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 12 | Unit | Analytics | calculates income total from type === "income" only | Sums only income-type transactions for income total | `src/services/__tests__/AnalyticsService.test.ts` | `expect(result.income).toBe(1500)` |
| 13 | Unit | Analytics | calculates expense total from type === "expense" only | Sums only expense-type transactions for expense total | `src/services/__tests__/AnalyticsService.test.ts` | `expect(result.expenses).toBe(500)` |
| 14 | Unit | Analytics | EXCLUDES transfers from both income and expenses | Ensures transfers don't affect income/expense totals | `src/services/__tests__/AnalyticsService.test.ts` | `expect(result.income).toBe(1000)` |
| 15 | Unit | Analytics | calculates savings rate correctly | Computes savings rate as (income-expenses)/income | `src/services/__tests__/AnalyticsService.test.ts` | `expect(result.savingsRate).toBe(60)` |
| 16 | Unit | Analytics | returns 0 savings rate when no income | Handles edge case of zero income | `src/services/__tests__/AnalyticsService.test.ts` | `expect(result.savingsRate).toBe(0)` |
| 17 | Unit | Analytics | includes only type === "expense" transactions | Category data only includes expenses | `src/services/__tests__/AnalyticsService.test.ts` | `expect(result).toHaveLength(1)` |
| 18 | Unit | Analytics | EXCLUDES transfers from category data | Transfer category is excluded from charts | `src/services/__tests__/AnalyticsService.test.ts` | `expect(result[0].name).toBe('Food')` |
| 19 | Unit | Analytics | aggregates expenses by category correctly | Groups and sums expenses per category | `src/services/__tests__/AnalyticsService.test.ts` | `expect(food?.value).toBe(150)` |
| 20 | Unit | Analytics | sorts categories by value descending | Orders categories from highest to lowest | `src/services/__tests__/AnalyticsService.test.ts` | `expect(result[0].name).toBe('Large')` |
| 21 | Unit | Analytics | includes only expenses with subcategories | Filters for transactions with subcategory field | `src/services/__tests__/AnalyticsService.test.ts` | `expect(result[0].name).toBe('Restaurants')` |
| 22 | Unit | Analytics | EXCLUDES transfers from subcategory data | Transfer subcategories excluded from breakdown | `src/services/__tests__/AnalyticsService.test.ts` | `expect(result[0].name).toBe('Groceries')` |
| 23 | Unit | Analytics | groups expenses by month | Aggregates expenses into monthly buckets | `src/services/__tests__/AnalyticsService.test.ts` | `expect(jan?.total).toBe(150)` |
| 24 | Unit | Analytics | EXCLUDES transfers from monthly data | Monthly totals exclude transfer amounts | `src/services/__tests__/AnalyticsService.test.ts` | `expect(result[0].total).toBe(100)` |
| 25 | Unit | Analytics | sorts monthly data chronologically | Orders months from oldest to newest | `src/services/__tests__/AnalyticsService.test.ts` | `expect(result[0].month).toContain('Jan')` |
| 26 | Unit | Analytics | returns unique expense categories only | Deduplicates category list | `src/services/__tests__/AnalyticsService.test.ts` | `expect(result).toHaveLength(2)` |
| 27 | Unit | Analytics | EXCLUDES transfer categories | Transfer not in unique categories list | `src/services/__tests__/AnalyticsService.test.ts` | `expect(result).not.toContain('Transfer')` |
| 28 | Unit | Analytics | returns top categories by value | Filters to top N categories by amount | `src/services/__tests__/AnalyticsService.test.ts` | `expect(result[0].name).toBe('Large')` |
| 29 | Unit | Analytics | defaults to top 3 when limit not specified | Uses default limit of 3 categories | `src/services/__tests__/AnalyticsService.test.ts` | `expect(result).toHaveLength(3)` |

### Transaction Service Tests

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 30 | Unit | Transactions | adds an expense and creates 1 record | Verifies single record creation for expenses | `src/services/__tests__/TransactionService.test.ts` | `expect(allTransactions).toHaveLength(1)` |
| 31 | Unit | Transactions | adds an income and creates 1 record | Verifies single record creation for income | `src/services/__tests__/TransactionService.test.ts` | `expect((result as Transaction).amount).toBe(5000)` |
| 32 | Unit | Transactions | creates exactly 2 records for a transfer | Dual-entry accounting for transfers | `src/services/__tests__/TransactionService.test.ts` | `expect((result as Transaction[]).length).toBe(2)` |
| 33 | Unit | Transactions | both records share the same transferId | Links transfer entries together | `src/services/__tests__/TransactionService.test.ts` | `expect(result[0].transferId).toBe(result[1].transferId)` |
| 34 | Unit | Transactions | one record has transferDirection "out" with negative amount | Debit entry has correct sign | `src/services/__tests__/TransactionService.test.ts` | `expect(outRecord!.amount).toBe(-500)` |
| 35 | Unit | Transactions | one record has transferDirection "in" with positive amount | Credit entry has correct sign | `src/services/__tests__/TransactionService.test.ts` | `expect(inRecord!.amount).toBe(500)` |
| 36 | Unit | Transactions | both records have category set to "Transfer" | Enforces Transfer category on both entries | `src/services/__tests__/TransactionService.test.ts` | `expect(result[0].category).toBe('Transfer')` |
| 37 | Unit | Transactions | both records have correct fromAccount and toAccount | Account fields preserved on both entries | `src/services/__tests__/TransactionService.test.ts` | `expect(t.fromAccount).toBe('Checking')` |
| 38 | Unit | Transactions | updating one half of a transfer updates both linked records | Atomic update for linked transfers | `src/services/__tests__/TransactionService.test.ts` | `expect(updatedIn!.title).toBe('Updated Title')` |
| 39 | Unit | Transactions | amount changes maintain correct signs in both halves | Sign correction on amount updates | `src/services/__tests__/TransactionService.test.ts` | `expect(updatedOut!.amount).toBe(-200)` |
| 40 | Unit | Transactions | deleting one half of a transfer deletes both linked records | Atomic delete for linked transfers | `src/services/__tests__/TransactionService.test.ts` | `expect(transactionService.getAllTransactions()).toHaveLength(0)` |
| 41 | Unit | Transactions | updates a regular transaction without affecting others | Isolated updates for non-transfers | `src/services/__tests__/TransactionService.test.ts` | `expect(updated!.title).toBe('Updated Expense')` |
| 42 | Unit | Transactions | deletes a regular transaction | Single record deletion works | `src/services/__tests__/TransactionService.test.ts` | `expect(transactionService.getAllTransactions()).toHaveLength(0)` |

### Budget Hierarchy Service Tests

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 43 | Unit | Budget | distributes yearly budgets across quarters | Even distribution of yearly amounts | `src/services/__tests__/BudgetHierarchyService.test.ts` | `expect(result.amounts).toEqual([300, 300, 300, 300])` |
| 44 | Unit | Budget | calculates derived amounts for child periods | Computes monthly from yearly budget | `src/services/__tests__/BudgetHierarchyService.test.ts` | `expect(monthlyAmount).toBeCloseTo(100)` |
| 45 | Unit | Budget | returns parent and child scope types | Gets hierarchy relationships | `src/services/__tests__/BudgetHierarchyService.test.ts` | `expect(getParentPeriod('monthly')).toBe('quarterly')` |
| 46 | Unit | Budget | distributes scope amounts evenly when no weights provided | Equal distribution without weights | `src/services/__tests__/BudgetHierarchyService.test.ts` | `expect(distributeScopeAmount(100, 2)).toEqual([50, 50])` |
| 47 | Unit | Budget | validates scope allocation totals | Detects over-allocation errors | `src/services/__tests__/BudgetHierarchyService.test.ts` | `expect(result.overage).toBe(50)` |

### Category Inferencer Tests

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 48 | Unit | Categories | infers category based on vendor keyword | Auto-categorizes by vendor name | `src/services/__tests__/CategoryInferencer.test.ts` | `expect(result.category).toBe('Food & Dining')` |
| 49 | Unit | Categories | falls back to defaults when no match found | Uses default category for unknown vendors | `src/services/__tests__/CategoryInferencer.test.ts` | `expect(result.category).toBe('Income')` |

### Learning Engine Service Tests

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 50 | Unit | Smart Paste | determines transaction type from keyword tokens | Infers income/expense from keywords | `src/services/__tests__/LearningEngineService.test.ts` | `expect(determineType({ received: 'keyword' })).toBe('income')` |
| 51 | Unit | Smart Paste | extracts amount and currency from tokens | Parses monetary values | `src/services/__tests__/LearningEngineService.test.ts` | `expect(determineAmount({ '1,234': 'amount' })).toBe(1234)` |
| 52 | Unit | Smart Paste | builds a transaction with defaults | Constructs transaction from tokens | `src/services/__tests__/LearningEngineService.test.ts` | `expect(result.amount).toBe(12)` |
| 53 | Unit | Smart Paste | suggests transaction details from raw message | Full message parsing | `src/services/__tests__/LearningEngineService.test.ts` | `expect(result.type).toBe('expense')` |

### SMS Processing Service Tests

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 54 | Unit | SMS Import | processes SMS entries into transactions | Converts SMS to transaction format | `src/services/__tests__/SmsProcessingService.test.ts` | `expect(results[0].title).toBe('Cafe')` |

---

## Integration Tests

### Navigation State Integration Tests

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 55 | Integration | Navigation | should parse budget period params from URL search string | Extracts period/year/index from URL | `src/__tests__/navigation.integration.test.ts` | `expect(params.get('period')).toBe('quarterly')` |
| 56 | Integration | Navigation | should handle missing params with defaults | Falls back to default values | `src/__tests__/navigation.integration.test.ts` | `expect(params.get('period') \|\| 'monthly').toBe('monthly')` |
| 57 | Integration | Navigation | should parse transaction ID from path | Extracts ID from edit URL | `src/__tests__/navigation.integration.test.ts` | `expect(match![1]).toBe('tx-123-abc')` |
| 58 | Integration | Navigation | should parse budget ID from path | Extracts ID from budget URL | `src/__tests__/navigation.integration.test.ts` | `expect(match![1]).toBe('budget-456-def')` |
| 59 | Integration | Navigation | should create valid navigation state for edit transaction | Builds nav state object | `src/__tests__/navigation.integration.test.ts` | `expect(navigationState.confidence).toBe(0.85)` |
| 60 | Integration | Navigation | should create valid navigation state for SMS review | Builds SMS review state | `src/__tests__/navigation.integration.test.ts` | `expect(navigationState.source).toBe('sms-import')` |
| 61 | Integration | Navigation | should match static routes | Route matching for static paths | `src/__tests__/navigation.integration.test.ts` | `expect(matchedRoute!.name).toBe('transactions')` |
| 62 | Integration | Navigation | should identify dynamic route patterns | Pattern matching for dynamic routes | `src/__tests__/navigation.integration.test.ts` | `expect(budgetDetailPattern.test(testPath)).toBe(true)` |

### State Persistence Integration Tests

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 63 | Integration | State | should store filter state in localStorage | Persists filter selections | `src/__tests__/navigation.integration.test.ts` | `expect(JSON.parse(stored!)).toEqual(filterState)` |
| 64 | Integration | State | should handle missing filter state gracefully | Handles undefined filter state | `src/__tests__/navigation.integration.test.ts` | `expect(stored).toBeNull()` |
| 65 | Integration | State | should store and retrieve last visited page | Persists navigation history | `src/__tests__/navigation.integration.test.ts` | `expect(lastPage).toBe('/analytics')` |
| 66 | Integration | State | should mark onboarding as complete | Persists onboarding completion | `src/__tests__/navigation.integration.test.ts` | `expect(onboardingDone).toBe('true')` |
| 67 | Integration | State | should check if onboarding is not complete | Checks unset onboarding flag | `src/__tests__/navigation.integration.test.ts` | `expect(onboardingDone).toBeNull()` |
| 68 | Integration | State | should store budget period selection | Persists budget period params | `src/__tests__/navigation.integration.test.ts` | `expect(JSON.parse(stored!)).toEqual(periodParams)` |
| 69 | Integration | State | should store user settings | Persists user preferences | `src/__tests__/navigation.integration.test.ts` | `expect(JSON.parse(stored!)).toEqual(settings)` |
| 70 | Integration | State | should store transactions array | Persists transaction data | `src/__tests__/navigation.integration.test.ts` | `expect(JSON.parse(stored!).length).toBe(2)` |
| 71 | Integration | State | should handle empty transactions | Handles empty transaction array | `src/__tests__/navigation.integration.test.ts` | `expect(JSON.parse(stored!)).toEqual([])` |

### Guided Tips Hook Tests

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 72 | Integration | UI Hints | shows tip when not previously dismissed | Displays tip on first visit | `src/__tests__/useGuidedTips.test.ts` | `expect(result.current.visible).toBe(true)` |
| 73 | Integration | UI Hints | persists dismissal | Saves dismissed state | `src/__tests__/useGuidedTips.test.ts` | `expect(localStorage.getItem('xpensia_tip_dashboard_shown')).toBe('true')` |

### Transaction Form + Service Integration Tests

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 74 | Integration | Forms | should validate a complete expense transaction | Schema validates expense form | `src/components/forms/__tests__/TransactionForm.integration.test.ts` | `expect(result.success).toBe(true)` |
| 75 | Integration | Forms | should validate a complete income transaction | Schema validates income form | `src/components/forms/__tests__/TransactionForm.integration.test.ts` | `expect(result.success).toBe(true)` |
| 76 | Integration | Forms | should require both accounts for transfer type | Transfer requires from/to accounts | `src/components/forms/__tests__/TransactionForm.integration.test.ts` | `expect(result.success).toBe(false)` |
| 77 | Integration | Forms | should require different accounts for transfer | Prevents same-account transfers | `src/components/forms/__tests__/TransactionForm.integration.test.ts` | `expect(result.success).toBe(false)` |
| 78 | Integration | Forms | should reject amount of 0 | Validates non-zero amounts | `src/components/forms/__tests__/TransactionForm.integration.test.ts` | `expect(result.success).toBe(false)` |
| 79 | Integration | Forms | should reject amounts exceeding max | Validates amount upper limit | `src/components/forms/__tests__/TransactionForm.integration.test.ts` | `expect(result.success).toBe(false)` |
| 80 | Integration | Forms | should require title with minimum length | Validates title length | `src/components/forms/__tests__/TransactionForm.integration.test.ts` | `expect(result.success).toBe(false)` |
| 81 | Integration | Forms | should create expense transaction from valid form data | Form submits to service | `src/components/forms/__tests__/TransactionForm.integration.test.ts` | `expect(tx.title).toBe('Groceries')` |
| 82 | Integration | Forms | should create transfer with dual entries from valid form data | Transfer creates two records | `src/components/forms/__tests__/TransactionForm.integration.test.ts` | `expect(entries.length).toBe(2)` |
| 83 | Integration | Forms | should update transaction from edited form data | Edit updates existing record | `src/components/forms/__tests__/TransactionForm.integration.test.ts` | `expect(updated?.title).toBe('Updated Title')` |
| 84 | Integration | Forms | should have sensible defaults | Default form values are valid | `src/components/forms/__tests__/TransactionForm.integration.test.ts` | `expect(DEFAULT_FORM_VALUES.type).toBe('expense')` |

### Budget + Transaction Integration Tests

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 85 | Integration | Budget | should track expenses against overall budget | Expenses count toward budget | `src/services/__tests__/budget-transaction.integration.test.ts` | `expect(progress.spent).toBe(200)` |
| 86 | Integration | Budget | should detect over-budget condition | Flags exceeded budgets | `src/services/__tests__/budget-transaction.integration.test.ts` | `expect(progress.isOverBudget).toBe(true)` |
| 87 | Integration | Budget | should EXCLUDE transfers from overall budget spending | Transfers don't affect budget | `src/services/__tests__/budget-transaction.integration.test.ts` | `expect(progress.spent).toBe(200)` |
| 88 | Integration | Budget | should track expenses against category budget | Category-specific tracking | `src/services/__tests__/budget-transaction.integration.test.ts` | `expect(progress.spent).toBe(100)` |
| 89 | Integration | Budget | should aggregate multiple expenses in same category | Sums category expenses | `src/services/__tests__/budget-transaction.integration.test.ts` | `expect(progress.spent).toBe(175)` |
| 90 | Integration | Budget | should trigger alerts when thresholds are exceeded | Alert at 50% threshold | `src/services/__tests__/budget-transaction.integration.test.ts` | `expect(progress.triggeredAlerts).toContain(50)` |
| 91 | Integration | Budget | should trigger multiple thresholds at once | Multiple alerts triggered | `src/services/__tests__/budget-transaction.integration.test.ts` | `expect(progress.triggeredAlerts).toContain(90)` |
| 92 | Integration | Budget | should reduce spent amount when expense is deleted | Delete updates progress | `src/services/__tests__/budget-transaction.integration.test.ts` | `expect(budgetService.getBudgetProgress(budget).spent).toBe(0)` |
| 93 | Integration | Budget | should only count transactions within budget period | Period-based filtering | `src/services/__tests__/budget-transaction.integration.test.ts` | `expect(progress.spent).toBe(100)` |
| 94 | Integration | Budget | should track same expense in both overall and category budgets | Multi-budget tracking | `src/services/__tests__/budget-transaction.integration.test.ts` | `expect(overallProgress.spent).toBe(150)` |

### Transaction + Account Integration Tests

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 95 | Integration | Accounts | should increase account balance when income is added | Income adds to balance | `src/services/__tests__/transaction-account.integration.test.ts` | `expect(balance).toBe(3000)` |
| 96 | Integration | Accounts | should handle multiple income transactions | Cumulative income | `src/services/__tests__/transaction-account.integration.test.ts` | `expect(balance).toBe(3500)` |
| 97 | Integration | Accounts | should decrease account balance when expense is added | Expense reduces balance | `src/services/__tests__/transaction-account.integration.test.ts` | `expect(balance).toBe(800)` |
| 98 | Integration | Accounts | should handle multiple expense transactions | Cumulative expenses | `src/services/__tests__/transaction-account.integration.test.ts` | `expect(balance).toBe(300)` |
| 99 | Integration | Accounts | should decrease source account and increase destination account | Transfer affects both accounts | `src/services/__tests__/transaction-account.integration.test.ts` | `expect(bankBalance).toBe(700)` |
| 100 | Integration | Accounts | should handle multiple transfers correctly | Multiple transfer tracking | `src/services/__tests__/transaction-account.integration.test.ts` | `expect(bankBalance).toBe(900)` |
| 101 | Integration | Accounts | should create exactly 2 records for each transfer | Dual-entry verification | `src/services/__tests__/transaction-account.integration.test.ts` | `expect(result.length).toBe(2)` |
| 102 | Integration | Accounts | should revert balance when expense is deleted | Delete reverts balance | `src/services/__tests__/transaction-account.integration.test.ts` | `expect(accountService.getAccountBalance('acc-1')).toBe(1000)` |
| 103 | Integration | Accounts | should revert both account balances when transfer is deleted | Delete reverts both accounts | `src/services/__tests__/transaction-account.integration.test.ts` | `expect(accountService.getAccountBalance('acc-2')).toBe(5000)` |
| 104 | Integration | Accounts | should update balance when transaction amount is changed | Update changes balance | `src/services/__tests__/transaction-account.integration.test.ts` | `expect(accountService.getAccountBalance('acc-1')).toBe(700)` |
| 105 | Integration | Accounts | should update both balances when transfer amount is changed | Update changes both balances | `src/services/__tests__/transaction-account.integration.test.ts` | `expect(accountService.getAccountBalance('acc-2')).toBe(5500)` |
| 106 | Integration | Accounts | should not allow deleting account with linked transactions | Protects linked accounts | `src/services/__tests__/transaction-account.integration.test.ts` | `expect(result.success).toBe(false)` |
| 107 | Integration | Accounts | should allow deleting account with no linked transactions | Allows empty account deletion | `src/services/__tests__/transaction-account.integration.test.ts` | `expect(result.success).toBe(true)` |
| 108 | Integration | Accounts | should count linked transactions correctly | Counts all linked transactions | `src/services/__tests__/transaction-account.integration.test.ts` | `expect(count).toBe(3)` |

### Transaction + Analytics Integration Tests

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 109 | Integration | Analytics | should update income totals when adding income transaction | Income updates analytics | `src/services/__tests__/transaction-analytics.integration.test.ts` | `expect(totals.income).toBe(5000)` |
| 110 | Integration | Analytics | should update expense totals when adding expense transaction | Expense updates analytics | `src/services/__tests__/transaction-analytics.integration.test.ts` | `expect(totals.expenses).toBe(150)` |
| 111 | Integration | Analytics | should NOT include transfers in income or expense totals | Transfers excluded from totals | `src/services/__tests__/transaction-analytics.integration.test.ts` | `expect(totals.income).toBe(5000)` |
| 112 | Integration | Analytics | should calculate correct savings rate excluding transfers | Savings rate excludes transfers | `src/services/__tests__/transaction-analytics.integration.test.ts` | `expect(totals.savingsRate).toBe(80)` |
| 113 | Integration | Analytics | should only include expenses in category data | Category data is expense-only | `src/services/__tests__/transaction-analytics.integration.test.ts` | `expect(categoryData.length).toBe(2)` |
| 114 | Integration | Analytics | should aggregate multiple expenses in same category | Category aggregation works | `src/services/__tests__/transaction-analytics.integration.test.ts` | `expect(categoryData.find(c => c.name === 'Food')?.value).toBe(175)` |
| 115 | Integration | Analytics | should reduce totals when transaction is deleted | Delete updates totals | `src/services/__tests__/transaction-analytics.integration.test.ts` | `expect(totals.expenses).toBe(50)` |
| 116 | Integration | Analytics | should remove transfer from analytics when deleted | Delete cleans up transfers | `src/services/__tests__/transaction-analytics.integration.test.ts` | `expect(transactions.length).toBe(1)` |
| 117 | Integration | Analytics | should group expenses by month and exclude transfers | Monthly grouping excludes transfers | `src/services/__tests__/transaction-analytics.integration.test.ts` | `expect(jan?.total).toBe(100)` |

### SMS Pipeline Integration Tests

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 118 | Integration | SMS Import | should process SMS entries and return transactions | SMS to transaction conversion | `src/services/__tests__/sms-pipeline.integration.test.ts` | `expect(Array.isArray(transactions)).toBe(true)` |
| 119 | Integration | SMS Import | should handle multiple SMS entries | Batch SMS processing | `src/services/__tests__/sms-pipeline.integration.test.ts` | `expect(transactions.length).toBeLessThanOrEqual(2)` |
| 120 | Integration | SMS Import | should skip invalid SMS entries gracefully | Error handling for bad SMS | `src/services/__tests__/sms-pipeline.integration.test.ts` | `expect(Array.isArray(transactions)).toBe(true)` |
| 121 | Integration | SMS Import | should process SMS messages via transaction service | Service-level SMS processing | `src/services/__tests__/sms-pipeline.integration.test.ts` | `expect(Array.isArray(transactions)).toBe(true)` |
| 122 | Integration | SMS Import | should handle empty message array | Empty input handling | `src/services/__tests__/sms-pipeline.integration.test.ts` | `expect(transactions).toEqual([])` |
| 123 | Integration | SMS Import | should process SMS and allow saving to storage | End-to-end SMS flow | `src/services/__tests__/sms-pipeline.integration.test.ts` | `expect(Array.isArray(allTransactions)).toBe(true)` |
| 124 | Integration | SMS Import | should detect SAR currency from SMS | Currency detection | `src/services/__tests__/sms-pipeline.integration.test.ts` | `expect(transactions[0].currency).toBe('SAR')` |
| 125 | Integration | SMS Import | should not throw on malformed SMS data | Graceful error handling | `src/services/__tests__/sms-pipeline.integration.test.ts` | `expect(() => processSmsEntries(malformedEntries)).not.toThrow()` |
| 126 | Integration | SMS Import | should handle SMS with only partial transaction data | Partial data handling | `src/services/__tests__/sms-pipeline.integration.test.ts` | `expect(Array.isArray(transactions)).toBe(true)` |

---

## End-to-End Tests

### Transaction CRUD Journey

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 127 | E2E | Transactions | should create a new expense transaction | Full expense creation flow | `e2e/transaction-crud.spec.ts` | `await list.expectTransactionVisible(testTransaction.title)` |
| 128 | E2E | Transactions | should edit an existing transaction | Edit transaction flow | `e2e/transaction-crud.spec.ts` | `await list.expectTransactionVisible(updatedTitle)` |
| 129 | E2E | Transactions | should delete a transaction | Delete transaction flow | `e2e/transaction-crud.spec.ts` | `await list.expectTransactionNotVisible(testTransaction.title)` |
| 130 | E2E | Transactions | should validate required fields | Form validation errors | `e2e/transaction-crud.spec.ts` | `await expect(page.getByText(/required|title is required/i)).toBeVisible()` |
| 131 | E2E | Transactions | should filter transactions by category | Category filter works | `e2e/transaction-crud.spec.ts` | `await list.expectTransactionVisible('Food Transaction')` |
| 132 | E2E | Transactions | should create an income transaction | Income creation flow | `e2e/transaction-crud.spec.ts` | `await expect(row).toContainText(/\+|\$5,000/)` |

### Transfer Transaction Flow

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 133 | E2E | Transfers | should create a transfer between accounts | Transfer creation flow | `e2e/transfer-flow.spec.ts` | `await expect(page.getByText(testTransfer.title)).toBeVisible()` |
| 134 | E2E | Transfers | should show transfer as neutral in analytics | Transfer excluded from analytics | `e2e/transfer-flow.spec.ts` | `await expect(incomeSection).not.toContainText(testTransfer.amount)` |
| 135 | E2E | Transfers | should link transfer entries together | Dual-entry linked correctly | `e2e/transfer-flow.spec.ts` | `await expect(transferEntries).toHaveCount(2)` |
| 136 | E2E | Transfers | should delete both transfer entries when one is deleted | Atomic transfer deletion | `e2e/transfer-flow.spec.ts` | `await expect(page.getByText(testTransfer.title)).not.toBeVisible()` |

### Budget Management Journey

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 137 | E2E | Budget | should navigate to budget hub | Budget page navigation | `e2e/budget-management.spec.ts` | `await nav.expectCurrentRoute('/budget')` |
| 138 | E2E | Budget | should create a new budget | Budget creation flow | `e2e/budget-management.spec.ts` | `await expect(page.getByText(/success|created|saved/i)).toBeVisible()` |
| 139 | E2E | Budget | should display budget progress | Progress indicator visible | `e2e/budget-management.spec.ts` | `await expect(progressIndicator.first()).toBeVisible()` |
| 140 | E2E | Budget | should show budget report | Report page loads | `e2e/budget-management.spec.ts` | `await expect(page.getByRole('heading', { name: /report|overview/i })).toBeVisible()` |
| 141 | E2E | Budget | should edit existing budget | Budget edit flow | `e2e/budget-management.spec.ts` | `await expect(page.getByText('600')).toBeVisible()` |
| 142 | E2E | Budget | should delete a budget | Budget deletion flow | `e2e/budget-management.spec.ts` | `await expect(page.getByText('Entertainment')).not.toBeVisible()` |
| 143 | E2E | Budget | should switch between budget periods | Period navigation works | `e2e/budget-management.spec.ts` | `await expect(monthlyTab).toHaveAttribute('data-state', 'active')` |

### Analytics Dashboard Journey

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 144 | E2E | Analytics | should navigate to analytics page | Analytics page navigation | `e2e/analytics-dashboard.spec.ts` | `await nav.expectCurrentRoute('/analytics')` |
| 145 | E2E | Analytics | should display income and expense totals | Totals display correctly | `e2e/analytics-dashboard.spec.ts` | `await expect(page.getByText(/5,000|5000/)).toBeVisible()` |
| 146 | E2E | Analytics | should display category breakdown chart | Chart renders | `e2e/analytics-dashboard.spec.ts` | `await expect(chart.first()).toBeVisible()` |
| 147 | E2E | Analytics | should filter analytics by date range | Date filter works | `e2e/analytics-dashboard.spec.ts` | `await thisMonthOption.click()` |
| 148 | E2E | Analytics | should show spending trends over time | Trend chart visible | `e2e/analytics-dashboard.spec.ts` | `await expect(trendChart.first()).toBeVisible()` |
| 149 | E2E | Analytics | should exclude transfers from analytics totals | Transfers excluded | `e2e/analytics-dashboard.spec.ts` | `await expect(incomeTotal).not.toContainText(/4,000|4000/)` |
| 150 | E2E | Analytics | should display dashboard summary cards | Summary cards visible | `e2e/analytics-dashboard.spec.ts` | `await expect(summarySection).toBeVisible()` |
| 151 | E2E | Analytics | should show recent transactions on dashboard | Recent transactions visible | `e2e/analytics-dashboard.spec.ts` | `await expect(page.getByText('Dashboard Test Transaction')).toBeVisible()` |

### Account Management Journey

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 152 | E2E | Accounts | should navigate to accounts page | Accounts page navigation | `e2e/accounts.spec.ts` | `await expect(page.getByRole('heading', { name: /account/i })).toBeVisible()` |
| 153 | E2E | Accounts | should create a new account | Account creation flow | `e2e/accounts.spec.ts` | `await expect(page.getByText(testAccount.name)).toBeVisible()` |
| 154 | E2E | Accounts | should edit an existing account | Account edit flow | `e2e/accounts.spec.ts` | `await expect(page.getByText(updatedName)).toBeVisible()` |
| 155 | E2E | Accounts | should delete an account | Account deletion flow | `e2e/accounts.spec.ts` | `await expect(page.getByText('Account To Delete')).not.toBeVisible()` |
| 156 | E2E | Accounts | should show account balance updates after transactions | Balance updates on transaction | `e2e/accounts.spec.ts` | `await expect(accountBalance).toBeVisible()` |

### Settings & Preferences Journey

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 157 | E2E | Settings | should navigate to settings page | Settings page navigation | `e2e/settings-flow.spec.ts` | `await nav.expectCurrentRoute('/settings')` |
| 158 | E2E | Settings | should change currency preference | Currency change persists | `e2e/settings-flow.spec.ts` | `await expect(currencySelect).toContainText(/EUR|Euro/i)` |
| 159 | E2E | Settings | should toggle dark mode | Theme toggle works | `e2e/settings-flow.spec.ts` | `expect(newState).not.toBe(initialState)` |
| 160 | E2E | Settings | should persist settings across sessions | Settings persist in new tab | `e2e/settings-flow.spec.ts` | `await expect(newCurrencySelect).toContainText(/GBP|Pound/i)` |
| 161 | E2E | Settings | should export data | Export triggers download | `e2e/settings-flow.spec.ts` | `expect(download.suggestedFilename()).toMatch(/\.json|\.csv/)` |
| 162 | E2E | Settings | should clear all data | Clear data works | `e2e/settings-flow.spec.ts` | `await expect(page.getByText('Test Transaction')).not.toBeVisible()` |
| 163 | E2E | Onboarding | should show onboarding for new users | Onboarding displays | `e2e/settings-flow.spec.ts` | `await expect(page.getByRole('heading', { name: /welcome|get started|onboarding/i })).toBeVisible()` |
| 164 | E2E | Onboarding | should complete onboarding steps | Onboarding completes | `e2e/settings-flow.spec.ts` | `await nav.expectCurrentRoute('/(home)?')` |

### Smart Paste Flow

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 165 | E2E | Smart Paste | should navigate to import page | Import page navigation | `e2e/smart-paste.spec.ts` | `await nav.expectCurrentRoute('/import-transactions')` |
| 166 | E2E | Smart Paste | should paste and parse transaction text | Text parsing works | `e2e/smart-paste.spec.ts` | `await expect(page.getByText(/coffee|starbucks/i)).toBeVisible()` |
| 167 | E2E | Smart Paste | should parse SMS message format | SMS format parsing | `e2e/smart-paste.spec.ts` | `await expect(page.getByText(/150|SAR/i)).toBeVisible()` |
| 168 | E2E | Smart Paste | should allow editing parsed transactions before import | Edit before import | `e2e/smart-paste.spec.ts` | `await expect(page.getByLabel(/title|description/i)).toBeVisible()` |
| 169 | E2E | Smart Paste | should import all parsed transactions | Bulk import works | `e2e/smart-paste.spec.ts` | `await expect(page.getByText(/success|imported|added/i)).toBeVisible()` |
| 170 | E2E | Smart Paste | should handle empty input gracefully | Empty input error | `e2e/smart-paste.spec.ts` | `await expect(page.getByText(/no transactions|empty|required/i)).toBeVisible()` |
| 171 | E2E | Smart Paste | should handle invalid text format | Invalid format error | `e2e/smart-paste.spec.ts` | `await expect(page.getByText(/no transactions|couldn't parse|not found/i)).toBeVisible()` |
| 172 | E2E | Smart Paste | should auto-detect categories from transaction descriptions | Category auto-detection | `e2e/smart-paste.spec.ts` | `await expect(page.getByText(/food|coffee/i)).toBeVisible()` |

### Error Handling & Edge Cases

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 173 | E2E | Error Handling | should handle 404 page not found | 404 page displays | `e2e/error-handling.spec.ts` | `await expect(page.getByText(/not found|404/i)).toBeVisible()` |
| 174 | E2E | Error Handling | should handle network errors gracefully | Network error resilience | `e2e/error-handling.spec.ts` | `await expect(page.locator('body')).toBeVisible()` |
| 175 | E2E | Error Handling | should validate negative amounts | Negative amount handling | `e2e/error-handling.spec.ts` | `await expect(errorMessage.or(successScenario)).toBeVisible()` |
| 176 | E2E | Error Handling | should handle very large amounts | Large amount handling | `e2e/error-handling.spec.ts` | `await expect(page.locator('body')).toBeVisible()` |
| 177 | E2E | Error Handling | should handle special characters in transaction title | XSS prevention | `e2e/error-handling.spec.ts` | `await expect(page.locator('body')).toBeVisible()` |
| 178 | E2E | Error Handling | should handle rapid form submissions | Debounce/dedup | `e2e/error-handling.spec.ts` | `expect(count).toBeLessThanOrEqual(3)` |
| 179 | E2E | Error Handling | should preserve form data on navigation away and back | Form state resilience | `e2e/error-handling.spec.ts` | `await expect(page.locator('body')).toBeVisible()` |
| 180 | E2E | Error Handling | should handle localStorage quota exceeded | Storage error handling | `e2e/error-handling.spec.ts` | `await expect(page.locator('body')).toBeVisible()` |

### Accessibility Edge Cases

| S# | Category | App Flow | Test Case Name | Test Case Description | Codebase Path | Piece of Code |
|----|----------|----------|----------------|----------------------|---------------|---------------|
| 181 | E2E | Accessibility | should be keyboard navigable | Keyboard navigation works | `e2e/error-handling.spec.ts` | `await expect(focusedElement).toBeVisible()` |
| 182 | E2E | Accessibility | should have proper heading hierarchy | Single H1 per page | `e2e/error-handling.spec.ts` | `expect(await h1.count()).toBe(1)` |

---

## Running Tests

### Unit & Integration Tests (Vitest)

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific file
npm run test -- src/services/__tests__/TransactionService.test.ts

# Watch mode
npm run test:watch
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npx playwright test

# Run with UI mode
npx playwright test --ui

# Run headed (visible browser)
npx playwright test --headed

# Run specific file
npx playwright test e2e/transaction-crud.spec.ts
```

---

## Test Coverage Thresholds

Current configuration in `vite.config.ts`:

| Metric | Threshold |
|--------|-----------|
| Lines | 30% |
| Functions | 30% |
| Branches | 10% |
| Statements | 30% |
