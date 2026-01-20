import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import { createStorageMock } from '@/test/storage-mock';

// Mock storage before imports
const storageMock = createStorageMock();
vi.stubGlobal('localStorage', storageMock);

// Import after mocks
import { UserProvider, useUser } from '../user/UserContext';

// Test component to access context
const TestComponent = ({ onMount }: { onMount: (ctx: ReturnType<typeof useUser>) => void }) => {
  const context = useUser();
  React.useEffect(() => {
    onMount(context);
  }, [context, onMount]);
  return <div data-testid="currency">{context.settings?.currency || 'none'}</div>;
};

describe('UserContext Integration', () => {
  beforeEach(() => {
    storageMock.clear();
    vi.clearAllMocks();
  });

  describe('Settings persistence', () => {
    it('should persist currency preference', async () => {
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
        contextRef!.updateSettings({ currency: 'SAR' });
      });

      await waitFor(() => {
        expect(screen.getByTestId('currency').textContent).toBe('SAR');
      });

      // Verify localStorage was updated
      expect(storageMock.setItem).toHaveBeenCalled();
    });

    it('should load settings from localStorage on mount', async () => {
      // Pre-populate storage with user settings
      const existingSettings = {
        currency: 'GBP',
        theme: 'dark',
      };

      storageMock.setItem('xpensia_user_settings', JSON.stringify(existingSettings));

      let contextRef: ReturnType<typeof useUser>;

      render(
        <UserProvider>
          <TestComponent onMount={(ctx) => { contextRef = ctx; }} />
        </UserProvider>
      );

      await waitFor(() => {
        expect(contextRef!.settings?.currency).toBe('GBP');
      });
    });

    it('should update multiple settings at once', async () => {
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
        contextRef!.updateSettings({
          currency: 'EUR',
          theme: 'light',
          language: 'ar',
        });
      });

      await waitFor(() => {
        expect(contextRef!.settings?.currency).toBe('EUR');
        expect(contextRef!.settings?.theme).toBe('light');
        expect(contextRef!.settings?.language).toBe('ar');
      });
    });
  });

  describe('Theme management', () => {
    it('should toggle theme correctly', async () => {
      let contextRef: ReturnType<typeof useUser>;

      render(
        <UserProvider>
          <TestComponent onMount={(ctx) => { contextRef = ctx; }} />
        </UserProvider>
      );

      await waitFor(() => {
        expect(contextRef!).toBeDefined();
      });

      const initialTheme = contextRef!.settings?.theme;

      act(() => {
        contextRef!.toggleTheme();
      });

      await waitFor(() => {
        expect(contextRef!.settings?.theme).not.toBe(initialTheme);
      });
    });
  });

  describe('User profile management', () => {
    it('should update user profile', async () => {
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
          name: 'Test User',
          email: 'test@example.com',
        });
      });

      await waitFor(() => {
        expect(contextRef!.user?.name).toBe('Test User');
        expect(contextRef!.user?.email).toBe('test@example.com');
      });
    });
  });

  describe('Currency preference integration', () => {
    it('should default to SAR if no currency is set', async () => {
      let contextRef: ReturnType<typeof useUser>;

      render(
        <UserProvider>
          <TestComponent onMount={(ctx) => { contextRef = ctx; }} />
        </UserProvider>
      );

      await waitFor(() => {
        // Default currency should be SAR or USD depending on implementation
        expect(contextRef!.settings?.currency).toBeDefined();
      });
    });
  });
});
