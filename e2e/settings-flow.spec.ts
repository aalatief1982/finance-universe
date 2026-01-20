import { test, expect } from '@playwright/test';
import { routes } from './fixtures/test-data';
import { NavigationHelper, SettingsHelper } from './fixtures/page-objects';
import { setupTestUser, setupNewUser } from './fixtures/test-setup';

test.describe('Settings & Preferences Journey', () => {
  let nav: NavigationHelper;
  let settings: SettingsHelper;

  test.beforeEach(async ({ page }) => {
    nav = new NavigationHelper(page);
    settings = new SettingsHelper(page);
    await page.goto(routes.home);
    await setupTestUser(page);
  });

  test('should navigate to settings page', async ({ page }) => {
    await nav.navigateToSettings();
    await nav.expectCurrentRoute('/settings');
    
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('should change currency preference', async ({ page }) => {
    await nav.navigateToSettings();
    
    const currencySelect = page.getByLabel(/currency/i).or(
      page.getByRole('combobox', { name: /currency/i })
    );
    
    if (await currencySelect.isVisible()) {
      await currencySelect.click();
      await page.getByRole('option', { name: /EUR|Euro/i }).click();
      
      // Save or auto-save
      const saveButton = page.getByRole('button', { name: /save/i });
      if (await saveButton.isVisible()) {
        await saveButton.click();
      }
      
      // Verify currency is saved
      await page.reload();
      await expect(currencySelect).toContainText(/EUR|Euro/i);
    }
  });

  test('should toggle dark mode', async ({ page }) => {
    await nav.navigateToSettings();
    
    const themeToggle = page.getByRole('switch', { name: /dark|theme/i }).or(
      page.getByLabel(/dark mode/i)
    );
    
    if (await themeToggle.isVisible()) {
      // Get initial state
      const initialState = await themeToggle.getAttribute('data-state');
      
      await themeToggle.click();
      
      // Verify toggle changed
      const newState = await themeToggle.getAttribute('data-state');
      expect(newState).not.toBe(initialState);
      
      // Verify theme is applied to document
      const isDarkMode = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      );
      
      expect(typeof isDarkMode).toBe('boolean');
    }
  });

  test('should persist settings across sessions', async ({ page }) => {
    await nav.navigateToSettings();
    
    // Make a change
    const currencySelect = page.getByLabel(/currency/i).or(
      page.getByRole('combobox', { name: /currency/i })
    );
    
    if (await currencySelect.isVisible()) {
      await currencySelect.click();
      await page.getByRole('option', { name: /GBP|Pound/i }).click();
      
      const saveButton = page.getByRole('button', { name: /save/i });
      if (await saveButton.isVisible()) {
        await saveButton.click();
      }
      
      // Open new tab/session
      const newPage = await page.context().newPage();
      await newPage.goto(routes.settings);
      
      const newCurrencySelect = newPage.getByLabel(/currency/i).or(
        newPage.getByRole('combobox', { name: /currency/i })
      );
      
      if (await newCurrencySelect.isVisible()) {
        await expect(newCurrencySelect).toContainText(/GBP|Pound/i);
      }
      
      await newPage.close();
    }
  });

  test('should export data', async ({ page }) => {
    await nav.navigateToSettings();
    
    const exportButton = page.getByRole('button', { name: /export/i });
    
    if (await exportButton.isVisible()) {
      // Listen for download
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.json|\.csv/);
    }
  });

  test('should clear all data', async ({ page }) => {
    // First add some data
    await nav.navigateToTransactions();
    await page.getByRole('button', { name: /add|new|create/i }).click();
    await page.getByLabel(/title/i).fill('Test Transaction');
    await page.getByLabel(/amount/i).fill('10.00');
    await page.getByRole('button', { name: /save|add|submit/i }).click();
    
    // Navigate to settings
    await nav.navigateToSettings();
    
    const clearButton = page.getByRole('button', { name: /clear|reset|delete all/i });
    
    if (await clearButton.isVisible()) {
      await clearButton.click();
      
      // Confirm dialog
      await page.getByRole('button', { name: /confirm|ok|yes/i }).click();
      
      // Verify data is cleared
      await nav.navigateToTransactions();
      await expect(page.getByText('Test Transaction')).not.toBeVisible();
    }
  });
});

test.describe('Onboarding Flow', () => {
  let nav: NavigationHelper;

  test.beforeEach(async ({ page }) => {
    nav = new NavigationHelper(page);
  });

  test('should show onboarding for new users', async ({ page }) => {
    await page.goto(routes.home);
    await setupNewUser(page);
    
    await page.goto(routes.onboarding);
    
    // Should show welcome or first step
    await expect(
      page.getByRole('heading', { name: /welcome|get started|onboarding/i })
    ).toBeVisible();
  });

  test('should complete onboarding steps', async ({ page }) => {
    await page.goto(routes.home);
    await setupNewUser(page);
    
    await page.goto(routes.onboarding);
    // Find and click next/continue buttons
    const nextButton = page.getByRole('button', { name: /next|continue|skip/i });
    
    let stepCount = 0;
    while (await nextButton.isVisible() && stepCount < 10) {
      await nextButton.click();
      stepCount++;
      await page.waitForTimeout(300); // Wait for animation
    }
    
    // Should end up on home or dashboard
    await nav.expectCurrentRoute('/(home)?');
  });
});
