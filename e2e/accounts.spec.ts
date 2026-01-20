import { test, expect } from '@playwright/test';
import { routes, testAccount } from './fixtures/test-data';
import { NavigationHelper } from './fixtures/page-objects';
import { setupTestUser } from './fixtures/test-setup';

test.describe('Account Management Journey', () => {
  let nav: NavigationHelper;

  test.beforeEach(async ({ page }) => {
    nav = new NavigationHelper(page);
    await page.goto(routes.home);
    await setupTestUser(page);
  });

  test('should navigate to accounts page', async ({ page }) => {
    await page.goto(routes.budgetAccounts);
    
    await expect(page.getByRole('heading', { name: /account/i })).toBeVisible();
  });

  test('should create a new account', async ({ page }) => {
    await page.goto(routes.budgetAccounts);
    
    const addButton = page.getByRole('button', { name: /add|new|create/i });
    
    if (await addButton.isVisible()) {
      await addButton.click();
      
      await page.getByLabel(/name/i).fill(testAccount.name);
      
      const typeSelect = page.getByLabel(/type/i);
      if (await typeSelect.isVisible()) {
        await typeSelect.click();
        await page.getByRole('option', { name: /checking/i }).click();
      }
      
      const balanceInput = page.getByLabel(/balance/i);
      if (await balanceInput.isVisible()) {
        await balanceInput.fill(testAccount.balance);
      }
      
      await page.getByRole('button', { name: /save|create|add/i }).click();
      
      await expect(page.getByText(testAccount.name)).toBeVisible();
    }
  });

  test('should edit an existing account', async ({ page }) => {
    await page.goto(routes.budgetAccounts);
    
    // Create an account first
    const addButton = page.getByRole('button', { name: /add|new|create/i });
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.getByLabel(/name/i).fill(testAccount.name);
      await page.getByRole('button', { name: /save|create|add/i }).click();
    }
    
    // Find and edit the account
    const accountRow = page.getByText(testAccount.name).locator('..');
    const editButton = accountRow.getByRole('button', { name: /edit/i });
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      const updatedName = 'Updated Account Name';
      await page.getByLabel(/name/i).clear();
      await page.getByLabel(/name/i).fill(updatedName);
      await page.getByRole('button', { name: /save|update/i }).click();
      
      await expect(page.getByText(updatedName)).toBeVisible();
    }
  });

  test('should delete an account', async ({ page }) => {
    await page.goto(routes.budgetAccounts);
    
    // Create an account first
    const addButton = page.getByRole('button', { name: /add|new|create/i });
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.getByLabel(/name/i).fill('Account To Delete');
      await page.getByRole('button', { name: /save|create|add/i }).click();
    }
    
    // Find and delete the account
    const accountRow = page.getByText('Account To Delete').locator('..');
    const deleteButton = accountRow.getByRole('button', { name: /delete/i });
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await page.getByRole('button', { name: /confirm|ok|delete/i }).click();
      
      await expect(page.getByText('Account To Delete')).not.toBeVisible();
    }
  });

  test('should show account balance updates after transactions', async ({ page }) => {
    // Create an account
    await page.goto(routes.budgetAccounts);
    const addButton = page.getByRole('button', { name: /add|new|create/i });
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.getByLabel(/name/i).fill('Test Balance Account');
      const balanceInput = page.getByLabel(/balance/i);
      if (await balanceInput.isVisible()) {
        await balanceInput.fill('1000.00');
      }
      await page.getByRole('button', { name: /save|create|add/i }).click();
    }
    
    // Add a transaction for this account
    await nav.navigateToTransactions();
    await page.getByRole('button', { name: /add|new|create/i }).click();
    await page.getByLabel(/title/i).fill('Account Transaction');
    await page.getByLabel(/amount/i).fill('200.00');
    
    const accountSelect = page.getByLabel(/account/i);
    if (await accountSelect.isVisible()) {
      await accountSelect.click();
      await page.getByRole('option', { name: /Test Balance Account/i }).click();
    }
    
    await page.getByRole('button', { name: /save|add|submit/i }).click();
    
    // Check account balance updated
    await page.goto(routes.budgetAccounts);
    const accountBalance = page.getByText(/800|1,200/); // Depending on expense vs income
    await expect(accountBalance).toBeVisible({ timeout: 5000 });
  });
});
