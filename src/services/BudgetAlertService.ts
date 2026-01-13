import { budgetService } from './BudgetService';
import { transactionService } from './TransactionService';
import { accountService } from './AccountService';
import { BudgetAlert } from '@/models/budget-period';
import { Budget } from '@/models/budget';

export interface AlertWithContext extends BudgetAlert {
  budgetName: string;
  budget: Budget;
  message: string;
  severity: 'warning' | 'danger' | 'critical';
}

/**
 * Service for managing and presenting budget alerts
 */
export class BudgetAlertService {
  /**
   * Get all active alerts with context for display
   */
  getActiveAlertsWithContext(): AlertWithContext[] {
    const activeAlerts = budgetService.getActiveAlerts();
    const budgets = budgetService.getBudgets();
    const accounts = accountService.getAccounts();
    const categories = transactionService.getCategories();

    return activeAlerts.map(alert => {
      const budget = budgets.find(b => b.id === alert.budgetId);
      if (!budget) return null;

      // Get target name
      let budgetName = 'Unknown Budget';
      if (budget.scope === 'overall') {
        budgetName = 'Overall Budget';
      } else {
        const allTargets = [...accounts, ...categories];
        const target = allTargets.find((t: any) => t.id === budget.targetId);
        budgetName = target ? (target as any).name : budget.targetId;
      }

      // Determine severity
      let severity: 'warning' | 'danger' | 'critical' = 'warning';
      if (alert.threshold >= 100) {
        severity = 'critical';
      } else if (alert.threshold >= 80) {
        severity = 'danger';
      }

      // Generate message
      let message = '';
      if (alert.threshold >= 100) {
        message = `${budgetName} has exceeded its budget limit!`;
      } else {
        message = `${budgetName} has reached ${alert.threshold}% of its budget.`;
      }

      return {
        ...alert,
        budgetName,
        budget,
        message,
        severity,
      };
    }).filter(Boolean) as AlertWithContext[];
  }

  /**
   * Get alerts grouped by severity
   */
  getAlertsBySeverity(): {
    critical: AlertWithContext[];
    danger: AlertWithContext[];
    warning: AlertWithContext[];
  } {
    const alerts = this.getActiveAlertsWithContext();
    
    return {
      critical: alerts.filter(a => a.severity === 'critical'),
      danger: alerts.filter(a => a.severity === 'danger'),
      warning: alerts.filter(a => a.severity === 'warning'),
    };
  }

  /**
   * Check if there are any unread alerts
   */
  hasActiveAlerts(): boolean {
    return budgetService.getActiveAlerts().length > 0;
  }

  /**
   * Get count of active alerts
   */
  getAlertCount(): number {
    return budgetService.getActiveAlerts().length;
  }

  /**
   * Dismiss an alert
   */
  dismissAlert(budgetId: string, threshold: number): void {
    budgetService.dismissAlert(budgetId, threshold);
  }

  /**
   * Refresh alerts (check for new threshold breaches)
   */
  refreshAlerts(): AlertWithContext[] {
    budgetService.checkBudgetAlerts();
    return this.getActiveAlertsWithContext();
  }

  /**
   * Get the most critical alert for display in the app header/banner
   */
  getMostCriticalAlert(): AlertWithContext | null {
    const { critical, danger, warning } = this.getAlertsBySeverity();
    
    // Return the most critical alert
    if (critical.length > 0) {
      return critical.sort((a, b) => b.percentUsed - a.percentUsed)[0];
    }
    if (danger.length > 0) {
      return danger.sort((a, b) => b.percentUsed - a.percentUsed)[0];
    }
    if (warning.length > 0) {
      return warning.sort((a, b) => b.percentUsed - a.percentUsed)[0];
    }
    
    return null;
  }

  /**
   * Check if a specific transaction will trigger any budget alerts
   * Useful for warning users before they confirm a transaction
   */
  checkTransactionImpact(
    amount: number,
    category: string,
    subcategory?: string,
    accountId?: string
  ): {
    willExceedBudget: boolean;
    affectedBudgets: Array<{
      budget: Budget;
      currentPercent: number;
      newPercent: number;
    }>;
  } {
    const budgets = budgetService.getBudgets();
    const affectedBudgets: Array<{
      budget: Budget;
      currentPercent: number;
      newPercent: number;
    }> = [];

    for (const budget of budgets) {
      let isAffected = false;

      switch (budget.scope) {
        case 'overall':
          isAffected = true;
          break;
        case 'account':
          isAffected = budget.targetId === accountId;
          break;
        case 'category':
          isAffected = budget.targetId === category;
          break;
        case 'subcategory':
          isAffected = budget.targetId === subcategory;
          break;
      }

      if (isAffected) {
        const progress = budgetService.getBudgetProgress(budget);
        const newSpent = progress.spent + Math.abs(amount);
        const newPercent = budget.amount > 0 ? (newSpent / budget.amount) * 100 : 0;

        affectedBudgets.push({
          budget,
          currentPercent: progress.percentUsed,
          newPercent,
        });
      }
    }

    return {
      willExceedBudget: affectedBudgets.some(a => a.newPercent >= 100 && a.currentPercent < 100),
      affectedBudgets,
    };
  }
}

export const budgetAlertService = new BudgetAlertService();
