
import { useState, useCallback } from 'react';

interface User {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<{ isAuthenticated: boolean; loading: boolean }>({
    isAuthenticated: false,
    loading: true,
  });

  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async () => {
    // Mock login implementation
    setAuthState({ isAuthenticated: true, loading: false });
    setUser({
      displayName: 'Test User',
      email: 'user@example.com',
      photoURL: null,
    });
    return true;
  }, []);

  const logout = useCallback(async () => {
    // Mock logout implementation
    setAuthState({ isAuthenticated: false, loading: false });
    setUser(null);
    return true;
  }, []);

  const loadAuthState = useCallback(() => {
    // Mock loading auth state
    const hasAuth = localStorage.getItem('auth') === 'true';
    setAuthState({ isAuthenticated: hasAuth, loading: false });
    if (hasAuth) {
      setUser({
        displayName: 'Test User',
        email: 'user@example.com',
        photoURL: null,
      });
    }
  }, []);

  return {
    authState,
    user,
    login,
    logout,
    loadAuthState,
  };
};
