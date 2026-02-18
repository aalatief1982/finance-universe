import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import {
  getNextSmsFlowStep,
  resolveProviderSelectionState,
  type OnboardingState,
  type SmsPermissionState,
} from '@/services/SmsFlowCoordinator';
import { safeStorage } from '@/utils/safe-storage';
import { smsProviderSelectionService } from '@/services/SmsProviderSelectionService';
import { smsPermissionService } from '@/services/SmsPermissionService';

vi.mock('@/services/SmsPermissionService', () => ({
  smsPermissionService: {
    checkPermissionStatus: vi.fn(),
  },
}));

vi.mock('@/services/SmsProviderSelectionService', () => ({
  smsProviderSelectionService: {
    hydrateProvidersFromStableStorage: vi.fn().mockResolvedValue(undefined),
    hasConfiguredProviders: vi.fn(),
  },
}));

type StartupFlowArgs = {
  onboardingDone?: boolean;
  justCompleted?: boolean;
  permissionGranted: boolean;
  userProviders?: string[];
  autoImportEnabled?: boolean;
};

const evaluateStartupFlow = async ({
  onboardingDone = true,
  justCompleted = false,
  permissionGranted,
  userProviders,
  autoImportEnabled = true,
}: StartupFlowArgs) => {
  safeStorage.removeItem('xpensia_onb_done');
  safeStorage.removeItem('xpensia_onb_just_completed');

  if (onboardingDone) {
    safeStorage.setItem('xpensia_onb_done', 'true');
  }

  if (justCompleted) {
    safeStorage.setItem('xpensia_onb_just_completed', 'true');
  }

  await smsProviderSelectionService.hydrateProvidersFromStableStorage();

  (smsPermissionService.checkPermissionStatus as Mock).mockResolvedValue({
    granted: permissionGranted,
  });

  const permissionStatus = await smsPermissionService.checkPermissionStatus();

  const onboardingState: OnboardingState =
    safeStorage.getItem('xpensia_onb_done') === 'true'
      ? safeStorage.getItem('xpensia_onb_just_completed') === 'true'
        ? 'first_run_post_onboarding'
        : 'subsequent_run'
      : 'not_completed';

  const permissionState: SmsPermissionState = permissionStatus.granted
    ? 'granted'
    : 'not_granted';

  const providerSelectionState = resolveProviderSelectionState(userProviders);

  return getNextSmsFlowStep({
    onboardingState,
    permissionState,
    providerSelectionState,
    autoImportEnabled,
  });
};

describe('App startup SMS flow integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    safeStorage.removeItem('xpensia_onb_done');
    safeStorage.removeItem('xpensia_onb_just_completed');
    safeStorage.removeItem('sms_providers');
    safeStorage.removeItem('smsProviders');
    (smsProviderSelectionService.hasConfiguredProviders as Mock).mockReturnValue(false);
  });

  it('routes first run with granted permission and missing providers to provider setup', async () => {
    const decision = await evaluateStartupFlow({
      onboardingDone: true,
      justCompleted: true,
      permissionGranted: true,
    });

    expect(decision.nextStep).toBe('route_sms_providers');
    expect(decision.route).toBe('/sms-providers');
  });

  it('routes subsequent run with cleared providers to provider setup', async () => {
    const decision = await evaluateStartupFlow({
      onboardingDone: true,
      justCompleted: false,
      permissionGranted: true,
    });

    expect(decision.nextStep).toBe('route_sms_providers');
    expect(decision.route).toBe('/sms-providers');
  });

  it('skips provider screen on subsequent run when providers are configured', async () => {
    const decision = await evaluateStartupFlow({
      onboardingDone: true,
      justCompleted: false,
      permissionGranted: true,
      userProviders: ['bank-abc'],
    });

    expect(decision.nextStep).toBe('continue_existing_flow');
    expect(decision.route).toBeUndefined();
    expect(decision.shouldTriggerAutoImport).toBe(true);
  });

  it('forces provider setup when provider storage is corrupted', async () => {
    safeStorage.setItem('sms_providers', '{broken-json');

    const decision = await evaluateStartupFlow({ permissionGranted: true });

    expect(decision.nextStep).toBe('route_sms_providers');
    expect(decision.route).toBe('/sms-providers');
  });

  it('forces provider setup when provider storage is empty', async () => {
    safeStorage.setItem('sms_providers', JSON.stringify([]));

    const decision = await evaluateStartupFlow({ permissionGranted: true });

    expect(decision.nextStep).toBe('route_sms_providers');
    expect(decision.route).toBe('/sms-providers');
  });

  it('waits for permission when denied and does not route to provider screen', async () => {
    safeStorage.setItem('sms_providers', '{broken-json');

    const decision = await evaluateStartupFlow({ permissionGranted: false });

    expect(decision.nextStep).toBe('wait_for_permission_or_onboarding');
    expect(decision.route).toBeUndefined();
    expect(decision.shouldTriggerAutoImport).toBe(false);
  });
});
