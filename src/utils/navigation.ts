import { NavigateFunction } from 'react-router-dom';
import { safeStorage } from '@/utils/safe-storage';

const ONBOARDING_DONE_KEY = 'xpensia_onb_done';
const PREVIOUS_PATH_KEY = 'xpensia_prev_path';
const CURRENT_PATH_KEY = 'xpensia_current_path';

export const isOnboardingCompleted = (): boolean => {
  return safeStorage.getItem(ONBOARDING_DONE_KEY) === 'true';
};

export const trackNavigationPath = (pathname: string): void => {
  if (typeof window === 'undefined') return;

  const currentPath = safeStorage.getItem(CURRENT_PATH_KEY);
  if (currentPath) {
    safeStorage.setItem(PREVIOUS_PATH_KEY, currentPath);
  }

  safeStorage.setItem(CURRENT_PATH_KEY, pathname);
};

export const navigateBackSafely = (navigate: NavigateFunction, fallbackPath = '/home'): void => {
  const previousPath = safeStorage.getItem(PREVIOUS_PATH_KEY);
  if (isOnboardingCompleted() && previousPath === '/onboarding') {
    navigate(fallbackPath, { replace: true });
    return;
  }

  navigate(-1);
};

