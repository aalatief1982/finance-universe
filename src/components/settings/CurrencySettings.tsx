/**
 * @file CurrencySettings.tsx
 * @description Settings section for CurrencySettings.
 *
 * @module components/settings/CurrencySettings
 *
 * @responsibilities
 * 1. Render settings controls and labels
 * 2. Persist setting changes via callbacks/services
 * 3. Provide validation or feedback where required
 *
 * @review-tags
 * - @ui: settings state wiring
 *
 * @review-checklist
 * - [ ] Settings state reflects stored preferences
 * - [ ] Changes are persisted or bubbled up
 */

import React, { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';
import CurrencySelect from '@/components/currency/CurrencySelect';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { SupportedCurrency } from '@/types/locale';
import { getUserSettings, updateCurrency } from '@/utils/storage-utils';

const CurrencySettings = () => {
  const [currency, setCurrency] = useState<SupportedCurrency>('USD');

  useEffect(() => {
    const userSettings = getUserSettings();
    setCurrency(userSettings.currency as SupportedCurrency);
  }, []);

  const handleCurrencyChange = (newCurrency: SupportedCurrency) => {
    setCurrency(newCurrency);
    updateCurrency(newCurrency);
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Coins className="mr-2" size={20} />
          <span>Currency Settings</span>
        </CardTitle>
        <CardDescription>Change your preferred currency</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <CurrencySelect
            id="currency"
            value={currency}
            onValueChange={handleCurrencyChange}
            placeholder="Select currency"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrencySettings;
