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
import CurrencyCombobox from '@/components/currency/CurrencyCombobox';

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

  const handleCurrencyChange = (currency: string) => {
    setCurrencyTouched(true);
    onCurrencyChange(currency);
  };

  const handleSaveClick = async () => {
    if (isSaving) return;

    setSubmitAttempted(true);

    if (!selectedCurrency) {
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
            <CurrencyCombobox
              value={selectedCurrency || undefined}
              onChange={handleCurrencyChange}
              className={showCurrencyError ? 'border-destructive text-destructive' : undefined}
            />
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
    </>
  );
};

export default DefaultCurrencyModal;
