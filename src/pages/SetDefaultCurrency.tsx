import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/UserContext';
import { toast } from '@/components/ui/use-toast';
import { getAvailableCurrencyOptions } from '@/lib/currency-utils';
import { getDefaultCurrency, markDefaultCurrencySelectionCompleted } from '@/utils/default-currency';

const SetDefaultCurrency: React.FC = () => {
  const navigate = useNavigate();
  const { updateCurrency } = useUser();
  const [selectedCurrency, setSelectedCurrency] = React.useState<string>(() => getDefaultCurrency() ?? '');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  const allCurrencies = React.useMemo(() => getAvailableCurrencyOptions(), []);

  const filteredCurrencies = React.useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return allCurrencies;

    return allCurrencies.filter((currency) => {
      const searchable = `${currency.code} ${currency.name} ${currency.country}`.toLowerCase();
      return searchable.includes(normalizedSearch);
    });
  }, [allCurrencies, searchTerm]);

  React.useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let backListener: { remove: () => void } | null = null;

    CapacitorApp.addListener('backButton', () => {
      toast({
        title: 'Default currency required',
        description: 'Please select a default currency to continue.',
      });
    }).then((listener) => {
      backListener = listener;
    });

    return () => {
      backListener?.remove();
    };
  }, []);

  const handleSave = async () => {
    if (!selectedCurrency || isSaving) return;

    setIsSaving(true);

    try {
      updateCurrency(selectedCurrency as Parameters<typeof updateCurrency>[0]);
      markDefaultCurrencySelectionCompleted();
      navigate('/home', { replace: true });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <div className="sticky top-0 z-10 space-y-3 border-b bg-background p-4">
        <Button onClick={handleSave} disabled={!selectedCurrency || isSaving} className="w-full">
          {isSaving ? 'Saving...' : 'Save & Continue'}
        </Button>
        <Input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by code or currency"
          aria-label="Search currency"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {filteredCurrencies.map((currency) => (
            <label
              key={`${currency.code}-${currency.countryCode}`}
              className="flex cursor-pointer items-center gap-3 rounded-md border p-3"
            >
              <input
                type="radio"
                name="default-currency"
                value={currency.code}
                checked={selectedCurrency === currency.code}
                onChange={() => setSelectedCurrency(currency.code)}
                className="size-4"
              />
              <span className="text-xl" aria-hidden>
                {currency.flag}
              </span>
              <span className="min-w-[52px] font-semibold">{currency.code}</span>
              <span className="text-sm text-muted-foreground">{currency.country}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SetDefaultCurrency;
