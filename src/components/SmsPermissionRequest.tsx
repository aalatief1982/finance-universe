
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { MessageSquare, Check, AlertTriangle } from 'lucide-react';
import { smsPermissionService } from '@/services/SmsPermissionService';

interface SmsPermissionRequestProps {
  onPermissionGranted?: () => void;
  className?: string;
}

const SmsPermissionRequest: React.FC<SmsPermissionRequestProps> = ({ 
  onPermissionGranted,
  className 
}) => {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const hasPermission = await smsPermissionService.hasPermission();
        setPermissionGranted(hasPermission);
        
        if (hasPermission && onPermissionGranted) {
          onPermissionGranted();
        }
      } catch (err) {
        console.error('[SMS] Error checking permissions:', err);
        setError('Failed to check SMS permission status. Please try again.');
      }
    };
    
    checkPermission();
  }, [onPermissionGranted]);

  const handleRequestPermission = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const granted = await smsPermissionService.requestPermission();
      setPermissionGranted(granted);
      
      if (granted && onPermissionGranted) {
        onPermissionGranted();
      } else if (!granted) {
        setError('Permission was denied. SMS features will not work without permission.');
      }
    } catch (error) {
      console.error('Error requesting SMS permission:', error);
      setError('Failed to request permission. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If not in a native environment, show a web fallback message
  if (!smsPermissionService.isNativeEnvironment()) {
    return (
      <div className={`bg-yellow-50 border border-yellow-100 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-yellow-500 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-medium">SMS Reading Not Available</h3>
            <p className="text-sm text-muted-foreground">
              This feature is only available on mobile devices. SMS reading is simulated in this web environment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (permissionGranted) {
    return (
      <div className={`bg-green-50 border border-green-100 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <Check className="text-green-600 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-medium">SMS Permission Granted</h3>
            <p className="text-sm text-muted-foreground">
              You've successfully granted permission for SMS reading. The app can now read your transaction SMS messages.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-medium">SMS Permission Required</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          To automatically track your transactions, we need permission to read SMS messages.
        </p>
        
        {error && (
          <div className="mb-4 text-sm p-2 bg-red-50 text-red-600 rounded-md w-full">
            <AlertTriangle className="inline-block mr-1 h-4 w-4" />
            {error}
          </div>
        )}
        
        <Button 
          onClick={handleRequestPermission} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Requesting..." : "Grant SMS Permission"}
        </Button>
      </div>
    </div>
  );
};

export default SmsPermissionRequest;
