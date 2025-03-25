
import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Download, UploadCloud, RefreshCw, Shield, Sun, Moon, Trash } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Settings = () => {
  const { toast } = useToast();
  
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
  
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        
        <div className="grid grid-cols-1 gap-6">
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sun className="mr-2" size={20} />
                <span>Appearance</span>
              </CardTitle>
              <CardDescription>Customize how the application looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <Switch id="dark-mode" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="theme">Currency</Label>
                <Select defaultValue="usd">
                  <SelectTrigger id="theme" className="w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                    <SelectItem value="gbp">GBP (£)</SelectItem>
                    <SelectItem value="jpy">JPY (¥)</SelectItem>
                    <SelectItem value="cad">CAD (C$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
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
                <Button variant="outline" className="gap-2">
                  <UploadCloud size={16} />
                  Import
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sync Frequency</p>
                  <p className="text-sm text-muted-foreground">How often data should be synchronized</p>
                </div>
                <Select defaultValue="realtime">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
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
            </CardContent>
          </Card>
          
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-destructive">
                <Trash className="mr-2" size={20} />
                <span>Danger Zone</span>
              </CardTitle>
              <CardDescription>Irreversible actions that affect your account</CardDescription>
            </CardHeader>
            <CardContent>
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
        </div>
      </motion.div>
    </Layout>
  );
};

export default Settings;
