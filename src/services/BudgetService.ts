import { v4 as uuidv4 } from 'uuid';
import { Budget } from '@/models/budget';

const STORAGE_KEY = 'xpensia_budgets';

export class BudgetService {
  getBudgets(): Budget[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as Budget[] : [];
    } catch {
      return [];
    }
  }

  addBudget(budget: Budget) {
    const budgets = this.getBudgets();
    budgets.push(budget);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
  }

  getBudgetSummary(period: string) {
    const budgets = this.getBudgets();
    return budgets.filter(b => b.period === period);
  }
}

export const budgetService = new BudgetService();
