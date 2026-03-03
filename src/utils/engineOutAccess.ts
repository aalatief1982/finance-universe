import type { InferenceDTO } from '@/types/inference';

interface EngineOutState {
  source: 'smart_entry' | 'notification_review';
  inferenceDTO?: InferenceDTO;
  continueState?: InferenceDTO & Record<string, unknown>;
}

export const canAccessEngineOut = (
  adminEnabled: boolean,
  state: EngineOutState | null | undefined,
): boolean => Boolean(adminEnabled && state?.inferenceDTO && state?.continueState);
