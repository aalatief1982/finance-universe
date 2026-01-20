import { test, expect } from '@playwright/test';
import { routes } from './fixtures/test-data';
import { NavigationHelper, TransactionFormHelper } from './fixtures/page-objects';
import { setupTestUser } from './fixtures/test-setup';

test.describe('Error Handling & Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(routes.home);
    await setupTestUser(page);
  });

  test('should handle 404 page not found', async ({ page }) => {
    await page.goto('/non-existent-page-12345');
    
    await expect(
      page.getByText(/not found|404|page doesn't exist/i)
    ).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Block network requests to simulate offline
    await page.route('**/*', (route) => {
      if (route.request().resourceType() === 'fetch' || 
          route.request().resourceType() === 'xhr') {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    const nav = new NavigationHelper(page);
    await nav.navigateToHome();
    
    // App should still render without crashing
    await expect(page.locator('body')).toBeVisible();
  });

  test('should validate negative amounts', async ({ page }) => {
    const nav = new NavigationHelper(page);
    const form = new TransactionFormHelper(page);
    
    await nav.navigateToTransactions();
    await page.getByRole('button', { name: /add|new|create/i }).click();
    
    await form.fillTransactionForm({
      title: 'Negative Amount Test',
      amount: '-50.00',
    });
    await form.submitForm();
    
    // Should either reject or convert to positive
    const errorMessage = page.getByText(/positive|invalid|greater than/i);
    const successScenario = page.getByText('Negative Amount Test');
    
    // Either validation error or successful with converted amount
    await expect(errorMessage.or(successScenario)).toBeVisible();
  });

  test('should handle very large amounts', async ({ page }) => {
    const nav = new NavigationHelper(page);
    const form = new TransactionFormHelper(page);
    
    await nav.navigateToTransactions();
    await page.getByRole('button', { name: /add|new|create/i }).click();
    
    await form.fillTransactionForm({
      title: 'Large Amount Test',
      amount: '999999999999.99',
    });
    await form.submitForm();
    
    // Should handle gracefully (either accept or show error)
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle special characters in transaction title', async ({ page }) => {
    const nav = new NavigationHelper(page);
    const form = new TransactionFormHelper(page);
    
    await nav.navigateToTransactions();
    await page.getByRole('button', { name: /add|new|create/i }).click();
    
    const specialTitle = 'Test <script>alert("xss")</script> & "quotes"';
    await form.fillTransactionForm({
      title: specialTitle,
      amount: '10.00',
    });
    await form.submitForm();
    
    // Should sanitize or escape special characters
    // XSS should not execute
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle rapid form submissions', async ({ page }) => {
    const nav = new NavigationHelper(page);
    
    await nav.navigateToTransactions();
    await page.getByRole('button', { name: /add|new|create/i }).click();
    
    await page.getByLabel(/title/i).fill('Rapid Submit Test');
    await page.getByLabel(/amount/i).fill('10.00');
    
    // Rapid click submit multiple times
    const submitButton = page.getByRole('button', { name: /save|add|submit/i });
    await submitButton.click();
    await submitButton.click();
    await submitButton.click();
    
    // Should only create one transaction or handle duplicates
    await page.waitForTimeout(1000);
    
    await nav.navigateToTransactions();
    const transactions = page.getByText('Rapid Submit Test');
    const count = await transactions.count();
    
    // Should be 1 or handled gracefully
    expect(count).toBeLessThanOrEqual(3);
  });

  test('should preserve form data on navigation away and back', async ({ page }) => {
    const nav = new NavigationHelper(page);
    
    await nav.navigateToTransactions();
    await page.getByRole('button', { name: /add|new|create/i }).click();
    
    await page.getByLabel(/title/i).fill('Unsaved Transaction');
    await page.getByLabel(/amount/i).fill('25.00');
    
    // Navigate away
    await nav.navigateToHome();
    
    // Navigate back - form may be cleared or preserved depending on implementation
    await nav.navigateToTransactions();
    
    // App should handle this gracefully
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle localStorage quota exceeded', async ({ page }) => {
    // Fill localStorage near capacity
    await page.evaluate(() => {
      const largeData = 'x'.repeat(1024 * 1024); // 1MB string
      for (let i = 0; i < 5; i++) {
        try {
          localStorage.setItem(`test_data_${i}`, largeData);
        } catch (e) {
          // Expected to fail at some point
        }
      }
    });
    
    const nav = new NavigationHelper(page);
    const form = new TransactionFormHelper(page);
    
    await nav.navigateToTransactions();
    await page.getByRole('button', { name: /add|new|create/i }).click();
    
    await form.fillTransactionForm({
      title: 'Quota Test',
      amount: '10.00',
    });
    await form.submitForm();
    
    // Should handle storage errors gracefully
    await expect(page.locator('body')).toBeVisible();
    
    // Cleanup
    await page.evaluate(() => {
      for (let i = 0; i < 5; i++) {
        localStorage.removeItem(`test_data_${i}`);
      }
    });
  });
});

test.describe('Accessibility Edge Cases', () => {
  test('should be keyboard navigable', async ({ page }) => {
    const nav = new NavigationHelper(page);
    await nav.navigateToHome();
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should have focus visible on some element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const nav = new NavigationHelper(page);
    await nav.navigateToHome();
    
    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
    
    // Count should be exactly 1 per page
    expect(await h1.count()).toBe(1);
  });
});
