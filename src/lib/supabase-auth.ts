
import { ENABLE_DEMO_MODE } from './env';

// This file simulates Supabase authentication functions
// In a real app, these would connect to the Supabase API

/**
 * Checks if we're in demo mode
 */
export const isDemoMode = (): boolean => {
  return ENABLE_DEMO_MODE || localStorage.getItem('demoMode') === 'true';
};

/**
 * Simulates phone verification through Supabase
 */
export const startPhoneVerificationWithSupabase = async (
  phone: string
): Promise<{ success: boolean; error?: any }> => {
  // In demo mode, always succeed
  if (isDemoMode()) {
    return { success: true };
  }
  
  // In a real implementation, this would send an API request to Supabase
  // For now, simulate success
  try {
    console.log(`Simulating phone verification for: ${phone}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Always succeed in development
    return { success: true };
  } catch (error) {
    console.error('Phone verification error:', error);
    return { 
      success: false, 
      error: { message: 'Failed to send verification code' } 
    };
  }
};

/**
 * Simulates verification code confirmation through Supabase
 */
export const confirmPhoneVerificationWithSupabase = async (
  code: string
): Promise<{ success: boolean; error?: any }> => {
  // In demo mode, check if code is "1234"
  if (isDemoMode()) {
    return { success: code === '1234' };
  }
  
  // In a real implementation, this would verify the code with Supabase
  // For now, simulate success for any code
  try {
    console.log(`Simulating verification code confirmation: ${code}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple validation - in a real app this would check against the Supabase API
    if (code.length < 4) {
      return { 
        success: false, 
        error: { message: 'Invalid code format' } 
      };
    }
    
    // Always succeed for valid looking codes
    return { success: true };
  } catch (error) {
    console.error('Code verification error:', error);
    return { 
      success: false, 
      error: { message: 'Failed to verify code' } 
    };
  }
};

/**
 * Simulates checking authentication state with Supabase
 */
export const isAuthenticatedWithSupabase = async (): Promise<boolean> => {
  // In a real app, this would check the Supabase session
  // For now, check localStorage
  return localStorage.getItem('isAuthenticated') === 'true';
};

/**
 * Simulates user logout from Supabase
 */
export const logoutFromSupabase = async (): Promise<boolean> => {
  // In a real app, this would sign out from Supabase
  localStorage.removeItem('isAuthenticated');
  return true;
};
