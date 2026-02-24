import { createContext } from 'react';
import type { UserContextType } from './types';

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
