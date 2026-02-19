import { safeStorage } from '@/utils/safe-storage';
import { smsProviderSelectionService } from '@/services/SmsProviderSelectionService';

export type OnboardingState = 'not_completed' | 'first_run_post_onboarding' | 'subsequent_run';
export type SmsPermissionState = 'granted' | 'not_granted';
export type ProviderSelectionState = 'configured' | 'missing' | 'invalid' | 'empty';

export type SmsFlowStep = 'route_sender_discovery' | 'continue_existing_flow' | 'wait_for_permission_or_onboarding';

export interface SmsFlowInput {
  onboardingState: OnboardingState;
  permissionState: SmsPermissionState;
  providerSelectionState: ProviderSelectionState;
  autoImportEnabled: boolean;
  smsSenderFirstFlowV2Enabled?: boolean;
  rollbackToLegacyRoutingOnce?: boolean;
}

export interface SmsFlowDecision {
  nextStep: SmsFlowStep;
  route?: '/process-sms';
  shouldTriggerAutoImport: boolean;
}

const SMS_PROVIDERS_STORAGE_KEY = 'sms_providers';

const isNonEmptyStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.some((entry) => typeof entry === 'string' && entry.trim().length > 0);

const hasSelectedProviderObjects = (value: unknown): boolean => {
  if (!Array.isArray(value)) return false;

  return value.some(
    (entry) =>
      typeof entry === 'object' &&
      entry !== null &&
      'isSelected' in entry &&
      Boolean((entry as { isSelected?: unknown }).isSelected)
  );
};

/**
 * Resolves provider-selection state from user data and persisted storage.
 */
export const resolveProviderSelectionState = (userSmsProviders?: string[]): ProviderSelectionState => {
  if (isNonEmptyStringArray(userSmsProviders)) {
    return 'configured';
  }

  const storedProviders = safeStorage.getItem(SMS_PROVIDERS_STORAGE_KEY);
  if (!storedProviders) {
    return 'missing';
  }

  try {
    const parsedProviders = JSON.parse(storedProviders);

    if (!Array.isArray(parsedProviders)) {
      return 'invalid';
    }

    if (parsedProviders.length === 0) {
      return 'empty';
    }

    if (smsProviderSelectionService.hasConfiguredProviders()) {
      return 'configured';
    }

    if (isNonEmptyStringArray(parsedProviders) || hasSelectedProviderObjects(parsedProviders)) {
      return 'invalid';
    }

    return 'empty';
  } catch {
    return 'invalid';
  }
};

/**
 * Coordinator for startup SMS flow so every app launch follows the same canonical route order:
 * /process-sms -> /vendor-mapping -> /review-sms-transactions.
 */
export const getNextSmsFlowStep = ({
  onboardingState,
  permissionState,
  providerSelectionState,
  autoImportEnabled,
  smsSenderFirstFlowV2Enabled = false,
  rollbackToLegacyRoutingOnce = false,
}: SmsFlowInput): SmsFlowDecision => {
  if (onboardingState === 'not_completed' || permissionState !== 'granted') {
    return {
      nextStep: 'wait_for_permission_or_onboarding',
      shouldTriggerAutoImport: false,
    };
  }

  if (providerSelectionState !== 'configured') {
    if (smsSenderFirstFlowV2Enabled && !rollbackToLegacyRoutingOnce) {
      return {
        nextStep: 'route_sender_discovery',
        route: '/process-sms',
        shouldTriggerAutoImport: false,
      };
    }

    if (
      onboardingState === 'first_run_post_onboarding' &&
      (providerSelectionState === 'missing' || providerSelectionState === 'empty')
    ) {
      return {
        nextStep: 'continue_existing_flow',
        shouldTriggerAutoImport: autoImportEnabled,
      };
    }

    return {
      nextStep: 'route_sender_discovery',
      route: '/process-sms',
      shouldTriggerAutoImport: false,
    };
  }

  return {
    nextStep: 'continue_existing_flow',
    shouldTriggerAutoImport: autoImportEnabled,
  };
};
