
import { User as UserType } from '@/types/user';

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
  registrationStarted?: boolean;
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

export interface UserContextType {
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
  checkUserExists: (phoneNumber: string) => Promise<boolean>;
}
