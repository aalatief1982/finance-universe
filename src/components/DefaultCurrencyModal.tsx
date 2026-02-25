import React from 'react';
import { BadgeDollarSign } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CURRENCIES } from '@/lib/categories-data';

interface DefaultCurrencyModalProps {
  open: boolean;
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  onSave: () => void;
}

const CURRENCY_FLAGS: Record<string, string> = {
  SAR: '🇸🇦',
  EGP: '🇪🇬',
  USD: '🇺🇸',
  BHD: '🇧🇭',
  AED: '🇦🇪',
};

const DefaultCurrencyModal: React.FC<DefaultCurrencyModalProps> = ({
  open,
  selectedCurrency,
  onCurrencyChange,
  onSave,
}) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        className="w-[calc(100%-2rem)] max-w-sm"
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Set your default currency to continue</AlertDialogTitle>
          <AlertDialogDescription>
            This is required before we can start tracking. All dashboard totals and reports will use
            this currency by default.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 rounded-md border border-primary/20 bg-primary/5 p-3">
          <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
            <SelectTrigger id="default-currency-gate-select">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-background text-sm" aria-hidden>
                  {selectedCurrency ? CURRENCY_FLAGS[selectedCurrency] ?? '💱' : <BadgeDollarSign className="h-4 w-4" />}
                </span>
                <SelectValue placeholder="Select currency" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <AlertDialogFooter>
          <Button onClick={onSave} disabled={!selectedCurrency} className="w-full">
            Save &amp; Continue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DefaultCurrencyModal;
