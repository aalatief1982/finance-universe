
import { useState, useCallback, useEffect } from 'react';

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

  // Check localStorage for authentication state on initialization
  useEffect(() => {
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

  const login = useCallback(async () => {
    // Mock login implementation
    setAuthState({ isAuthenticated: true, loading: false });
    setUser({
      displayName: 'Test User',
      email: 'user@example.com',
      photoURL: null,
    });
    localStorage.setItem('auth', 'true');
    return true;
  }, []);

  const logout = useCallback(async () => {
    // Mock logout implementation
    setAuthState({ isAuthenticated: false, loading: false });
    setUser(null);
    localStorage.removeItem('auth');
    return true;
  }, []);

  const loadAuthState = useCallback(() => {
    // Mock loading auth state - now this just checks localStorage
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
