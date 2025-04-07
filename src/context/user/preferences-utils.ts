
import { User, UserPreferences, CurrencyOption, ThemeOption } from './types';
import { setTheme } from './theme-utils';

/**
 * Updates user preferences and returns the updated user object
 */
export const updateUserPreferences = (
  user: User,
  updates: Partial<UserPreferences>
): User => {
  // Create a new user object with updated preferences
  const updatedUser = {
    ...user,
    preferences: {
      ...user.preferences,
      ...updates
    },
    updatedAt: new Date()
  };
  
  // Apply theme change if theme was updated
  if (updates.theme && updates.theme !== user.preferences?.theme) {
    setTheme(updates.theme);
  }
  
  return updatedUser;
};

/**
 * Updates the user's theme preference
 */
export const updateTheme = (
  user: User,
  theme: ThemeOption
): User => {
  return updateUserPreferences(user, { theme });
};

/**
 * Updates the user's currency preference
 */
export const updateCurrency = (
  user: User,
  currency: CurrencyOption
): User => {
  return updateUserPreferences(user, { currency });
};

/**
 * Updates the user's language preference
 */
export const updateLanguage = (
  user: User,
  language: string
): User => {
  return updateUserPreferences(user, { language });
};

/**
 * Updates the user's notification settings
 */
export const updateNotificationSettings = (
  user: User,
  notifications: boolean
): User => {
  return updateUserPreferences(user, { notifications });
};

/**
 * Gets the effective theme (with system preference resolved)
 */
export const getEffectiveTheme = (
  preferences?: UserPreferences
): 'light' | 'dark' => {
  const theme = preferences?.theme || 'system';
  
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  return theme;
};
