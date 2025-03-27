import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Download, UploadCloud, RefreshCw, Shield, Sun, Moon, Trash, Bell, Database, Eye, Globe, Languages } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/context/UserContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { SetStateAction } from 'react';

const Settings = () => {
  const { toast } = useToast();
  const { 
    user, 
    updateTheme, 
    updateCurrency, 
    updateLanguage, 
    updateNotificationSettings,
    updateDisplayOptions,
    updatePrivacySettings,
    updateDataManagement,
    getEffectiveTheme
  } = useUser();
  
  // State for form values
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    user?.preferences?.theme || 'light'
  );
  const [currency, setCurrency] = useState(user?.preferences?.currency || 'USD');
  const [language, setLanguage] = useState(user?.preferences?.language || 'en');
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.preferences?.notifications || false
  );
  const [showCents, setShowCents] = useState(
    user?.preferences?.displayOptions?.showCents || true
  );
  const [weekStartsOn, setWeekStartsOn] = useState<'sunday' | 'monday'>(
    user?.preferences?.displayOptions?.weekStartsOn || 'sunday'
  );
  const [defaultView, setDefaultView] = useState<'list' | 'stats' | 'calendar'>(
    user?.preferences?.displayOptions?.defaultView || 'list'
  );
  const [compactMode, setCompactMode] = useState(
    user?.preferences?.displayOptions?.compactMode || false
  );
  const [maskAmounts, setMaskAmounts] = useState(
    user?.preferences?.privacy?.maskAmounts || false
  );
  const [requireAuth, setRequireAuth] = useState(
    user?.preferences?.privacy?.requireAuthForSensitiveActions || false
  );
  const [dataSharing, setDataSharing] = useState<'none' | 'anonymous' | 'full'>(
    user?.preferences?.privacy?.dataSharing || 'none'
  );
  const [autoBackup, setAutoBackup] = useState(
    user?.preferences?.dataManagement?.autoBackup || false
  );
  const [backupFrequency, setBackupFrequency] = useState<'daily' | 'weekly' | 'monthly'>(
    user?.preferences?.dataManagement?.backupFrequency || 'weekly'
  );
  const [dataRetention, setDataRetention] = useState<'3months' | '6months' | '1year' | 'forever'>(
    user?.preferences?.dataManagement?.dataRetention || 'forever'
  );
  
  // Initialize values from user context on component mount
  useEffect(() => {
    if (user?.preferences) {
      setTheme(user.preferences.theme || 'light');
      setCurrency(user.preferences.currency || 'USD');
      setLanguage(user.preferences.language || 'en');
      setNotificationsEnabled(user.preferences.notifications || false);
      
      if (user.preferences.displayOptions) {
        setShowCents(user.preferences.displayOptions.showCents || true);
        setWeekStartsOn(user.preferences.displayOptions.weekStartsOn || 'sunday');
        setDefaultView(user.preferences.displayOptions.defaultView || 'list');
        setCompactMode(user.preferences.displayOptions.compactMode || false);
      }
      
      if (user.preferences.privacy) {
        setMaskAmounts(user.preferences.privacy.maskAmounts || false);
        setRequireAuth(user.preferences.privacy.requireAuthForSensitiveActions || false);
        setDataSharing(user.preferences.privacy.dataSharing || 'none');
      }
      
      if (user.preferences.dataManagement) {
        setAutoBackup(user.preferences.dataManagement.autoBackup || false);
        setBackupFrequency(user.preferences.dataManagement.backupFrequency || 'weekly');
        setDataRetention(user.preferences.dataManagement.dataRetention || 'forever');
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
  };
  
  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    updateLanguage(value);
  };
  
  const handleNotificationsChange = (checked: boolean) => {
    setNotificationsEnabled(checked);
    updateNotificationSettings(checked);
  };
  
  const handleDisplayOptionsChange = () => {
    updateDisplayOptions({
      showCents,
      weekStartsOn,
      defaultView,
      compactMode
    });
    
    toast({
      title: "Display preferences updated",
      description: "Your display settings have been saved."
    });
  };
  
  const handlePrivacySettingsChange = () => {
    updatePrivacySettings({
      maskAmounts,
      requireAuthForSensitiveActions: requireAuth,
      dataSharing
    });
    
    toast({
      title: "Privacy settings updated",
      description: "Your privacy settings have been saved."
    });
  };
  
  const handleDataManagementChange = () => {
    updateDataManagement({
      autoBackup,
      backupFrequency,
      dataRetention
    });
    
    toast({
      title: "Data management updated",
      description: "Your data management settings have been saved."
    });
  };
  
  const handleResetData = () => {
    localStorage.removeItem('transactions');
    toast({
      title: "Data reset successful",
      description: "All your transaction data has been reset.",
    });
    window.location.reload();
  };
  
  const handleExportData = () => {
    const transactions = localStorage.getItem('transactions');
    if (!transactions) {
      toast({
        title: "No data to export",
        description: "You don't have any transactions to export.",
        variant: "destructive",
      });
      return;
    }
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(transactions);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "expense-tracker-data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    toast({
      title: "Export successful",
      description: "Your data has been exported successfully.",
    });
  };
  
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        localStorage.setItem('transactions', JSON.stringify(jsonData));
        toast({
          title: "Import successful",
          description: "Your data has been imported successfully.",
        });
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Failed to parse the imported file. Make sure it's a valid JSON file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  // Fix the Switch component handler in the maskAmounts section
  const handleMaskAmountsChange = (checked: boolean) => {
    setMaskAmounts(checked as SetStateAction<boolean>);
    updatePrivacySettings({
      maskAmounts: checked,
      requireAuthForSensitiveActions: requireAuth,
      dataSharing
    });
    
    toast({
      title: "Privacy settings updated",
      description: "Your privacy settings have been saved."
    });
  };
  
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="data">Data Management</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance" className="space-y-4">
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-monitor"><rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /></svg>
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
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                      <SelectItem value="CAD">CAD (C$)</SelectItem>
                      <SelectItem value="AUD">AUD (A$)</SelectItem>
                      <SelectItem value="CNY">CNY (¥)</SelectItem>
                      <SelectItem value="INR">INR (₹)</SelectItem>
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
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive alerts and notifications</p>
                  </div>
                  <Switch 
                    id="notifications" 
                    checked={notificationsEnabled}
                    onCheckedChange={handleNotificationsChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="display" className="space-y-4">
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="mr-2" size={20} />
                  <span>Display Options</span>
                </CardTitle>
                <CardDescription>Customize how information is displayed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-cents">Show Cents</Label>
                    <p className="text-sm text-muted-foreground">Display decimal values for amounts</p>
                  </div>
                  <Switch 
                    id="show-cents" 
                    checked={showCents}
                    onCheckedChange={(checked) => setShowCents(checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="compact-mode">Compact Mode</Label>
                    <p className="text-sm text-muted-foreground">Use more compact UI elements</p>
                  </div>
                  <Switch 
                    id="compact-mode" 
                    checked={compactMode}
                    onCheckedChange={(checked) => setCompactMode(checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Week Starts On</Label>
                  <ToggleGroup 
                    type="single" 
                    value={weekStartsOn}
                    onValueChange={(value) => value && setWeekStartsOn(value as 'sunday' | 'monday')}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="sunday">Sunday</ToggleGroupItem>
                    <ToggleGroupItem value="monday">Monday</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                
                <div className="space-y-2">
                  <Label>Default View</Label>
                  <ToggleGroup 
                    type="single" 
                    value={defaultView}
                    onValueChange={(value) => value && setDefaultView(value as 'list' | 'stats' | 'calendar')}
                    className="justify-start"
                  >
                    <ToggleGroupItem value="list">List</ToggleGroupItem>
                    <ToggleGroupItem value="stats">Stats</ToggleGroupItem>
                    <ToggleGroupItem value="calendar">Calendar</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  onClick={handleDisplayOptionsChange}
                >
                  Save Display Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="privacy" className="space-y-4">
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2" size={20} />
                  <span>Privacy Settings</span>
                </CardTitle>
                <CardDescription>Manage your data privacy and security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="mask-amounts">Mask Amounts</Label>
                    <p className="text-sm text-muted-foreground">Hide transaction amounts by default</p>
                  </div>
                  <Switch 
                    id="mask-amounts" 
                    checked={maskAmounts}
                    onCheckedChange={handleMaskAmountsChange}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="require-auth">Require Authentication for Sensitive Actions</Label>
                    <p className="text-sm text-muted-foreground">Additional security for important changes</p>
                  </div>
                  <Switch 
                    id="require-auth" 
                    checked={requireAuth}
                    onCheckedChange={setRequireAuth}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="data-sharing">Data Sharing</Label>
                  <Select value={dataSharing} onValueChange={(value) => setDataSharing(value as 'none' | 'anonymous' | 'full')}>
                    <SelectTrigger id="data-sharing" className="w-full">
                      <SelectValue placeholder="Data sharing level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No data sharing</SelectItem>
                      <SelectItem value="anonymous">Anonymous usage data only</SelectItem>
                      <SelectItem value="full">Full data sharing</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Controls what data is shared with us to help improve the app.
                  </p>
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  onClick={handlePrivacySettingsChange}
                >
                  Save Privacy Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="data" className="space-y-4">
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2" size={20} />
                  <span>Data Management</span>
                </CardTitle>
                <CardDescription>Manage your data and privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-backup">Automatic Backups</Label>
                      <p className="text-sm text-muted-foreground">Regularly back up your data</p>
                    </div>
                    <Switch 
                      id="auto-backup" 
                      checked={autoBackup}
                      onCheckedChange={setAutoBackup}
                    />
                  </div>
                  
                  {autoBackup && (
                    <div className="space-y-2">
                      <Label htmlFor="backup-frequency">Backup Frequency</Label>
                      <Select 
                        value={backupFrequency} 
                        onValueChange={(value) => setBackupFrequency(value as 'daily' | 'weekly' | 'monthly')}
                        disabled={!autoBackup}
                      >
                        <SelectTrigger id="backup-frequency" className="w-full">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="data-retention">Data Retention</Label>
                    <Select 
                      value={dataRetention} 
                      onValueChange={(value) => setDataRetention(value as '3months' | '6months' | '1year' | 'forever')}
                    >
                      <SelectTrigger id="data-retention" className="w-full">
                        <SelectValue placeholder="Select data retention" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3months">3 Months</SelectItem>
                        <SelectItem value="6months">6 Months</SelectItem>
                        <SelectItem value="1year">1 Year</SelectItem>
                        <SelectItem value="forever">Forever</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-1">
                      How long to keep your transaction history.
                    </p>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={handleDataManagementChange}
                  >
                    Save Data Management Settings
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
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
                    <div>
                      <Input
                        id="import-file"
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleImportData}
                      />
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => document.getElementById('import-file')?.click()}
                      >
                        <UploadCloud size={16} />
                        Import
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="danger" className="space-y-4">
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
                    <Button variant="destructive" className="w-full gap-2">
                      <RefreshCw size={16} />
                      Reset All Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will permanently delete all your transaction data and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={handleResetData}
                      >
                        Reset All Data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
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
          </TabsContent>
        </Tabs>
      </motion.div>
    </Layout>
  );
};

export default Settings;
