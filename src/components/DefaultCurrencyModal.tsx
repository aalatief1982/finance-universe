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
import { Plus } from 'lucide-react';
import CurrencyCombobox from '@/components/currency/CurrencyCombobox';
import AddCurrencyDialog from '@/components/currency/AddCurrencyDialog';
import type { CustomCurrency } from '@/lib/currency-utils';

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
  const [addCurrencyOpen, setAddCurrencyOpen] = React.useState(false);

  const handleSavedCurrency = (currency: CustomCurrency) => {
    onCurrencyChange(currency.code);
  };

  return (
    <>
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
            <div className="flex items-center gap-2">
              <CurrencyCombobox
                id="default-currency-gate-select"
                value={selectedCurrency}
                onChange={onCurrencyChange}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setAddCurrencyOpen(true)}
                aria-label="Add currency"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <AlertDialogFooter>
            <Button onClick={onSave} disabled={!selectedCurrency} className="w-full">
              Save &amp; Continue
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddCurrencyDialog
        open={addCurrencyOpen}
        onOpenChange={setAddCurrencyOpen}
        onSaved={handleSavedCurrency}
      />
    </>
  );
};

export default DefaultCurrencyModal;
