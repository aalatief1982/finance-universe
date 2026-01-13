import { Budget, migrateBudget } from '@/models/budget';
import { safeStorage } from '@/utils/safe-storage';

const STORAGE_KEY = 'xpensia_budgets';
const MIGRATION_VERSION_KEY = 'xpensia_budget_migration_version';
const CURRENT_MIGRATION_VERSION = 2; // Increment when adding new migrations

/**
 * Check if budget data needs migration
 */
export function needsMigration(): boolean {
  try {
    const version = safeStorage.getItem(MIGRATION_VERSION_KEY);
    const currentVersion = version ? parseInt(version, 10) : 0;
    return currentVersion < CURRENT_MIGRATION_VERSION;
  } catch {
    return true;
  }
}

/**
 * Run all pending migrations on budget data
 */
export function runMigrations(): void {
  try {
    const version = safeStorage.getItem(MIGRATION_VERSION_KEY);
    const currentVersion = version ? parseInt(version, 10) : 0;
    
    if (currentVersion < 1) {
      migrateToV1();
    }
    
    if (currentVersion < 2) {
      migrateToV2();
    }
    
    // Mark migrations as complete
    safeStorage.setItem(MIGRATION_VERSION_KEY, CURRENT_MIGRATION_VERSION.toString());
  } catch (error) {
    console.error('Budget migration failed:', error);
  }
}

/**
 * V1 Migration: Add year and periodIndex fields
 */
function migrateToV1(): void {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    
    const budgets = JSON.parse(raw) as Partial<Budget>[];
    const migrated = budgets.map(b => migrateBudget(b));
    
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    console.log('Budget migration V1 complete:', migrated.length, 'budgets migrated');
  } catch (error) {
    console.error('V1 migration failed:', error);
  }
}

/**
 * V2 Migration: Handle 'overall' scope conversion
 * - Convert 'overall' scope budgets to 'category' scope
 * - Mark them with a special targetId for UI handling
 */
function migrateToV2(): void {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    
    const budgets = JSON.parse(raw) as Partial<Budget>[];
    
    const migrated = budgets.map(b => {
      // Already migrated in migrateBudget(), just ensure consistency
      return migrateBudget(b);
    });
    
    // Filter out legacy overall budgets if desired, or keep them marked
    // For now, we keep them but they're marked with _overall_legacy targetId
    
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    console.log('Budget migration V2 complete');
  } catch (error) {
    console.error('V2 migration failed:', error);
  }
}

/**
 * Verify data integrity after migrations
 */
export function verifyMigration(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  try {
    const raw = safeStorage.getItem(STORAGE_KEY);
    if (!raw) return { valid: true, issues: [] };
    
    const budgets = JSON.parse(raw) as Budget[];
    
    budgets.forEach((b, index) => {
      if (!b.id) issues.push(`Budget ${index}: missing id`);
      if (!b.scope) issues.push(`Budget ${index}: missing scope`);
      if (!b.period) issues.push(`Budget ${index}: missing period`);
      if (b.year === undefined) issues.push(`Budget ${index}: missing year`);
      if (b.period !== 'yearly' && b.periodIndex === undefined) {
        issues.push(`Budget ${index}: missing periodIndex for ${b.period} period`);
      }
    });
    
    return { valid: issues.length === 0, issues };
  } catch (error) {
    return { valid: false, issues: [`Parse error: ${error}`] };
  }
}

/**
 * Initialize migrations on app load
 */
export function initBudgetMigrations(): void {
  if (needsMigration()) {
    console.log('Running budget data migrations...');
    runMigrations();
    
    const result = verifyMigration();
    if (!result.valid) {
      console.warn('Budget migration verification issues:', result.issues);
    }
  }
}
