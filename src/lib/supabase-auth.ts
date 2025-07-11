import { safeStorage } from "@/utils/safe-storage";
import { supabase } from './supabase';
import { ErrorType, AppError, ErrorSeverity } from '@/types/error';
import { handleError, createError } from '@/utils/error-utils';
import { getFriendlyMessage } from '@/utils/errorMapper';
import { ENABLE_SUPABASE_AUTH } from './env';

// Session timeout in milliseconds (30 minutes instead of 15)
const SESSION_TIMEOUT = 30 * 60 * 1000;
// Maximum verification attempts
const MAX_VERIFICATION_ATTEMPTS = 5;

// Store the verification state
const verificationState = {
  phoneNumber: '',
  attempts: 0,
  startTime: 0,
  sessionExpiryTime: 0,
  isInDemoMode: false
};

/**
 * Sets the demo mode for OTP verification
 * @param isDemoMode Boolean indicating if demo mode should be enabled
 */
export const setDemoMode = (isDemoMode: boolean): void => {
  verificationState.isInDemoMode = isDemoMode;
};

/**
 * Gets the current demo mode status
 * @returns Boolean indicating if demo mode is enabled
 */
export const isDemoMode = (): boolean => {
  return verificationState.isInDemoMode;
};

/**
 * Starts the phone verification process with Supabase
 * @param phoneNumber Phone number to verify
 * @returns Promise resolving to success status or error
 */
