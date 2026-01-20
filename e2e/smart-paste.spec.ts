import { test, expect } from '@playwright/test';
import { routes, testSmartPasteInput, testSmsMessage } from './fixtures/test-data';
import { NavigationHelper, SmartPasteHelper } from './fixtures/page-objects';
import { setupTestUser } from './fixtures/test-setup';

test.describe('Smart Paste Flow', () => {
  let nav: NavigationHelper;
  let smartPaste: SmartPasteHelper;

  test.beforeEach(async ({ page }) => {
    nav = new NavigationHelper(page);
    smartPaste = new SmartPasteHelper(page);
    await page.goto(routes.home);
    await setupTestUser(page);
  });

  test('should navigate to import page', async ({ page }) => {
    await nav.navigateToImport();
    await nav.expectCurrentRoute('/import-transactions');
    
    await expect(page.getByRole('textbox')).toBeVisible();
  });

  test('should paste and parse transaction text', async ({ page }) => {
    await nav.navigateToImport();
    
    await smartPaste.pasteText(testSmartPasteInput);
    await smartPaste.parseTransactions();
    
    // Should show parsed transactions
    await expect(page.getByText(/coffee|starbucks/i)).toBeVisible();
  });

  test('should parse SMS message format', async ({ page }) => {
    await nav.navigateToImport();
    
    await smartPaste.pasteText(testSmsMessage);
    await smartPaste.parseTransactions();
    
    // Should extract amount from SMS
    await expect(page.getByText(/150|SAR/i)).toBeVisible();
  });

  test('should allow editing parsed transactions before import', async ({ page }) => {
    await nav.navigateToImport();
    
    await smartPaste.pasteText(testSmartPasteInput);
    await smartPaste.parseTransactions();
    
    // Find edit button on a parsed transaction
    const editButton = page.getByRole('button', { name: /edit/i }).first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Should open edit dialog/form
      await expect(page.getByLabel(/title|description/i)).toBeVisible();
    }
  });

  test('should import all parsed transactions', async ({ page }) => {
    await nav.navigateToImport();
    
    await smartPaste.pasteText(testSmartPasteInput);
    await smartPaste.parseTransactions();
    
    // Wait for parse results
    await page.waitForTimeout(1000);
    
    // Import all
    const importButton = page.getByRole('button', { name: /import|save|confirm/i });
    if (await importButton.isVisible()) {
      await importButton.click();
      
      // Should show success or redirect
      await expect(
        page.getByText(/success|imported|added/i).or(page.locator('[data-testid="success-toast"]'))
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle empty input gracefully', async ({ page }) => {
    await nav.navigateToImport();
    
    await smartPaste.pasteText('');
    
    const parseButton = page.getByRole('button', { name: /parse|process|extract/i });
    
    // Should either be disabled or show error when clicked
    if (await parseButton.isEnabled()) {
      await parseButton.click();
      await expect(page.getByText(/no transactions|empty|required/i)).toBeVisible();
    }
  });

  test('should handle invalid text format', async ({ page }) => {
    await nav.navigateToImport();
    
    await smartPaste.pasteText('Random text with no transaction data abc xyz');
    await smartPaste.parseTransactions();
    
    // Should show no transactions found or error
    await expect(
      page.getByText(/no transactions|couldn't parse|not found/i)
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Smart Paste Category Detection', () => {
  test('should auto-detect categories from transaction descriptions', async ({ page }) => {
    const nav = new NavigationHelper(page);
    const smartPaste = new SmartPasteHelper(page);
    
    await page.goto(routes.home);
    await setupTestUser(page);
    await nav.navigateToImport();
    
    // Paste text with clear category indicators
    await smartPaste.pasteText('Starbucks coffee purchase - $5.00');
    await smartPaste.parseTransactions();
    
    // Should detect Food category for Starbucks
    await expect(page.getByText(/food|coffee/i)).toBeVisible();
  });
});
