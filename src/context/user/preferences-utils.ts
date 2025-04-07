
import { User, UserPreferences } from './types';
import { setTheme } from './theme-utils';

/**
 * Updates user preferences and applies relevant changes
 */
export const updateUserPreferences = (
  user: User, 
  preferences: Partial<UserPreferences>
): User => {
  // Create updated user object
  const updatedUser = {
    ...user,
    preferences: {
      ...user.preferences,
      ...preferences
    }
  };
  
  // Apply theme change if present
  if (preferences.theme && preferences.theme !== user.preferences?.theme) {
    setTheme(preferences.theme);
  }
  
  // Store updated user in localStorage
  localStorage.setItem('user', JSON.stringify(updatedUser));
  
  return updatedUser;
};

/**
 * Gets the user's effective currency
 */
export const getEffectiveCurrency = (user: User | null): string => {
  if (user?.preferences?.currency) {
    return user.preferences.currency;
  }
  
  // Default currency from localStorage or fallback
  return localStorage.getItem('currency') || 'USD';
};

/**
 * Sets the user's preferred currency
 */
export const setPreferredCurrency = (currency: string): void => {
  localStorage.setItem('currency', currency);
};

/**
 * Gets the user's preferred language
 */
export const getPreferredLanguage = (user: User | null): string => {
  if (user?.preferences?.language) {
    return user.preferences.language;
  }
  
  // Default language from localStorage or fallback
  return localStorage.getItem('language') || 'en';
};

/**
 * Sets the user's preferred language
 */
export const setPreferredLanguage = (language: string): void => {
  localStorage.setItem('language', language);
};
