import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import ImportTransactions from './ImportTransactions';

const navigateMock = vi.fn();
const toastMock = vi.fn();
const markSmsStatusMock = vi.fn();
const loadSmsInboxMock = vi.fn();
const buildInferenceDTOMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => ({
      pathname: '/import-transactions',
      search: '?sender=bank',
      hash: '#inbox',
      state: null,
    }),
  };
});

vi.mock('@/components/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/SmartPaste', () => ({
  default: () => <div>smart paste</div>,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock('@/lib/inference/buildInferenceDTO', () => ({
  buildInferenceDTO: (...args: unknown[]) => buildInferenceDTOMock(...args),
}));

vi.mock('@/lib/sms-inbox/smsInboxQueue', () => ({
  getInbox: () => loadSmsInboxMock(),
  markSmsStatus: (...args: unknown[]) => markSmsStatusMock(...args),
}));

describe('ImportTransactions error handling', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    toastMock.mockReset();
    markSmsStatusMock.mockReset();
    buildInferenceDTOMock.mockReset();
    loadSmsInboxMock.mockReset();
  });

  it('logs structured payload and avoids navigation on review DTO failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    loadSmsInboxMock.mockReturnValue([
      {
        id: 'new-1',
        sender: 'Bank A',
        body: '',
        receivedAt: '2026-01-01T10:00:00.000Z',
        status: 'new',
        source: 'listener',
      },
    ]);
    buildInferenceDTOMock.mockRejectedValue(new Error('dto failed'));

    render(<ImportTransactions />);

    fireEvent.click(screen.getByRole('button', { name: 'Review' }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ImportTransactions] Failed to build inference DTO',
        expect.objectContaining({
          module: 'pages/ImportTransactions',
          fn: 'handleReviewSms',
          action: 'review',
          itemId: 'new-1',
          sender: 'Bank A',
          isBodyEmpty: true,
          route: '/import-transactions?sender=bank#inbox',
        })
      );
    });

    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
    expect(navigateMock).not.toHaveBeenCalled();
    expect(markSmsStatusMock).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('logs structured payload and avoids navigation on continue DTO failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    loadSmsInboxMock.mockReturnValue([
      {
        id: 'opened-1',
        sender: 'Bank B',
        body: 'Payment notice',
        receivedAt: '2026-01-01T10:00:00.000Z',
        status: 'opened',
        source: 'listener',
      },
    ]);
    buildInferenceDTOMock.mockRejectedValue(new Error('dto failed'));

    render(<ImportTransactions />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ImportTransactions] Failed to build inference DTO',
        expect.objectContaining({
          module: 'pages/ImportTransactions',
          fn: 'handleContinueSms',
          action: 'continue',
          itemId: 'opened-1',
          sender: 'Bank B',
          isBodyEmpty: false,
          route: '/import-transactions?sender=bank#inbox',
        })
      );
    });

    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
    expect(navigateMock).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
