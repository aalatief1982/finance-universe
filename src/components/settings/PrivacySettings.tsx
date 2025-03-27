// PrivacySettings.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Lock, UserX } from 'lucide-react';
import { getUserSettings, storeUserSettings } from '@/utils/storage-utils';

const PrivacySettings = () => {
  const [maskAmounts, setMaskAmounts] = useState(false);
  const [requireAuth, setRequireAuth] = useState(true);
  const [dataSharing, setDataSharing] = useState<string>('none');
  
  useEffect(() => {
    // Get user settings on component mount
    const userSettings = getUserSettings();
    setMaskAmounts(userSettings.privacy?.maskAmounts === true);
    setRequireAuth(userSettings.privacy?.requireAuthForSensitiveActions !== false);
    setDataSharing(userSettings.privacy?.dataSharing || 'none');
  }, []);
  
  const handleMaskAmountsToggle = (enabled: boolean) => {
    setMaskAmounts(enabled);
    
    // Update user settings
    const userSettings = getUserSettings();
    storeUserSettings({
      ...userSettings,
      privacy: {
        ...userSettings.privacy,
        maskAmounts: enabled
      }
    });
  };
  
  const handleRequireAuthToggle = (enabled: boolean) => {
    setRequireAuth(enabled);
    
    // Update user settings
    const userSettings = getUserSettings();
    storeUserSettings({
      ...userSettings,
      privacy: {
        ...userSettings.privacy,
        requireAuthForSensitiveActions: enabled
      }
    });
  };
  
  const handleDataSharingChange = (value: string) => {
    setDataSharing(value);
    
    // Update user settings
    const userSettings = getUserSettings();
    storeUserSettings({
      ...userSettings,
      privacy: {
        ...userSettings.privacy,
        dataSharing: value
      }
    });
  };
  
  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lock className="mr-2" size={20} />
          <span>Privacy Settings</span>
        </CardTitle>
        <CardDescription>Control your privacy and security options</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="mask-amounts" className="flex items-center">
              {maskAmounts ? <EyeOff size={16} className="mr-2" /> : <Eye size={16} className="mr-2" />}
              Mask Transaction Amounts
            </Label>
            <p className="text-sm text-muted-foreground">
              Hide transaction amounts in the app from prying eyes
            </p>
          </div>
          <Switch 
            id="mask-amounts" 
            checked={maskAmounts}
            onCheckedChange={handleMaskAmountsToggle}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="require-auth" className="flex items-center">
              <Lock size={16} className="mr-2" />
              Require Authentication
            </Label>
            <p className="text-sm text-muted-foreground">
              Require authentication for sensitive operations like deleting data
            </p>
          </div>
          <Switch 
            id="require-auth" 
            checked={requireAuth}
            onCheckedChange={handleRequireAuthToggle}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="data-sharing" className="flex items-center">
            <UserX size={16} className="mr-2" />
            Data Sharing
          </Label>
          <Select value={dataSharing} onValueChange={handleDataSharingChange}>
            <SelectTrigger id="data-sharing" className="w-full">
              <SelectValue placeholder="Select sharing level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No data sharing</SelectItem>
              <SelectItem value="anonymous">Anonymous usage data only</SelectItem>
              <SelectItem value="minimal">Minimal data (no transaction details)</SelectItem>
              <SelectItem value="full">Full data sharing</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Controls what data is shared for app improvements and analytics
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrivacySettings;
