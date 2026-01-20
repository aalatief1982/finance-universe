import { Page } from '@playwright/test';

/**
 * Common setup helper for E2E tests
 * Sets required localStorage flags to bypass onboarding
 */
export async function setupTestUser(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    // Mark onboarding as completed to bypass the carousel
    localStorage.setItem('xpensia_onb_done', 'true');
    // Enable beta features if needed
    localStorage.setItem('xpensia_beta_code', 'valid');
  });
}

/**
 * Setup for tests that need a fresh/new user experience
 * Clears everything including onboarding flag
 */
export async function setupNewUser(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
  });
}
