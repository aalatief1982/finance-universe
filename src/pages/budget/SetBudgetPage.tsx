import React from 'react';
import Layout from '@/components/Layout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { formatCurrency } from '@/utils/format-utils';
import { v4 as uuidv4 } from 'uuid';
import { budgetService } from '@/services/BudgetService';
import { accountService } from '@/services/AccountService';
import { Budget } from '@/models/budget';
import { Account } from '@/models/account';
import { transactionService } from '@/services/TransactionService';
import { CURRENCIES } from '@/lib/categories-data';

const periods = ['weekly','monthly','quarterly','yearly','custom'];

const SetBudgetPage = () => {
  const [budgets, setBudgets] = React.useState<Budget[]>(() => budgetService.getBudgets());
  const [open, setOpen] = React.useState(false);
  const [scope, setScope] = React.useState<Budget['scope']>('account');
  const [form, setForm] = React.useState<Omit<Budget,'id'>>({
    scope: 'account',
    targetId: '',
    amount: 0,
    currency: 'USD',
    period: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    rollover: false,
    notes: ''
  });

  const accounts = React.useMemo(() => accountService.getAccounts(), []);
  const categories = React.useMemo(() => transactionService.getCategories(), []);
  const subcats = React.useMemo(() => categories.filter(c => c.parentId), [categories]);

  const targets = scope === 'account'
    ? accounts.map(a => ({ id: a.id, name: a.name }))
    : scope === 'category'
      ? categories.filter(c => !c.parentId).map(c => ({ id: c.id, name: c.name }))
      : subcats.map(c => ({ id: c.id, name: c.name }));

  const handleSave = () => {
    if (!form.targetId) return;
    const newBudget: Budget = { id: uuidv4(), ...form };
    budgetService.addBudget(newBudget);
    setBudgets(budgetService.getBudgets());
    setOpen(false);
    setForm({ ...form, targetId: '', amount: 0, notes: '' });
  };

  const displayTarget = (b: Budget) => {
    const all = [...accounts, ...categories, ...subcats] as any[];
    const t = all.find(x => x.id === b.targetId);
    return t ? t.name : b.targetId;
  };

  return (
    <Layout showBack>
      <div className="container px-1">
        <PageHeader title="Set Budget" />
        <div className="space-y-3 py-4">
          {budgets.map(b => (
            <div key={b.id} className="flex items-center justify-between bg-card p-3 rounded-xl">
              <span>{displayTarget(b)}</span>
              <span>{formatCurrency(b.amount, b.currency)}</span>
            </div>
          ))}
          <Button onClick={() => setOpen(true)}>Add Budget</Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={scope} onValueChange={val => { setScope(val as Budget['scope']); setForm({ ...form, scope: val as Budget['scope'], targetId: '' }); }}>
              <SelectTrigger><SelectValue placeholder="Scope" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="subcategory">Subcategory</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.targetId} onValueChange={val => setForm({ ...form, targetId: val })}>
              <SelectTrigger><SelectValue placeholder="Target" /></SelectTrigger>
              <SelectContent>
                {targets.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Amount" value={form.amount} onChange={e=>setForm({...form,amount:parseFloat(e.target.value)||0})} />
            <Select value={form.currency} onValueChange={val => setForm({ ...form, currency: val })}>
              <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.period} onValueChange={val => setForm({ ...form, period: val as Budget['period'] })}>
              <SelectTrigger><SelectValue placeholder="Period" /></SelectTrigger>
              <SelectContent>
                {periods.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Checkbox id="roll" checked={form.rollover} onCheckedChange={v=>setForm({...form,rollover:!!v})} />
              <label htmlFor="roll" className="text-sm">Rollover</label>
            </div>
            <Textarea placeholder="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
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

export default SetBudgetPage;
