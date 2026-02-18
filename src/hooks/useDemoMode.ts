/**
 * @file useDemoMode.ts
 * @description Hook exposing demo mode state and actions to UI components.
 */

import { useTransactions } from '@/context/TransactionContext';

export function useDemoMode() {
  const { appMode: mode, exitDemoMode } = useTransactions();

  return {
    isDemoMode: mode === 'demo',
    isRealMode: mode === 'real',
    exitDemoMode,
  };
}
