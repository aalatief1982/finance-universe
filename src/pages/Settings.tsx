import React, { useEffect, useState } from "react";
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
  Sun,
  Moon,
  Trash,
  Bell,
  Eye,
  MessageSquare,
  Download,
  UploadCloud,
  Database,
  Mail,
} from "lucide-react";
import { smsPermissionService } from "@/services/SmsPermissionService";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/context/UserContext";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CURRENCIES } from "@/lib/categories-data";
import FeedbackButton from "@/components/FeedbackButton";
import {
  updateCurrency as persistCurrency,
  getStoredTransactions,
  storeTransactions,
} from "@/utils/storage-utils";
import { convertTransactionsToCsv, parseCsvTransactions } from "@/utils/csv";
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';

const Settings = () => {
  const { toast } = useToast();
  const {
    user,
    updateTheme,
    updateCurrency,
    updateDisplayOptions,
    updateUserPreferences,
    getEffectiveTheme,
  } = useUser();

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
  const [autoImport, setAutoImport] = useState(
    user?.preferences?.sms?.autoImport || false,
  );
  const [weekStartsOn, setWeekStartsOn] = useState<
    "sunday" | "monday" | "saturday"
  >(user?.preferences?.displayOptions?.weekStartsOn || "sunday");

  // Initialize values from user context on component mount
  useEffect(() => {
    if (user?.preferences) {
      setTheme(user.preferences.theme || "light");
      setCurrency(user.preferences.currency || "USD");
      if (user.preferences.sms) {
        setBackgroundSmsEnabled(
          user.preferences.sms.backgroundSmsEnabled || false,
        );
        setAutoImport(user.preferences.sms.autoImport || false);
      }

      if (user.preferences.displayOptions) {
        setWeekStartsOn(
          user.preferences.displayOptions.weekStartsOn || "sunday",
        );
      }
    }
  }, [user]);

  // Handlers for settings changes
  const handleThemeChange = (value: "light" | "dark" | "system") => {
    setTheme(value);
  };

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
  };


  const handleBackgroundSmsChange = async (checked: boolean) => {

    if (checked) {
      let granted = await smsPermissionService.hasPermission();
      if (!granted) {
        granted = await smsPermissionService.requestPermission();
      }

      if (!granted) {
        alert("SMS permission is required to read messages in the background.");
        setBackgroundSmsEnabled(false);
        return;
      }
    }

    setBackgroundSmsEnabled(checked);
  };

  const handleSaveSettings = () => {
    // Consolidate all preference updates into a single call to prevent multiple toasts
    updateUserPreferences({
      theme,
      currency,
      sms: { ...user?.preferences?.sms, backgroundSmsEnabled, autoImport },
      displayOptions: { ...user?.preferences?.displayOptions, weekStartsOn }
    });
    
    // Persist currency separately for compatibility
    persistCurrency(currency);

    FirebaseAnalytics.logEvent({ name: 'settings_saved' });

    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
  };

  const updateWeekStartsOn = (value: "sunday" | "monday" | "saturday") => {
    setWeekStartsOn(value);
  };

  const handleExportData = () => {
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
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.href = url;
      downloadAnchorNode.download = "transactions.csv";
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Your data has been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "An error occurred while exporting your data.",
        variant: "destructive",
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

  return (
    <Layout showBack>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 pb-24"
      >
        <Button className="w-full mb-2" onClick={handleSaveSettings}>
          Save Settings
        </Button>
        <section className="space-y-4">
          <h2 className="flex items-center text-lg font-semibold">
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
          <h2 className="flex items-center text-lg font-semibold">
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
          <h2 className="flex items-center text-lg font-semibold">
            <Bell className="mr-2" size={20} />
            <span>Notification Settings</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage notification preferences
          </p>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="background-sms">
                Enable Background SMS Reading
              </Label>
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
        </section>
        <section className="space-y-4">
          <h2 className="flex items-center text-lg font-semibold">
            <MessageSquare className="mr-2" size={20} />
            <span>SMS Import</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Automatically import new SMS messages
          </p>
          <div className="flex items-center justify-between">
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
          <h2 className="flex items-center text-lg font-semibold">
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
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center text-lg font-semibold">
            <Mail className="mr-2" size={20} />
            <span>Feedback</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Tell us what you think about the app
          </p>
          <FeedbackButton className="w-full" />
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center text-lg font-semibold text-destructive">
            <Trash className="mr-2" size={20} />
            <span>Danger Zone</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Irreversible actions that affect your data
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove all your data from our servers.
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
        </section>
      </motion.div>
    </Layout>
  );
};

export default Settings;
