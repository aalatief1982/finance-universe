import { test, expect } from '@playwright/test';
import { routes, testBudget } from './fixtures/test-data';
import { NavigationHelper, BudgetHelper } from './fixtures/page-objects';

test.describe('Budget Management Journey', () => {
  let nav: NavigationHelper;
  let budget: BudgetHelper;

  test.beforeEach(async ({ page }) => {
    nav = new NavigationHelper(page);
    budget = new BudgetHelper(page);
    
    await page.goto(routes.home);
    await page.evaluate(() => localStorage.clear());
    
    // Enable beta features if needed
    await page.evaluate(() => {
      localStorage.setItem('xpensia_beta_code', 'valid');
    });
  });

  test('should navigate to budget hub', async ({ page }) => {
    await nav.navigateToBudget();
    await nav.expectCurrentRoute('/budget');
    
    // Verify budget page content
    await expect(page.getByRole('heading', { name: /budget/i })).toBeVisible();
  });

  test('should create a new budget', async ({ page }) => {
    await page.goto(routes.budgetSet);
    
    await budget.fillBudgetForm({
      category: testBudget.category,
      amount: testBudget.amount,
    });
    
    await budget.saveBudget();
    
    // Should redirect to budget hub or show success
    await expect(page.getByText(/success|created|saved/i)).toBeVisible();
  });

  test('should display budget progress', async ({ page }) => {
    // First create a budget
    await page.goto(routes.budgetSet);
    await budget.fillBudgetForm({
      category: 'Food',
      amount: '500.00',
    });
    await budget.saveBudget();
    
    // Navigate to budget hub
    await nav.navigateToBudget();
    
    // Verify progress bar or indicator is visible
    const progressIndicator = page.locator('[data-testid="budget-progress"]').or(
      page.locator('[role="progressbar"]')
    ).or(
      page.getByText(/spent|remaining/i)
    );
    
    await expect(progressIndicator.first()).toBeVisible();
  });

  test('should show budget report', async ({ page }) => {
    await page.goto(routes.budgetReport);
    
    await expect(page.getByRole('heading', { name: /report|overview/i })).toBeVisible();
  });

  test('should edit existing budget', async ({ page }) => {
    // Create a budget first
    await page.goto(routes.budgetSet);
    await budget.fillBudgetForm({
      category: 'Food',
      amount: '500.00',
    });
    await budget.saveBudget();
    
    // Navigate back to edit
    await nav.navigateToBudget();
    
    // Find and click edit on the budget
    const budgetCard = page.locator('[data-testid="budget-Food"]').or(
      page.getByText('Food').locator('..')
    );
    
    if (await budgetCard.getByRole('button', { name: /edit/i }).isVisible()) {
      await budgetCard.getByRole('button', { name: /edit/i }).click();
      
      // Update the amount
      await page.getByLabel(/amount|budget/i).clear();
      await page.getByLabel(/amount|budget/i).fill('600.00');
      await budget.saveBudget();
      
      // Verify update
      await expect(page.getByText('600')).toBeVisible();
    }
  });

  test('should delete a budget', async ({ page }) => {
    // Create a budget first
    await page.goto(routes.budgetSet);
    await budget.fillBudgetForm({
      category: 'Entertainment',
      amount: '200.00',
    });
    await budget.saveBudget();
    
    await nav.navigateToBudget();
    
    // Find and delete the budget
    const budgetCard = page.locator('[data-testid="budget-Entertainment"]').or(
      page.getByText('Entertainment').locator('..')
    );
    
    if (await budgetCard.getByRole('button', { name: /delete/i }).isVisible()) {
      await budgetCard.getByRole('button', { name: /delete/i }).click();
      await page.getByRole('button', { name: /ok|confirm|delete/i }).click();
      
      // Verify removal
      await expect(page.getByText('Entertainment')).not.toBeVisible();
    }
  });
});

test.describe('Budget Period Navigation', () => {
  test('should switch between budget periods', async ({ page }) => {
    await page.goto(routes.home);
    await page.evaluate(() => {
      localStorage.setItem('xpensia_beta_code', 'valid');
    });
    
    await page.goto(routes.budget);
    
    // Look for period selectors
    const periodSelector = page.getByRole('combobox', { name: /period/i }).or(
      page.getByRole('tablist')
    );
    
    if (await periodSelector.isVisible()) {
      // Try switching periods
      const monthlyTab = page.getByRole('tab', { name: /monthly/i });
      const weeklyTab = page.getByRole('tab', { name: /weekly/i });
      
      if (await monthlyTab.isVisible()) {
        await monthlyTab.click();
        await expect(monthlyTab).toHaveAttribute('data-state', 'active');
      }
      
      if (await weeklyTab.isVisible()) {
        await weeklyTab.click();
        await expect(weeklyTab).toHaveAttribute('data-state', 'active');
      }
    }
  });
});
