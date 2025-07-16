
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, UploadCloud, Database, Trash2, Lock, Unlock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { demoTransactionService } from '@/services/DemoTransactionService';
import { useToast } from '@/hooks/use-toast';
import { getStoredTransactions, storeTransactions } from '@/utils/storage-utils';
import { convertTransactionsToCsv, parseCsvTransactions } from '@/utils/csv';
import { logAnalyticsEvent } from '@/utils/firebase-analytics';

const DataManagementSettings = () => {
  const { toast } = useToast();
  const [betaDialogOpen, setBetaDialogOpen] = useState(false);
  const [betaCode, setBetaCode] = useState('');
  const [isBetaActive, setIsBetaActive] = useState(() => {
    return localStorage.getItem('betaFeaturesActive') === 'true';
  });
  
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

          const existing = getStoredTransactions();
          const confirmImport = window.confirm(
            `This will add ${data.length} transactions to your existing ${existing.length}. Continue?`
          );

          if (!confirmImport) return;

          const merged = [...existing, ...(data as any[])];
          storeTransactions(merged as any);
          toast({
            title: "Import successful",
            description: `Added ${data.length} transactions successfully.`,
          });
          setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
          toast({
            title: "Import failed",
            description: "Failed to parse the imported file. Make sure it's a valid JSON or CSV file.",
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
      
      // Log clear sample data event
      logAnalyticsEvent('clear_sample_data', {
        success: true
      });
      
      toast({
        title: 'Sample data cleared',
        description: 'Demo transactions have been removed.',
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      logAnalyticsEvent('clear_sample_data', {
        success: false,
        error: error.message
      });
      
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
      
      // Log beta activation event
      logAnalyticsEvent('activate_beta', {
        success: true
      });
      
      toast({
        title: "🎉 Beta Features Activated!",
        description: "You now have access to all beta features including Budget and Import SMS.",
      });
    } else {
      logAnalyticsEvent('activate_beta', {
        success: false,
        invalid_code: true
      });
      
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
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2" size={20} />
          <span>Data Management</span>
        </CardTitle>
        <CardDescription>Manage your data and privacy settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <Button variant="outline" onClick={handleImportData} className="gap-2">
              <UploadCloud size={16} />
              Import
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Clear Sample Data</p>
              <p className="text-sm text-muted-foreground">Remove seeded demo transactions</p>
            </div>
            <Button variant="outline" onClick={handleClearSampleData} className="gap-2 text-destructive">
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
        </div>
      </CardContent>
    </Card>
  );
};

export default DataManagementSettings;
