export interface User {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  phoneVerified?: boolean;
  gender?: 'male' | 'female' | null;
  birthDate?: Date | null;
  avatar?: string;
  occupation?: string;
  hasProfile?: boolean;
  smsProviders?: string[];
  detectedSmsProviders?: string[]; // New field for auto-detected providers
  smsProviderDetectionRun?: boolean; // New field to track if detection has run
  completedOnboarding?: boolean;
  createdAt?: Date;
  lastActive?: Date;
  smsPermissionGranted?: boolean;
  settings?: {
    currency?: string;
    language?: string;
    theme: 'light' | 'dark' | 'system';
    notifications?: boolean;
  };
}

export interface UserPreferences {
  currency: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    enabled: boolean;
    types?: Array<'sms' | 'budget' | 'insights' | 'security'>;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
  };
  displayOptions: {
    showCents: boolean;
    weekStartsOn: 'sunday' | 'monday' | 'saturday';
    defaultView: 'list' | 'stats' | 'calendar';
    compactMode: boolean;
    showCategories: boolean;
    showTags: boolean;
    dateFormat?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    timeFormat?: '12h' | '24h';
  };
  privacy: {
    maskAmounts: boolean;
    requireAuthForSensitiveActions: boolean;
    dataSharing: 'none' | 'anonymous' | 'minimal' | 'full';
    lockScreenTimeout?: number; // in minutes
    biometricAuth?: boolean;
  };
  dataManagement: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
    dataRetention: '3months' | '6months' | '1year' | 'forever';
    exportFormat?: 'json' | 'csv' | 'pdf';
    cloudSync?: boolean;
  };
  sms?: { // New section for SMS-specific preferences
    startDate?: string;
    autoDetectProviders: boolean;
    showDetectionNotifications: boolean;
    autoImport?: boolean;
    backgroundSmsEnabled?: boolean;
  };
  categories?: {
    showUncategorized: boolean;
    defaultCategorySort: 'alphabetical' | 'custom' | 'most-used';
    expandSubcategories: boolean;
  };
  budgets?: {
    warningThreshold: number; // percentage
    criticalThreshold: number; // percentage
    rolloverUnspent: boolean;
    startDay?: number; // day of month for monthly budgets
  };
}

export type ProfileSection = 'personal' | 'preferences' | 'security' | 'notifications' | 'data' | 'categories' | 'budgets';

export interface ProfileMenuItem {
  title: string;
  description: string;
  icon: React.ComponentType;
  link: string;
  status?: string;
  statusColor?: string;
  section: ProfileSection;
}

export interface ProfileData {
  image?: string | null;
  fullName: string;
  gender: 'male' | 'female' | null;
  birthDate: Date | null;
  email?: string;
  occupation?: string;
  createdAt?: Date;
}

export interface UserThemePreference {
  theme: 'light' | 'dark' | 'system';
  accentColor?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'default';
  fontSize?: 'small' | 'medium' | 'large';
  reducedMotion?: boolean;
  highContrast?: boolean;
}

export interface UserCurrencyPreference {
  code: string;
  symbol: string;
  symbolPosition: 'before' | 'after';
  decimalSeparator: '.' | ',';
  thousandsSeparator: ',' | '.' | ' ' | '';
  decimalPlaces: number;
}

export interface UserNotificationSetting {
  type: 'sms' | 'budget' | 'insights' | 'security';
  enabled: boolean;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };
  frequency?: 'immediate' | 'daily' | 'weekly';
}

export interface UserSecuritySettings {
  requireAuthForSensitiveActions: boolean;
  twoFactorAuth: boolean;
  biometricAuth?: boolean;
  lockScreenTimeout: number; // in minutes
  lastPasswordChange?: Date;
  sessionTimeout?: number; // in minutes
}

export interface UserDataExportOptions {
  format: 'json' | 'csv' | 'pdf';
  includeTransactions: boolean;
  includeCategories: boolean;
  includeBudgets: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface PrivacySetting {
  key: string;
  label: string;
  description: string;
  value: boolean | string;
  options?: Array<{
    label: string;
    value: string;
  }>;
}

export interface DisplaySetting {
  key: string;
  label: string;
  description: string;
  value: boolean | string | number;
  type: 'toggle' | 'select' | 'radio';
  options?: Array<{
    label: string;
    value: string | number;
  }>;
}

export interface SmsProvider { // New interface for detailed SMS provider info
  id: string;
  name: string;
  pattern: string;
  isSelected: boolean;
  isDetected: boolean;
  lastDetected?: Date;
}
