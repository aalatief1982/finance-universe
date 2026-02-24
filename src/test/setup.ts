import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

vi.mock('@capacitor/core', () => {
  const registerPlugin = vi.fn(() => ({
    addListener: vi.fn(async () => ({ remove: vi.fn() })),
    removeAllListeners: vi.fn(async () => undefined),
  }));

  return {
    Capacitor: {
      registerPlugin,
      isNativePlatform: vi.fn(() => false),
      getPlatform: vi.fn(() => 'web'),
    },
  };
});

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(
    'xpensia_user_settings',
    JSON.stringify({
      currency: 'USD',
      language: 'en',
      theme: 'light',
    }),
  );
  localStorage.setItem(
    'xpensia_locale_settings',
    JSON.stringify({
      locale: 'en-US',
      currency: 'USD',
      dateFormat: 'MM/dd/yyyy',
      timeFormat: 'h:mm a',
      firstDayOfWeek: 0,
      numberFormat: {
        useGrouping: true,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    }),
  );
});
