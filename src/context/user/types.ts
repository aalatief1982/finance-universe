
import { AppError } from '@/types/error';

export type ThemeOption = 'light' | 'dark' | 'system';
export type CurrencyOption = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';

export interface UserPreferences {
  theme?: ThemeOption;
  currency?: CurrencyOption;
  notifications?: boolean;
  language?: string;
  // Add missing properties
  displayOptions?: {
    showCents?: boolean;
    weekStartsOn?: 'sunday' | 'monday';
    defaultView?: 'list' | 'stats' | 'calendar';
    compactMode?: boolean;
    showCategories?: boolean;
    showTags?: boolean;
  };
  privacy?: {
    maskAmounts?: boolean;
    requireAuthForSensitiveActions?: boolean;
    dataSharing?: 'none' | 'anonymous' | 'full';
  };
  dataManagement?: {
    autoBackup?: boolean;
    backupFrequency?: 'daily' | 'weekly' | 'monthly';
    dataRetention?: '3months' | '6months' | '1year' | 'forever';
  };
}

export interface User {
  id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  completedOnboarding?: boolean;
  smsPermissionGranted?: boolean;
  smsProviders?: string[];
  preferences?: UserPreferences;
  createdAt?: Date;
  updatedAt?: Date;
  gender?: 'male' | 'female' | null;
  birthDate?: Date | null;
  occupation?: string;
  // Add missing property
  phoneVerified?: boolean;
}

export interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  isVerifying: boolean;
  error: AppError | null;
  // Add missing properties
  isDemoMode?: boolean;
  verificationAttemptsRemaining?: number;
}

export interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
}

export interface UserContextValue {
  user: User | null;
  auth: AuthState;
  login: (phone: string) => Promise<boolean>;
  verify: (phone: string, code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  checkProfileCompletion: () => ProfileCompletionStatus;
  // Add missing methods
  startPhoneVerification?: (phone: string) => Promise<boolean>;
  confirmPhoneVerification?: (code: string) => Promise<boolean>;
  isLoading?: boolean;
  updateTheme?: (theme: ThemeOption) => void;
  updateCurrency?: (currency: CurrencyOption) => void;
  updateLanguage?: (language: string) => void;
  updateNotificationSettings?: (enabled: boolean) => void;
  updateDisplayOptions?: (options: UserPreferences['displayOptions']) => void;
  updatePrivacySettings?: (settings: UserPreferences['privacy']) => void;
  updateDataManagement?: (settings: UserPreferences['dataManagement']) => void;
  getEffectiveTheme?: () => 'light' | 'dark';
  logIn?: () => void;
  logOut?: () => Promise<void>;
}
