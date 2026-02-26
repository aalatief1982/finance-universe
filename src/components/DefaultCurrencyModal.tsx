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
  onSave: () => void | Promise<void>;
}

const DefaultCurrencyModal: React.FC<DefaultCurrencyModalProps> = ({
  open,
  selectedCurrency,
  onCurrencyChange,
  onSave,
}) => {
  const [addCurrencyOpen, setAddCurrencyOpen] = React.useState(false);
  const [submitAttempted, setSubmitAttempted] = React.useState(false);
  const [currencyTouched, setCurrencyTouched] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const showCurrencyError = !selectedCurrency && (submitAttempted || currencyTouched);

  React.useEffect(() => {
    if (!open) {
      setSubmitAttempted(false);
      setCurrencyTouched(false);
      setIsSaving(false);
    }
  }, [open]);

  const handleSavedCurrency = (currency: CustomCurrency) => {
    setCurrencyTouched(true);
    onCurrencyChange(currency.code);
  };

  const handleCurrencyChange = (currency: string) => {
    setCurrencyTouched(true);
    onCurrencyChange(currency);
  };

  const focusCurrencyDropdown = () => {
    const trigger = document.getElementById('default-currency-gate-select');
    if (!trigger) return;

    trigger.focus();
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  };

  const handleSaveClick = async () => {
    if (isSaving) return;

    setSubmitAttempted(true);

    if (!selectedCurrency) {
      focusCurrencyDropdown();
      return;
    }

    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
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
                onChange={handleCurrencyChange}
                className={showCurrencyError ? 'border-destructive text-destructive' : undefined}
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
            {showCurrencyError ? (
              <p className="text-sm text-destructive" role="alert">
                Please select a currency to continue.
              </p>
            ) : null}
          </div>

          <AlertDialogFooter>
            <Button onClick={handleSaveClick} disabled={isSaving} className="w-full">
              {isSaving ? 'Saving...' : 'Save & Continue'}
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
