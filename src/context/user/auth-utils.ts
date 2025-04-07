
import { createUserWithPhone, UserPhoneAuthResponse } from '@/services/AuthService';
import { ErrorType, AppError } from '@/types/error';
import { createError, handleError } from '@/utils/error-utils';
import { User } from './types';
import { startPhoneVerificationWithSupabase, confirmPhoneVerificationWithSupabase, isDemoMode } from '@/lib/supabase-auth';
import { ENABLE_DEMO_MODE } from '@/lib/env';

/**
 * Handles phone number authentication
 */
export const authenticateWithPhone = async (
  phone: string,
  storeUser: (user: User) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: AppError | null) => void
): Promise<boolean> => {
  setLoading(true);
  setError(null);
  
  try {
    // First, try to send verification code via Supabase
    const { success, error } = await startPhoneVerificationWithSupabase(phone);
    
    if (!success) {
      setError(error || createError(ErrorType.AUTH, 'Failed to send verification code'));
      setLoading(false);
      return false;
    }
    
    // If in demo mode, notify the user that a dummy code "1234" can be used
    if (ENABLE_DEMO_MODE || isDemoMode()) {
      console.log('Demo mode enabled. Use "1234" as verification code.');
    }
    
    setLoading(false);
    return true;
  } catch (error) {
    const appError = createError(
      ErrorType.AUTH,
      'Authentication failed',
      { phone },
      error
    );
    
    setError(appError);
    handleError(appError);
    setLoading(false);
    return false;
  }
};

/**
 * Verifies phone number with code from SMS
 */
export const verifyPhoneWithCode = async (
  phone: string,
  code: string,
  storeUser: (user: User) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: AppError | null) => void,
  setVerified: (verified: boolean) => void
): Promise<boolean> => {
  setLoading(true);
  setError(null);
  
  try {
    // Attempt to verify the code with Supabase
    const { success, error } = await confirmPhoneVerificationWithSupabase(code);
    
    if (!success) {
      setError(error || createError(ErrorType.AUTH, 'Failed to verify code'));
      setLoading(false);
      return false;
    }
    
    // If verification is successful, create or fetch the user
    const response: UserPhoneAuthResponse = await createUserWithPhone(phone);
    
    if (response.error) {
      setError(createError(ErrorType.AUTH, response.error));
      setLoading(false);
      return false;
    }
    
    // If user doesn't exist yet or is incomplete, mark as not having completed onboarding
    if (!response.user.completedOnboarding) {
      response.user.completedOnboarding = false;
    }
    
    // Store the verified user
    storeUser(response.user);
    setVerified(true);
    setLoading(false);
    return true;
  } catch (error) {
    const appError = createError(
      ErrorType.AUTH,
      'Verification failed',
      { phone, code },
      error
    );
    
    setError(appError);
    handleError(appError);
    setLoading(false);
    return false;
  }
};
