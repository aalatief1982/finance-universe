
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { User as UserType, UserPreferences } from '@/types/user';
import { ValidatedUserPreferences, userPreferencesSchema, validateData } from '@/lib/validation';
import { toast } from '@/components/ui/use-toast';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ENABLE_SUPABASE_AUTH, ENABLE_DEMO_MODE } from '@/lib/env';
import { 
  startPhoneVerificationWithSupabase, 
  confirmPhoneVerificationWithSupabase,
  updateUserProfileInSupabase,
  isAuthenticatedWithSupabase,
  signOutFromSupabase,
  setDemoMode,
  isDemoMode,
  getVerificationAttemptsRemaining,
  getMaxVerificationAttempts
} from '@/lib/supabase-auth';

export interface User extends UserType {
  id: string;
  phone: string;
  phoneVerified: boolean;
  hasProfile: boolean;
  fullName: string;
  gender: 'male' | 'female' | null;
  birthDate: Date | null;
  email?: string;
  avatar?: string;
  occupation?: string;
  smsProviders: string[];
  completedOnboarding: boolean;
  createdAt?: Date;
  lastActive?: Date;
  preferences?: {
    currency: string;
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
    displayOptions?: {
      showCents: boolean;
      weekStartsOn: "sunday" | "monday";
      defaultView: "list" | "stats" | "calendar";
      compactMode?: boolean;
      showCategories?: boolean;
      showTags?: boolean;
    };
    privacy?: {
      maskAmounts?: boolean;
      requireAuthForSensitiveActions?: boolean;
      dataSharing?: "none" | "anonymous" | "full";
    };
    dataManagement?: {
      autoBackup?: boolean;
      backupFrequency?: "daily" | "weekly" | "monthly";
      dataRetention?: "3months" | "6months" | "1year" | "forever";
    };
  };
}

