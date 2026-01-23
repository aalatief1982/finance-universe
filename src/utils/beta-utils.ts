
import { toast } from '@/hooks/use-toast';
import { BETA_DEFAULT } from '@/lib/env';

const VALID_BETA_CODES = ['0599572215', '123456'];
const BETA_STORAGE_KEY = 'betaFeaturesActive';

export const isBetaActive = (): boolean => {
  const stored = localStorage.getItem(BETA_STORAGE_KEY);
  if (stored === 'false') return false;
  if (stored === 'true') return true;
  return BETA_DEFAULT;
};

export const validateBetaCode = (code: string): boolean => {
  return VALID_BETA_CODES.includes(code);
};

export const activateBetaFeatures = (): void => {
  localStorage.setItem(BETA_STORAGE_KEY, 'true');
};

export const deactivateBetaFeatures = (): void => {
  localStorage.setItem(BETA_STORAGE_KEY, 'false');
};

export const handleLockedFeatureClick = (featureName: string): void => {
  toast({
    title: `🚧 ${featureName} Coming Soon!`,
    description: "This feature is currently under development. Stay tuned for exciting updates!",
  });
};

export const handleBetaCodeSubmit = (
  betaCode: string,
  onSuccess: () => void,
  onError: () => void
): void => {
  if (validateBetaCode(betaCode)) {
    activateBetaFeatures();
    onSuccess();
    toast({
      title: "🎉 Beta Features Activated!",
      description: "You now have access to all beta features including Budget and Import SMS.",
    });
  } else {
    onError();
    toast({
      title: "❌ Invalid Beta Code",
      description: "Please enter a valid beta code to activate premium features.",
      variant: "destructive",
    });
  }
};
