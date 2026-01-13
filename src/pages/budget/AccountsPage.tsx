import React from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/utils/format-utils';
import { v4 as uuidv4 } from 'uuid';
import { accountService } from '@/services/AccountService';
import { Account } from '@/models/account';
import { CURRENCIES } from '@/lib/categories-data';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Wallet,
  Building2,
  Coins,
  BarChart3,
  Home,
  CreditCard,
  TrendingUp,
  ArrowRightLeft
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

const AccountsPage = () => {
  const [accounts, setAccounts] = React.useState<Account[]>(() => accountService.getAccounts());
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<Account | null>(null);
  const [accountToDelete, setAccountToDelete] = React.useState<Account | null>(null);
  const [linkedCount, setLinkedCount] = React.useState(0);
  
  // Unmanaged accounts (used in transactions but not in list)
  const unmanagedAccounts = React.useMemo(() => accountService.getUnmanagedAccounts(), [accounts]);

  const today = React.useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const [form, setForm] = React.useState<Omit<Account, 'id'>>({
    name: '',
    type: 'Bank',
    currency: 'USD',
    initialBalance: 0,
    startDate: today,
    tags: []
  });

  const refreshAccounts = () => {
    setAccounts(accountService.getAccounts());
  };

  const resetForm = () => {
    setForm({
      name: '',
      type: 'Bank',
      currency: 'USD',
      initialBalance: 0,
      startDate: today,
      tags: []
    });
    setEditingAccount(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (account: Account) => {
    setEditingAccount(account);
    setForm({
      name: account.name,
      type: account.type,
      currency: account.currency,
      initialBalance: account.initialBalance,
      startDate: account.startDate,
      tags: account.tags || []
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (account: Account) => {
    setAccountToDelete(account);
    setLinkedCount(accountService.getLinkedTransactionCount(account.id));
    setIsDeleteDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: 'Account name is required', variant: 'destructive' });
      return;
    }

    // Check for duplicate names (excluding current account when editing)
    const existingAccount = accountService.getAccountByName(form.name);
    if (existingAccount && existingAccount.id !== editingAccount?.id) {
      toast({ title: 'An account with this name already exists', variant: 'destructive' });
      return;
    }

    if (editingAccount) {
      // Update
      accountService.updateAccount(editingAccount.id, form);
      toast({ title: 'Account updated successfully' });
    } else {
      // Create
      const newAccount: Account = { id: uuidv4(), ...form };
      accountService.addAccount(newAccount);
      toast({ title: 'Account created successfully' });
    }

    refreshAccounts();
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = () => {
    if (!accountToDelete) return;

    const result = accountService.deleteAccount(accountToDelete.id);
    
    if (result.success) {
      toast({ title: 'Account deleted successfully' });
      refreshAccounts();
    } else {
      toast({ title: 'Cannot delete account', description: result.error, variant: 'destructive' });
    }

    setIsDeleteDialogOpen(false);
    setAccountToDelete(null);
  };

  const handleImportUnmanaged = (name: string) => {
    const newAccount: Account = {
      id: uuidv4(),
      name,
      type: 'Bank',
      currency: 'USD',
      initialBalance: 0,
      startDate: today,
      tags: []
    };
    accountService.addAccount(newAccount);
    refreshAccounts();
    toast({ title: `Account "${name}" added` });
  };

  const getAccountBalance = (account: Account) => {
    return accountService.getAccountBalance(account.id);
  };

  const getLinkedCountForAccount = (account: Account) => {
    return accountService.getLinkedTransactionCount(account.id);
  };

  return (
    <Layout showBack>
      <div className="container px-4 py-6 pb-24 space-y-6 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Accounts</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your financial accounts
            </p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        {/* Unmanaged Accounts Alert */}
        {unmanagedAccounts.length > 0 && (
          <Alert className="border-amber-500/50 bg-amber-500/5">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="ml-2">
              <p className="font-medium text-amber-600 mb-2">
                {unmanagedAccounts.length} account{unmanagedAccounts.length > 1 ? 's' : ''} found in transactions but not managed
              </p>
              <div className="flex flex-wrap gap-2">
                {unmanagedAccounts.slice(0, 5).map(name => (
                  <Badge
                    key={name}
                    variant="outline"
                    className="cursor-pointer hover:bg-amber-500/10"
                    onClick={() => handleImportUnmanaged(name)}
                  >
                    {name}
                    <Plus className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
                {unmanagedAccounts.length > 5 && (
                  <Badge variant="outline">+{unmanagedAccounts.length - 5} more</Badge>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Accounts List */}
        {accounts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-lg mb-2">No accounts yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your bank accounts, cash, crypto wallets and more.
              </p>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {accounts.map(acc => {
              const Icon = ACCOUNT_ICONS[acc.type] || Wallet;
              const balance = getAccountBalance(acc);
              const txCount = getLinkedCountForAccount(acc);
              
              return (
                <Card key={acc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-full bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold truncate">{acc.name}</h3>
                          <div className="flex items-center gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(acc)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => openDeleteDialog(acc)}
                              disabled={txCount > 0}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {acc.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {acc.currency}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">Current Balance</p>
                            <p className={cn(
                              "font-semibold",
                              balance < 0 ? "text-destructive" : "text-foreground"
                            )}>
                              {formatCurrency(balance, acc.currency)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Transactions</p>
                            <p className="font-medium text-sm">{txCount}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'Edit Account' : 'Add Account'}
            </DialogTitle>
            <DialogDescription>
              {editingAccount 
                ? 'Update your account details'
                : 'Add a new financial account to track'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <Input
                placeholder="e.g., Main Checking"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1.5 block">Type</label>
              <Select value={form.type} onValueChange={val => setForm({ ...form, type: val as Account['type'] })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map(t => {
                    const Icon = ACCOUNT_ICONS[t];
                    return (
                      <SelectItem key={t} value={t}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{t}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Currency</label>
                <Select value={form.currency} onValueChange={val => setForm({ ...form, currency: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1.5 block">Initial Balance</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.initialBalance || ''}
                  onChange={e => setForm({ ...form, initialBalance: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1.5 block">Start Date</label>
              <DatePicker
                date={new Date(form.startDate)}
                setDate={d => setForm({ ...form, startDate: d?.toISOString().split('T')[0] || form.startDate })}
              />
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingAccount ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              {linkedCount > 0 ? (
                <span className="text-destructive">
                  This account cannot be deleted because it is linked to {linkedCount} transaction{linkedCount > 1 ? 's' : ''}.
                </span>
              ) : (
                <>
                  Are you sure you want to delete <strong>"{accountToDelete?.name}"</strong>? 
                  This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            {linkedCount === 0 && (
              <Button variant="destructive" onClick={handleDelete}>
                Delete Account
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AccountsPage;
