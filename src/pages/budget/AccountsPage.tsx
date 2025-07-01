import React from 'react';
import Layout from '@/components/Layout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { formatCurrency } from '@/utils/format-utils';
import { v4 as uuidv4 } from 'uuid';
import { accountService } from '@/services/AccountService';
import { Account } from '@/models/account';
import { CURRENCIES } from '@/lib/categories-data';

const TYPES: Account['type'][] = ['Bank','Cash','Crypto','Gold','Stocks','Sukuk','Real Estate','Loan'];

const AccountsPage = () => {
  const [accounts, setAccounts] = React.useState<Account[]>(() => accountService.getAccounts());
  const [open, setOpen] = React.useState(false);
  const today = React.useMemo(() => new Date().toISOString().split('T')[0], []);
  const [form, setForm] = React.useState<Omit<Account,'id'>>({
    name: '',
    type: 'Bank',
    currency: 'USD',
    initialBalance: 0,
    startDate: today,
    tags: []
  });

  const handleSave = () => {
    const newAccount: Account = { id: uuidv4(), ...form };
    accountService.addAccount(newAccount);
    setAccounts(accountService.getAccounts());
    setOpen(false);
    setForm({ ...form, name: '', initialBalance: 0 });
  };

  return (
    <Layout showBack>
      <div className="container px-1">
        <PageHeader title="Accounts & Balances" />
        <div className="space-y-3 py-4">
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center justify-between bg-card p-3 rounded-xl">
              <span>{acc.name}</span>
              <span>{formatCurrency(acc.initialBalance, acc.currency)}</span>
            </div>
          ))}
          <Button onClick={() => setOpen(true)}>Add Account</Button>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
            <Select value={form.type} onValueChange={val=>setForm({...form,type:val as Account['type']})}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.currency} onValueChange={val=>setForm({...form,currency:val})}>
              <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Initial Balance" value={form.initialBalance} onChange={e=>setForm({...form,initialBalance:parseFloat(e.target.value)||0})}/>
            <DatePicker date={new Date(form.startDate)} setDate={d=>setForm({...form,startDate:d?d.toISOString().split('T')[0]:form.startDate})} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AccountsPage;
