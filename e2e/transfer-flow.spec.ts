import { test, expect } from '@playwright/test';
import { routes, testTransfer } from './fixtures/test-data';
import { NavigationHelper, TransactionFormHelper } from './fixtures/page-objects';

test.describe('Transfer Transaction Flow', () => {
  let nav: NavigationHelper;
  let form: TransactionFormHelper;

  test.beforeEach(async ({ page }) => {
    nav = new NavigationHelper(page);
    form = new TransactionFormHelper(page);
    
    await page.goto(routes.home);
    await page.evaluate(() => localStorage.clear());
  });

  test('should create a transfer between accounts', async ({ page }) => {
    await nav.navigateToTransactions();
    await page.getByRole('button', { name: /add|new|create/i }).click();
    
    // Select transfer type
    await page.getByRole('radio', { name: /transfer/i }).click();
    
    // Fill transfer details
    await page.getByLabel(/title|description/i).fill(testTransfer.title);
    await page.getByLabel(/amount/i).fill(testTransfer.amount);
    
    // Select accounts if dropdowns are available
    const fromAccountSelect = page.getByLabel(/from account|source/i);
    if (await fromAccountSelect.isVisible()) {
      await fromAccountSelect.click();
      await page.getByRole('option', { name: testTransfer.fromAccount }).click();
    }
    
    const toAccountSelect = page.getByLabel(/to account|destination/i);
    if (await toAccountSelect.isVisible()) {
      await toAccountSelect.click();
      await page.getByRole('option', { name: testTransfer.toAccount }).click();
    }
    
    await form.submitForm();
    
    // Verify transfer appears in transactions
    await expect(page.getByText(testTransfer.title)).toBeVisible();
  });

  test('should show transfer as neutral in analytics', async ({ page }) => {
    // Create a transfer
    await nav.navigateToTransactions();
    await page.getByRole('button', { name: /add|new|create/i }).click();
    await page.getByRole('radio', { name: /transfer/i }).click();
    await page.getByLabel(/title|description/i).fill(testTransfer.title);
    await page.getByLabel(/amount/i).fill(testTransfer.amount);
    await form.submitForm();
    
    // Navigate to analytics
    await nav.navigateToAnalytics();
    
    // Verify transfer doesn't affect income/expense totals
    // The exact selectors will depend on the analytics page structure
    const incomeSection = page.locator('[data-testid="total-income"]');
    const expenseSection = page.locator('[data-testid="total-expenses"]');
    
    // Transfers should not appear in income or expense totals
    if (await incomeSection.isVisible()) {
      await expect(incomeSection).not.toContainText(testTransfer.amount);
    }
    if (await expenseSection.isVisible()) {
      await expect(expenseSection).not.toContainText(testTransfer.amount);
    }
  });

  test('should link transfer entries together', async ({ page }) => {
    await nav.navigateToTransactions();
    await page.getByRole('button', { name: /add|new|create/i }).click();
    await page.getByRole('radio', { name: /transfer/i }).click();
    await page.getByLabel(/title|description/i).fill(testTransfer.title);
    await page.getByLabel(/amount/i).fill(testTransfer.amount);
    await form.submitForm();
    
    // Both entries should be visible (debit and credit)
    // This depends on how the app displays linked transfers
    const transferEntries = page.getByText(testTransfer.title);
    
    // Dual-entry should create 2 linked records
    await expect(transferEntries).toHaveCount(2);
  });

  test('should delete both transfer entries when one is deleted', async ({ page }) => {
    // Create a transfer
    await nav.navigateToTransactions();
    await page.getByRole('button', { name: /add|new|create/i }).click();
    await page.getByRole('radio', { name: /transfer/i }).click();
    await page.getByLabel(/title|description/i).fill(testTransfer.title);
    await page.getByLabel(/amount/i).fill(testTransfer.amount);
    await form.submitForm();
    
    // Delete the transfer
    const firstEntry = page.getByRole('row').filter({ hasText: testTransfer.title }).first();
    await firstEntry.getByRole('button', { name: /delete/i }).click();
    await page.getByRole('button', { name: /ok|confirm|delete/i }).click();
    
    // Both entries should be removed
    await expect(page.getByText(testTransfer.title)).not.toBeVisible();
  });
});
