import { useState, useEffect, useCallback } from 'react';
import { safeStorage } from '@/utils/safe-storage';

/**
 * Hook for showing a guided tip/tooltip on first visit to a section.
 *
 * @param section Unique identifier for the section or page
 */
export const useGuidedTips = (section: string) => {
  const key = `xpensia_tip_${section}_shown`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = safeStorage.getItem(key);
    if (stored !== 'true') {
      setVisible(true);
    }
  }, [key]);

  const dismiss = useCallback(() => {
    try {
      safeStorage.setItem(key, 'true');
    } catch {
      // ignore storage errors
    }
    setVisible(false);
  }, [key]);

  return { visible, dismiss };
};