export const startPhoneVerificationWithSupabase = async (phoneNumber: string): Promise<{success: boolean; error?: AppError}> => {
  try {
    // Reset verification state
    verificationState.phoneNumber = phoneNumber;
    verificationState.attempts = 0;
    verificationState.startTime = Date.now();
    verificationState.sessionExpiryTime = Date.now() + SESSION_TIMEOUT;
    
    // If in demo mode, skip actual Supabase API call
    if (verificationState.isInDemoMode) {
      if (import.meta.env.MODE === 'development') {
        console.log('Demo mode: Simulating OTP verification send for:', phoneNumber);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    }
    
    // Check if Supabase is enabled
    if (!ENABLE_SUPABASE_AUTH) {
      if (import.meta.env.MODE === 'development') {
        console.warn('Supabase auth is disabled. Enable it in environment settings.');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    }
    
    // Real implementation with Supabase
    const { error } = await supabase.auth.signInWithOtp({
      phone: phoneNumber
    });
    
    if (error) {
      return {
        success: false,
        error: createError(
          ErrorType.AUTH,
          getFriendlyMessage(error) || 'Failed to send verification code',
          { phoneNumber, statusCode: error.status },
          error,
          ErrorSeverity.ERROR
        )
      };
    }
    
    // Store the session expiry time in localStorage to persist across page reloads
    safeStorage.setItem('verificationSessionExpiry', verificationState.sessionExpiryTime.toString());
    safeStorage.setItem('verificationPhoneNumber', phoneNumber);
    
    return { success: true };
  } catch (error) {
    const appError = createError(
      ErrorType.AUTH,
      'Error starting phone verification with Supabase',
      { phoneNumber },
      error
    );
    
    if (import.meta.env.MODE === 'development') {
      console.error(appError);
    }
    return { success: false, error: appError };
  }
};

/**
 * Checks if the verification session has expired
 * @returns Boolean indicating if session is valid
 */
export const isVerificationSessionValid = (): boolean => {
  // Check if there's a stored session expiry time
  const storedExpiryTime = safeStorage.getItem('verificationSessionExpiry');
  if (storedExpiryTime) {
    verificationState.sessionExpiryTime = parseInt(storedExpiryTime, 10);
    
    // Also restore the phone number if available
    const storedPhoneNumber = safeStorage.getItem('verificationPhoneNumber');
    if (storedPhoneNumber) {
      verificationState.phoneNumber = storedPhoneNumber;
    }
  }
  
  return Date.now() < verificationState.sessionExpiryTime;
};

/**
 * Gets the remaining time for the verification session in milliseconds
 * @returns Time remaining in milliseconds
 */
export const getVerificationSessionTimeRemaining = (): number => {
  if (!isVerificationSessionValid()) return 0;
  return verificationState.sessionExpiryTime - Date.now();
};

/**
 * Confirms a verification code for phone number verification
 * @param code Verification code received by SMS
 * @returns Promise resolving to success status
 */
export const confirmPhoneVerificationWithSupabase = async (code: string): Promise<{success: boolean; error?: AppError}> => {
  try {
    // Check if verification session has expired
    if (!isVerificationSessionValid()) {
      return {
        success: false,
        error: createError(
          ErrorType.AUTH,
          'Verification session has expired, please request a new code',
          { sessionExpired: true }
        )
      };
    }
    
    // Check if maximum attempts reached
    if (verificationState.attempts >= MAX_VERIFICATION_ATTEMPTS) {
      return {
        success: false,
        error: createError(
          ErrorType.AUTH,
          'Too many verification attempts, please request a new code',
          { maxAttemptsReached: true }
        )
      };
    }
    
    verificationState.attempts += 1;
    
    // If in demo mode, only check for the demo code "1234"
    if (verificationState.isInDemoMode) {
      if (import.meta.env.MODE === 'development') {
        console.log('Demo mode: Verifying code:', code);
      }
      
      const isValid = code === "1234";
      
      if (!isValid) {
        const attemptsLeft = MAX_VERIFICATION_ATTEMPTS - verificationState.attempts;
        return {
          success: false,
          error: createError(
            ErrorType.AUTH,
            `Invalid verification code. ${attemptsLeft} attempts remaining.`,
            { attemptsLeft, attempts: verificationState.attempts }
          )
        };
      }
      
      // Clear session data on successful verification
      safeStorage.removeItem('verificationSessionExpiry');
      safeStorage.removeItem('verificationPhoneNumber');
      
      return { success: true };
    }
    
    // Check if Supabase is enabled
    if (!ENABLE_SUPABASE_AUTH) {
      if (import.meta.env.MODE === 'development') {
        console.warn('Supabase auth is disabled. Enable it in environment settings.');
      }
      const isValid = code === "1234";
      
      if (!isValid) {
        const attemptsLeft = MAX_VERIFICATION_ATTEMPTS - verificationState.attempts;
        return {
          success: false,
          error: createError(
            ErrorType.AUTH,
            `Invalid verification code. ${attemptsLeft} attempts remaining.`,
            { attemptsLeft, attempts: verificationState.attempts }
          )
        };
      }
      
      // Clear session data on successful verification
      safeStorage.removeItem('verificationSessionExpiry');
      safeStorage.removeItem('verificationPhoneNumber');
      
      return { success: true };
    }
    
    // Real implementation with Supabase
    const { error } = await supabase.auth.verifyOtp({
      phone: verificationState.phoneNumber,
      token: code,
      type: 'sms'
    });
    
    if (error) {
      const attemptsLeft = MAX_VERIFICATION_ATTEMPTS - verificationState.attempts;
      return {
        success: false,
        error: createError(
          ErrorType.AUTH,
          `${getFriendlyMessage(error) || 'Invalid verification code'}. ${attemptsLeft} attempts remaining.`,
          { attemptsLeft, attempts: verificationState.attempts, phoneNumber: verificationState.phoneNumber },
          error
        )
      };
    }
    
    // Clear session data on successful verification
    safeStorage.removeItem('verificationSessionExpiry');
    safeStorage.removeItem('verificationPhoneNumber');
    
    return { success: true };
  } catch (error) {
    const appError = createError(
      ErrorType.AUTH,
      'Error confirming phone verification with Supabase',
      { attempts: verificationState.attempts },
      error
    );
    
    if (import.meta.env.MODE === 'development') {
      console.error(appError);
    }
    return { success: false, error: appError };
  }
};

/**
 * Reset verification session (useful when user requests a new code)
 */
export const resetVerificationSession = (): void => {
  verificationState.attempts = 0;
  verificationState.startTime = Date.now();
  verificationState.sessionExpiryTime = Date.now() + SESSION_TIMEOUT;
  
  // Update localStorage
  safeStorage.setItem('verificationSessionExpiry', verificationState.sessionExpiryTime.toString());
  if (verificationState.phoneNumber) {
    safeStorage.setItem('verificationPhoneNumber', verificationState.phoneNumber);
  }
};

/**
 * Updates user profile in Supabase
 * @param userId User ID to update
 * @param userData User data to update
 * @returns Promise resolving to success status
 */
export const updateUserProfileInSupabase = async (userId: string, userData: any): Promise<boolean> => {
  try {
    if (!userId) {
      handleError(createError(
        ErrorType.AUTH,
        'Cannot update profile: User ID is missing',
        { userData }
      ));
      return false;
    }
    
    // If in demo mode or Supabase is disabled, simulate success
    if (verificationState.isInDemoMode || !ENABLE_SUPABASE_AUTH) {
      if (import.meta.env.MODE === 'development') {
        console.log('Demo mode or Supabase disabled: Simulating profile update for:', userId);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    }
    
    const { error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', userId);
      
    if (error) {
      handleError(createError(
        ErrorType.API,
        'Failed to update user profile',
        { userId, userData, supabaseError: error },
        error
      ));
      return false;
    }
    
    return true;
  } catch (error) {
    handleError(createError(
      ErrorType.API,
      'Error updating user profile in Supabase',
      { userId },
      error
    ));
    return false;
  }
};

/**
 * Checks if a user is authenticated with Supabase
 * @returns Promise resolving to authentication status
 */
export const isAuthenticatedWithSupabase = async (): Promise<boolean> => {
  try {
    // If in demo mode or Supabase is disabled, return based on local storage
    if (verificationState.isInDemoMode || !ENABLE_SUPABASE_AUTH) {
      const hasLocalUser = safeStorage.getItem('user') !== null;
      return hasLocalUser;
    }
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      handleError(createError(
        ErrorType.AUTH,
        'Error checking authentication status',
        { supabaseError: error },
        error,
        undefined,
        true // Silent error
      ));
      return false;
    }
    
    return !!data.session;
  } catch (error) {
    handleError(createError(
      ErrorType.AUTH,
      'Error checking authentication status with Supabase',
      {},
      error,
      undefined,
      true // Silent error
    ));
    return false;
  }
};

/**
 * Refreshes the current session if it's close to expiring
 * @returns Promise resolving to success status
 */
export const refreshSessionIfNeeded = async (): Promise<boolean> => {
  try {
    // If in demo mode or Supabase is disabled, always return true
    if (verificationState.isInDemoMode || !ENABLE_SUPABASE_AUTH) {
      return true;
    }
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error || !data.session) {
      return false;
    }
    
    // If session exists but expires in less than 5 minutes (300 seconds), refresh it
    const expiresAt = data.session.expires_at;
    const expirationTime = expiresAt ? new Date(expiresAt * 1000) : null;
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    
    if (expirationTime && expirationTime < fiveMinutesFromNow) {
      // Session expiring soon, refresh it
      const { error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        if (import.meta.env.MODE === 'development') {
          console.warn('Failed to refresh session:', refreshError);
        }
        return false;
      }
      
      return true;
    }
    
    // Session is valid and not expiring soon
    return true;
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('Error refreshing session:', error);
    }
    return false;
  }
};

/**
 * Signs out the current user from Supabase
 * @returns Promise resolving to success status
 */
export const signOutFromSupabase = async (): Promise<boolean> => {
  try {
    // If in demo mode or Supabase is disabled, just return true
    if (verificationState.isInDemoMode || !ENABLE_SUPABASE_AUTH) {
      if (import.meta.env.MODE === 'development') {
        console.log('Demo mode or Supabase disabled: Simulating sign out');
      }
      return true;
    }
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      handleError(createError(
        ErrorType.AUTH,
        'Error signing out from Supabase',
        { supabaseError: error },
        error
      ));
      return false;
    }
    
    return true;
  } catch (error) {
    handleError(createError(
      ErrorType.AUTH,
      'Error signing out from Supabase',
      {},
      error
    ));
    return false;
  }
};

/**
 * Gets the current timeout of the verification session in milliseconds
 * @returns Timeout value in milliseconds
 */
export const getVerificationSessionTimeout = (): number => {
  return SESSION_TIMEOUT;
};

/**
 * Gets the maximum allowed verification attempts
 * @returns Maximum number of attempts
 */
export const getMaxVerificationAttempts = (): number => {
  return MAX_VERIFICATION_ATTEMPTS;
};

/**
 * Gets the number of verification attempts remaining
 * @returns Number of attempts remaining
 */
export const getVerificationAttemptsRemaining = (): number => {
  return MAX_VERIFICATION_ATTEMPTS - verificationState.attempts;
};

