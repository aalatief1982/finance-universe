
import { ErrorType } from '@/types/error';
import { createError, handleError } from '@/utils/error-utils';
import { startPhoneVerificationWithSupabase, confirmPhoneVerificationWithSupabase, isDemoMode } from '@/lib/supabase-auth';
import { ENABLE_DEMO_MODE } from '@/lib/env';
import { User } from '@/context/user/types';

// Mock function to replace the import from AuthService
const createUserWithPhone = async (phone: string): Promise<{ user: User; error?: string }> => {
  try {
    // In a real app, this would make a call to a backend service
    // For now, we'll create a mock user
    const mockUser: User = {
      id: `user-${Date.now()}`,
      phone: phone,
      fullName: '',
      email: '',
      completedOnboarding: false,
      smsPermissionGranted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: {
        theme: 'system',
        currency: 'USD',
        notifications: true,
        language: 'en'
      }
    };
    
    return { user: mockUser };
  } catch (error) {
    return { 
      user: { phone } as User,
      error: 'Failed to create user. Please try again.'
    };
  }
};

/**
 * Handles phone number authentication
 */
export const authenticateWithPhone = async (
  phone: string,
  storeUser: (user: Partial<User>) => void,
  setLoading: (isLoading: boolean) => void,
  setError: (error: any) => void
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
  storeUser: (user: Partial<User>) => void,
  setLoading: (isLoading: boolean) => void,
  setError: (error: any) => void,
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
    const response = await createUserWithPhone(phone);
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
