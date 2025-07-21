
import { safeStorage } from "@/utils/safe-storage";

export interface PermissionState {
  sms: {
    requested: boolean;
    granted: boolean;
    requestedAt?: string;
    grantedAt?: string;
  };
  notifications: {
    requested: boolean;
    granted: boolean;
    requestedAt?: string;
    grantedAt?: string;
  };
  onboardingCompleted: boolean;
  skippedPermissions: string[];
}

const PERMISSION_STORAGE_KEY = 'xpensia_permission_state';

const defaultPermissionState: PermissionState = {
  sms: {
    requested: false,
    granted: false,
  },
  notifications: {
    requested: false,
    granted: false,
  },
  onboardingCompleted: false,
  skippedPermissions: [],
};

export const getPermissionState = (): PermissionState => {
  try {
    const stored = safeStorage.getItem(PERMISSION_STORAGE_KEY);
    if (stored) {
      return { ...defaultPermissionState, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('Failed to parse permission state:', error);
  }
  return defaultPermissionState;
};

export const setPermissionState = (state: Partial<PermissionState>) => {
  try {
    const currentState = getPermissionState();
    const newState = { ...currentState, ...state };
    safeStorage.setItem(PERMISSION_STORAGE_KEY, JSON.stringify(newState));
  } catch (error) {
    console.error('Failed to save permission state:', error);
  }
};

export const updatePermissionStatus = (
  type: 'sms' | 'notifications',
  updates: Partial<PermissionState['sms']>
) => {
  const currentState = getPermissionState();
  const newState = {
    ...currentState,
    [type]: {
      ...currentState[type],
      ...updates,
    },
  };
  setPermissionState(newState);
};

export const markOnboardingCompleted = () => {
  setPermissionState({ onboardingCompleted: true });
};

export const addSkippedPermission = (permission: string) => {
  const currentState = getPermissionState();
  const skippedPermissions = [...currentState.skippedPermissions];
  if (!skippedPermissions.includes(permission)) {
    skippedPermissions.push(permission);
  }
  setPermissionState({ skippedPermissions });
};

export const isPermissionOnboardingNeeded = (): boolean => {
  const state = getPermissionState();
  return !state.onboardingCompleted;
};
