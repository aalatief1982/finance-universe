
// CurrencySettings.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign } from 'lucide-react';
import { getUserSettings, storeUserSettings, updateCurrency } from '@/utils/storage-utils';
import { SupportedCurrency } from '@/types/locale';
import { getAllCurrencies } from '@/utils/locale';

const CurrencySettings = () => {
  const [currency, setCurrency] = useState<SupportedCurrency>('USD');
  const [currencies, setCurrencies] = useState<Array<{code: SupportedCurrency, name: string, symbol: string}>>([]);
  
  useEffect(() => {
    // Get user settings on component mount
    const userSettings = getUserSettings();
    setCurrency(userSettings.currency as SupportedCurrency);
    
    // Get all available currencies
    const allCurrencies = getAllCurrencies();
    setCurrencies(allCurrencies.map(curr => ({
      code: curr.code,
      name: curr.name,
      symbol: curr.symbol
    })));
  }, []);
  
  const handleCurrencyChange = (newCurrency: SupportedCurrency) => {
    setCurrency(newCurrency);
    
    // Update currency in locale settings and user preferences
    updateCurrency(newCurrency);
  };
  
  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="me-2" size={20} />
          <span>Currency Settings</span>
        </CardTitle>
        <CardDescription>Change your preferred currency</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select value={currency} onValueChange={handleCurrencyChange}>
            <SelectTrigger id="currency" className="w-full">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map(curr => (
                <SelectItem key={curr.code} value={curr.code}>
                  {curr.symbol} {curr.name} ({curr.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrencySettings;
