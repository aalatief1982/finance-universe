import { Page, Locator, expect } from '@playwright/test';
import { routes } from './test-data';

/**
 * Page Object Model for common page interactions
 */

export class NavigationHelper {
  constructor(private page: Page) {}

  async navigateToHome() {
    await this.page.goto(routes.home);
  }

  async navigateToTransactions() {
    await this.page.goto(routes.transactions);
  }

  async navigateToAnalytics() {
    await this.page.goto(routes.analytics);
  }

  async navigateToBudget() {
    await this.page.goto(routes.budget);
  }

  async navigateToSettings() {
    await this.page.goto(routes.settings);
  }

  async navigateToImport() {
    await this.page.goto(routes.importTransactions);
  }

  async clickNavLink(name: string) {
    await this.page.getByRole('link', { name }).click();
  }

  async expectCurrentRoute(route: string) {
    await expect(this.page).toHaveURL(new RegExp(route));
  }
}

export class TransactionFormHelper {
  constructor(private page: Page) {}

  async fillTransactionForm(data: {
    title: string;
    amount: string;
    category?: string;
    type?: 'income' | 'expense' | 'transfer';
  }) {
    await this.page.getByLabel(/title/i).fill(data.title);
    await this.page.getByLabel(/amount/i).fill(data.amount);
    
    if (data.category) {
      await this.page.getByLabel(/category/i).click();
      await this.page.getByRole('option', { name: data.category }).click();
    }
    
    if (data.type) {
      await this.page.getByRole('radio', { name: new RegExp(data.type, 'i') }).click();
    }
  }

  async submitForm() {
    await this.page.getByRole('button', { name: /save|add|submit/i }).click();
  }

  async expectFormError(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }
}

export class TransactionListHelper {
  constructor(private page: Page) {}

  async expectTransactionVisible(title: string) {
    await expect(this.page.getByText(title)).toBeVisible();
  }

  async expectTransactionNotVisible(title: string) {
    await expect(this.page.getByText(title)).not.toBeVisible();
  }

  async clickEditTransaction(title: string) {
    const row = this.page.getByRole('row').filter({ hasText: title });
    await row.getByRole('button', { name: /edit/i }).click();
  }

  async clickDeleteTransaction(title: string) {
    const row = this.page.getByRole('row').filter({ hasText: title });
    await row.getByRole('button', { name: /delete/i }).click();
  }

  async confirmDelete() {
    await this.page.getByRole('button', { name: /ok|confirm|delete/i }).click();
  }
}

export class BudgetHelper {
  constructor(private page: Page) {}

  async fillBudgetForm(data: { category?: string; amount: string }) {
    if (data.category) {
      await this.page.getByLabel(/category/i).click();
      await this.page.getByRole('option', { name: data.category }).click();
    }
    await this.page.getByLabel(/amount|budget/i).fill(data.amount);
  }

  async saveBudget() {
    await this.page.getByRole('button', { name: /save|set|create/i }).click();
  }

  async expectBudgetVisible(category: string, amount: string) {
    const budgetItem = this.page.locator(`[data-testid="budget-${category}"]`);
    await expect(budgetItem).toContainText(amount);
  }
}

export class SettingsHelper {
  constructor(private page: Page) {}

  async selectCurrency(currency: string) {
    await this.page.getByLabel(/currency/i).click();
    await this.page.getByRole('option', { name: currency }).click();
  }

  async toggleDarkMode() {
    await this.page.getByRole('switch', { name: /dark mode|theme/i }).click();
  }

  async saveSettings() {
    await this.page.getByRole('button', { name: /save/i }).click();
  }
}

export class SmartPasteHelper {
  constructor(private page: Page) {}

  async pasteText(text: string) {
    await this.page.getByRole('textbox').fill(text);
  }

  async parseTransactions() {
    await this.page.getByRole('button', { name: /parse|process|extract/i }).click();
  }

  async expectParsedTransactions(count: number) {
    const transactions = this.page.locator('[data-testid="parsed-transaction"]');
    await expect(transactions).toHaveCount(count);
  }

  async importAll() {
    await this.page.getByRole('button', { name: /import all|save all/i }).click();
  }
}
