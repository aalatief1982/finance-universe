/**
 * @file DataManagementSettings.tsx
 * @description Settings section for DataManagementSettings.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, UploadCloud, Database, Unlock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getStoredTransactions, storeTransactions } from '@/utils/storage-utils';
import { convertTransactionsToCsv, parseCsvTransactions } from '@/utils/csv';
import { logAnalyticsEvent } from '@/utils/firebase-analytics';
import { useLanguage } from '@/i18n/LanguageContext';

const DataManagementSettings = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
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
          title: t('toast.noDataToExport'),
          description: t('toast.noDataToExportDesc'),
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
        title: t('toast.exportSuccessful'),
        description: t('toast.exportedDesc'),
      });
    } catch (error) {
      toast({
        title: t('toast.exportFailed'),
        description: t('toast.exportFailedDesc'),
        variant: "destructive",
      });
    }
  };
  
  const handleImportData = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    
    fileInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (!target.files?.length) return;
      
      const file = target.files[0];
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.json')) {
        toast({
          title: t('toast.importFailed'),
          description: 'JSON transaction imports are disabled. Please import a CSV file.',
          variant: 'destructive',
        });
        return;
      }

      if (!fileName.endsWith('.csv')) {
        toast({
          title: t('toast.importFailed'),
          description: 'Only CSV transaction imports are supported.',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const data = parseCsvTransactions(text);

          if (!Array.isArray(data) || data.length === 0) {
            throw new Error('No valid transactions');
          }

          const existing = getStoredTransactions();
          const confirmImport = window.confirm(
            t('dataMgmt.importConfirm').replace('{count}', String(data.length)).replace('{existing}', String(existing.length))
          );

          if (!confirmImport) return;

          const merged = [...existing, ...data];
          storeTransactions(merged);
          toast({
            title: t('toast.importSuccessful'),
            description: t('toast.importSuccessfulDesc'),
          });
          window.dispatchEvent(new StorageEvent('storage', { key: 'xpensia_transactions' }));
        } catch (error) {
          toast({
            title: t('toast.importFailed'),
            description: t('toast.importFailedDesc'),
            variant: "destructive",
          });
        }
      };

      reader.readAsText(file);
    };
    
    fileInput.click();
  };

  const handleBetaCodeSubmit = () => {
    if (betaCode === '0599572215') {
      localStorage.setItem('betaFeaturesActive', 'true');
      setIsBetaActive(true);
      setBetaDialogOpen(false);
      setBetaCode('');
      
      logAnalyticsEvent('activate_beta', { success: true });
      
      toast({
        title: t('toast.betaActivated'),
        description: t('toast.betaActivatedDesc'),
      });
    } else {
      logAnalyticsEvent('activate_beta', { success: false, invalid_code: true });
      
      toast({
        title: t('toast.invalidBetaCode'),
        description: t('toast.invalidBetaCodeDesc'),
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
          <Database className="ltr:mr-2 rtl:ml-2" size={20} />
          <span>{t('dataMgmt.title')}</span>
        </CardTitle>
        <CardDescription>{t('dataMgmt.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Export Transactions</p>
              <p className="text-sm text-muted-foreground">{t('dataMgmt.exportDataDesc')}</p>
            </div>
            <Button variant="outline" onClick={handleExportData} className="gap-2">
              <Download size={16} />
              Export Transactions
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Import Transactions</p>
              <p className="text-sm text-muted-foreground">{t('dataMgmt.importDataDesc')}</p>
            </div>
            <Button variant="outline" onClick={handleImportData} className="gap-2">
              <UploadCloud size={16} />
              Import Transactions
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('dataMgmt.betaFeatures')}</p>
              <p className="text-sm text-muted-foreground">
                {isBetaActive ? t('dataMgmt.betaActive') : t('dataMgmt.unlockBeta')}
              </p>
            </div>
            {isBetaActive ? (
              <div className="flex items-center text-green-600">
                <Unlock className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                <span className="text-sm font-medium">{t('dataMgmt.active')}</span>
              </div>
            ) : (
              <Dialog open={betaDialogOpen} onOpenChange={setBetaDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">{t('dataMgmt.activateBeta')}</Button>
                </DialogTrigger>
                <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85dvh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t('dataMgmt.enterBetaCode')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="betaCode">{t('dataMgmt.betaCode')}</Label>
                      <Input
                        id="betaCode"
                        value={betaCode}
                        onChange={(e) => setBetaCode(e.target.value)}
                        placeholder={t('dataMgmt.enterBetaCodePlaceholder')}
                      />
                    </div>
                    <Button onClick={handleBetaCodeSubmit} className="w-full">
                      {t('dataMgmt.activateFeatures')}
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
