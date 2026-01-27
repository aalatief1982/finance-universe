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
import { useUser } from '@/context/user/UserContext';
import { safeStorage } from '@/utils/safe-storage';
import { toast } from '@/hooks/use-toast';

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

  useEffect(() => {
    console.log('SmsPermissionPrompt rendered with open:', open);
  }, [open]);

  const handleEnable = async () => {
    setIsRequesting(true);
    try {
      const result = await smsPermissionService.requestPermission();
      
      if (result.granted) {
        // Set both preferences
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
          title: "SMS Import Enabled! 🎉",
          description: "Your transactions will now be imported automatically."
        });
        
        safeStorage.setItem('sms_prompt_shown', 'true');
        onOpenChange(false);
      } else {
        if (result.permanentlyDenied) {
          toast({
            title: "Permission Required",
            description: "Enable SMS in Settings > Apps > Xpensia > Permissions",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Permission Denied",
            description: "You can enable SMS auto-import later in Settings.",
          });
        }
        safeStorage.setItem('sms_prompt_shown', 'true');
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error requesting SMS permission:', error);
      toast({
        title: "Something went wrong",
        description: "Please try enabling SMS import from Settings.",
        variant: "destructive"
      });
      safeStorage.setItem('sms_prompt_shown', 'true');
      onOpenChange(false);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleLater = () => {
    console.log('User selected Maybe Later for SMS permission.');
    toast({
      title: "No problem!",
      description: "Enable SMS auto-import anytime in Profile → Settings → SMS Settings"
    });
    safeStorage.setItem('sms_prompt_shown', 'true');
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
          <Button 
            onClick={handleEnable} 
            className="w-full"
            disabled={isRequesting}
          >
            {isRequesting ? "Requesting..." : "Enable SMS Import"}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleLater}
            className="w-full"
            disabled={isRequesting}
          >
            Maybe Later
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SmsPermissionPrompt;
