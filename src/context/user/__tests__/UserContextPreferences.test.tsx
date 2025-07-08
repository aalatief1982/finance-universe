import React from 'react';
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserProvider, useUser } from '@/context/UserContext';

describe('UserContext preference helpers', () => {
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <UserProvider>{children}</UserProvider>
  );

  it('initializes user when updating preferences', () => {
    const { result } = renderHook(() => useUser(), { wrapper });

    act(() => {
      result.current.updateUserPreferences({ theme: 'dark' });
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.preferences?.theme).toBe('dark');
    expect(result.current.user?.preferences?.currency).toBe('USD');
  });

  it('initializes user when updating display options', () => {
    const { result } = renderHook(() => useUser(), { wrapper });

    act(() => {
      result.current.updateDisplayOptions({ compactMode: true });
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user?.preferences?.displayOptions?.compactMode).toBe(true);
    expect(result.current.user?.preferences?.currency).toBe('USD');
  });
});
