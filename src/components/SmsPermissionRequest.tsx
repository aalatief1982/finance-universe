
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, MessageSquare, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { smsPermissionService } from '@/services/SmsPermissionService';

interface SmsPermissionRequestProps {
  onGranted: () => void;
  onDenied: () => void;
}

const SmsPermissionRequest: React.FC<SmsPermissionRequestProps> = ({ 
  onGranted, 
  onDenied 
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const { toast } = useToast();

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    
    try {
      // In a real mobile app, this would use Capacitor or other APIs
      const granted = await smsPermissionService.requestPermission();
      
      if (granted) {
        toast({
          title: "Permission granted",
          description: "You've successfully granted SMS reading permission",
        });
        onGranted();
      } else {
        toast({
          title: "Permission denied",
          description: "SMS reading permission is required for automatic tracking",
          variant: "destructive",
        });
        onDenied();
      }
    } catch (error) {
      toast({
        title: "Error requesting permission",
        description: "There was a problem requesting SMS permission",
        variant: "destructive",
      });
      onDenied();
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 text-center"
    >
      <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center">
        <MessageSquare className="text-primary h-10 w-10" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-2">SMS Permission Required</h2>
        <p className="text-muted-foreground">
          To automatically track your expenses, we need permission to read SMS messages from your financial institutions.
        </p>
      </div>
      
      <div className="flex items-start bg-secondary p-4 rounded-lg text-left">
        <AlertTriangle className="text-amber-500 mr-3 mt-1 shrink-0" size={20} />
        <div className="space-y-1">
          <p className="font-medium">Privacy Focused</p>
          <p className="text-sm text-muted-foreground">
            We only read messages from the financial institutions you select. Your personal messages remain private.
          </p>
        </div>
      </div>
      
      <div className="flex items-start bg-secondary p-4 rounded-lg text-left">
        <Shield className="text-green-500 mr-3 mt-1 shrink-0" size={20} />
        <div className="space-y-1">
          <p className="font-medium">Data Security</p>
          <p className="text-sm text-muted-foreground">
            Your financial data is stored securely on your device and never shared without your permission.
          </p>
        </div>
      </div>
      
      <div className="pt-2">
        <Button 
          className="w-full mb-2" 
          onClick={handleRequestPermission}
          disabled={isRequesting}
        >
          {isRequesting ? "Requesting Permission..." : "Grant SMS Permission"}
        </Button>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={onDenied}
        >
          Skip (Manual Entry Only)
        </Button>
      </div>
    </motion.div>
  );
};

export default SmsPermissionRequest;
