import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { LanguageProvider } from '@/i18n/LanguageContext';
import { UserProvider, useUser } from '@/context/UserContext';
import Settings from '../Settings';
import { beforeEach, vi } from 'vitest';

vi.mock('@/services/SmsPermissionService', () => ({
  smsPermissionService: {
    checkPermissionStatus: vi.fn().mockResolvedValue({
      granted: true,
      shouldShowRationale: false,
      permanentlyDenied: false,
    }),
    hasPermission: vi.fn().mockResolvedValue(true),
    requestPermission: vi.fn().mockResolvedValue({ granted: true, permanentlyDenied: false }),
  },
}));



vi.mock('@/components/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const StateViewer = () => {
  const { user } = useUser();
  const enabled = user?.preferences?.sms?.backgroundSmsEnabled;
  return <div data-testid="sms-state">{String(enabled)}</div>;
};

describe('Settings background SMS toggle', () => {
  beforeEach(() => {
    localStorage.setItem('betaFeaturesActive', 'false');
    localStorage.setItem(
      'xpensia_admin_mode',
      '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({ version: '1.0.0' }),
      }),
    );
  });

  it('is disabled when feature is locked', async () => {
    render(
      <UserProvider>
        <BrowserRouter>
          <Settings />
          <StateViewer />
        </BrowserRouter>
      </UserProvider>
    );

    const toggle = await screen.findByLabelText(/read sms transactions/i);
    expect(toggle).toBeDisabled();
  });
});
