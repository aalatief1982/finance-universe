import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { UserProvider, useUser } from '@/context/UserContext';
import Settings from '../Settings';
import { vi } from 'vitest';

vi.mock('@/services/SmsPermissionService', () => ({
  smsPermissionService: {
    hasPermission: vi.fn().mockResolvedValue(true),
    requestPermission: vi.fn().mockResolvedValue(true),
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
  it('persists preference when toggled', async () => {
    render(
      <UserProvider>
        <BrowserRouter>
          <Settings />
          <StateViewer />
        </BrowserRouter>
      </UserProvider>
    );

    const toggle = screen.getByLabelText(/enable background sms reading/i);
    expect(screen.getByTestId('sms-state')).toHaveTextContent('undefined');

    await act(async () => {
      fireEvent.click(toggle);
    });

    expect(screen.getByTestId('sms-state')).toHaveTextContent('true');
  });
});
