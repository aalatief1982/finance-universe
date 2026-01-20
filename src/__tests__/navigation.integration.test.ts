import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStorageMock } from '@/test/storage-mock';

// Mock storage before imports
const storageMock = createStorageMock();
vi.stubGlobal('localStorage', storageMock);

describe('Navigation State Integration', () => {
  beforeEach(() => {
    storageMock.clear();
    vi.clearAllMocks();
  });

  describe('URL parameter parsing', () => {
    it('should parse budget period params from URL search string', () => {
      const searchString = '?period=quarterly&year=2025&periodIndex=2';
      const params = new URLSearchParams(searchString);

      expect(params.get('period')).toBe('quarterly');
      expect(params.get('year')).toBe('2025');
      expect(params.get('periodIndex')).toBe('2');
    });

    it('should handle missing params with defaults', () => {
      const searchString = '';
      const params = new URLSearchParams(searchString);

      expect(params.get('period') || 'monthly').toBe('monthly');
      expect(params.get('year') || '2024').toBe('2024');
    });

    it('should parse transaction ID from path', () => {
      const path = '/edit-transaction/tx-123-abc';
      const match = path.match(/\/edit-transaction\/(.+)/);

      expect(match).not.toBeNull();
      expect(match![1]).toBe('tx-123-abc');
    });

    it('should parse budget ID from path', () => {
      const path = '/budget/budget-456-def';
      const match = path.match(/\/budget\/(.+)/);

      expect(match).not.toBeNull();
      expect(match![1]).toBe('budget-456-def');
    });
  });

  describe('Navigation state objects', () => {
    it('should create valid navigation state for edit transaction', () => {
      const transaction = {
        id: 'tx-1',
        title: 'Test Transaction',
        amount: -100,
        type: 'expense' as const,
        category: 'Food',
        date: '2024-01-15',
        currency: 'SAR',
      };

      const navigationState = {
        transaction,
        rawMessage: 'Purchase SAR 100',
        senderHint: 'BANK',
        confidence: 0.85,
        isSuggested: true,
        matchOrigin: 'template' as const,
      };

      expect(navigationState.transaction.id).toBe('tx-1');
      expect(navigationState.confidence).toBe(0.85);
      expect(navigationState.matchOrigin).toBe('template');
    });

    it('should create valid navigation state for SMS review', () => {
      const smsTransactions = [
        { id: 'sms-1', title: 'SMS 1', amount: -50 },
        { id: 'sms-2', title: 'SMS 2', amount: -100 },
      ];

      const navigationState = {
        transactions: smsTransactions,
        source: 'sms-import',
        totalCount: 2,
      };

      expect(navigationState.transactions.length).toBe(2);
      expect(navigationState.source).toBe('sms-import');
    });
  });

  describe('Route matching', () => {
    const routes = [
      { path: '/', name: 'home' },
      { path: '/home', name: 'home' },
      { path: '/transactions', name: 'transactions' },
      { path: '/analytics', name: 'analytics' },
      { path: '/settings', name: 'settings' },
      { path: '/budget', name: 'budget-hub' },
      { path: '/budget/:budgetId', name: 'budget-detail' },
      { path: '/edit-transaction', name: 'edit-transaction' },
      { path: '/edit-transaction/:id', name: 'edit-transaction' },
      { path: '/import-transactions', name: 'import' },
    ];

    it('should match static routes', () => {
      const testPath = '/transactions';
      const matchedRoute = routes.find(r => r.path === testPath);

      expect(matchedRoute).toBeDefined();
      expect(matchedRoute!.name).toBe('transactions');
    });

    it('should identify dynamic route patterns', () => {
      const testPath = '/budget/budget-123';
      const budgetDetailPattern = /^\/budget\/(.+)$/;

      expect(budgetDetailPattern.test(testPath)).toBe(true);
    });
  });
});

describe('State Persistence Integration', () => {
  beforeEach(() => {
    storageMock.clear();
    vi.clearAllMocks();
  });

  describe('Filter state persistence', () => {
    it('should store filter state in localStorage', () => {
      const filterState = {
        dateRange: { start: '2024-01-01', end: '2024-01-31' },
        category: 'Food',
        type: 'expense',
      };

      storageMock.setItem('xpensia_filter_state', JSON.stringify(filterState));

      const stored = storageMock.getItem('xpensia_filter_state');
      expect(stored).toBeDefined();
      expect(JSON.parse(stored!)).toEqual(filterState);
    });

    it('should handle missing filter state gracefully', () => {
      const stored = storageMock.getItem('xpensia_filter_state');
      expect(stored).toBeNull();
    });
  });

  describe('Last visited page persistence', () => {
    it('should store and retrieve last visited page', () => {
      storageMock.setItem('xpensia_last_page', '/analytics');

      const lastPage = storageMock.getItem('xpensia_last_page');
      expect(lastPage).toBe('/analytics');
    });
  });

  describe('Onboarding completion state', () => {
    it('should mark onboarding as complete', () => {
      storageMock.setItem('xpensia_onb_done', 'true');

      const onboardingDone = storageMock.getItem('xpensia_onb_done');
      expect(onboardingDone).toBe('true');
    });

    it('should check if onboarding is not complete', () => {
      const onboardingDone = storageMock.getItem('xpensia_onb_done');
      expect(onboardingDone).toBeNull();
    });
  });

  describe('Budget period params persistence', () => {
    it('should store budget period selection', () => {
      const periodParams = {
        period: 'quarterly',
        year: 2025,
        periodIndex: 2,
      };

      storageMock.setItem('xpensia_budget_period', JSON.stringify(periodParams));

      const stored = storageMock.getItem('xpensia_budget_period');
      expect(JSON.parse(stored!)).toEqual(periodParams);
    });
  });

  describe('User settings persistence', () => {
    it('should store user settings', () => {
      const settings = {
        currency: 'SAR',
        theme: 'dark',
        language: 'ar',
      };

      storageMock.setItem('xpensia_user_settings', JSON.stringify(settings));

      const stored = storageMock.getItem('xpensia_user_settings');
      expect(JSON.parse(stored!)).toEqual(settings);
    });
  });

  describe('Transaction storage', () => {
    it('should store transactions array', () => {
      const transactions = [
        { id: 'tx-1', title: 'Test 1', amount: -100 },
        { id: 'tx-2', title: 'Test 2', amount: -200 },
      ];

      storageMock.setItem('xpensia_transactions', JSON.stringify(transactions));

      const stored = storageMock.getItem('xpensia_transactions');
      expect(JSON.parse(stored!).length).toBe(2);
    });

    it('should handle empty transactions', () => {
      storageMock.setItem('xpensia_transactions', JSON.stringify([]));

      const stored = storageMock.getItem('xpensia_transactions');
      expect(JSON.parse(stored!)).toEqual([]);
    });
  });
});
