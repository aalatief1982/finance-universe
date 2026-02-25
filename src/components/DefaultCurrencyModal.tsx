import React from 'react';
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
          <AlertDialogTitle>Choose your default currency</AlertDialogTitle>
          <AlertDialogDescription>
            This is the currency used across dashboards and reports. Amounts in other currencies
            will be converted to your default currency.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
            <SelectTrigger id="default-currency-gate-select">
              <SelectValue placeholder="Select currency" />
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
