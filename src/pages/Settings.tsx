import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sun,
  Moon,
  Bell,
  Eye,
  MessageSquare,
  Download,
  UploadCloud,
  Database,
  Trash2,
  Lock,
  Unlock,
} from "lucide-react";
import { smsPermissionService } from "@/services/SmsPermissionService";
import { demoTransactionService } from "@/services/DemoTransactionService";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/context/UserContext";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CURRENCIES } from "@/lib/categories-data";

import {
  updateCurrency as persistCurrency,
  getStoredTransactions,
  storeTransactions,
} from "@/utils/storage-utils";
import { convertTransactionsToCsv, parseCsvTransactions } from "@/utils/csv";
import { logAnalyticsEvent } from '@/utils/firebase-analytics';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Filesystem, Directory } from '@capacitor/filesystem';

const Settings = () => {
  const { toast } = useToast();
  const {
    user,
    updateTheme,
    updateCurrency,
    updateDisplayOptions,
    updateUser,
    getEffectiveTheme,
  } = useUser();

  const navigate = useNavigate();

  const [notificationsAllowed, setNotificationsAllowed] = useState(
    typeof Notification !== 'undefined' && Notification.permission === "granted"
  );

  useEffect(() => {
    const checkPermissions = async () => {
      const platform = Capacitor.getPlatform();
      if (platform === 'web' && typeof Notification !== 'undefined') {
        setNotificationsAllowed(Notification.permission === 'granted');
      } else {
        try {
          const status = await LocalNotifications.checkPermissions();
          setNotificationsAllowed(status.display === 'granted');
        } catch {
          setNotificationsAllowed(false);
        }
      }
    };

    checkPermissions();
  }, []);

  // State for form values
  const [theme, setTheme] = useState<"light" | "dark" | "system">(
    user?.preferences?.theme || "light",
  );
  const [currency, setCurrency] = useState(
    user?.preferences?.currency || "USD",
  );
  const [backgroundSmsEnabled, setBackgroundSmsEnabled] = useState(
    user?.preferences?.sms?.backgroundSmsEnabled || false,
  );
  const [baselineBackgroundSmsEnabled, setBaselineBackgroundSmsEnabled] = useState(
    user?.preferences?.sms?.backgroundSmsEnabled || false,
  );
  const [autoImport, setAutoImport] = useState(
    user?.preferences?.sms?.autoImport || false,
  );
  const [weekStartsOn, setWeekStartsOn] = useState<
    "sunday" | "monday" | "saturday"
  >(user?.preferences?.displayOptions?.weekStartsOn || "sunday");

  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
  
  // Beta features state
  const [betaDialogOpen, setBetaDialogOpen] = useState(false);
  const [betaCode, setBetaCode] = useState('');
  const [isBetaActive, setIsBetaActive] = useState(() => {
    return localStorage.getItem('betaFeaturesActive') === 'true';
  });

  // Note: useBlocker is not available in React Router v7, implementing a simple warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Initialize values from user context on component mount
  useEffect(() => {
    if (user?.preferences) {
      setTheme(user.preferences.theme || "light");
      setCurrency(user.preferences.currency || "USD");
      if (user.preferences.sms) {
        const initialBg = user.preferences.sms.backgroundSmsEnabled || false;
        setBackgroundSmsEnabled(initialBg);
        setBaselineBackgroundSmsEnabled(initialBg);
        setAutoImport(user.preferences.sms.autoImport || false);
      }

      if (user.preferences.displayOptions) {
        setWeekStartsOn(
          user.preferences.displayOptions.weekStartsOn || "sunday",
        );
      }
    }
  }, [user]);

  useEffect(() => {
    const checkSmsPermission = async () => {
      const granted = await smsPermissionService.hasPermission();
      if (granted) {
        setBackgroundSmsEnabled(true);
        setBaselineBackgroundSmsEnabled(true);
        if (!user?.preferences?.sms?.backgroundSmsEnabled) {
          updateUser({
            preferences: {
              ...user?.preferences,
              sms: {
                ...user?.preferences?.sms,
                backgroundSmsEnabled: true,
              },
            },
          });
        }
      }
    };

    checkSmsPermission();
  }, [user]);

  useEffect(() => {
    const origTheme = user?.preferences?.theme || "light";
    const origCurrency = user?.preferences?.currency || "USD";
    const origAutoImport = user?.preferences?.sms?.autoImport || false;
    const origBackground = baselineBackgroundSmsEnabled;
    const origWeek = user?.preferences?.displayOptions?.weekStartsOn || "sunday";

    const changed =
      theme !== origTheme ||
      currency !== origCurrency ||
      autoImport !== origAutoImport ||
      backgroundSmsEnabled !== origBackground ||
      weekStartsOn !== origWeek;

    setIsDirty(changed);
  }, [theme, currency, autoImport, backgroundSmsEnabled, weekStartsOn, baselineBackgroundSmsEnabled, user]);

  // Handlers for settings changes
  const handleThemeChange = (value: "light" | "dark" | "system") => {
    setTheme(value);
  };

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
  };


  const handleBackgroundSmsChange = async (checked: boolean) => {
    if (checked) {
      try {
        // Request permission when turning on
        const granted = await smsPermissionService.requestPermission();
        
        if (!granted) {
          toast({
            title: "Permission Required",
            description: "SMS permission is required to read messages in the background.",
            variant: "destructive",
          });
          setBackgroundSmsEnabled(false);
          return;
        }
        
        // Update stored preference when permission is granted
        updateUser({
          preferences: {
            ...user?.preferences,
            sms: {
              ...user?.preferences?.sms,
              backgroundSmsEnabled: true,
            },
          },
        });
        setBackgroundSmsEnabled(true);
        setBaselineBackgroundSmsEnabled(true);
      } catch (error) {
        console.error('Error requesting SMS permission:', error);
        toast({
          title: "Error",
          description: "Failed to request SMS permission. Please try again.",
          variant: "destructive",
        });
        setBackgroundSmsEnabled(false);
      }
    } else {
      // Attempt to revoke permission when turning off
      const result = await smsPermissionService.revokePermission();
      
      if (result.requiresManualAction) {
        // Show instructions for manual revocation on native platforms
        toast({
          title: "Manual Action Required",
          description: result.message,
          variant: "default",
        });
        return; // Keep toggle on since permission is still granted
      }
      
      if (result.success) {
        // Successfully revoked (web only)
        setBackgroundSmsEnabled(false);
        setBaselineBackgroundSmsEnabled(false);
        updateUser({
          preferences: {
            ...user?.preferences,
            sms: {
              ...user?.preferences?.sms,
              backgroundSmsEnabled: false,
            },
          },
        });
        
        toast({
          title: "Permission Revoked",
          description: result.message,
        });
      }
    }
  };

  const handleNotificationToggle = async (checked: boolean) => {
    const platform = Capacitor.getPlatform();

    if (checked) {
      if (platform === 'web' && typeof Notification !== 'undefined') {
        if (Notification.permission !== 'granted') {
          const result = await Notification.requestPermission();
          if (result !== 'granted') {
            setNotificationsAllowed(false);
            return;
          }
        }
        setNotificationsAllowed(true);
        return;
      }

      try {
        const status = await LocalNotifications.checkPermissions();
        if (status.display !== 'granted') {
          const req = await LocalNotifications.requestPermissions();
          if (req.display !== 'granted') {
            setNotificationsAllowed(false);
            return;
          }
        }
        setNotificationsAllowed(true);
      } catch {
        setNotificationsAllowed(false);
      }
    } else {
      setNotificationsAllowed(false);
    }
  };

  const handleSaveSettings = () => {
    const updated = {
      theme,
      currency,
      sms: {
        ...user?.preferences?.sms,
        backgroundSmsEnabled,
        autoImport,
      },
      displayOptions: {
        ...user?.preferences?.displayOptions,
        weekStartsOn,
      },
    } as any;

    updateUser({ preferences: { ...user?.preferences, ...updated } });

    persistCurrency(currency);

    logAnalyticsEvent('settings_saved');

    toast({
      title: "Settings saved successfully",
    });

    setIsDirty(false);
  };

  const handleSkipWithoutSave = () => {
    setShowUnsavedPrompt(false);
    setIsDirty(false);
  };

  const handleSaveAndProceed = () => {
    handleSaveSettings();
    setShowUnsavedPrompt(false);
  };

  const updateWeekStartsOn = (value: "sunday" | "monday" | "saturday") => {
    setWeekStartsOn(value);
  };

  const handleExportData = async () => {
    try {
      const transactions = getStoredTransactions();
      if (!transactions.length) {
        toast({
          title: "No data to export",
          description: "You don't have any transactions to export.",
          variant: "destructive",
        });
        return;
      }

      const csv = convertTransactionsToCsv(transactions);

      if (Capacitor.getPlatform() === 'web') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.href = url;
        downloadAnchorNode.download = 'transactions.csv';
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        URL.revokeObjectURL(url);
      } else {
        const fileName = `transactions_${Date.now()}.csv`;
        await Filesystem.writeFile({
          path: fileName,
          data: csv,
          directory: Directory.Documents,
          encoding: 'utf8' as any
        });
        toast({
          title: 'Export successful',
          description: `Saved to Documents/${fileName}`
        });
        return;
      }

      toast({
        title: 'Export successful',
        description: 'Your data has been exported successfully.',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'An error occurred while exporting your data.',
        variant: 'destructive',
      });
    }
  };

  const handleImportData = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json,.csv";

    fileInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (!target.files?.length) return;

      const file = target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const isCsv = file.name.toLowerCase().endsWith(".csv");
          const data = isCsv ? parseCsvTransactions(text) : JSON.parse(text);

          if (!Array.isArray(data) || data.length === 0) {
            throw new Error("No valid transactions");
          }

          const existing = getStoredTransactions();
          const confirmImport = window.confirm(
            `This will add ${data.length} transactions to your existing ${existing.length}. Continue?`,
          );

          if (!confirmImport) return;

          const merged = [...existing, ...(data as any[])];
          storeTransactions(merged as any);
          toast({
            title: "Import successful",
            description: `Added ${data.length} transactions successfully.`,
          });
          setTimeout(() => window.location.reload(), 1500);
        } catch {
          toast({
            title: "Import failed",
            description:
              "Failed to parse the imported file. Make sure it's a valid JSON or CSV file.",
            variant: "destructive",
          });
        }
      };

      reader.readAsText(file);
    };

    fileInput.click();
  };

  const handleClearSampleData = () => {
    const confirmClear = window.confirm(
      'Are you sure you want to clear the sample data?'
    );
    if (!confirmClear) return;

    try {
      demoTransactionService.clearDemoTransactions();
      toast({
        title: 'Sample data cleared',
        description: 'Demo transactions have been removed.',
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast({
        title: 'Failed to clear sample data',
        variant: 'destructive',
      });
    }
  };

  const handleBetaCodeSubmit = () => {
    if (betaCode === '0599572215') {
      localStorage.setItem('betaFeaturesActive', 'true');
      setIsBetaActive(true);
      setBetaDialogOpen(false);
      setBetaCode('');
      toast({
        title: "🎉 Beta Features Activated!",
        description: "You now have access to all beta features including Budget and Import SMS.",
      });
    } else {
      toast({
        title: "❌ Invalid Beta Code",
        description: "Please enter a valid beta code to activate premium features.",
        variant: "destructive",
      });
      setBetaDialogOpen(false);
      setBetaCode('');
    }
  };

  return (
    <Layout showBack>
      <div className="px-1">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 pb-24 mt-2"
      >
        <Button className="w-full mb-2" onClick={handleSaveSettings}>
          Save Settings
        </Button>
        <section className="space-y-4">
          <h2 className="flex items-center justify-center text-lg font-semibold">
            <Sun className="mr-2" size={20} />
            <span>Appearance</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Customize how the application looks
          </p>
          <div className="space-y-2">
            <Label>Theme</Label>
            <ToggleGroup
              type="single"
              value={theme}
              onValueChange={(value) =>
                handleThemeChange(value as "light" | "dark" | "system")
              }
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide lucide-monitor"
                >
                  <rect width="20" height="14" x="2" y="3" rx="2" />
                  <line x1="8" x2="16" y1="21" y2="21" />
                  <line x1="12" x2="12" y1="17" y2="21" />
                </svg>
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

        </section>

        <section className="space-y-4">
          <h2 className="flex items-center justify-center text-lg font-semibold">
            <Eye className="mr-2" size={20} />
            <span>Display Options</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Customize how information is displayed
          </p>
          <div className="space-y-2">
            <Label>Week Starts On</Label>
            <ToggleGroup
              type="single"
              value={weekStartsOn}
              onValueChange={(value) =>
                value &&
                updateWeekStartsOn(value as "sunday" | "monday" | "saturday")
              }
              className="justify-start"
            >
              <ToggleGroupItem value="sunday">Sunday</ToggleGroupItem>
              <ToggleGroupItem value="monday">Monday</ToggleGroupItem>
              <ToggleGroupItem value="saturday">Saturday</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </section>
        <section className="space-y-4">
          <h2 className="flex items-center justify-center text-lg font-semibold">
            <Bell className="mr-2" size={20} />
            <span>Notification Settings</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage notification preferences
          </p>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allow-notifications">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Allow this app to send you notifications
              </p>
            </div>
            <Switch
              id="allow-notifications"
              checked={notificationsAllowed}
              onCheckedChange={handleNotificationToggle}
            />
          </div>
        </section>
        <section className="space-y-4">
          <h2 className="flex items-center justify-center text-lg font-semibold">
            <MessageSquare className="mr-2" size={20} />
            <span>SMS Settings</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage SMS related options
          </p>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="background-sms">Enable Background SMS Reading</Label>
              <p className="text-sm text-muted-foreground">
                Read incoming SMS in the background
              </p>
            </div>
            <Switch
              id="background-sms"
              checked={backgroundSmsEnabled}
              onCheckedChange={handleBackgroundSmsChange}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="space-y-0.5">
              <Label htmlFor="auto-sms-import">Automatic SMS import</Label>
              <p className="text-sm text-muted-foreground">
                Check for new SMS on startup
              </p>
            </div>
            <Switch
              id="auto-sms-import"
              checked={autoImport}
              onCheckedChange={setAutoImport}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center justify-center text-lg font-semibold">
            <Database className="mr-2" size={20} />
            <span>Data Management</span>
          </h2>
          <p className="text-sm text-muted-foreground">Manage your data</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Export Data</p>
              <p className="text-sm text-muted-foreground">
                Download all your transaction data
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleExportData}
              className="gap-2"
            >
              <Download size={16} />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Import Data</p>
              <p className="text-sm text-muted-foreground">
                Import transactions from a file
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleImportData}
              className="gap-2"
            >
              <UploadCloud size={16} />
              Import
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Clear Sample Data</p>
              <p className="text-sm text-muted-foreground">
                Remove seeded demo transactions
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleClearSampleData}
              className="gap-2 text-destructive"
            >
              <Trash2 size={16} />
              Clear Sample Data
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Beta Features</p>
              <p className="text-sm text-muted-foreground">
                {isBetaActive ? 'Beta features are active' : 'Unlock exclusive beta features'}
              </p>
            </div>
            {isBetaActive ? (
              <div className="flex items-center text-green-600">
                <Unlock className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Active</span>
              </div>
            ) : (
              <Dialog open={betaDialogOpen} onOpenChange={setBetaDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    Activate Beta Features
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enter Beta Code</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="betaCode">Beta Code</Label>
                      <Input
                        id="betaCode"
                        value={betaCode}
                        onChange={(e) => setBetaCode(e.target.value)}
                        placeholder="Enter your beta code"
                      />
                    </div>
                    <Button onClick={handleBetaCodeSubmit} className="w-full">
                      Activate Features
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </section>


      </motion.div>
      </div>
      <AlertDialog open={showUnsavedPrompt} onOpenChange={setShowUnsavedPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={handleSkipWithoutSave}>
              Skip without Save
            </Button>
            <Button onClick={handleSaveAndProceed}>
              Save and Proceed
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Settings;
