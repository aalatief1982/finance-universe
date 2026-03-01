/**
 * @file useAutoSave.ts
 * @description Auto-save hook for form data with debounce and status tracking.
 *
 * @module hooks/useAutoSave
 *
 * @responsibilities
 * 1. Debounce form changes and trigger save callback
 * 2. Track save status and last saved timestamp
 * 3. Surface save errors via toast or custom handler
 *
 * @dependencies
 * - errorMapper.ts: user-friendly error messages
 * - use-toast.ts: UI notifications
 *
 * @review-tags
 * - @risk: MutationObserver usage on form
 * - @side-effects: triggers save callback and toasts
 *
 * @review-checklist
 * - [ ] Debounce respects enabled flag
 * - [ ] Timeout cleared on rapid changes
 * - [ ] Error handler fallback uses toast
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { UseFormReturn, FieldValues } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';
import { getFriendlyMessage } from '@/utils/errorMapper';

export interface AutoSaveOptions<T> {
  delay?: number;
  enabled?: boolean;
  onSave?: (data: T) => Promise<void>;
  onError?: (error: Error) => void;
}

export const useAutoSave = <T extends FieldValues>(
  form: UseFormReturn<T>,
  options: AutoSaveOptions<T> = {}
) => {
  const {
    delay = 2000,
    enabled = true,
    onSave,
    onError
  } = options;

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  const debouncedSave = useCallback(async (data: T) => {
    if (!onSave || !enabled) return;

    setSaveStatus('saving');

    try {
      await onSave(data);
      setSaveStatus('saved');
      setLastSaved(new Date());
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      const errorMessage = getFriendlyMessage(error);

      if (onError) {
        onError(error as Error);
      } else {
        toast({
          title: 'Auto-save failed',
          description: errorMessage,
          variant: 'destructive'
        });
      }

      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [enabled, onError, onSave, toast]);

  useEffect(() => {
    if (!enabled) return;

    const handleChange = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        debouncedSave(form.getValues());
      }, delay);
    };

    const subscription = form.watch(handleChange as unknown as string);

    const observer = new MutationObserver(handleChange);
    const formElement = document.querySelector('form');
    if (formElement) {
      observer.observe(formElement, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
      if (typeof subscription === 'object' && subscription && 'unsubscribe' in subscription) {
        (subscription as { unsubscribe: () => void }).unsubscribe();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [form, delay, enabled, debouncedSave]);

  return {
    saveStatus,
    lastSaved,
    forceSave: () => debouncedSave(form.getValues())
  };
};
