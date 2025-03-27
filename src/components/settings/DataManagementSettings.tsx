// DataManagementSettings.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Download, UploadCloud, RefreshCw, Shield, Trash } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getUserSettings, storeUserSettings, backupData, restoreData, clearAllData } from '@/utils/storage-utils';

const DataManagementSettings = () => {
  const { toast } = useToast();
  const [autoBackup, setAutoBackup] = useState(false);
  const [backupFrequency, setBackupFrequency] = useState<string>('weekly');
  const [dataRetention, setDataRetention] = useState<string>('forever');
  
  useEffect(() => {
    // Get user settings on component mount
    const userSettings = getUserSettings();
    setAutoBackup(userSettings.dataManagement?.autoBackup === true);
    setBackupFrequency(userSettings.dataManagement?.backupFrequency || 'weekly');
    setDataRetention(userSettings.dataManagement?.dataRetention || 'forever');
  }, []);
  
  const handleAutoBackupToggle = (enabled: boolean) => {
    setAutoBackup(enabled);
    
    // Update user settings
    const userSettings = getUserSettings();
    storeUserSettings({
      ...userSettings,
      dataManagement: {
        ...userSettings.dataManagement,
        autoBackup: enabled
      }
    });
  };
  
  const handleBackupFrequencyChange = (frequency: string) => {
    setBackupFrequency(frequency);
    
    // Update user settings
    const userSettings = getUserSettings();
    storeUserSettings({
      ...userSettings,
      dataManagement: {
        ...userSettings.dataManagement,
        backupFrequency: frequency
      }
    });
  };
  
  const handleDataRetentionChange = (retention: string) => {
    setDataRetention(retention);
    
    // Update user settings
    const userSettings = getUserSettings();
    storeUserSettings({
      ...userSettings,
      dataManagement: {
        ...userSettings.dataManagement,
        dataRetention: retention
      }
    });
  };
  
  const handleExportData = () => {
    try {
      // Create data backup
      const backupString = backupData();
      
      if (!backupString) {
        toast({
          title: "No data to export",
          description: "You don't have any data to export.",
          variant: "destructive",
        });
        return;
      }
      
      // Create download link
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(backupString);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      
      // Create filename with current date
      const date = new Date().toISOString().split('T')[0];
      downloadAnchorNode.setAttribute("download", `expense-tracker-backup-${date}.json`);
      
      // Trigger download
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
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
    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (!target.files?.length) return;
      
      const file = target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const result = event.target?.result as string;
          const success = restoreData(result);
          
          if (success) {
            toast({
              title: "Import successful",
              description: "Your data has been imported successfully.",
            });
            // Reload page to reflect changes
            window.location.reload();
          } else {
            toast({
              title: "Import failed",
              description: "The backup file couldn't be processed.",
              variant: "destructive",
            });
          }
        } catch (error) {
          toast({
            title: "Import failed",
            description: "An error occurred while importing your data.",
            variant: "destructive",
          });
        }
      };
      
      reader.readAsText(file);
    };
    
    // Trigger file selection
    fileInput.click();
  };
  
  const handleResetData = () => {
    try {
      clearAllData();
      toast({
        title: "Data reset successful",
        description: "All your data has been reset.",
      });
      // Reload page to reflect changes
      window.location.reload();
    } catch (error) {
      toast({
        title: "Reset failed",
        description: "An error occurred while resetting your data.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2" size={20} />
          <span>Data Management</span>
        </CardTitle>
        <CardDescription>Manage your data and privacy settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Automatic Backups</p>
            <p className="text-sm text-muted-foreground">Regularly back up your data</p>
          </div>
          <Switch
            checked={autoBackup}
            onCheckedChange={handleAutoBackupToggle}
          />
        </div>
        
        {autoBackup && (
          <div className="flex items-center justify-between pl-6">
            <Label htmlFor="backup-frequency">Backup Frequency</Label>
            <Select value={backupFrequency} onValueChange={handleBackupFrequencyChange}>
              <SelectTrigger id="backup-frequency" className="w-[150px]">
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
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Data Retention</p>
            <p className="text-sm text-muted-foreground">How long to keep your transaction history</p>
          </div>
          <Select value={dataRetention} onValueChange={handleDataRetentionChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">3 months</SelectItem>
              <SelectItem value="6months">6 months</SelectItem>
              <SelectItem value="1year">1 year</SelectItem>
              <SelectItem value="forever">Forever</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="pt-4 space-y-4">
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
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full gap-2 mt-4">
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
        </div>
      </CardContent>
    </Card>
  );
};

export default DataManagementSettings;
