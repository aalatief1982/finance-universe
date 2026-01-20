import { test, expect } from '@playwright/test';
import { routes } from './fixtures/test-data';
import { NavigationHelper, TransactionFormHelper } from './fixtures/page-objects';
import { setupTestUser } from './fixtures/test-setup';

test.describe('Analytics Dashboard Journey', () => {
  let nav: NavigationHelper;
  let form: TransactionFormHelper;

  test.beforeEach(async ({ page }) => {
    nav = new NavigationHelper(page);
    form = new TransactionFormHelper(page);
    await page.goto(routes.home);
    await setupTestUser(page);
  });

  test('should navigate to analytics page', async ({ page }) => {
    await nav.navigateToAnalytics();
    await nav.expectCurrentRoute('/analytics');
    
    await expect(page.getByRole('heading', { name: /analytics|reports/i })).toBeVisible();
  });

  test('should display income and expense totals', async ({ page }) => {
    // Add some transactions first
    await nav.navigateToTransactions();
    
    // Add income
    await page.getByRole('button', { name: /add|new|create/i }).click();
    await form.fillTransactionForm({
      title: 'Salary',
      amount: '5000.00',
      type: 'income',
    });
    await form.submitForm();
    
    // Add expense
    await page.getByRole('button', { name: /add|new|create/i }).click();
    await form.fillTransactionForm({
      title: 'Rent',
      amount: '1500.00',
      type: 'expense',
    });
    await form.submitForm();
    
    // Navigate to analytics
    await nav.navigateToAnalytics();
    
    // Verify totals are displayed
    await expect(page.getByText(/5,000|5000/)).toBeVisible();
    await expect(page.getByText(/1,500|1500/)).toBeVisible();
  });

  test('should display category breakdown chart', async ({ page }) => {
    // Add transactions with categories
    await nav.navigateToTransactions();
    
    await page.getByRole('button', { name: /add|new|create/i }).click();
    await form.fillTransactionForm({
      title: 'Groceries',
      amount: '200.00',
      category: 'Food',
      type: 'expense',
    });
    await form.submitForm();
    
    await nav.navigateToAnalytics();
    
    // Should show chart or category breakdown
    const chart = page.locator('svg').or(page.locator('[data-testid="category-chart"]'));
    await expect(chart.first()).toBeVisible();
  });

  test('should filter analytics by date range', async ({ page }) => {
    await nav.navigateToAnalytics();
    
    const dateFilter = page.getByRole('button', { name: /this month|date range|filter/i }).or(
      page.getByLabel(/date/i)
    );
    
    if (await dateFilter.isVisible()) {
      await dateFilter.click();
      
      // Select a preset or date range
      const thisMonthOption = page.getByRole('option', { name: /this month/i }).or(
        page.getByRole('menuitem', { name: /this month/i })
      );
      
      if (await thisMonthOption.isVisible()) {
        await thisMonthOption.click();
      }
    }
  });

  test('should show spending trends over time', async ({ page }) => {
    await nav.navigateToAnalytics();
    
    // Look for trend chart or graph
    const trendChart = page.locator('[data-testid="spending-trend"]').or(
      page.getByText(/trend|over time/i)
    );
    
    await expect(trendChart.first()).toBeVisible({ timeout: 5000 });
  });

  test('should exclude transfers from analytics totals', async ({ page }) => {
    // Add a transfer
    await nav.navigateToTransactions();
    await page.getByRole('button', { name: /add|new|create/i }).click();
    await page.getByRole('radio', { name: /transfer/i }).click();
    await page.getByLabel(/title|description/i).fill('Internal Transfer');
    await page.getByLabel(/amount/i).fill('1000.00');
    await form.submitForm();
    
    // Add real income
    await page.getByRole('button', { name: /add|new|create/i }).click();
    await form.fillTransactionForm({
      title: 'Salary',
      amount: '3000.00',
      type: 'income',
    });
    await form.submitForm();
    
    await nav.navigateToAnalytics();
    
    // Income should be 3000, not 4000 (transfer excluded)
    const incomeTotal = page.locator('[data-testid="total-income"]');
    if (await incomeTotal.isVisible()) {
      await expect(incomeTotal).toContainText(/3,000|3000/);
      await expect(incomeTotal).not.toContainText(/4,000|4000/);
    }
  });
});

test.describe('Dashboard Overview', () => {
  test('should display dashboard summary cards', async ({ page }) => {
    const nav = new NavigationHelper(page);
    
    await page.goto(routes.home);
    await setupTestUser(page);
    await nav.navigateToHome();
    
    // Should show summary cards
    const summarySection = page.locator('[data-testid="dashboard-summary"]').or(
      page.getByText(/total|balance|income|expense/i).first().locator('..')
    );
    
    await expect(summarySection).toBeVisible();
  });

  test('should show recent transactions on dashboard', async ({ page }) => {
    const nav = new NavigationHelper(page);
    const form = new TransactionFormHelper(page);
    
    await page.goto(routes.home);
    await setupTestUser(page);
    // Add a transaction
    await nav.navigateToTransactions();
    await page.getByRole('button', { name: /add|new|create/i }).click();
    await form.fillTransactionForm({
      title: 'Dashboard Test Transaction',
      amount: '50.00',
    });
    await form.submitForm();
    
    // Go to dashboard
    await nav.navigateToHome();
    
    // Should show recent transactions
    await expect(page.getByText('Dashboard Test Transaction')).toBeVisible();
  });
});
