
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ENABLE_SUPABASE_AUTH, ENABLE_DEMO_MODE } from '@/lib/env';
import { User } from './types';
import { toast } from '@/hooks/use-toast';
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
import { createError, ErrorType } from '@/types/error';

/**
 * Check if a user with the given phone number exists
 * @param phoneNumber The phone number to check
 * @returns Promise resolving to a boolean indicating if the user exists
 */
export const checkUserExists = async (phoneNumber: string): Promise<boolean> => {
  // First check local storage
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.phone === phoneNumber) {
        return true;
      }
    } catch (error) {
      console.error('Error parsing stored user', error);
    }
  }
  
  // Then check Supabase if enabled
  if (ENABLE_SUPABASE_AUTH && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('phone')
        .eq('phone', phoneNumber)
        .limit(1);
        
      if (error) {
        console.error("Error checking if user exists:", error);
        return false;
      }
      
      return data && data.length > 0;
    } catch (error) {
      console.error("Error checking if user exists:", error);
      return false;
    }
  }
  
  return false;
};

/**
 * Check local storage for user data
 * @returns The user data from local storage or null if not found
 */
export const getUserFromLocalStorage = (): User | null => {
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
      
      return parsedUser;
    } catch (error) {
      console.error('Failed to parse stored user data', error);
    }
  }
  return null;
};

/**
 * Check Supabase authentication
 * @param setUser Function to set the user state
 * @param setAuth Function to set the auth state
 */
export const checkSupabaseAuth = async (
  setUser: (user: User) => void,
  setAuth: (auth: any) => void
): Promise<void> => {
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
          const updatedUser: User = {
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
            registrationStarted: true,
          };
          
          setUser(updatedUser);
          setAuth((prev: any) => ({
            ...prev,
            isAuthenticated: updatedUser.phoneVerified,
            isLoading: false,
            isVerifying: false
          }));
          
          // Update localStorage
          localStorage.setItem('user', JSON.stringify(updatedUser));
          return;
        }
      }
    } catch (error) {
      console.error("Error checking Supabase auth:", error);
    }
  }
  
  // If we get here, either Supabase auth failed or it's disabled
  setAuth((prev: any) => ({ ...prev, isLoading: false }));
};

/**
 * Start phone verification
 * @param phoneNumber The phone number to verify
 * @param setIsLoading Function to set loading state
 * @param setAuth Function to set auth state
 * @param updateUser Function to update user
 * @param updateAuthState Function to update auth state
 * @returns Promise resolving to a boolean indicating success
 */
export const startPhoneVerification = async (
  phoneNumber: string,
  setIsLoading: (isLoading: boolean) => void,
  setAuth: (auth: any) => void,
  updateUser: (userData: Partial<User>) => void,
  updateAuthState: () => void
): Promise<boolean> => {
  setIsLoading(true);
  setAuth((prev: any) => ({ ...prev, isVerifying: true }));
  
  try {
    // Check if we should use Supabase for verification
    if (ENABLE_SUPABASE_AUTH && isSupabaseConfigured() && !isDemoMode()) {
      const { success } = await startPhoneVerificationWithSupabase(phoneNumber);
      
      if (success) {
        // Update user phone number and registration status
        updateUser({ 
          phone: phoneNumber,
          registrationStarted: true
        });
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
      updateUser({ 
        phone: phoneNumber,
        registrationStarted: true 
      });
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

/**
 * Confirm phone verification
 * @param code The verification code
 * @param setIsLoading Function to set loading state
 * @param setAuth Function to set auth state
 * @param updateUser Function to update user
 * @param updateAuthState Function to update auth state
 * @returns Promise resolving to a boolean indicating success
 */
export const confirmPhoneVerification = async (
  code: string,
  setIsLoading: (isLoading: boolean) => void,
  setAuth: (auth: any) => void,
  updateUser: (userData: Partial<User>) => void,
  updateAuthState: () => void
): Promise<boolean> => {
  setIsLoading(true);
  
  try {
    // Check if we should use Supabase for verification
    if (ENABLE_SUPABASE_AUTH && isSupabaseConfigured() && !isDemoMode()) {
      const { success } = await confirmPhoneVerificationWithSupabase(code);
      
      if (success) {
        updateUser({ 
          phoneVerified: true,
          registrationStarted: true
        });
        setAuth((prev: any) => ({ 
          ...prev, 
          isVerifying: false,
          isAuthenticated: true // Set authenticated when phone is verified
        }));
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
        updateUser({ 
          phoneVerified: true,
          registrationStarted: true
        });
        setAuth((prev: any) => ({ 
          ...prev, 
          isVerifying: false,
          isAuthenticated: true // Set authenticated when phone is verified in demo mode too
        }));
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

/**
 * Log in user
 * @param updateUser Function to update user
 * @param setAuth Function to set auth state
 * @param user Current user
 */
export const logIn = async (
  updateUser: (userData: Partial<User>) => void,
  setAuth: (auth: any) => void,
  user: User | null
): Promise<void> => {
  if (ENABLE_SUPABASE_AUTH && isSupabaseConfigured() && !isDemoMode()) {
    // If using Supabase auth, this is handled automatically by the sign-in flow
    // We just need to check if we're already authenticated
    const isAuthenticated = await isAuthenticatedWithSupabase();
    
    setAuth((prev: any) => ({ 
      ...prev, 
      isAuthenticated: isAuthenticated || prev.isAuthenticated 
    }));
  } else {
    // When not using Supabase, handle auth state locally
    // Only set as authenticated if phone is verified
    setAuth((prev: any) => ({ 
      ...prev, 
      isAuthenticated: user?.phoneVerified || false
    }));
  }
  
  // Update last active timestamp
  updateUser({ 
    lastActive: new Date(),
    registrationStarted: true
  });
};

/**
 * Log out user
 * @param setAuth Function to set auth state
 * @param setUser Function to set user state
 */
export const logOut = async (
  setAuth: (auth: any) => void,
  setUser: (user: User | null) => void
): Promise<void> => {
  try {
    if (ENABLE_SUPABASE_AUTH && isSupabaseConfigured() && !isDemoMode()) {
      // Sign out from Supabase
      await signOutFromSupabase();
    }
    
    // Clear local state
    setAuth((prev: any) => ({ 
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
};

/**
 * Calculate profile completion percentage
 * @param user The user object
 * @returns The profile completion percentage
 */
export const calculateProfileCompletionPercentage = (user: User | null): number => {
  if (!user) return 20;
  
  let fields = 0;
  const totalFields = 6; // fullName, email, phone, gender, birthDate, occupation
  
  if (user.fullName) fields++;
  if (user.email) fields++;
  if (user.phone) fields++;
  if (user.gender) fields++;
  if (user.birthDate) fields++;
  if (user.occupation) fields++;
  
  return Math.round((fields / totalFields) * 100);
};

/**
 * Check if user profile is complete
 * @param user The user object
 * @returns Boolean indicating if profile is complete
 */
export const isProfileComplete = (user: User | null): boolean => {
  if (!user) return false;
  
  // Check if required profile fields are completed
  const requiredFields = [
    user.fullName,
    user.phoneVerified,
    user.phone,
    user.smsProviders && user.smsProviders.length > 0
  ];
  
  return requiredFields.every(Boolean);
};
