import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Sun, Moon, Trash, Bell, Eye, Globe, Languages, MessageSquare } from 'lucide-react';
import { SmsReaderService } from '@/services/SmsReaderService';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/context/UserContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { CURRENCIES } from '@/lib/categories-data';

import DataManagementSettings from '@/components/settings/DataManagementSettings';

import { updateCurrency as persistCurrency } from '@/utils/storage-utils';
import { useLocale } from '@/context/LocaleContext';


const Settings = () => {
  const { toast } = useToast();
  const {
    user,
    updateTheme,
    updateCurrency,
    updateLanguage,
    updateNotificationSettings,
    updateDisplayOptions,
    updateUserPreferences,
    getEffectiveTheme
  } = useUser();
  const { setLanguage: loadLanguage, t } = useLocale();
  
  // State for form values
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    user?.preferences?.theme || 'light'
  );
  const [currency, setCurrency] = useState(user?.preferences?.currency || 'USD');
  const [language, setLanguage] = useState(user?.preferences?.language || 'en');
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.preferences?.notifications || false
  );
  const [backgroundSmsEnabled, setBackgroundSmsEnabled] = useState(
    user?.preferences?.sms?.backgroundSmsEnabled || false
  );
  const [weekStartsOn, setWeekStartsOn] = useState<'sunday' | 'monday' | 'saturday'>(
    user?.preferences?.displayOptions?.weekStartsOn || 'sunday'
  );

  
  // Initialize values from user context on component mount
  useEffect(() => {
    if (user?.preferences) {
      setTheme(user.preferences.theme || 'light');
      setCurrency(user.preferences.currency || 'USD');
      setLanguage(user.preferences.language || 'en');
      setNotificationsEnabled(user.preferences.notifications || false);
      if (user.preferences.sms) {
        setBackgroundSmsEnabled(user.preferences.sms.backgroundSmsEnabled || false);
      }

      if (user.preferences.displayOptions) {
        setWeekStartsOn(user.preferences.displayOptions.weekStartsOn || 'sunday');
      }
    }
  }, [user]);
  
  // Handlers for settings changes
  const handleThemeChange = (value: 'light' | 'dark' | 'system') => {
    setTheme(value);
    updateTheme(value);
  };
  
  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
    updateCurrency(value);
    persistCurrency(value);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    updateLanguage(value);
    loadLanguage(value);
  };
  
  const handleNotificationsChange = (checked: boolean) => {
    setNotificationsEnabled(checked);
    updateNotificationSettings(checked);
  };



  const handleBackgroundSmsChange = async (checked: boolean) => {
    if (checked) {
      const granted = await SmsReaderService.checkOrRequestPermission();
      if (!granted) {
        alert('SMS permission is required to read messages in the background.');
        setBackgroundSmsEnabled(false);
        return;
      }
    }

    setBackgroundSmsEnabled(checked);
    updateUserPreferences({ sms: { ...user?.preferences?.sms, backgroundSmsEnabled: checked } });
  };

  const handleAppearanceSave = () => {
    updateTheme(theme);
    updateCurrency(currency);
    persistCurrency(currency);
    updateLanguage(language);
    loadLanguage(language);
    updateNotificationSettings(notificationsEnabled);
    updateDisplayOptions({
      weekStartsOn
    });

    toast({
      title: t('settings-updated'),
      description: t('settings-saved-desc')
    });
  };

  // Legacy handler used by the save button
  const handleSaveSettings = () => {
    handleAppearanceSave();
  };

  // Handler for the display options "save" button
  const handleDisplayOptionsChange = () => {
    updateDisplayOptions({
      weekStartsOn
    });

    toast({
      title: t('settings-updated'),
      description: t('settings-saved-desc')
    });
  };
  
  
  return (
    <Layout showBack>
      <PageHeader title={t('settings')} />
      <div className="flex justify-end pb-4">
        <Button onClick={handleSaveSettings}>{t('save-settings')}</Button>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 pb-24"
      >
        
        <Tabs defaultValue="preferences" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="preferences">{t('preferences')}</TabsTrigger>
            <TabsTrigger value="danger">{t('danger-zone')}</TabsTrigger>
          </TabsList>
          <TabsContent value="preferences" className="space-y-4">
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sun className="mr-2" size={20} />
                  <span>{t('appearance')}</span>
                </CardTitle>
                <CardDescription>{t('customize-appearance')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('theme')}</Label>
                  <ToggleGroup
                    type="single"
                    value={theme}
                    onValueChange={(value) => handleThemeChange(value as 'light' | 'dark' | 'system')}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="light" className="gap-1">
                      <Sun size={16} />
                      {t('light')}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="dark" className="gap-1">
                      <Moon size={16} />
                      {t('dark')}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="system" className="gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide lucide-monitor"><rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /></svg>
                      {t('system')}
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">{t('currency')}</Label>
                  <Select value={currency} onValueChange={handleCurrencyChange}>
                    <SelectTrigger id="currency" className="w-full">
                      <SelectValue placeholder={t('currency')} />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((code) => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">{t('language')}</Label>
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger id="language" className="w-full">
                      <SelectValue placeholder={t('language')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">{t('notifications')}</Label>
                    <p className="text-sm text-muted-foreground">{t('receive-alerts')}</p>
                  </div>
                <Switch
                    id="notifications"
                    checked={notificationsEnabled}
                    onCheckedChange={handleNotificationsChange}
                  />
                </div>

              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="mr-2" size={20} />
                  <span>{t('display-options')}</span>
                </CardTitle>
                <CardDescription>{t('customize-appearance')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('week-starts-on')}</Label>
                  <ToggleGroup
                    type="single"
                    value={weekStartsOn}
                    onValueChange={(value) =>
                      value && setWeekStartsOn(value as 'sunday' | 'monday' | 'saturday')
                    }
                    className="justify-start"
                  >
                    <ToggleGroupItem value="sunday">Sunday</ToggleGroupItem>
                    <ToggleGroupItem value="monday">Monday</ToggleGroupItem>
                    <ToggleGroupItem value="saturday">Saturday</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                

                <Button
                  className="w-full mt-4"
                  onClick={handleDisplayOptionsChange}
                >
                  {t('save-display')}
                </Button>
            </CardContent>
          </Card>
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2" size={20} />
                <span>{t('notification-settings')}</span>
              </CardTitle>
              <CardDescription>{t('receive-alerts')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">{t('notifications')}</Label>
                  <p className="text-sm text-muted-foreground">{t('receive-alerts')}</p>
                </div>
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationsChange}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="background-sms">{t('enable-background-sms')}</Label>
                  <p className="text-sm text-muted-foreground">{t('read-incoming-sms')}</p>
                </div>
                <Switch
                  id="background-sms"
                  checked={backgroundSmsEnabled}
                  onCheckedChange={handleBackgroundSmsChange}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2" size={20} />
                <span>{t('sms-import')}</span>

                </CardTitle>
                <CardDescription>{t('automatic-sms-import')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-sms-import">{t('automatic-sms-import')}</Label>
                    <p className="text-sm text-muted-foreground">{t('check-new-sms')}</p>
                  </div>
                  <Switch
                    id="auto-sms-import"
                    checked={!!user?.preferences?.sms?.autoImport}
                    onCheckedChange={(checked) =>
                      updateUserPreferences({ sms: { ...user?.preferences?.sms, autoImport: checked } })
                    }
                  />
                </div>
              </CardContent>
            </Card>
            <DataManagementSettings />
          </TabsContent>
          
          <TabsContent value="danger" className="space-y-4">
            <Card className="border border-destructive/20 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                  <Trash className="mr-2" size={20} />
                  <span>{t('danger-zone')}</span>
                </CardTitle>
                <CardDescription>{t('danger-zone-desc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">{t('delete-account')}</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('are-you-sure')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('delete-account-desc')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {t('delete-account')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </Layout>
  );
};

export default Settings;
