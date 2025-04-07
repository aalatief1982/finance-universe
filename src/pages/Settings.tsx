import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { ArrowLeft, Moon, Sun, Bell, Languages } from 'lucide-react';
import Layout from '@/components/Layout';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getEffectiveCurrency, setPreferredCurrency, getPreferredLanguage, setPreferredLanguage } from '@/context/user/preferences-utils';
import { ThemeOption, CurrencyOption } from '@/context/user/types';
import { SUPPORTED_LANGUAGES } from '@/utils/locale/settings';

const Settings = () => {
  const navigate = useNavigate();
  const { user, updateUser, updateTheme, updateCurrency, updateLanguage } = useUser();
  const [theme, setTheme] = useState<ThemeOption>(user?.preferences?.theme || 'system');
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.preferences?.notifications || false);
  const [currency, setCurrency] = useState<CurrencyOption>(getEffectiveCurrency(user) as CurrencyOption || 'USD');
  const [language, setLanguage] = useState(getPreferredLanguage(user) || 'en');
  const { toast } = useToast();
  
  const handleThemeChange = (newTheme: ThemeOption) => {
    setTheme(newTheme);
    updateTheme(newTheme);
    
    // Show toast notification
    toast({
      title: "Theme updated",
      description: `Theme set to ${newTheme}`,
    });
  };
  
  const handleNotificationsChange = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    updateUser({ preferences: { ...user?.preferences, notifications: enabled } });
    
    // Show toast notification
    toast({
      title: "Notification settings updated",
      description: `Notifications ${enabled ? 'enabled' : 'disabled'}`,
    });
  };
  
  const handleCurrencyChange = (currencyValue: string) => {
    // Type guard to ensure value is a valid currency option
    const isValidCurrency = (value: string): value is CurrencyOption => {
      return ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'].includes(value);
    };
    
    if (isValidCurrency(currencyValue)) {
      setCurrency(currencyValue);
      updateCurrency(currencyValue);
    } else {
      // Default to USD if invalid currency selected
      setCurrency('USD');
      updateCurrency('USD');
      console.warn(`Invalid currency selected: ${currencyValue}`);
    }
  };
  
  const handleLanguageChange = (languageCode: string) => {
    setLanguage(languageCode);
    updateLanguage(languageCode);
    
    // Show toast notification
    toast({
      title: "Language updated",
      description: `Language set to ${languageCode}`,
    });
  };
  
  const handleBack = () => {
    navigate(-1);
  };
  
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto space-y-6"
      >
        <div className="flex items-center justify-between">
          <button 
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-secondary"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Settings</h1>
          <div className="w-8"></div>
        </div>
        
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Theme</h2>
            <p className="text-sm text-muted-foreground">
              Adjust the appearance of the app to your preference.
            </p>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </SelectItem>
                <SelectItem value="dark">
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </SelectItem>
                <SelectItem value="system">
                  <Sun className="mr-2 h-4 w-4" />
                  System
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-1">Notifications</h2>
            <p className="text-sm text-muted-foreground">
              Enable or disable push notifications for important updates.
            </p>
            <div className="flex items-center justify-between mt-3">
              <Label htmlFor="notifications">Receive Notifications</Label>
              <Switch 
                id="notifications" 
                checked={notificationsEnabled} 
                onCheckedChange={handleNotificationsChange} 
              />
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-1">Currency</h2>
            <p className="text-sm text-muted-foreground">
              Set your preferred currency for displaying amounts.
            </p>
            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="JPY">JPY</SelectItem>
                <SelectItem value="CAD">CAD</SelectItem>
                <SelectItem value="AUD">AUD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-1">Language</h2>
            <p className="text-sm text-muted-foreground">
              Choose your preferred language for the app interface.
            </p>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="bg-secondary p-4 rounded-lg text-sm">
          <p className="font-medium mb-1">Data Privacy</p>
          <p className="text-muted-foreground">
            Your settings are stored securely and used to personalize your experience.
          </p>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Settings;
