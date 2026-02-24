/**
 * @file UserContext.tsx
 * @description Global user state management including authentication,
 *              preferences, and profile data.
 *
 * @responsibilities
 * - Manage user authentication state (phone verification, sessions)
 * - Store and persist user preferences (theme, currency, language)
 * - Handle profile completion and onboarding flow
 * - Sync user data with Supabase when enabled
 * - Manage demo mode for testing
 *
 * @storage-keys
 * - user: Full user object in localStorage
 *
 * @dependencies
 * - auth-utils.ts: Authentication flow utilities
 * - theme-utils.ts: Theme detection and application
 * - preferences-utils.ts: Preference update utilities
 * - supabase.ts: Supabase client and config check
 * - supabase-auth.ts: Supabase auth utilities
 *
 * @review-checklist
 * - [ ] Local storage checked before Supabase on init (fast first render)
 * - [ ] Theme system preference listener cleaned up on unmount
 * - [ ] Demo mode isolated from real auth flows
 * - [ ] Supabase profile sync only when configured and authenticated
 *
 * @review-tags
 * - @side-effects: Writes to localStorage, updates Supabase profile
 * - @review-focus: Auth initialization order (lines 137-151)
 * - @platform: Web-only (no native auth)
 */

import { safeStorage } from "@/utils/safe-storage";

import React, { useState, useEffect, useCallback } from 'react';
import { User } from './types';
import { toast } from '@/hooks/use-toast';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ENABLE_SUPABASE_AUTH } from '@/lib/env';
import {
  getVerificationAttemptsRemaining,
  getMaxVerificationAttempts,
  updateUserProfileInSupabase
} from '@/lib/supabase-auth';
import { detectSystemTheme, applyThemeToDocument } from './theme-utils';
import {
  getUserFromLocalStorage,
  checkSupabaseAuth,
  startPhoneVerification as startPhoneVerificationUtil,
  confirmPhoneVerification as confirmPhoneVerificationUtil,
  logIn as logInUtil,
  logOut as logOutUtil,
  checkUserExists as checkUserExistsUtil,
  isProfileComplete as isProfileCompleteUtil
} from './auth-utils';
import { safeSetItem } from '@/utils/storage-utils';
import { updateCurrency as persistCurrency } from '@/utils/storage-utils';
import { UserContext } from './UserContext.context';
import {
  updateUserPreferences as updateUserPreferencesUtil,
  updateDisplayOptions as updateDisplayOptionsUtil,
  updatePrivacySettings as updatePrivacySettingsUtil,
  updateDataManagement as updateDataManagementUtil
} from './preferences-utils';

const traceState = (message: string, payload?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  if (payload) {
    console.log(`[TRACE][STATE][${timestamp}] ${message}`, payload);
    return;
  }

  console.log(`[TRACE][STATE][${timestamp}] ${message}`);
};

// ============================================================================
// SECTION: Default Preferences
// PURPOSE: Define default values for new users
// REVIEW: Ensure all preference keys have defaults
// ============================================================================

const DEFAULT_PREFERENCES = {
  currency: 'USD',
  theme: 'light' as const,
  notifications: true,
  language: 'en',
  displayOptions: {
    showCents: true,
    weekStartsOn: 'sunday' as const,
    defaultView: 'list' as const,
    compactMode: false,
    showCategories: true,
    showTags: true
  },
  sms: {
    autoDetectProviders: true,
    showDetectionNotifications: true,
    autoImport: false,
    backgroundSmsEnabled: false
  }
};

