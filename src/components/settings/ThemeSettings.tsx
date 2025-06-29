
// ThemeSettings.tsx
import React from 'react';
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sun, Moon } from 'lucide-react';
import { getUserSettings, storeUserSettings } from '@/utils/storage-utils';

const ThemeSettings = () => {
  const { theme, setTheme } = useTheme() || { theme: 'light', setTheme: () => {} };
  
  const handleThemeChange = (isDark: boolean) => {
    const newTheme = isDark ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Update user settings in local storage
    const userSettings = getUserSettings();
    storeUserSettings({
      ...userSettings,
      theme: newTheme
    });
  };
  
  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sun className="me-2" size={20} />
          <span>Appearance</span>
        </CardTitle>
        <CardDescription>Customize how the application looks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun size={18} className="text-muted-foreground" />
            <Label htmlFor="dark-mode">Dark Mode</Label>
            <Moon size={18} className="text-muted-foreground" />
          </div>
          <Switch 
            id="dark-mode" 
            checked={theme === 'dark'}
            onCheckedChange={handleThemeChange}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeSettings;
