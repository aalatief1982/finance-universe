import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Sun, Moon, Trash, Bell, Eye, MessageSquare, Download, UploadCloud, Database } from 'lucide-react';
import { SmsReaderService } from '@/services/SmsReaderService';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/context/UserContext';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CURRENCIES } from '@/lib/categories-data';
import { updateCurrency as persistCurrency, getStoredTransactions, storeTransactions } from '@/utils/storage-utils';
import { convertTransactionsToCsv, parseCsvTransactions } from '@/utils/csv';
import { useLocale } from '@/context/LocaleContext';

const Settings = () => {
  const { toast } = useToast();
  const {
    user, 
    updateTheme, 
    updateCurrency, 
    updateLanguage,
    updateDisplayOptions,
    updateUserPreferences,
    getEffectiveTheme
  } = useUser();
  const { setLanguage: loadLanguage } = useLocale();
  
  // State for form values
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    user?.preferences?.theme || 'light'
  );
  const [currency, setCurrency] = useState(user?.preferences?.currency || 'USD');
  const [language, setLanguage] = useState(user?.preferences?.language || 'en');
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

    toast({
      title: "Appearance updated",
      description: "Your appearance settings have been saved."
    });
  };
  
  const updateWeekStartsOn = (value: 'sunday' | 'monday' | 'saturday') => {
    setWeekStartsOn(value);
    updateDisplayOptions({ weekStartsOn: value });
    toast({
      title: "Display preferences updated",
      description: "Your display settings have been saved."
    });
  };

  const handleExportData = () => {
    try {
      const transactions = getStoredTransactions();
      if (!transactions.length) {
        toast({
          title: "No data to export",
          description: "You don't have any transactions to export.",
          variant: "destructive"
        });
        return;
      }

      const csv = convertTransactionsToCsv(transactions);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.href = url;
      downloadAnchorNode.download = 'transactions.csv';
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Your data has been exported successfully."
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "An error occurred while exporting your data.",
        variant: "destructive"
      });
    }
  };

  const handleImportData = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,.csv';

    fileInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (!target.files?.length) return;

      const file = target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const isCsv = file.name.toLowerCase().endsWith('.csv');
          const data = isCsv ? parseCsvTransactions(text) : JSON.parse(text);

          if (!Array.isArray(data) || data.length === 0) {
            throw new Error('No valid transactions');
          }

          storeTransactions(data as any);
          toast({
            title: "Import successful",
            description: "Your data has been imported successfully."
          });
          setTimeout(() => window.location.reload(), 1500);
        } catch {
          toast({
            title: "Import failed",
            description: "Failed to parse the imported file. Make sure it's a valid JSON or CSV file.",
            variant: "destructive"
          });
        }
      };

      reader.readAsText(file);
    };

    fileInput.click();
  };
  
  
  return (
    <Layout showBack>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 pb-24"
      >
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sun className="mr-2" size={20} />
                  <span>Appearance</span>
                </CardTitle>
                <CardDescription>Customize how the application looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <ToggleGroup 
                    type="single" 
                    value={theme}
                    onValueChange={(value) => handleThemeChange(value as 'light' | 'dark' | 'system')}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="light" className="gap-1">
                      <Sun size={16} />
                      Light
                    </ToggleGroupItem>
                    <ToggleGroupItem value="dark" className="gap-1">
                      <Moon size={16} />
                      Dark
                    </ToggleGroupItem>
                    <ToggleGroupItem value="system" className="gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide lucide-monitor"><rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /></svg>
                      System
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={handleCurrencyChange}>
                    <SelectTrigger id="currency" className="w-full">
                      <SelectValue placeholder="Select currency" />
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
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger id="language" className="w-full">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  className="w-full mt-4"
                  onClick={handleAppearanceSave}
                >
                  Save Settings
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="mr-2" size={20} />
                  <span>Display Options</span>
                </CardTitle>
                <CardDescription>Customize how information is displayed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Week Starts On</Label>
                  <ToggleGroup
                    type="single"
                    value={weekStartsOn}
                    onValueChange={(value) =>
                      value && updateWeekStartsOn(value as 'sunday' | 'monday' | 'saturday')
                    }
                    className="justify-start"
                  >
                    <ToggleGroupItem value="sunday">Sunday</ToggleGroupItem>
                    <ToggleGroupItem value="monday">Monday</ToggleGroupItem>
                    <ToggleGroupItem value="saturday">Saturday</ToggleGroupItem>
                  </ToggleGroup>
                </div>
            </CardContent>
          </Card>
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2" size={20} />
                <span>Notification Settings</span>
              </CardTitle>
              <CardDescription>Manage notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="background-sms">Enable Background SMS Reading</Label>
                  <p className="text-sm text-muted-foreground">Read incoming SMS in the background</p>
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
                <span>SMS Import</span>
                </CardTitle>
                <CardDescription>Automatically import new SMS messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-sms-import">Automatic SMS import</Label>
                    <p className="text-sm text-muted-foreground">Check for new SMS on startup</p>
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

          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2" size={20} />
                <span>Data Management</span>
              </CardTitle>
              <CardDescription>Manage your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Export Data</p>
                  <p className="text-sm text-muted-foreground">Download all your transaction data</p>
                </div>
                <Button variant="outline" onClick={handleExportData} className="gap-2">
                  <Download size={16} />
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Import Data</p>
                  <p className="text-sm text-muted-foreground">Import transactions from a file</p>
                </div>
                <Button variant="outline" onClick={handleImportData} className="gap-2">
                  <UploadCloud size={16} />
                  Import
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-destructive/20 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-destructive">
                <Trash className="mr-2" size={20} />
                <span>Danger Zone</span>
              </CardTitle>
              <CardDescription>Irreversible actions that affect your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

      </motion.div>
    </Layout>
  );
};

export default Settings;