// ============================================================================
// SECTION: User Provider Component
// PURPOSE: Manage global user state and provide context
// ============================================================================

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    isLoading: true,
    isVerifying: false,
    verificationAttemptsRemaining: getVerificationAttemptsRemaining(),
    maxVerificationAttempts: getMaxVerificationAttempts(),
    isDemoMode: false
  });
  const startupTraceRef = React.useRef({ authInitStarted: false });
  const traceSetUser = useCallback((value: React.SetStateAction<User | null>, reason: string) => {
    setUser(prev => {
      const next = typeof value === 'function' ? (value as (prevState: User | null) => User | null)(prev) : value;
      traceState('setUser update', {
        reason,
        previousUserId: prev?.id ?? null,
        nextUserId: next?.id ?? null,
        previousPhoneVerified: prev?.phoneVerified ?? null,
        nextPhoneVerified: next?.phoneVerified ?? null,
      });
      return next;
    });
  }, []);
  const traceSetAuth = useCallback((value: React.SetStateAction<typeof auth>, reason: string) => {
    setAuth(prev => {
      const next = typeof value === 'function' ? (value as (prevState: typeof auth) => typeof auth)(prev) : value;
      traceState('setAuth update', {
        reason,
        prevIsLoading: prev.isLoading,
        nextIsLoading: next.isLoading,
        prevIsAuthenticated: prev.isAuthenticated,
        nextIsAuthenticated: next.isAuthenticated,
        prevIsVerifying: prev.isVerifying,
        nextIsVerifying: next.isVerifying,
      });
      return next;
    });
  }, []);

  // ============================================================================
  // SECTION: Theme Management
  // PURPOSE: Handle theme preference and system theme detection
  // REVIEW: System theme listener must be cleaned up
  // ============================================================================
  
  /**
   * Get effective theme based on user preference.
   * Falls back to system preference when set to 'system'.
   */
  const getEffectiveTheme = useCallback((): 'light' | 'dark' => {
    if (!user || !user.preferences) return 'light';
    const userTheme = user.preferences.theme;
    
    if (userTheme === 'system') {
      return detectSystemTheme();
    }
    return userTheme;
  }, [user]);
  
  // Apply theme to document when it changes
  useEffect(() => {
    applyThemeToDocument(getEffectiveTheme());
  }, [getEffectiveTheme]);
  
  // Listen for system theme changes when using 'system' preference
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        if (user?.preferences?.theme === 'system') {
          applyThemeToDocument(detectSystemTheme());
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [user]);
  
  
  // ============================================================================
  // SECTION: Auth Initialization
  // PURPOSE: Initialize auth state from localStorage then verify with Supabase
  // REVIEW: Local check first for faster initial render
  // @review-focus: Order matters - local before Supabase
  // ============================================================================
  
  useEffect(() => {
    traceState('auth initialization start', {
      supabaseAuthEnabled: ENABLE_SUPABASE_AUTH,
      supabaseConfigured: isSupabaseConfigured(),
    });
    startupTraceRef.current.authInitStarted = true;

    // First check localStorage for quicker initial render
    const localUser = getUserFromLocalStorage();
    traceState('user hydration from local storage', {
      found: Boolean(localUser),
      userId: localUser?.id ?? null,
      phoneVerified: localUser?.phoneVerified ?? null,
    });

    if (localUser) {
      traceSetUser(localUser, 'auth-init:hydrated-local-user');
      traceSetAuth(prev => ({
        ...prev,
        isAuthenticated: localUser.phoneVerified || false,
        isLoading: ENABLE_SUPABASE_AUTH && isSupabaseConfigured() // Keep loading if we need to verify with Supabase
      }), 'auth-init:apply-local-auth-state');
    }
    
    // Then verify with Supabase if needed
    void checkSupabaseAuth(
      (value) => traceSetUser(value, 'auth-init:supabase-sync'),
      (value) => traceSetAuth(value, 'auth-init:supabase-sync')
    ).finally(() => {
      traceState('auth initialization end');
    });
  }, [traceSetAuth, traceSetUser]);
  
  // Update authentication state with demo mode and attempts remaining
  const updateAuthState = useCallback(() => {
    traceSetAuth(prev => ({
      ...prev,
      verificationAttemptsRemaining: getVerificationAttemptsRemaining(),
      maxVerificationAttempts: getMaxVerificationAttempts(),
      isDemoMode: false
    }), 'update-auth-state:refresh-attempts');
  }, [traceSetAuth]);
  
  // ============================================================================
  // SECTION: User Persistence
  // PURPOSE: Sync user state to localStorage and Supabase
  // REVIEW: Supabase sync only when configured and user has ID
  // @side-effects: Writes to localStorage and Supabase
  // ============================================================================
  
  useEffect(() => {
    if (user) {
      safeSetItem('user', user);
      
      // If Supabase is enabled, also update the user profile there
      if (ENABLE_SUPABASE_AUTH && isSupabaseConfigured() && user.id) {
        updateUserProfileInSupabase(user.id, {
          full_name: user.fullName,
          email: user.email,
          phone: user.phone,
          phone_verified: user.phoneVerified,
          gender: user.gender,
          birth_date: user.birthDate ? user.birthDate.toISOString() : null,
          avatar_url: user.avatar,
          occupation: user.occupation,
          sms_providers: user.smsProviders,
          completed_onboarding: user.completedOnboarding,
          last_active: new Date().toISOString()
        }).catch(error => {
          if (import.meta.env.MODE === 'development') {
            console.error("Error updating user profile in Supabase:", error);
          }
        });
      }
    }
  }, [user]);
  
  // ============================================================================
  // SECTION: User Update
  // PURPOSE: Update user state with proper defaults
  // REVIEW: New user gets full default preferences
  // ============================================================================
  
  const updateUser = useCallback((userData: Partial<User>) => {
    traceSetUser(prevUser => {
      if (!prevUser) {
        const newUser: User = {
          id: userData.id || `user_${Date.now()}`,
          phone: userData.phone || '',
          phoneVerified: userData.phoneVerified || false,
          hasProfile: userData.hasProfile || false,
          fullName: userData.fullName || '',
          gender: userData.gender || null,
          birthDate: userData.birthDate || null,
          email: userData.email,
          avatar: userData.avatar,
          occupation: userData.occupation,
          smsProviders: userData.smsProviders || [],
          completedOnboarding: userData.completedOnboarding || false,
          createdAt: new Date(),
          lastActive: new Date(),
          registrationStarted: true, // Mark as started registration
          preferences: userData.preferences || {
            currency: 'USD',
            theme: 'light',
            notifications: true,
            language: 'en',
          displayOptions: {
            showCents: true,
            weekStartsOn: 'sunday',
            defaultView: 'list',
            compactMode: false,
            showCategories: true,
            showTags: true
          },
          sms: {
            autoDetectProviders: true,
            showDetectionNotifications: true,
            autoImport: false,
            backgroundSmsEnabled: false
          }
        }
      };
        return newUser;
      }
      
      // Update lastActive timestamp
      const updatedUser = { 
        ...prevUser, 
        ...userData,
        lastActive: new Date() 
      };
      
      return updatedUser;
    }, 'update-user:merge-user-data');
  }, [traceSetUser]);
  
  // ============================================================================
  // SECTION: Auth Functions
  // PURPOSE: Authentication flow wrappers
  // ============================================================================
  
  const checkUserExists = useCallback((phoneNumber: string): Promise<boolean> => {
    return checkUserExistsUtil(phoneNumber);
  }, []);

  const startPhoneVerification = useCallback((phoneNumber: string): Promise<boolean> => {
    return startPhoneVerificationUtil(phoneNumber, setIsLoading, setAuth, updateUser, updateAuthState);
  }, [updateUser, updateAuthState]);

  const confirmPhoneVerification = useCallback((code: string): Promise<boolean> => {
    return confirmPhoneVerificationUtil(code, setIsLoading, setAuth, updateUser, updateAuthState);
  }, [updateUser, updateAuthState]);

  const logIn = useCallback(() => {
    logInUtil(updateUser, setAuth, user);
  }, [updateUser, user]);

  const logOut = useCallback(() => {
    logOutUtil(setAuth, setUser);
  }, []);

  const loadUserProfile = useCallback(async (): Promise<User | null> => {
    // Simulate API call
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
    
    return user;
  }, [user]);
  
  // ============================================================================
  // SECTION: Preference Updates
  // PURPOSE: Type-safe preference update wrappers
  // REVIEW: Each method merges with defaults for new users
  // ============================================================================
  
  const updateUserPreferences = useCallback(
    (preferences: Partial<User['preferences']>) => {
      if (!user) {
        const merged = {
          ...DEFAULT_PREFERENCES,
          ...preferences,
          displayOptions: {
            ...DEFAULT_PREFERENCES.displayOptions,
            ...(preferences.displayOptions || {})
          },
          sms: {
            ...DEFAULT_PREFERENCES.sms,
            ...(preferences.sms || {})
          },
          ...(preferences.privacy ? { privacy: { ...preferences.privacy } } : {}),
          ...(preferences.dataManagement
            ? { dataManagement: { ...preferences.dataManagement } }
            : {})
        } as User['preferences'];

        updateUser({ preferences: merged });
        return;
      }

      updateUserPreferencesUtil(user, setUser, preferences);
    },
    [user, updateUser]
  );
  
  const updateTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    updateUserPreferences({ theme });
  }, [updateUserPreferences]);
  
  const updateCurrency = useCallback((currency: string) => {
    updateUserPreferences({ currency });
    persistCurrency(currency);
  }, [updateUserPreferences]);
  
  const updateLanguage = useCallback((language: string) => {
    updateUserPreferences({ language });
  }, [updateUserPreferences]);
  
  const updateNotificationSettings = useCallback((enabled: boolean, types?: string[]) => {
    const notificationSettings = { notifications: enabled };
    updateUserPreferences(notificationSettings);
  }, [updateUserPreferences]);
  
  const updateDisplayOptions = useCallback(
    (displayOptions: Partial<User['preferences']['displayOptions']>) => {
      if (!user) {
        const merged = {
          ...DEFAULT_PREFERENCES,
          displayOptions: {
            ...DEFAULT_PREFERENCES.displayOptions,
            ...displayOptions
          }
        } as User['preferences'];

        updateUser({ preferences: merged });
        return;
      }

      updateDisplayOptionsUtil(user, setUser, displayOptions);
    },
    [user, updateUser]
  );
  
  const updatePrivacySettings = useCallback((privacySettings: Partial<User['preferences']['privacy']>) => {
    updatePrivacySettingsUtil(user, setUser, privacySettings);
  }, [user]);
  
  const updateDataManagement = useCallback((dataManagement: Partial<User['preferences']['dataManagement']>) => {
    updateDataManagementUtil(user, setUser, dataManagement);
  }, [user]);
  
  // ============================================================================
  // SECTION: Onboarding Completion
  // PURPOSE: Mark user as fully onboarded and authenticated
  // REVIEW: Updates multiple state flags atomically
  // ============================================================================
  
  const completeOnboarding = useCallback(() => {
    updateUser({ 
      completedOnboarding: true,
      hasProfile: true,
      registrationStarted: true
    });
    
    // Update auth state to mark as authenticated
    traceSetAuth(prev => ({ 
      ...prev, 
      isAuthenticated: true,
      isVerifying: false
    }), 'complete-onboarding:set-authenticated');
    
    // Log in to ensure proper session state
    logIn();
  }, [logIn, traceSetAuth, updateUser]);
  
  const isProfileComplete = useCallback((): boolean => {
    return isProfileCompleteUtil(user);
  }, [user]);
  
  const updateAvatar = useCallback((avatarUrl: string) => {
    updateUser({ avatar: avatarUrl });
  }, [updateUser]);
  
  const setDemoModeEnabled = useCallback((enabled: boolean) => {
    traceSetAuth(
      (prev) => ({
        ...prev,
        isDemoMode: enabled,
      }),
      'set-demo-mode',
    );
  }, [traceSetAuth]);
  
  useEffect(() => {
    if (!startupTraceRef.current.authInitStarted) {
      return;
    }

    traceState('auth.isLoading transition observed', {
      authIsLoading: auth.isLoading,
      authIsAuthenticated: auth.isAuthenticated,
      authIsVerifying: auth.isVerifying,
    });
  }, [auth.isAuthenticated, auth.isLoading, auth.isVerifying]);

  // ============================================================================
  // SECTION: Provider Render
  // ============================================================================
  
  return (
    <UserContext.Provider
      value={{
        user,
        auth,
        updateUser,
        startPhoneVerification,
        confirmPhoneVerification,
        logIn,
        logOut,
        isLoading,
        loadUserProfile,
        updateUserPreferences,
        updateTheme,
        updateCurrency,
        updateLanguage,
        updateNotificationSettings,
        updateDisplayOptions,
        updatePrivacySettings,
        updateDataManagement,
        completeOnboarding,
        isProfileComplete,
        updateAvatar,
        getEffectiveTheme,
        setDemoModeEnabled,
        checkUserExists
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