interface UserContextType {
  user: User | null;
  auth: {
    isAuthenticated: boolean;
    isLoading: boolean;
    isVerifying: boolean;
    verificationAttemptsRemaining?: number;
    maxVerificationAttempts?: number;
    isDemoMode: boolean;
  };
  updateUser: (userData: Partial<User>) => void;
  startPhoneVerification: (phoneNumber: string) => Promise<boolean>;
  confirmPhoneVerification: (code: string) => Promise<boolean>;
  logIn: () => void;
  logOut: () => void;
  isLoading: boolean;
  loadUserProfile: () => Promise<User | null>;
  updateUserPreferences: (preferences: Partial<User['preferences']>) => void;
  updateTheme: (theme: 'light' | 'dark' | 'system') => void;
  updateCurrency: (currency: string) => void;
  updateLanguage: (language: string) => void;
  updateNotificationSettings: (enabled: boolean, types?: string[]) => void;
  updateDisplayOptions: (displayOptions: Partial<User['preferences']['displayOptions']>) => void;
  updatePrivacySettings: (privacySettings: Partial<User['preferences']['privacy']>) => void;
  updateDataManagement: (dataManagement: Partial<User['preferences']['dataManagement']>) => void;
  completeOnboarding: () => void;
  isProfileComplete: () => boolean;
  updateAvatar: (avatarUrl: string) => void;
  getEffectiveTheme: () => 'light' | 'dark';
  setDemoModeEnabled: (enabled: boolean) => void;
}

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
  
  // Detect system theme preference
  const detectSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light'; // Default fallback
  }, []);
  
  // Get effective theme based on user preference and system setting
  const getEffectiveTheme = useCallback((): 'light' | 'dark' => {
    if (!user || !user.preferences) return 'light';
    const userTheme = user.preferences.theme;
    
    if (userTheme === 'system') {
      return detectSystemTheme();
    }
    return userTheme;
  }, [user, detectSystemTheme]);
  
  // Apply theme to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const theme = getEffectiveTheme();
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [getEffectiveTheme]);
  
  // Listen for system theme changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        if (user?.preferences?.theme === 'system') {
          const theme = detectSystemTheme();
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [user, detectSystemTheme]);
  
  // Set demo mode based on environment or user preference
  useEffect(() => {
    setDemoMode(ENABLE_DEMO_MODE);
  }, []);
  
  // Check for Supabase auth on initial load
  useEffect(() => {
    const checkSupabaseAuth = async () => {
      if (ENABLE_SUPABASE_AUTH && isSupabaseConfigured()) {
        try {
          const { data } = await supabase.auth.getSession();
          
          if (data.session) {
            // Get user profile from Supabase
            const { data: userData, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.session.user.id)
              .single();
              
            if (userData && !error) {
              // Convert Supabase user data to our User format
              setUser({
                id: data.session.user.id,
                fullName: userData.full_name,
                email: userData.email || '',
                phone: userData.phone || '',
                phoneVerified: userData.phone_verified,
                hasProfile: true,
                gender: userData.gender,
                birthDate: userData.birth_date ? new Date(userData.birth_date) : null,
                smsProviders: userData.sms_providers || [],
                completedOnboarding: userData.completed_onboarding,
                createdAt: userData.created_at ? new Date(userData.created_at) : new Date(),
                lastActive: userData.last_active ? new Date(userData.last_active) : new Date(),
                // ... map other properties
              });
              
              setAuth(prev => ({
                ...prev,
                isAuthenticated: true,
                isLoading: false,
                isVerifying: false
              }));
              
              return;
            }
          }
        } catch (error) {
          console.error("Error checking Supabase auth:", error);
        }
      }
      
      // Fall back to local storage check if Supabase auth fails or is disabled
      checkLocalStorageAuth();
    };
    
    const checkLocalStorageAuth = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // Convert string dates back to Date objects
          if (parsedUser.birthDate) {
            parsedUser.birthDate = new Date(parsedUser.birthDate);
          }
          if (parsedUser.createdAt) {
            parsedUser.createdAt = new Date(parsedUser.createdAt);
          }
          if (parsedUser.lastActive) {
            parsedUser.lastActive = new Date(parsedUser.lastActive);
          }
          
          // Initialize preferences with defaults if not present
          if (!parsedUser.preferences) {
            parsedUser.preferences = {
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
              }
            };
          }
          
          setUser(parsedUser);
          setAuth(prev => ({
            ...prev,
            isAuthenticated: parsedUser.completedOnboarding || false,
            isLoading: false
          }));
        } catch (error) {
          console.error('Failed to parse stored user data', error);
          setAuth(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setAuth(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    checkSupabaseAuth();
  }, []);
  
  // Save user to local storage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      
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
  
  // Update authentication state with demo mode and attempts remaining
  const updateAuthState = useCallback(() => {
    setAuth(prev => ({
      ...prev,
      verificationAttemptsRemaining: getVerificationAttemptsRemaining(),
      maxVerificationAttempts: getMaxVerificationAttempts(),
      isDemoMode: isDemoMode()
    }));
  }, []);

  // Implementation with demo mode support
  const startPhoneVerification = async (phoneNumber: string): Promise<boolean> => {
    setIsLoading(true);
    setAuth(prev => ({ ...prev, isVerifying: true }));
    
    try {
      // Check if we should use Supabase for verification
      if (ENABLE_SUPABASE_AUTH && isSupabaseConfigured()) {
        const success = await startPhoneVerificationWithSupabase(phoneNumber);
        
        if (success) {
          // Update user phone number
          updateUser({ phone: phoneNumber });
          setIsLoading(false);
          updateAuthState();
          return true;
        } else {
          // Handle verification failure
          console.error('Failed to start phone verification');
          setIsLoading(false);
          updateAuthState();
          return false;
        }
      } else {
        // Use mock verification in demo mode
        await new Promise(resolve => setTimeout(resolve, 1500));
        updateUser({ phone: phoneNumber });
        setIsLoading(false);
        updateAuthState();
        return true;
      }
    } catch (error) {
      console.error('Error starting phone verification', error);
      setIsLoading(false);
      updateAuthState();
      return false;
    }
  };

  // Implementation with demo mode support
  const confirmPhoneVerification = async (code: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Check if we should use Supabase for verification
      if (ENABLE_SUPABASE_AUTH && isSupabaseConfigured() && !isDemoMode()) {
        const success = await confirmPhoneVerificationWithSupabase(code);
        
        if (success) {
          updateUser({ phoneVerified: true });
          setAuth(prev => ({ ...prev, isVerifying: false }));
          setIsLoading(false);
          updateAuthState();
          return true;
        } else {
          // Code is invalid
          setIsLoading(false);
          updateAuthState();
          return false;
        }
      } else {
        // In demo mode, "1234" is always valid
        await new Promise(resolve => setTimeout(resolve, 1500));
        const isValid = code === "1234";
        
        if (isValid) {
          updateUser({ phoneVerified: true });
          setAuth(prev => ({ ...prev, isVerifying: false }));
        }
        
        setIsLoading(false);
        updateAuthState();
        return isValid;
      }
    } catch (error) {
      console.error('Error confirming verification code', error);
      setIsLoading(false);
      updateAuthState();
      return false;
    }
  };

  const loadUserProfile = useCallback(async (): Promise<User | null> => {
    // In a real app, this would fetch user data from the backend
    // For now, we'll just return the current user from state
    
    // Simulate API call
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
    
    return user;
  }, [user]);
  
  // Enhanced preferences update functions
  const updateUserPreferences = useCallback((preferences: Partial<User['preferences']>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      
      const updatedPreferences = {
        ...prevUser.preferences,
        ...preferences
      };
      
      return {
        ...prevUser,
        preferences: updatedPreferences
      };
    });
    
    toast({
      title: "Settings updated",
      description: "Your preferences have been saved successfully."
    });
  }, []);
  
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
    setUser(prevUser => {
      if (!prevUser || !prevUser.preferences) return prevUser;
      
      return {
        ...prevUser,
        preferences: {
          ...prevUser.preferences,
          displayOptions: {
            ...prevUser.preferences.displayOptions,
            ...displayOptions
          }
        }
      };
    });
    
    toast({
      title: "Display settings updated",
      description: "Your display preferences have been saved."
    });
  }, []);
  
  const updatePrivacySettings = useCallback((privacySettings: Partial<User['preferences']['privacy']>) => {
    setUser(prevUser => {
      if (!prevUser || !prevUser.preferences) return prevUser;
      
      return {
        ...prevUser,
        preferences: {
          ...prevUser.preferences,
          privacy: {
            ...prevUser.preferences.privacy,
            ...privacySettings
          }
        }
      };
    });
    
    toast({
      title: "Privacy settings updated",
      description: "Your privacy preferences have been saved."
    });
  }, []);
  
  const updateDataManagement = useCallback((dataManagement: Partial<User['preferences']['dataManagement']>) => {
    setUser(prevUser => {
      if (!prevUser || !prevUser.preferences) return prevUser;
      
      return {
        ...prevUser,
        preferences: {
          ...prevUser.preferences,
          dataManagement: {
            ...prevUser.preferences.dataManagement,
            ...dataManagement
          }
        }
      };
    });
    
    toast({
      title: "Data management updated",
      description: "Your data management preferences have been saved."
    });
  }, []);
  
  const completeOnboarding = useCallback(() => {
    updateUser({ 
      completedOnboarding: true,
      hasProfile: true 
    });
    logIn();
  }, [updateUser]);
  
  const isProfileComplete = useCallback((): boolean => {
    if (!user) return false;
    
    // Check if required profile fields are completed
    const requiredFields = [
      user.fullName,
      user.phoneVerified,
      user.phone,
      user.smsProviders && user.smsProviders.length > 0
    ];
    
    return requiredFields.every(Boolean);
  }, [user]);
  
  const updateAvatar = useCallback((avatarUrl: string) => {
    updateUser({ avatar: avatarUrl });
  }, [updateUser]);
  
  // Implementation with demo mode support
  const logIn = useCallback(async () => {
    if (ENABLE_SUPABASE_AUTH && isSupabaseConfigured() && !isDemoMode()) {
      // If using Supabase auth, this is handled automatically by the sign-in flow
      // We just need to check if we're already authenticated
      const isAuthenticated = await isAuthenticatedWithSupabase();
      
      setAuth(prev => ({ 
        ...prev, 
        isAuthenticated: isAuthenticated || prev.isAuthenticated 
      }));
    } else {
      // When not using Supabase, handle auth state locally
      setAuth(prev => ({ ...prev, isAuthenticated: true }));
    }
    
    // Update last active timestamp
    updateUser({ lastActive: new Date() });
  }, [updateUser]);
  
  // Implementation with demo mode and signOutFromSupabase
  const logOut = useCallback(async () => {
    try {
      if (ENABLE_SUPABASE_AUTH && isSupabaseConfigured() && !isDemoMode()) {
        // Sign out from Supabase
        await signOutFromSupabase();
      }
      
      // Clear local state
      setAuth(prev => ({ 
        ...prev, 
        isAuthenticated: false,
        isDemoMode: isDemoMode()
      }));
      setUser(null);
      localStorage.removeItem('user');
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out."
      });
    } catch (error) {
      console.error('Error signing out', error);
    }
  }, []);
  
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
        setDemoModeEnabled
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
