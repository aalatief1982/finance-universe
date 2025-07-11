import { useEffect, useRef, useState, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useToast } from '@/components/ui/use-toast';
import { getFriendlyMessage } from '@/utils/errorMapper';

interface UseAutoSaveOptions {
  delay?: number;
  enabled?: boolean;
  onSave?: (data: any) => Promise<void>;
  onError?: (error: Error) => void;
}

export const useAutoSave = (
  form: UseFormReturn<any>,
  options: UseAutoSaveOptions = {}
) => {
  const {
    delay = 2000,
    enabled = true,
    onSave,
    onError
  } = options;

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  const debouncedSave = useCallback(async (data: any) => {
    if (!onSave || !enabled) return;

    setSaveStatus('saving');
    
    try {
      await onSave(data);
      setSaveStatus('saved');
      setLastSaved(new Date());
      
      // Reset to idle after showing success state
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      const errorMessage = getFriendlyMessage(error);
      
      if (onError) {
        onError(error as Error);
      } else {
        toast({
          title: "Auto-save failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
      
      // Reset to idle after showing error state
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [onSave, enabled, onError, toast]);

  useEffect(() => {
    if (!enabled) return;

    const subscription = form.watch();
    
    const handleChange = () => {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        debouncedSave(form.getValues());
      }, delay);
    };

    // Listen to form changes
    const observer = new MutationObserver(handleChange);
    const formElement = document.querySelector('form');
    if (formElement) {
      observer.observe(formElement, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
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
