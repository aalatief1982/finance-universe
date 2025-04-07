
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
    // Store timestamp for session expiry (30 minutes from now)
    const expiryTime = Date.now() + (30 * 60 * 1000);
    localStorage.setItem('verificationSessionExpiry', expiryTime.toString());
    localStorage.setItem('verificationPhoneNumber', phone);
    localStorage.setItem('verificationAttemptsRemaining', '5');
    
    return { success: true };
  }
  
  // In a real implementation, this would send an API request to Supabase
  // For now, simulate success
  try {
    console.log(`Simulating phone verification for: ${phone}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Store timestamp for session expiry (30 minutes from now)
    const expiryTime = Date.now() + (30 * 60 * 1000);
    localStorage.setItem('verificationSessionExpiry', expiryTime.toString());
    localStorage.setItem('verificationPhoneNumber', phone);
    localStorage.setItem('verificationAttemptsRemaining', '5');
    
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
    const attemptsRemaining = getVerificationAttemptsRemaining();
    
    if (attemptsRemaining <= 0) {
      return { 
        success: false, 
        error: { message: 'Too many failed attempts. Please request a new code.' } 
      };
    }
    
    const isCorrect = code === '1234';
    
    if (!isCorrect) {
      // Decrease attempts remaining
      const newAttempts = Math.max(0, attemptsRemaining - 1);
      localStorage.setItem('verificationAttemptsRemaining', newAttempts.toString());
    }
    
    return { success: isCorrect };
  }
  
  // In a real implementation, this would verify the code with Supabase
  // For now, simulate success for any code
  try {
    console.log(`Simulating verification code confirmation: ${code}`);
    
    // Get remaining attempts
    const attemptsRemaining = getVerificationAttemptsRemaining();
    
    if (attemptsRemaining <= 0) {
      return { 
        success: false, 
        error: { message: 'Too many failed attempts. Please request a new code.' } 
      };
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple validation - in a real app this would check against the Supabase API
    if (code.length < 4) {
      // Decrease attempts remaining
      const newAttempts = Math.max(0, attemptsRemaining - 1);
      localStorage.setItem('verificationAttemptsRemaining', newAttempts.toString());
      
      return { 
        success: false, 
        error: { message: 'Invalid code format' } 
      };
    }
    
    // For demo purposes, accept code "1234" or if we're in development, any 4-digit code
    const isValidCode = code === '1234';
    
    if (!isValidCode) {
      // Decrease attempts remaining
      const newAttempts = Math.max(0, attemptsRemaining - 1);
      localStorage.setItem('verificationAttemptsRemaining', newAttempts.toString());
    }
    
    return { success: isValidCode };
  } catch (error) {
    console.error('Code verification error:', error);
    return { 
      success: false, 
      error: { message: 'Failed to verify code' } 
    };
  }
};

/**
 * Get the number of verification attempts remaining
 */
export const getVerificationAttemptsRemaining = (): number => {
  const attemptsString = localStorage.getItem('verificationAttemptsRemaining');
  return attemptsString ? parseInt(attemptsString, 10) : 5;
};

/**
 * Get the verification session timeout timestamp
 */
export const getVerificationSessionTimeout = (): number => {
  const expiryTime = localStorage.getItem('verificationSessionExpiry');
  return expiryTime ? parseInt(expiryTime, 10) - Date.now() : 0;
};

/**
 * Get the remaining time for the verification session in milliseconds
 */
export const getVerificationSessionTimeRemaining = (): number => {
  const expiryTime = localStorage.getItem('verificationSessionExpiry');
  if (!expiryTime) return 0;
  
  const expiry = parseInt(expiryTime, 10);
  const remaining = expiry - Date.now();
  
  return Math.max(0, remaining);
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
