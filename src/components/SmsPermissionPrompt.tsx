import React, { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, Shield, Clock, Sparkles } from 'lucide-react';
import { smsPermissionService } from '@/services/SmsPermissionService';
import { useSmsPermission } from '@/hooks/useSmsPermission';
import { useUser } from '@/context/user/UserContext';
import { safeStorage } from '@/utils/safe-storage';
import { toast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import SmsImportService from '@/services/SmsImportService';
import { logAnalyticsEvent } from '@/utils/firebase-analytics';
import { useNavigate } from 'react-router-dom';
import { LoadingOverlay } from '@/components/ui/loading-overlay';

interface SmsPermissionPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SmsPermissionPrompt: React.FC<SmsPermissionPromptProps> = ({
  open,
  onOpenChange,
}) => {
  const { updateUserPreferences, user } = useUser();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState('');
  const [permanentlyDenied, setPermanentlyDenied] = useState(false);
  const navigate = useNavigate();

  const { refreshPermission } = useSmsPermission();

  useEffect(() => {
    console.log('SmsPermissionPrompt rendered with open:', open);
  }, [open]);

  const openAppSettingsFallback = async () => {
    console.log('[SmsPermissionPrompt] openAppSettingsFallback called');

    // Copy instructions to clipboard as a reliable fallback
    const instructions = 'Open Settings → Apps → Xpensia → Permissions → Allow SMS';
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(instructions);
        console.log('[SmsPermissionPrompt] Instructions copied to clipboard');
        toast({ title: 'Instructions copied', description: 'Open Settings and enable SMS permission for Xpensia.' });
      }
    } catch (e) {
      console.warn('[SmsPermissionPrompt] Failed to copy instructions to clipboard', e);
    }

    // Try a best-effort attempt to open platform settings. This may silently fail on some devices.
    try {
      if (Capacitor.isNativePlatform()) {
        // Try to use any available plugin method if exposed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Plugins = (window as any).Plugins ?? (window as any).CapacitorPlugins ?? null;
        if (Plugins && Plugins.App && typeof Plugins.App.openUrl === 'function') {
          console.log('[SmsPermissionPrompt] Trying Plugins.App.openUrl("app-settings:")');
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          Plugins.App.openUrl({ url: 'app-settings:' });
          return;
        }

        // Fallback: try opening the app-settings URI
        window.open('app-settings:');
        console.log('[SmsPermissionPrompt] window.open(app-settings:) attempted');
      } else {
        // Web fallback: open a help/support page if available or instruct user
        console.log('[SmsPermissionPrompt] Not native; no settings to open. Show toast with instructions');
        toast({ title: 'Open Settings', description: instructions });
      }
    } catch (err) {
      console.warn('[SmsPermissionPrompt] Failed to launch settings via URI', err);
      toast({ title: 'Open Settings', description: instructions });
    }
  };

  const handleEnable = async () => {
    console.log('[SmsPermissionPrompt] handleEnable — start permission request');
    setIsRequesting(true);
    setPermanentlyDenied(false);

    // Add a one-time listener for app resume so we can immediately check permission when app regains focus
    let resumeListener: any | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Plugins = (window as any).Plugins ?? (window as any).CapacitorPlugins ?? null;
      if (Plugins && typeof Plugins.App?.addListener === 'function') {
        resumeListener = Plugins.App.addListener('resume', async () => {
          console.log('[SmsPermissionPrompt] App resumed — checking canonical permission status');
          try {
            const canonicalStatus = await smsPermissionService.checkPermissionStatus();
            console.log('[SmsPermissionPrompt] canonical status on resume:', canonicalStatus);
            if (canonicalStatus.granted) {
              // persist preferences and then import
              try {
                setIsBusy(true);
                setBusyMessage('Importing SMS messages...');
                await updateUserPreferences({
                  sms: {
                    ...user?.preferences?.sms,
                    autoDetectProviders: user?.preferences?.sms?.autoDetectProviders ?? true,
                    showDetectionNotifications: user?.preferences?.sms?.showDetectionNotifications ?? true,
                    autoImport: true,
                    backgroundSmsEnabled: true,
                  }
                });
                safeStorage.setItem('sms_prompt_shown', 'true');
                // refresh permission hook so other components update immediately
                try { refreshPermission(); } catch (e) { /* ignore */ }
                // telemetry
                try { logAnalyticsEvent('sms_permission_granted'); } catch (e) { console.warn('[SmsPermissionPrompt] analytics error', e); }

                // Initialize listener and perform import
                try {
                  console.log('[SmsPermissionPrompt] Initializing SMS listener and triggering initial import...');
                  await smsPermissionService.initSmsListener();
                  // small delay to ensure listener is ready
                  await new Promise((res) => setTimeout(res, 500));
                  await SmsImportService.checkForNewMessages(navigate, { auto: false, usePermissionDate: true });
                  console.log('[SmsPermissionPrompt] Initial SMS import completed');
                } catch (importErr) {
                  console.warn('[SmsPermissionPrompt] Error during initial SMS import:', importErr);
                }

                toast({
                  title: 'SMS Import Enabled! 🎉',
                  description: 'Your transactions will now be imported automatically.'
                });

                onOpenChange(false);
              } finally {
                setIsBusy(false);
                setBusyMessage('');
              }
            } else if (canonicalStatus.permanentlyDenied) {
              setPermanentlyDenied(true);
            }
          } catch (e) {
            console.warn('[SmsPermissionPrompt] Error checking permission on resume', e);
          } finally {
            try {
              resumeListener?.remove?.();
            } catch (e) {
              // ignore
            }
          }
        });
      }
    } catch (e) {
      console.warn('[SmsPermissionPrompt] Failed to register resume listener', e);
      resumeListener = null;
    }

    try {
      const REQUEST_TIMEOUT = 15000; // ms
      const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ timedOut: true }), REQUEST_TIMEOUT));

      // Race the real permission request against a client-side timeout to avoid hanging forever
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (await Promise.race([smsPermissionService.requestPermission(), timeoutPromise])) as any;

      if (result?.timedOut) {
        console.warn('[SmsPermissionPrompt] requestPermission timed out after', REQUEST_TIMEOUT, 'ms');
        toast({
          title: 'Request timed out',
          description: 'Permission dialog did not return. Please try again or enable SMS permission from Settings.',
          variant: 'destructive'
        });
        try { logAnalyticsEvent('sms_permission_request_timed_out'); } catch (e) { /* ignore */ }
        // Keep prompt open so user can retry or open settings
        setIsRequesting(false);
        try { resumeListener?.remove?.(); } catch (e) {}
        return;
      }

      console.log('[SmsPermissionPrompt] requestPermission returned, now checking canonical permission status. rawResult:', result);

      // Always verify canonical permission status from the service (handles native inconsistencies)
      const canonicalStatus = await smsPermissionService.checkPermissionStatus();
      console.log('[SmsPermissionPrompt] canonical permission status after request:', canonicalStatus);

      if (canonicalStatus.granted) {
        console.log('[SmsPermissionPrompt] canonical status: granted — updating preferences');
        updateUserPreferences({
          sms: {
            ...user?.preferences?.sms,
            autoDetectProviders: user?.preferences?.sms?.autoDetectProviders ?? true,
            showDetectionNotifications: user?.preferences?.sms?.showDetectionNotifications ?? true,
            autoImport: true,
            backgroundSmsEnabled: true,
          }
        });

        toast({
          title: 'SMS Import Enabled! 🎉',
          description: 'Your transactions will now be imported automatically.'
        });

        safeStorage.setItem('sms_prompt_shown', 'true');
        console.log('[SmsPermissionPrompt] sms_prompt_shown set to true (canonical granted)');
        // refresh permission hook so UI updates instantly
        try { refreshPermission(); } catch (e) { /* ignore */ }
        try { logAnalyticsEvent('sms_permission_granted'); } catch (e) { console.warn('[SmsPermissionPrompt] analytics error', e); }

        // Initialize listener and trigger initial SMS import with blocking spinner
        try {
          setIsBusy(true);
          setBusyMessage('Importing SMS messages...');
          
          console.log('[SmsPermissionPrompt] Initializing SMS listener and triggering initial import...');
          await smsPermissionService.initSmsListener();
          
          // Small delay to ensure listener is ready
          await new Promise(r => setTimeout(r, 500));
          await SmsImportService.checkForNewMessages(navigate, { 
            auto: false, 
            usePermissionDate: true 
          });
          console.log('[SmsPermissionPrompt] Initial SMS import completed successfully');
        } catch (initErr) {
          console.warn('[SmsPermissionPrompt] Error during SMS import:', initErr);
        } finally {
          setIsBusy(false);
          setBusyMessage('');
        }

        onOpenChange(false);
      } else {
        // Not granted — check if permanently denied
        if (canonicalStatus.permanentlyDenied) {
          console.log('[SmsPermissionPrompt] canonical status: permanentlyDenied — showing fallback UI');
          setPermanentlyDenied(true);
          toast({
            title: 'Permission Required',
            description: 'Enable SMS in Settings → Apps → Xpensia → Permissions',
            variant: 'destructive'
          });
          // do not mark sms_prompt_shown so user can act
        } else {
          console.log('[SmsPermissionPrompt] canonical status: denied (temporary) — marking shown and closing');
          toast({
            title: 'Permission Denied',
            description: 'You can enable SMS auto-import later in Settings.',
          });
          safeStorage.setItem('sms_prompt_shown', 'true');
          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error('[SmsPermissionPrompt] Error requesting SMS permission:', error);
      toast({
        title: 'Something went wrong',
        description: 'Please try enabling SMS import from Settings.',
        variant: 'destructive'
      });
      try { logAnalyticsEvent('sms_permission_request_failed'); } catch (e) { /* ignore */ }
      safeStorage.setItem('sms_prompt_shown', 'true');
      console.log('[SmsPermissionPrompt] sms_prompt_shown set to true (error)');
      onOpenChange(false);
    } finally {
      setIsRequesting(false);
      setIsBusy(false);
      setBusyMessage('');
      try { resumeListener?.remove?.(); } catch (e) {}
    }
  };

  const handleLater = () => {
    console.log('[SmsPermissionPrompt] User selected Maybe Later for SMS permission.');
    toast({
      title: 'No problem!',
      description: 'Enable SMS auto-import anytime in Profile → Settings → SMS Settings'
    });
    safeStorage.setItem('sms_prompt_shown', 'true');
    onOpenChange(false);
  };

  const handleDismissAfterPermanent = () => {
    console.log('[SmsPermissionPrompt] Dismissing dialog after permanent denial — marking prompt shown');
    safeStorage.setItem('sms_prompt_shown', 'true');
    setPermanentlyDenied(false);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[340px] rounded-2xl">
        <AlertDialogHeader className="space-y-4">
          {/* Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>

          <AlertDialogTitle className="text-center text-xl">
            Never Miss a Transaction
          </AlertDialogTitle>

          <AlertDialogDescription className="sr-only">
            Enable SMS auto-import to automatically capture your transactions
          </AlertDialogDescription>

          <div className="space-y-4">
            <p className="text-center text-muted-foreground">
              Xpensia can automatically read your bank SMS and import transactions for you.
            </p>

            {/* Benefits */}
            <div className="space-y-3 rounded-lg bg-muted/50 p-3">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span className="text-sm text-foreground">
                  Save time — no manual entry needed
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span className="text-sm text-foreground">
                  Capture every expense instantly
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span className="text-sm text-foreground">
                  Smart categorization included
                </span>
              </div>
            </div>

            {/* Privacy assurance */}
            <div className="flex items-start gap-2 rounded-lg border border-border/50 bg-background p-3">
              <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Your Privacy Matters:</span>{' '}
                All processing happens on your device. We only read financial messages and never access personal conversations.
              </p>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          {!permanentlyDenied ? (
            <>
              <Button 
                onClick={handleEnable} 
                className="w-full"
                disabled={isRequesting}
              >
                {isRequesting ? 'Requesting...' : 'Enable SMS Import'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLater}
                className="w-full"
                disabled={isRequesting}
              >
                Maybe Later
              </Button>
            </>
          ) : (
            <>
              <Button onClick={openAppSettingsFallback} className="w-full">
                Open Settings
              </Button>
              <Button variant="outline" onClick={handleDismissAfterPermanent} className="w-full">
                Done
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
      {/* Use shared LoadingOverlay for both requesting and importing */}
      <LoadingOverlay isOpen={isRequesting || isBusy} message={isRequesting ? 'Completing permission flow…' : busyMessage} />
    </AlertDialog>
  );
};

export default SmsPermissionPrompt;
