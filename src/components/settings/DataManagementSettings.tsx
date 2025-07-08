
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, UploadCloud, Database } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getStoredTransactions, storeTransactions } from '@/utils/storage-utils';
import { convertTransactionsToCsv, parseCsvTransactions } from '@/utils/csv';
import { exportCsvViaShare } from '@/utils/export-utils';

const DataManagementSettings = () => {
  const { toast } = useToast();
  
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

      try {
        const didShare = await exportCsvViaShare(csv);
        if (!didShare) {
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);

          const downloadAnchorNode = document.createElement('a');
          downloadAnchorNode.href = url;
          downloadAnchorNode.download = 'transactions.csv';
          document.body.appendChild(downloadAnchorNode);
          downloadAnchorNode.click();
          downloadAnchorNode.remove();
          URL.revokeObjectURL(url);
        }

        toast({
          title: "Export successful",
          description: "Your data has been exported successfully.",
        });
      } catch (err) {
        toast({
          title: "Export failed",
          description: "An error occurred while exporting your data.",
          variant: "destructive",
        });
      }
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
        </div>
      </CardContent>
    </Card>
  );
};

export default DataManagementSettings;
