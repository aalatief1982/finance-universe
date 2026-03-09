/**
 * @file ExchangeRates.tsx
 * @description Full CRUD page for managing exchange rates.
 *
 * @module pages/ExchangeRates
 */

import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, ArrowRightLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ResponsiveFAB from '@/components/dashboard/ResponsiveFAB';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getUserSettings } from '@/utils/storage-utils';
import { ExchangeRate } from '@/models/exchange-rate';
import {
  getAllExchangeRates,
  deleteExchangeRate,
} from '@/services/ExchangeRateService';
import ExchangeRateDialog from '@/components/fx/ExchangeRateDialog';
import { toast } from '@/components/ui/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';

const ExchangeRates: React.FC = () => {
  const { t, language } = useLanguage();
  const baseCurrency = getUserSettings()?.currency || 'SAR';

  const [rates, setRates] = useState<ExchangeRate[]>(() => getAllExchangeRates());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ExchangeRate | undefined>();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rateToDelete, setRateToDelete] = useState<ExchangeRate | null>(null);

  const refreshRates = () => {
    setRates(getAllExchangeRates());
  };

  // Group rates by currency pair
  const groupedRates = useMemo(() => {
    const groups: Record<string, ExchangeRate[]> = {};
    rates.forEach((rate) => {
      const key = `${rate.fromCurrency}:${rate.toCurrency}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(rate);
    });
    // Sort each group by effective date descending
    Object.values(groups).forEach((group) => {
      group.sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
    });
    return groups;
  }, [rates]);

  const handleAddNew = () => {
    setEditingRate(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (rate: ExchangeRate) => {
    setEditingRate(rate);
    setDialogOpen(true);
  };

  const handleDeleteClick = (rate: ExchangeRate) => {
    setRateToDelete(rate);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (rateToDelete) {
      const success = deleteExchangeRate(rateToDelete.id);
      if (success) {
        toast({ title: t('exchangeRates.deleted'), description: '' });
        refreshRates();
      } else {
        toast({ title: t('exchangeRates.updateFailed'), description: t('common.tryAgain'), variant: 'destructive' });
      }
    }
    setDeleteConfirmOpen(false);
    setRateToDelete(null);
  };

  const handleSave = () => {
    refreshRates();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Layout withPadding={false} fullWidth>
      <div className="container px-1">
        <div className="px-[var(--page-padding-x)] pt-2 pb-24 space-y-4">

          {Object.keys(groupedRates).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ArrowRightLeft className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('exchangeRates.noRates')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('exchangeRates.addRatesToConvert')} {baseCurrency}
                </p>
                <Button onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t('exchangeRates.addFirstRate')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedRates).map(([pairKey, pairRates]) => {
              const [from, to] = pairKey.split(':');
              return (
                <Card key={pairKey}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="font-mono">{from}</span>
                      <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono">{to}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({pairRates.length} rate{pairRates.length !== 1 ? 's' : ''})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pairRates.map((rate, index) => (
                      <div
                        key={rate.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          index === 0 ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              1 {from} = {rate.rate.toFixed(4)} {to}
                            </span>
                            {index === 0 && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                {t('exchangeRates.latest')}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t('exchangeRates.effective')}: {formatDate(rate.effectiveDate)}
                            {rate.notes && ` • ${rate.notes}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(rate)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(rate)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <ExchangeRateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        existingRate={editingRate}
        onSave={handleSave}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('exchangeRates.deleteRate')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('exchangeRates.deleteRateDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>{t('exchangeRates.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ResponsiveFAB onClick={handleAddNew} />
    </Layout>
  );
};

export default ExchangeRates;
