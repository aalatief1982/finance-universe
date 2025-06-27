
export interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  phoneVerified?: boolean;
  gender?: string | null;
  birthDate?: Date | null;
  hasProfile?: boolean;
  smsProviders?: string[];
  completedOnboarding?: boolean;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  currency: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    enabled: boolean;
    types: string[];
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    quietHours?: {
      enabled?: boolean;
      start?: string;
      end?: string;
    }
  };
  displayOptions: {
    showCents: boolean;
    weekStartsOn: 'sunday' | 'monday';
    defaultView: 'list' | 'stats' | 'calendar';
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
  sms?: {
    autoImport?: boolean;
  };
  updatedAt?: string;
}
