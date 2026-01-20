import { test, expect } from '@playwright/test';
import { routes, testTransaction } from './fixtures/test-data';
import { 
  NavigationHelper, 
  TransactionFormHelper, 
  TransactionListHelper 
} from './fixtures/page-objects';

test.describe('Transaction CRUD Journey', () => {
  let nav: NavigationHelper;
  let form: TransactionFormHelper;
  let list: TransactionListHelper;

  test.beforeEach(async ({ page }) => {
    nav = new NavigationHelper(page);
    form = new TransactionFormHelper(page);
    list = new TransactionListHelper(page);
    
    // Clear localStorage before each test
    await page.goto(routes.home);
    await page.evaluate(() => localStorage.clear());
  });

  test('should create a new expense transaction', async ({ page }) => {
    await nav.navigateToTransactions();
    
    // Click add transaction button
    await page.getByRole('button', { name: /add|new|create/i }).click();
    
    // Fill the form
    await form.fillTransactionForm({
      title: testTransaction.title,
      amount: testTransaction.amount,
      category: testTransaction.category,
      type: 'expense',
    });
    
    await form.submitForm();
    
    // Verify transaction appears in list
    await list.expectTransactionVisible(testTransaction.title);
  });

  test('should edit an existing transaction', async ({ page }) => {
    // First create a transaction
    await nav.navigateToTransactions();
    await page.getByRole('button', { name: /add|new|create/i }).click();
    await form.fillTransactionForm({
      title: testTransaction.title,
      amount: testTransaction.amount,
    });
    await form.submitForm();
    
    // Wait for transaction to appear
    await list.expectTransactionVisible(testTransaction.title);
    
    // Edit the transaction
    await list.clickEditTransaction(testTransaction.title);
    
    const updatedTitle = 'Updated E2E Transaction';
    await page.getByLabel(/title/i).clear();
    await page.getByLabel(/title/i).fill(updatedTitle);
    await form.submitForm();
    
    // Verify updated transaction
    await list.expectTransactionVisible(updatedTitle);
    await list.expectTransactionNotVisible(testTransaction.title);
  });

  test('should delete a transaction', async ({ page }) => {
    // Create a transaction first
    await nav.navigateToTransactions();
    await page.getByRole('button', { name: /add|new|create/i }).click();
    await form.fillTransactionForm({
      title: testTransaction.title,
      amount: testTransaction.amount,
    });
    await form.submitForm();
    
    await list.expectTransactionVisible(testTransaction.title);
    
    // Delete the transaction
    await list.clickDeleteTransaction(testTransaction.title);
    await list.confirmDelete();
    
    // Verify transaction is removed
    await list.expectTransactionNotVisible(testTransaction.title);
  });

  test('should validate required fields', async ({ page }) => {
    await nav.navigateToTransactions();
    await page.getByRole('button', { name: /add|new|create/i }).click();
    
    // Try to submit empty form
    await form.submitForm();
    
    // Expect validation errors
    await expect(page.getByText(/required|title is required/i)).toBeVisible();
  });

  test('should filter transactions by category', async ({ page }) => {
    // Create transactions with different categories
    await nav.navigateToTransactions();
    
    // Add Food transaction
    await page.getByRole('button', { name: /add|new|create/i }).click();
    await form.fillTransactionForm({
      title: 'Food Transaction',
      amount: '10.00',
      category: 'Food',
    });
    await form.submitForm();
    
    // Add Transport transaction
    await page.getByRole('button', { name: /add|new|create/i }).click();
    await form.fillTransactionForm({
      title: 'Transport Transaction',
      amount: '20.00',
      category: 'Transport',
    });
    await form.submitForm();
    
    // Filter by Food category
    await page.getByRole('combobox', { name: /filter|category/i }).click();
    await page.getByRole('option', { name: 'Food' }).click();
    
    // Verify only Food transaction is visible
    await list.expectTransactionVisible('Food Transaction');
    await list.expectTransactionNotVisible('Transport Transaction');
  });
});

test.describe('Income Transaction Flow', () => {
  test('should create an income transaction', async ({ page }) => {
    const nav = new NavigationHelper(page);
    const form = new TransactionFormHelper(page);
    const list = new TransactionListHelper(page);
    
    await page.goto(routes.home);
    await page.evaluate(() => localStorage.clear());
    
    await nav.navigateToTransactions();
    await page.getByRole('button', { name: /add|new|create/i }).click();
    
    await form.fillTransactionForm({
      title: 'Salary Payment',
      amount: '5000.00',
      type: 'income',
    });
    await form.submitForm();
    
    await list.expectTransactionVisible('Salary Payment');
    
    // Verify it shows as income (positive amount indicator)
    const row = page.getByRole('row').filter({ hasText: 'Salary Payment' });
    await expect(row).toContainText(/\+|\$5,000/);
  });
});
