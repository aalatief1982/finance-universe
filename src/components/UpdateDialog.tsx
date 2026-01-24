import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, RefreshCw as RefreshCwIcon, ExternalLink, Sparkles, Check } from 'lucide-react';
import { UpdateManifest, DownloadProgress, appUpdateService } from '@/services/AppUpdateService';
import { Capacitor } from '@capacitor/core';

interface UpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentVersion: string;
  manifest: UpdateManifest;
  requiresStoreUpdate?: boolean;
}

type UpdatePhase = 'prompt' | 'downloading' | 'extracting' | 'success' | 'error';

export const UpdateDialog: React.FC<UpdateDialogProps> = ({
  open,
  onOpenChange,
  currentVersion,
  manifest,
  requiresStoreUpdate = false
}) => {
  const [phase, setPhase] = useState<UpdatePhase>('prompt');
  const [progress, setProgress] = useState<DownloadProgress>({ loaded: 0, total: 0, percent: 0 });
  const [errorMessage, setErrorMessage] = useState('');

  const handleUpdate = async () => {
    if (requiresStoreUpdate) {
      // Open app store
      const platform = Capacitor.getPlatform();
      const storeUrl = platform === 'ios' 
        ? 'https://apps.apple.com/app/xpensia/id000000000' // Replace with actual App Store ID
        : 'https://play.google.com/store/apps/details?id=app.xpensia.com';
      
      window.open(storeUrl, '_blank');
      return;
    }

    setPhase('downloading');
    setProgress({ loaded: 0, total: 0, percent: 0 });

    // Download only - do not apply immediately (deferred to next launch)
    const bundle = await appUpdateService.downloadUpdate(
      manifest,
      (prog) => {
        setProgress(prog);
        // Switch to extracting phase when download completes
        if (prog.percent >= 100 && phase === 'downloading') {
          setPhase('extracting');
        }
      }
    );

    if (bundle) {
      setPhase('success');
      // User continues using app - update applies on next launch
    } else {
      setPhase('error');
      setErrorMessage('Failed to download update. Please try again.');
    }
  };

  const handleClose = () => {
    if (phase === 'downloading' || phase === 'extracting') {
      return; // Don't allow closing during update
    }
    setPhase('prompt');
    onOpenChange(false);
  };

  const renderContent = () => {
    switch (phase) {
      case 'downloading':
        return (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 animate-bounce text-primary" />
              <span className="text-sm text-muted-foreground">
                Downloading update...
              </span>
            </div>
            <Progress value={progress.percent} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {progress.percent}% complete
            </p>
          </div>
        );

      case 'extracting':
        return (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <RefreshCwIcon className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Installing update...
              </span>
            </div>
            <Progress value={progress.percent} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Extracting files...
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">Update ready!</p>
              <p className="text-sm text-muted-foreground mt-1">
                The update will apply the next time you open the app.
              </p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-4 py-4 text-center">
            <p className="text-destructive text-sm">{errorMessage}</p>
            {errorMessage.toLowerCase().includes('webview') && (
              <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                <p>Try: Settings → Apps → Android System WebView → Uninstall updates</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current version:</span>
              <span className="font-mono">{currentVersion}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">New version:</span>
              <span className="font-mono text-primary">{manifest.version}</span>
            </div>
            
            {manifest.releaseNotes && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-medium mb-1">What's new:</p>
                <p className="text-xs text-muted-foreground">
                  {manifest.releaseNotes}
                </p>
              </div>
            )}

            {requiresStoreUpdate && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-xs text-destructive">
                  This update requires a new version from the app store.
                </p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        // Only react to close requests; never force-close on open.
        if (!nextOpen) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {phase === 'success' ? 'Update Complete' : 'Update Available'}
          </DialogTitle>
          <DialogDescription>
            {phase === 'prompt' && (
              manifest.mandatory 
                ? 'A required update is available. Please update to continue.'
                : 'A new version of Xpensia is available.'
            )}
          </DialogDescription>
        </DialogHeader>

        {renderContent()}

        <DialogFooter className="gap-2 sm:gap-0">
          {phase === 'prompt' && (
            <>
              {!manifest.mandatory && (
                <Button variant="ghost" onClick={handleClose}>
                  Later
                </Button>
              )}
              <Button onClick={handleUpdate}>
                {requiresStoreUpdate ? (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Store
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Update Now
                  </>
                )}
              </Button>
            </>
          )}

          {phase === 'success' && (
            <Button onClick={handleClose} className="w-full">
              <Check className="h-4 w-4 mr-2" />
              Got it
            </Button>
          )}

          {phase === 'error' && (
            <>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>
                Try Again
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
