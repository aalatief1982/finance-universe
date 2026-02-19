import { describe, expect, it, beforeEach } from 'vitest';
import { getNextSmsFlowStep, resolveProviderSelectionState } from '@/services/SmsFlowCoordinator';
import { safeStorage } from '@/utils/safe-storage';

describe('SmsFlowCoordinator', () => {
  beforeEach(() => {
    safeStorage.removeItem('sms_providers');
    safeStorage.removeItem('smsProviders');
    safeStorage.removeItem('xpensia_sms_sender_import_map');
  });

  it('continues first run with granted permission and no providers to sender scan flow', () => {
    const decision = getNextSmsFlowStep({
      onboardingState: 'first_run_post_onboarding',
      permissionState: 'granted',
      providerSelectionState: 'missing',
      autoImportEnabled: true,
    });

    expect(decision.nextStep).toBe('continue_existing_flow');
    expect(decision.route).toBeUndefined();
    expect(decision.shouldTriggerAutoImport).toBe(true);
  });

  it('routes subsequent runs when provider config is invalid', () => {
    const decision = getNextSmsFlowStep({
      onboardingState: 'subsequent_run',
      permissionState: 'granted',
      providerSelectionState: 'invalid',
      autoImportEnabled: true,
    });

    expect(decision.nextStep).toBe('route_sender_discovery');
    expect(decision.shouldTriggerAutoImport).toBe(false);
  });

  it('continues flow when providers are configured and permission granted', () => {
    const decision = getNextSmsFlowStep({
      onboardingState: 'subsequent_run',
      permissionState: 'granted',
      providerSelectionState: 'configured',
      autoImportEnabled: true,
    });

    expect(decision.nextStep).toBe('continue_existing_flow');
    expect(decision.shouldTriggerAutoImport).toBe(true);
  });

  it('treats malformed provider storage as invalid', () => {
    safeStorage.setItem('sms_providers', '{broken-json');

    expect(resolveProviderSelectionState()).toBe('invalid');
  });


  it('treats provider payload with no selected providers as empty', () => {
    safeStorage.setItem(
      'sms_providers',
      JSON.stringify([
        { id: 'provider-1', name: 'Provider 1', pattern: 'test', isSelected: false },
      ])
    );

    expect(resolveProviderSelectionState()).toBe('empty');
  });

  it('treats legacy provider key as invalid to force migration', () => {
    safeStorage.setItem(
      'sms_providers',
      JSON.stringify([
        { id: 'provider-1', name: 'Provider 1', pattern: 'test', isSelected: true },
      ])
    );
    safeStorage.setItem('smsProviders', JSON.stringify([{ id: 'legacy', name: 'Legacy' }]));

    expect(resolveProviderSelectionState()).toBe('invalid');
  });

  it('treats selected provider objects as configured', () => {
    safeStorage.setItem(
      'sms_providers',
      JSON.stringify([
        { id: 'provider-1', name: 'Provider 1', pattern: 'test', isSelected: false },
        { id: 'provider-2', name: 'Provider 2', pattern: 'test', isSelected: true },
      ])
    );

    expect(resolveProviderSelectionState()).toBe('configured');
  });
});
