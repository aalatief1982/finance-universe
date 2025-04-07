
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, Settings } from 'lucide-react';
import { smsPermissionService } from '@/services/SmsPermissionService';

const MobileSmsButton = () => {
  const canReadSms = smsPermissionService.canReadSms();
  const hasPermission = smsPermissionService.hasPermission();
  const hasProviders = smsPermissionService.hasProvidersSelected();

  // If we have permission but no providers selected
  if (hasPermission && !hasProviders) {
    return (
      <div className="sm:hidden">
        <Button 
          variant="outline" 
          className="w-full gap-1 mb-4"
          asChild
        >
          <Link to="/sms-providers">
            <Settings size={18} />
            Configure SMS Providers
          </Link>
        </Button>
      </div>
    );
  }

  // If we don't have permission, don't show any button
  if (!hasPermission) {
    return null;
  }

  // Default case: everything is set up properly
  return (
    <div className="sm:hidden">
      <Button 
        variant="outline" 
        className="w-full gap-1 mb-4"
        asChild
      >
        <Link to="/process-sms">
          <MessageSquare size={18} />
          Import Transactions from SMS
        </Link>
      </Button>
    </div>
  );
};

export default MobileSmsButton;
