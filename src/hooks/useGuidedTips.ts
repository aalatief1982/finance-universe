/**
 * @file useGuidedTips.ts
 * @description Hook for showing one-time guided tips per section.
 *
 * @module hooks/useGuidedTips
 *
 * @responsibilities
 * 1. Track whether a tip has been shown for a section
 * 2. Persist dismissals to storage
 *
 * @dependencies
 * - safe-storage.ts: storage wrapper
 *
 * @review-tags
 * - @risk: storage failures should not block UI
 *
 * @review-checklist
 * - [ ] Defaults to visible when no stored flag
 * - [ ] Dismiss persists flag before hiding
 */

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
