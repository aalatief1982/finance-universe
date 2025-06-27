
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { User, UserContextType } from './types';
import { toast } from '@/hooks/use-toast';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ENABLE_SUPABASE_AUTH, ENABLE_DEMO_MODE } from '@/lib/env';
import {
  setDemoMode,
  isDemoMode,
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
import {
  updateUserPreferences as updateUserPreferencesUtil,
  updateDisplayOptions as updateDisplayOptionsUtil,
  updatePrivacySettings as updatePrivacySettingsUtil,
  updateDataManagement as updateDataManagementUtil
} from './preferences-utils';

export const UserContext = createContext<UserContextType>({
  user: null,
  auth: {
    isAuthenticated: false,
    isLoading: false,
    isVerifying: false,
    isDemoMode: false
  },
  updateUser: () => {},
  startPhoneVerification: async () => false,
  confirmPhoneVerification: async () => false,
  logIn: () => {},
  logOut: () => {},
  isLoading: false,
  loadUserProfile: async () => null,
  updateUserPreferences: () => {},
  updateTheme: () => {},
  updateCurrency: () => {},
  updateLanguage: () => {},
  updateNotificationSettings: () => {},
  updateDisplayOptions: () => {},
  updatePrivacySettings: () => {},
  updateDataManagement: () => {},
  completeOnboarding: () => {},
  isProfileComplete: () => false,
  updateAvatar: () => {},
  getEffectiveTheme: () => 'light',
  setDemoModeEnabled: () => {},
  checkUserExists: async () => false,
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    isLoading: true,
    isVerifying: false,
    verificationAttemptsRemaining: getVerificationAttemptsRemaining(),
    maxVerificationAttempts: getMaxVerificationAttempts(),
    isDemoMode: isDemoMode()
  });
  
  // Get effective theme based on user preference and system setting
  const getEffectiveTheme = useCallback((): 'light' | 'dark' => {
    if (!user || !user.preferences) return 'light';
    const userTheme = user.preferences.theme;
    
    if (userTheme === 'system') {
      return detectSystemTheme();
    }
    return userTheme;
  }, [user]);
  
  // Apply theme to document
  useEffect(() => {
    applyThemeToDocument(getEffectiveTheme());
  }, [getEffectiveTheme]);
  
  // Listen for system theme changes
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
  
  // Set demo mode based on environment or user preference
  useEffect(() => {
    setDemoMode(ENABLE_DEMO_MODE);
  }, []);
  
  // Enhanced auth check that initializes with local storage first for faster UI response
  useEffect(() => {
    // First check localStorage for quicker initial render
    const localUser = getUserFromLocalStorage();
    if (localUser) {
      setUser(localUser);
      setAuth(prev => ({
        ...prev,
        isAuthenticated: localUser.phoneVerified || false,
        isLoading: ENABLE_SUPABASE_AUTH && isSupabaseConfigured() // Keep loading if we need to verify with Supabase
      }));
    }
    
    // Then verify with Supabase if needed
    checkSupabaseAuth(setUser, setAuth);
  }, []);
  
  // Update authentication state with demo mode and attempts remaining
  const updateAuthState = useCallback(() => {
    setAuth(prev => ({
      ...prev,
      verificationAttemptsRemaining: getVerificationAttemptsRemaining(),
      maxVerificationAttempts: getMaxVerificationAttempts(),
      isDemoMode: isDemoMode()
    }));
  }, []);
  
  // Save user to local storage whenever it changes
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
          console.error("Error updating user profile in Supabase:", error);
        });
      }
    }
  }, [user]);
  
  // Enhanced updateUser with improved defaults
  const updateUser = useCallback((userData: Partial<User>) => {
    setUser(prevUser => {
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
            autoImport: false
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
    });
  }, []);
  
  // Function implementations 
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
  
  const updateUserPreferences = useCallback((preferences: Partial<User['preferences']>) => {
    updateUserPreferencesUtil(user, setUser, preferences);
  }, [user]);
  
  const updateTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    updateUserPreferences({ theme });
  }, [updateUserPreferences]);
  
  const updateCurrency = useCallback((currency: string) => {
    updateUserPreferences({ currency });
  }, [updateUserPreferences]);
  
  const updateLanguage = useCallback((language: string) => {
    updateUserPreferences({ language });
  }, [updateUserPreferences]);
  
  const updateNotificationSettings = useCallback((enabled: boolean, types?: string[]) => {
    const notificationSettings = { notifications: enabled };
    updateUserPreferences(notificationSettings);
  }, [updateUserPreferences]);
  
  const updateDisplayOptions = useCallback((displayOptions: Partial<User['preferences']['displayOptions']>) => {
    updateDisplayOptionsUtil(user, setUser, displayOptions);
  }, [user]);
  
  const updatePrivacySettings = useCallback((privacySettings: Partial<User['preferences']['privacy']>) => {
    updatePrivacySettingsUtil(user, setUser, privacySettings);
  }, [user]);
  
  const updateDataManagement = useCallback((dataManagement: Partial<User['preferences']['dataManagement']>) => {
    updateDataManagementUtil(user, setUser, dataManagement);
  }, [user]);
  
  // Enhanced onboarding completion that also updates authentication state
  const completeOnboarding = useCallback(() => {
    updateUser({ 
      completedOnboarding: true,
      hasProfile: true,
      registrationStarted: true
    });
    
    // Update auth state to mark as authenticated
    setAuth(prev => ({ 
      ...prev, 
      isAuthenticated: true,
      isVerifying: false
    }));
    
    // Log in to ensure proper session state
    logIn();
  }, [updateUser, logIn]);
  
  const isProfileComplete = useCallback((): boolean => {
    return isProfileCompleteUtil(user);
  }, [user]);
  
  const updateAvatar = useCallback((avatarUrl: string) => {
    updateUser({ avatar: avatarUrl });
  }, [updateUser]);
  
  // Function to toggle demo mode
  const setDemoModeEnabled = useCallback((enabled: boolean) => {
    setDemoMode(enabled);
    updateAuthState();
    
    toast({
      title: enabled ? "Demo Mode Enabled" : "Demo Mode Disabled",
      description: enabled 
        ? "Using mock authentication. Verification code is 1234." 
        : "Using real authentication services."
    });
  }, [updateAuthState]);
  
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

export const useUser = () => useContext(UserContext);
