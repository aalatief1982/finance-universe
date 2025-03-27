// NotificationSettings.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, AlertTriangle, CreditCard, TrendingUp } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { getUserSettings, storeUserSettings } from '@/utils/storage-utils';

const NotificationSettings = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationTypes, setNotificationTypes] = useState({
    sms: true,
    budget: true,
    insights: true
  });
  
  useEffect(() => {
    // Get user settings on component mount
    const userSettings = getUserSettings();
    setNotificationsEnabled(userSettings.notifications?.enabled !== false);
    
    if (userSettings.notifications?.types) {
      setNotificationTypes({
        sms: userSettings.notifications.types.includes('sms'),
        budget: userSettings.notifications.types.includes('budget'),
        insights: userSettings.notifications.types.includes('insights')
      });
    }
  }, []);
  
  const handleNotificationsToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    
    // Update user settings
    const userSettings = getUserSettings();
    storeUserSettings({
      ...userSettings,
      notifications: {
        ...userSettings.notifications,
        enabled
      }
    });
  };
  
  const handleNotificationTypeToggle = (type: 'sms' | 'budget' | 'insights', checked: boolean) => {
    setNotificationTypes(prev => ({
      ...prev,
      [type]: checked
    }));
    
    // Update user settings
    const userSettings = getUserSettings();
    const currentTypes = userSettings.notifications?.types || [];
    let newTypes: string[];
    
    if (checked) {
      newTypes = [...currentTypes, type].filter((v, i, a) => a.indexOf(v) === i);
    } else {
      newTypes = currentTypes.filter(t => t !== type);
    }
    
    storeUserSettings({
      ...userSettings,
      notifications: {
        ...userSettings.notifications,
        types: newTypes
      }
    });
  };
  
  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="mr-2" size={20} />
          <span>Notification Settings</span>
        </CardTitle>
        <CardDescription>Control what notifications you receive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="enable-notifications">Enable Notifications</Label>
          <Switch 
            id="enable-notifications" 
            checked={notificationsEnabled}
            onCheckedChange={handleNotificationsToggle}
          />
        </div>
        
        {notificationsEnabled && (
          <div className="space-y-4 pl-1">
            <Label className="text-sm font-medium">Notification Types</Label>
            
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="sms-notifications" 
                checked={notificationTypes.sms}
                onCheckedChange={(checked) => 
                  handleNotificationTypeToggle('sms', checked as boolean)
                }
              />
              <div className="space-y-1 leading-none">
                <Label htmlFor="sms-notifications" className="flex items-center">
                  <AlertTriangle size={16} className="mr-1" />
                  SMS Transactions
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive notifications when new SMS transactions are detected
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="budget-notifications" 
                checked={notificationTypes.budget}
                onCheckedChange={(checked) => 
                  handleNotificationTypeToggle('budget', checked as boolean)
                }
              />
              <div className="space-y-1 leading-none">
                <Label htmlFor="budget-notifications" className="flex items-center">
                  <CreditCard size={16} className="mr-1" />
                  Budget Alerts
                </Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when you're approaching or exceeding a budget
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="insights-notifications" 
                checked={notificationTypes.insights}
                onCheckedChange={(checked) => 
                  handleNotificationTypeToggle('insights', checked as boolean)
                }
              />
              <div className="space-y-1 leading-none">
                <Label htmlFor="insights-notifications" className="flex items-center">
                  <TrendingUp size={16} className="mr-1" />
                  Spending Insights
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive weekly and monthly spending reports and insights
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
