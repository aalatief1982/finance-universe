/**
 * @file Settings.tsx
 * @description Settings screen for app preferences, SMS import options,
 *              notifications, data import/export, and beta toggles.
 *
 * @module pages/Settings
 *
 * @responsibilities
 * 1. Read/update user preferences (theme, currency, display options)
 * 2. Manage SMS permissions and background SMS settings
 * 3. Handle import/export, data reset, and OTA update utilities
 * 4. Log analytics for settings changes
 *
 * @dependencies
 * - storage-utils.ts: persist currency and transaction data
 * - SmsPermissionService: permission orchestration
 * - firebase-analytics.ts: settings event logging
 *
 * @review-tags
 * - @side-effects: writes user prefs, storage exports, and native APIs
 * - @risk: data reset and import flows must be reversible/validated
 *
 * @review-checklist
 * - [ ] Permissions checked before enabling background SMS
 * - [ ] CSV import validates schema before overwrite
 * - [ ] Unsaved changes prompt on exit
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sun,
  Moon,
  Eye,
  MessageSquare,
  Download,
  UploadCloud,
  Database,
  Trash2,
  Lock,
  Bell,
} from "lucide-react";
import { smsPermissionService } from "@/services/SmsPermissionService";

import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/context/UserContext";
import { useTheme } from "next-themes";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import CurrencyCombobox from "@/components/currency/CurrencyCombobox";
import { LockedFeature } from "@/components/ui/locked-feature";
import { isBetaActive, handleLockedFeatureClick } from "@/utils/beta-utils";

import {
  updateCurrency as persistCurrency,
  getStoredTransactions,
  storeTransactions,
} from "@/utils/storage-utils";
import { convertTransactionsToCsv, parseCsvTransactions } from "@/utils/csv";
import { logAnalyticsEvent, logFirebaseOnlyEvent } from '@/utils/firebase-analytics';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { openAndroidAppPermissionsSettings, openAndroidNotificationSettings } from '@/lib/androidSettings';
import { Device } from '@capacitor/device';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Filesystem, Directory } from '@capacitor/filesystem';
import OTADebugSection from '@/components/settings/OTADebugSection';
import { appUpdateService } from '@/services/AppUpdateService';
import TemplateStatsSection from '@/components/settings/TemplateStatsSection';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { isAdminMode, activateAdminMode, deactivateAdminMode } from '@/utils/admin-utils';
import { isDefaultCurrencySet } from '@/utils/default-currency';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';
import { SMS_AUTO_IMPORT_ENABLED } from '@/lib/env';

const Settings = () => {
  const { toast } = useToast();
  const { user, updateUser } = useUser();

  const navigate = useNavigate();
  const { setTheme: setNextTheme } = useTheme();
  const [theme, setTheme] = useState<"light" | "dark" | "system">(
    user?.preferences?.theme || "light",
  );
  const [currency, setCurrency] = useState(
    user?.preferences?.currency || "SAR",
  );
  
  const [backgroundSmsEnabled, setBackgroundSmsEnabled] = useState(
    user?.preferences?.sms?.backgroundSmsEnabled || false,
  );
  const [autoImport, setAutoImport] = useState(
    user?.preferences?.sms?.autoImport || false,
  );
  const [weekStartsOn, setWeekStartsOn] = useState<
    "sunday" | "monday" | "saturday"
  >(user?.preferences?.displayOptions?.weekStartsOn || "sunday");

  // Beta features state
  const betaActive = isBetaActive();
  
  // App version state
  const [appVersion, setAppVersion] = useState<string>('');

  // SMS busy state for loading overlay
  const [smsBusy, setSmsBusy] = useState(false);
  const [smsBusyMessage, setSmsBusyMessage] = useState('');

  // Admin mode state
  const [adminMode, setAdminMode] = useState(() => isAdminMode());
  const [adminTapCount, setAdminTapCount] = useState(0);
  const [lastAdminTap, setLastAdminTap] = useState(0);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [adminPin, setAdminPin] = useState('');

  // Notification state
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.preferences?.notifications !== false
  );
  const [disablePermissionTarget, setDisablePermissionTarget] = useState<"sms" | null>(null);

  const handleVersionTap = () => {
    const now = Date.now();
    if (now - lastAdminTap < 500) {
      const newCount = adminTapCount + 1;
      setAdminTapCount(newCount);
      if (newCount >= 5) {
        setAdminTapCount(0);
        setShowPinDialog(true);
      }
    } else {
      setAdminTapCount(1);
    }
    setLastAdminTap(now);
  };

  const handlePinSubmit = () => {
    if (activateAdminMode(adminPin)) {
      setAdminMode(true);
      setShowPinDialog(false);
      setAdminPin('');
      toast({ title: 'Admin mode activated' });
    } else {
      toast({ title: 'Invalid PIN', variant: 'destructive' });
    }
  };

  const handleExitAdminMode = () => {
    deactivateAdminMode();
    setAdminMode(false);
    toast({ title: 'Admin mode deactivated' });
  };

  const { updateUserPreferences } = useUser();

  const isAndroid13OrAbove = async () => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return false;
    try {
      const deviceInfo = await Device.getInfo();
      const majorVersion = Number.parseInt((deviceInfo.osVersion || '0').split('.')[0], 10);
      return Number.isFinite(majorVersion) && majorVersion >= 13;
    } catch {
      return true;
    }
  };

  const checkNotificationPermission = async () => {
    if (!Capacitor.isNativePlatform()) return true;
    if (!(await isAndroid13OrAbove())) return true;
    const status = await LocalNotifications.checkPermissions();
    return status.display === 'granted';
  };

  // Track screen view
  useEffect(() => {
    logFirebaseOnlyEvent('view_settings', { timestamp: Date.now() });
  }, []);


  useEffect(() => {
    if (user?.preferences) {
      setTheme(user.preferences.theme || "light");
      setCurrency(user.preferences.currency || "SAR");
      if (user.preferences.sms) {
        const initialBg = user.preferences.sms.backgroundSmsEnabled || false;
        setBackgroundSmsEnabled(initialBg);
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
    const syncPermissionToggles = async () => {
      const [smsPermissionStatus, notificationPermissionStatus] = await Promise.all([
        smsPermissionService.checkPermissionStatus(),
        checkNotificationPermission(),
      ]);

      setBackgroundSmsEnabled(smsPermissionStatus.granted);
      setAutoImport(smsPermissionStatus.granted);
      setNotificationsEnabled(notificationPermissionStatus);
    };

    void syncPermissionToggles();
  }, []);

  useEffect(() => {
    const fetchVersion = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const info = await App.getInfo();
          setAppVersion(info.version || '...');

          const otaVersion = await Promise.race([
            appUpdateService.getCurrentVersion(),
            new Promise<string>((resolve) => setTimeout(() => resolve(''), 3000)),
          ]);
          if (otaVersion) {
            setAppVersion(otaVersion);
          }
        } catch {
          setAppVersion('...');
        }
      } else {
        try {
          const response = await fetch('https://xpensia-505ac.web.app/manifest.json');
          const manifest = await response.json();
          setAppVersion(manifest.version || '1.0.0');
        } catch (err) {
          console.error('[Settings] Failed to fetch manifest:', err);
          setAppVersion('1.0.0');
        }
      }
    };

    fetchVersion();
  }, []);

  const persistSettings = (overrides: {
    theme?: "light" | "dark" | "system";
    currency?: string;
    autoImport?: boolean;
    backgroundSmsEnabled?: boolean;
    weekStartsOn?: "sunday" | "monday" | "saturday";
  }) => {
    const updatedTheme = overrides.theme ?? theme;
    const updatedCurrency = overrides.currency ?? currency;
    const updatedAutoImport = overrides.autoImport ?? autoImport;
    const updatedBackgroundSmsEnabled = overrides.backgroundSmsEnabled ?? backgroundSmsEnabled;
    const updatedWeekStartsOn = overrides.weekStartsOn ?? weekStartsOn;

    updateUser({
      preferences: {
        ...user?.preferences,
        theme: updatedTheme,
        currency: updatedCurrency,
        sms: {
          ...user?.preferences?.sms,
          backgroundSmsEnabled: updatedBackgroundSmsEnabled,
          autoImport: updatedAutoImport,
        },
        displayOptions: {
          ...user?.preferences?.displayOptions,
          weekStartsOn: updatedWeekStartsOn,
        },
      },
    });

    setNextTheme(updatedTheme);
    persistCurrency(updatedCurrency);
    logAnalyticsEvent('settings_saved');
  };

  const handleThemeChange = (value: "light" | "dark" | "system") => {
    setTheme(value);
    persistSettings({ theme: value });
    logFirebaseOnlyEvent('theme_change', { theme: value });
  };

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
    persistSettings({ currency: value });
  };


  const updateWeekStartsOn = (value: "sunday" | "monday" | "saturday") => {
    setWeekStartsOn(value);
    persistSettings({ weekStartsOn: value });
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
          encoding: 'utf8' as unknown as import('@capacitor/filesystem').Encoding
        });
        toast({
          title: 'Export successful',
          description: `Saved to Documents/${fileName}`
        });
        return;
      }

      // Log export success
      logAnalyticsEvent('data_export', {
        count: transactions.length,
        platform: Capacitor.getPlatform()
      });

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

          const merged = [...existing, ...data];
          storeTransactions(merged);
          
          // Log import success
          logAnalyticsEvent('data_import', {
            imported_count: data.length,
            existing_count: existing.length,
            format: isCsv ? 'csv' : 'json'
          });
          
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

  return (
    <Layout showBack>
      <div className="px-1">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 pb-24 mt-2"
      >
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
            <CurrencyCombobox
              id="currency"
              value={currency}
              onChange={handleCurrencyChange}
            />
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

        {/* Alerts & Notifications */}
        <section className="space-y-4">
          <h2 className="flex items-center justify-center text-lg font-semibold">
            <Bell className="mr-2" size={20} />
            <span>Alerts & Notifications</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage how you get notified
          </p>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications-toggle">Transaction Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new expenses are detected from SMS
              </p>
            </div>
            <Switch
              id="notifications-toggle"
              checked={notificationsEnabled}
              onCheckedChange={async (checked) => {
                if (!checked) {
                  setNotificationsEnabled(false);
                  updateUserPreferences({ notifications: false });
                  if (Capacitor.isNativePlatform()) {
                    await openAndroidNotificationSettings();
                  }
                  return;
                }

                const alreadyGranted = await checkNotificationPermission();
                if (alreadyGranted) {
                  setNotificationsEnabled(true);
                  updateUserPreferences({ notifications: true });
                  return;
                }

                await LocalNotifications.requestPermissions();
                const grantedAfterRequest = await checkNotificationPermission();
                setNotificationsEnabled(grantedAfterRequest);
                updateUserPreferences({ notifications: grantedAfterRequest });
              }}
            />
          </div>
        </section>

        {/* SMS Import */}
        <section className="space-y-4">
          <h2 className="flex items-center justify-center text-lg font-semibold">
            <MessageSquare className="mr-2" size={20} />
            <span>SMS Import</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage SMS transaction importing
          </p>
          
          <LockedFeature
            isLocked={!betaActive}
            featureName="Read SMS Transactions"
            onLockedClick={() => handleLockedFeatureClick('Read SMS Transactions')}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-auto-import">
                  Read SMS Transactions
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow Xpensia to read your bank SMS messages and import transactions automatically
                </p>
              </div>
              <Switch
                id="sms-auto-import"
                checked={backgroundSmsEnabled}
                onCheckedChange={async (checked) => {
                  if (checked) {
                    const platform = Capacitor.getPlatform();
                    if (platform === 'web') {
                      setBackgroundSmsEnabled(true);
                      setAutoImport(true);
                      // Persist immediately on web
                      updateUserPreferences({
                        sms: { ...user?.preferences?.sms, autoImport: true, backgroundSmsEnabled: true }
                      });
                      return;
                    }

                    if (!isDefaultCurrencySet()) {
                      navigate('/set-default-currency');
                      return;
                    }

                    // Show spinner
                    setSmsBusy(true);
                    setSmsBusyMessage('Requesting SMS permission...');

                    try {
                      const currentStatus = await smsPermissionService.checkPermissionStatus();
                      if (!currentStatus.granted) {
                        await smsPermissionService.requestPermission();
                      }
                      
                      // Always re-check canonical permission status
                      const canonicalStatus = await smsPermissionService.checkPermissionStatus();
                      console.log('[Settings] SMS Auto-Import toggle canonical status:', canonicalStatus);

                      if (canonicalStatus.granted) {
                        setBackgroundSmsEnabled(true);
                        setAutoImport(true);

                        // PERSIST IMMEDIATELY - no Save button needed
                        updateUserPreferences({
                          sms: { ...user?.preferences?.sms, autoImport: true, backgroundSmsEnabled: true }
                        });

                        // Initialize listener and trigger initial import
                        setSmsBusyMessage('Importing SMS messages...');
                        try {
                          console.log('[Settings] (toggle) Initializing SMS listener and triggering import...');
                          await smsPermissionService.initSmsListener();
                          const SmsImportService = (await import('@/services/SmsImportService')).default;
                          await new Promise(r => setTimeout(r, 500)); // Small delay for listener ready
                          if (!SMS_AUTO_IMPORT_ENABLED) {
                            console.log('[SMS_IMPORT] disabled -> skipping settings-triggered import');
                          } else {
                            await SmsImportService.checkForNewMessages(navigate, { auto: false, usePermissionDate: true });
                          }
                          console.log('[Settings] (toggle) Initial SMS import triggered');
                        } catch (e) {
                          console.warn('[Settings] (toggle) Error during import:', e);
                        }

                        toast({
                          title: 'SMS Auto-Import Enabled! 🎉',
                          description: 'Your transactions will now be imported automatically.'
                        });
                      } else {
                        if (canonicalStatus.permanentlyDenied) {
                          toast({
                            title: 'SMS permission permanently denied',
                            description:
                              'Enable SMS permissions in your device Settings > Apps > Xpensia > Permissions to use SMS auto-import.',
                            variant: 'destructive',
                          });
                        }
                      }
                    } catch (e) {
                      console.warn('[Settings] SMS toggle error:', e);
                    } finally {
                      setSmsBusy(false);
                      setSmsBusyMessage('');
                    }
                  } else {
                    setDisablePermissionTarget('sms');
                  }
                }}
                disabled={!betaActive}
              />
            </div>
          </LockedFeature>
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

          <LockedFeature
            isLocked={!betaActive}
            featureName="Import Data"
            onLockedClick={() => handleLockedFeatureClick('Import Data')}
          >
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
          </LockedFeature>



        </section>

        {/* Template Stats Section - admin only */}
        {adminMode && <TemplateStatsSection />}

        <section className="bg-card rounded-lg p-4 mt-6">
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground cursor-default select-none bg-transparent border-0 p-0"
              onClick={handleVersionTap}
            >
              Version {appVersion || '...'}
            </button>
            {adminMode && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Admin Mode
                </Badge>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleExitAdminMode}>
                  Exit
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* OTA Debug Section - admin only, native only */}
        {adminMode && <OTADebugSection />}

        {/* Admin PIN Dialog */}
        <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Enter Admin PIN</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="password"
                inputMode="numeric"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="Enter PIN"
                onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
              />
              <Button onClick={handlePinSubmit} className="w-full">
                Unlock
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </motion.div>
      </div>
      

      <AlertDialog open={disablePermissionTarget !== null} onOpenChange={(open) => { if (!open) setDisablePermissionTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Permission</AlertDialogTitle>
            <AlertDialogDescription>
              Android requires you to disable this permission in system settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await openAndroidAppPermissionsSettings();
                setDisablePermissionTarget(null);
              }}
            >
              Open Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LoadingOverlay isOpen={smsBusy} message={smsBusyMessage} />
    </Layout>
  );
};

export default Settings;
