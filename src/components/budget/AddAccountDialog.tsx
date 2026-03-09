import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CurrencySelect from '@/components/currency/CurrencySelect';
import { DatePicker } from '@/components/ui/date-picker';
import { CURRENCIES } from '@/lib/categories-data';
import { getCurrencyOrAppFallback } from '@/utils/default-currency';
import { Account } from '@/models/account';
import { accountService } from '@/services/AccountService';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  Wallet,
  Building2,
  Coins,
  BarChart3,
  Home,
  CreditCard,
  TrendingUp,
  ArrowRightLeft,
} from 'lucide-react';

const ACCOUNT_TYPES: Account['type'][] = ['Bank', 'Cash', 'Crypto', 'Gold', 'Stocks', 'Sukuk', 'Real Estate', 'Loan'];

const ACCOUNT_ICONS: Record<Account['type'], React.ElementType> = {
  Bank: Building2,
  Cash: Wallet,
  Crypto: Coins,
  Gold: TrendingUp,
  Stocks: BarChart3,
  Sukuk: CreditCard,
  'Real Estate': Home,
  Loan: ArrowRightLeft,
};

interface AddAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onAccountCreated: (newAccount: Account) => void;
  initialAccount?: Account | null;
}

const AddAccountDialog: React.FC<AddAccountDialogProps> = ({ open, onClose, onAccountCreated, initialAccount }) => {
  const { t } = useLanguage();
  const today = React.useMemo(() => new Date().toISOString().split('T')[0], []);
  const defaultCurrency = React.useMemo(() => getCurrencyOrAppFallback(), []);
  const [form, setForm] = React.useState<Omit<Account, 'id'>>({
    name: '',
    type: 'Bank',
    currency: defaultCurrency,
    initialBalance: 0,
    startDate: today,
    tags: []
  });

  React.useEffect(() => {
    if (!open) return;

    if (initialAccount) {
      setForm({
        name: initialAccount.name,
        type: initialAccount.type,
        currency: initialAccount.currency,
        initialBalance: initialAccount.initialBalance,
        startDate: initialAccount.startDate,
        tags: initialAccount.tags || [],
      });
      return;
    }

    setForm({
      name: '',
      type: 'Bank',
      currency: defaultCurrency,
      initialBalance: 0,
      startDate: today,
      tags: []
    });
  }, [open, today, initialAccount]);

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: t('toast.accountNameRequired'), variant: 'destructive' });
      return;
    }

    const existingAccount = accountService.getAccountByName(form.name);
    const isDuplicateName = existingAccount && existingAccount.id !== initialAccount?.id;
    if (isDuplicateName) {
      toast({ title: t('toast.accountNameExists'), variant: 'destructive' });
      return;
    }

    if (initialAccount?.id) {
      const updatedAccount = accountService.updateAccount(initialAccount.id, form);
      if (!updatedAccount) {
        toast({ title: t('account.failedToUpdate'), variant: 'destructive' });
        return;
      }
      toast({ title: t('toast.accountUpdated') });
      onAccountCreated(updatedAccount);
      onClose();
      return;
    }

    const newAccount: Account = { id: uuidv4(), ...form };
    accountService.addAccount(newAccount);
    toast({ title: t('account.createdSuccessfully') });
    onAccountCreated(newAccount);
    onClose();
  };

  const isEditing = Boolean(initialAccount?.id);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('addAccount.editAccount') : t('addAccount.addAccount')}</DialogTitle>
          <DialogDescription>
            {t('addAccount.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block" htmlFor="account-name">
              {t('addAccount.name')}
            </label>
            <Input
              id="account-name"
              placeholder={t('account.egMySavings')}
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block" htmlFor="account-type">
              {t('addAccount.type')}
            </label>
            <Select value={form.type} onValueChange={val => setForm({ ...form, type: val as Account['type'] })}>
              <SelectTrigger id="account-type">
                <SelectValue placeholder={t('account.selectType')} />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map(type => {
                  const Icon = ACCOUNT_ICONS[type];
                  return (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{type}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block" htmlFor="account-currency">
                {t('addAccount.currency')}
              </label>
                <CurrencySelect
                  id="account-currency"
                  value={form.currency}
                  onChange={(val) => setForm({ ...form, currency: val })}
                  currencies={CURRENCIES}
                  placeholder={t('addAccount.currency')}
                />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block" htmlFor="account-initial-balance">
                {t('addAccount.initialBalance')}
              </label>
              <Input
                id="account-initial-balance"
                type="number"
                placeholder="0.00"
                value={form.initialBalance || ''}
                onChange={e => setForm({ ...form, initialBalance: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block" htmlFor="account-start-date">
              {t('addAccount.startDate')}
            </label>
            <DatePicker
              date={new Date(form.startDate)}
              setDate={d => setForm({ ...form, startDate: d?.toISOString().split('T')[0] || form.startDate })}
              inputId="account-start-date"
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            {t('addAccount.cancel')}
          </Button>
          <Button onClick={handleSave}>
            {isEditing ? t('addAccount.update') : t('addAccount.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddAccountDialog;
