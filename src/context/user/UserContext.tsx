
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserContextValue, AuthState, ProfileCompletionStatus } from './types';
import { authenticateWithPhone, verifyPhoneWithCode } from './auth-utils';
import { updateUserPreferences } from './preferences-utils';
import { setTheme } from './theme-utils';
import { ErrorType, AppError } from '@/types/error';
import { createError, handleError } from '@/utils/error-utils';
import { isAuthenticatedWithSupabase } from '@/lib/supabase-auth';

// Create context with default values
export const UserContext = createContext<UserContextValue>({
  user: null,
  auth: {
    isLoading: true,
    isAuthenticated: false,
    isVerifying: false,
    error: null
  },
  login: async () => false,
  verify: async () => false,
  logout: async () => {},
  updateUser: () => {},
  checkProfileCompletion: () => ({ isComplete: false, missingFields: [] }),
});

// Hook for using the UserContext
export const useUser = () => useContext(UserContext);

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    isVerifying: false,
    error: null
  });
  
  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check if authenticated with Supabase first
        const isAuthenticated = await isAuthenticatedWithSupabase();
        
        if (!isAuthenticated) {
          // Try to load from localStorage as fallback
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser: User = JSON.parse(storedUser);
            setUser(parsedUser);
            setAuthState(prev => ({ ...prev, isAuthenticated: true, isLoading: false }));
          } else {
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
        } else {
          // If authenticated with Supabase but no user in state, try to load from localStorage
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser: User = JSON.parse(storedUser);
            setUser(parsedUser);
          }
          
          setAuthState(prev => ({ ...prev, isAuthenticated: true, isLoading: false }));
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setAuthState(prev => ({ 
          ...prev, 
          isLoading: false,
          error: createError(ErrorType.AUTH, 'Failed to load user', {}, error)
        }));
      }
    };
    
    loadUser();
  }, []);
  
  // Store user in localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      
      // Apply theme preference if set
      if (user.preferences?.theme) {
        setTheme(user.preferences.theme);
      }
    }
  }, [user]);
  
  // Save updated user data
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return updates as User;
      
      const updatedUser = { ...prev, ...updates };
      
      // Apply theme if changed
      if (updates.preferences?.theme && updates.preferences.theme !== prev.preferences?.theme) {
        setTheme(updates.preferences.theme);
      }
      
      return updatedUser;
    });
  }, []);
  
  // Login with phone number
  const login = useCallback(async (phone: string): Promise<boolean> => {
    return authenticateWithPhone(
      phone,
      updateUser,
      (isLoading) => setAuthState(prev => ({ ...prev, isLoading })),
      (error) => setAuthState(prev => ({ ...prev, error }))
    );
  }, [updateUser]);
  
  // Verify phone code
  const verify = useCallback(async (phone: string, code: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isVerifying: true }));
    
    const success = await verifyPhoneWithCode(
      phone,
      code,
      updateUser,
      (isLoading) => setAuthState(prev => ({ ...prev, isLoading })),
      (error) => setAuthState(prev => ({ ...prev, error })),
      (verified) => setAuthState(prev => ({ 
        ...prev, 
        isAuthenticated: verified,
        isVerifying: !verified
      }))
    );
    
    if (!success) {
      setAuthState(prev => ({ ...prev, isVerifying: false }));
    }
    
    return success;
  }, [updateUser]);
  
  // Logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      // Clear user data
      setUser(null);
      localStorage.removeItem('user');
      
      // Reset auth state
      setAuthState({
        isLoading: false,
        isAuthenticated: false,
        isVerifying: false,
        error: null
      });
    } catch (error) {
      handleError(createError(
        ErrorType.AUTH,
        'Logout failed',
        {},
        error
      ));
    }
  }, []);
  
  // Check if user profile is complete
  const checkProfileCompletion = useCallback((): ProfileCompletionStatus => {
    if (!user) {
      return { isComplete: false, missingFields: ['all'] };
    }
    
    const missingFields: string[] = [];
    
    // Check for mandatory fields
    if (!user.fullName) missingFields.push('fullName');
    if (!user.phone) missingFields.push('phone');
    if (!user.email) missingFields.push('email');
    
    // Optional but recommended fields for complete profile
    if (!user.gender) missingFields.push('gender');
    if (!user.birthDate) missingFields.push('birthDate');
    if (!user.occupation) missingFields.push('occupation');
    
    return {
      isComplete: missingFields.length === 0,
      missingFields
    };
  }, [user]);
  
  // Context value
  const contextValue: UserContextValue = {
    user,
    auth: authState,
    login,
    verify,
    logout,
    updateUser,
    checkProfileCompletion,
  };
  
  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};
