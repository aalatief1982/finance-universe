import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import { createStorageMock } from '@/test/storage-mock';

// Mock storage before imports
const storageMock = createStorageMock();
vi.stubGlobal('localStorage', storageMock);

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: () => false,
}));

vi.mock('@/lib/env', () => ({
  ENABLE_SUPABASE_AUTH: false,
  ENABLE_DEMO_MODE: true,
}));

// Import after mocks
import { UserProvider, useUser } from '../user/UserContext';

// Test component to access context
const TestComponent = ({ onMount }: { onMount: (ctx: ReturnType<typeof useUser>) => void }) => {
  const context = useUser();
  React.useEffect(() => {
    onMount(context);
  }, [context, onMount]);
  return <div data-testid="currency">{context.user?.preferences?.currency || 'none'}</div>;
};

describe('UserContext Integration', () => {
  beforeEach(() => {
    storageMock.clear();
    vi.clearAllMocks();
  });

  describe('User preferences persistence', () => {
    it('should update currency preference', async () => {
      let contextRef: ReturnType<typeof useUser>;

      render(
        <UserProvider>
          <TestComponent onMount={(ctx) => { contextRef = ctx; }} />
        </UserProvider>
      );

      await waitFor(() => {
        expect(contextRef!).toBeDefined();
      });

      act(() => {
        contextRef!.updateCurrency('SAR');
      });

      await waitFor(() => {
        expect(contextRef!.user?.preferences?.currency).toBe('SAR');
      });
    });

    it('should update theme preference', async () => {
      let contextRef: ReturnType<typeof useUser>;

      render(
        <UserProvider>
          <TestComponent onMount={(ctx) => { contextRef = ctx; }} />
        </UserProvider>
      );

      await waitFor(() => {
        expect(contextRef!).toBeDefined();
      });

      act(() => {
        contextRef!.updateTheme('dark');
      });

      await waitFor(() => {
        expect(contextRef!.user?.preferences?.theme).toBe('dark');
      });
    });

    it('should update multiple preferences at once', async () => {
      let contextRef: ReturnType<typeof useUser>;

      render(
        <UserProvider>
          <TestComponent onMount={(ctx) => { contextRef = ctx; }} />
        </UserProvider>
      );

      await waitFor(() => {
        expect(contextRef!).toBeDefined();
      });

      act(() => {
        contextRef!.updateUserPreferences({
          currency: 'EUR',
          theme: 'light',
          language: 'ar',
        });
      });

      await waitFor(() => {
        expect(contextRef!.user?.preferences?.currency).toBe('EUR');
        expect(contextRef!.user?.preferences?.theme).toBe('light');
        expect(contextRef!.user?.preferences?.language).toBe('ar');
      });
    });
  });

  describe('Theme management', () => {
    it('should get effective theme correctly', async () => {
      let contextRef: ReturnType<typeof useUser>;

      render(
        <UserProvider>
          <TestComponent onMount={(ctx) => { contextRef = ctx; }} />
        </UserProvider>
      );

      await waitFor(() => {
        expect(contextRef!).toBeDefined();
      });

      // getEffectiveTheme should return 'light' or 'dark'
      const effectiveTheme = contextRef!.getEffectiveTheme();
      expect(['light', 'dark']).toContain(effectiveTheme);
    });

    it('should switch between light and dark themes', async () => {
      let contextRef: ReturnType<typeof useUser>;

      render(
        <UserProvider>
          <TestComponent onMount={(ctx) => { contextRef = ctx; }} />
        </UserProvider>
      );

      await waitFor(() => {
        expect(contextRef!).toBeDefined();
      });

      act(() => {
        contextRef!.updateTheme('dark');
      });

      await waitFor(() => {
        expect(contextRef!.user?.preferences?.theme).toBe('dark');
      });

      act(() => {
        contextRef!.updateTheme('light');
      });

      await waitFor(() => {
        expect(contextRef!.user?.preferences?.theme).toBe('light');
      });
    });
  });

  describe('User profile management', () => {
    it('should update user profile via updateUser', async () => {
      let contextRef: ReturnType<typeof useUser>;

      render(
        <UserProvider>
          <TestComponent onMount={(ctx) => { contextRef = ctx; }} />
        </UserProvider>
      );

      await waitFor(() => {
        expect(contextRef!).toBeDefined();
      });

      act(() => {
        contextRef!.updateUser({
          fullName: 'Test User',
          email: 'test@example.com',
        });
      });

      await waitFor(() => {
        expect(contextRef!.user?.fullName).toBe('Test User');
        expect(contextRef!.user?.email).toBe('test@example.com');
      });
    });

    it('should complete onboarding', async () => {
      let contextRef: ReturnType<typeof useUser>;

      render(
        <UserProvider>
          <TestComponent onMount={(ctx) => { contextRef = ctx; }} />
        </UserProvider>
      );

      await waitFor(() => {
        expect(contextRef!).toBeDefined();
      });

      act(() => {
        contextRef!.completeOnboarding();
      });

      await waitFor(() => {
        expect(contextRef!.user?.completedOnboarding).toBe(true);
        expect(contextRef!.auth.isAuthenticated).toBe(true);
      });
    });
  });

  describe('Display options', () => {
    it('should update display options', async () => {
      let contextRef: ReturnType<typeof useUser>;

      render(
        <UserProvider>
          <TestComponent onMount={(ctx) => { contextRef = ctx; }} />
        </UserProvider>
      );

      await waitFor(() => {
        expect(contextRef!).toBeDefined();
      });

      act(() => {
        contextRef!.updateDisplayOptions({
          showCents: false,
          compactMode: true,
        });
      });

      await waitFor(() => {
        expect(contextRef!.user?.preferences?.displayOptions?.showCents).toBe(false);
        expect(contextRef!.user?.preferences?.displayOptions?.compactMode).toBe(true);
      });
    });
  });

  describe('Auth state management', () => {
    it('should have correct initial auth state', async () => {
      let contextRef: ReturnType<typeof useUser>;

      render(
        <UserProvider>
          <TestComponent onMount={(ctx) => { contextRef = ctx; }} />
        </UserProvider>
      );

      await waitFor(() => {
        expect(contextRef!.auth).toBeDefined();
        expect(contextRef!.auth.isDemoMode).toBeDefined();
      });
    });

    it('should toggle demo mode', async () => {
      let contextRef: ReturnType<typeof useUser>;

      render(
        <UserProvider>
          <TestComponent onMount={(ctx) => { contextRef = ctx; }} />
        </UserProvider>
      );

      await waitFor(() => {
        expect(contextRef!).toBeDefined();
      });

      const initialDemoMode = contextRef!.auth.isDemoMode;

      act(() => {
        contextRef!.setDemoModeEnabled(!initialDemoMode);
      });

      // Demo mode toggle should work
      await waitFor(() => {
        expect(contextRef!.auth.isDemoMode).toBe(!initialDemoMode);
      });
    });
  });
});
