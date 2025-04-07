
import { User } from '@/context/user/types';
import { ErrorType } from '@/types/error';
import { createError, handleError } from '@/utils/error-utils';
import { ENABLE_DEMO_MODE } from '@/lib/env';

export interface UserPhoneAuthResponse {
  user: User;
  error?: string;
}

/**
 * Creates or fetches a user using phone number
 * In demo mode, this will create a mock user
 */
export const createUserWithPhone = async (phone: string): Promise<UserPhoneAuthResponse> => {
  try {
    // Normalize phone number
    const normalizedPhone = phone.replace(/\s+/g, '');
    
    // For demo purposes, create a mock user
    if (ENABLE_DEMO_MODE) {
      console.log('Demo mode: Creating mock user with phone', normalizedPhone);
      
      // Create a demo user with the provided phone
      const demoUser: User = {
        id: `demo-${Date.now()}`,
        phone: normalizedPhone,
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
      
      // Store in localStorage for demo persistence
      const existingUsers = localStorage.getItem('demoUsers');
      let users = existingUsers ? JSON.parse(existingUsers) : [];
      
      // Check if user with this phone already exists
      const existingUser = users.find((u: User) => u.phone === normalizedPhone);
      if (existingUser) {
        return { user: existingUser };
      }
      
      // Add new user
      users.push(demoUser);
      localStorage.setItem('demoUsers', JSON.stringify(users));
      
      return { user: demoUser };
    }
    
    // In a real implementation, this would make a call to a backend service
    // For now, we'll simulate a successful creation
    const mockUser: User = {
      id: `user-${Date.now()}`,
      phone: normalizedPhone,
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
    handleError(createError(
      ErrorType.AUTH,
      'Failed to create user with phone',
      { phone },
      error
    ));
    
    return { 
      user: { phone },
      error: 'Failed to create user. Please try again.'
    };
  }
};
