import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/utils/format-utils';
import { budgetService } from '@/services/BudgetService';
import { accountService } from '@/services/AccountService';
import { transactionService } from '@/services/TransactionService';
import { Budget, BudgetScope, BudgetPeriod, DEFAULT_ALERT_THRESHOLDS, CreateBudgetInput } from '@/models/budget';
import { CURRENCIES } from '@/lib/categories-data';
import { toast } from '@/hooks/use-toast';
import { 
  Globe, 
  Wallet, 
  Tag, 
  Tags, 
  AlertTriangle,
  Bell,
  RotateCcw,
  Check,
  Trash2
} from 'lucide-react';

const PERIODS: { value: BudgetPeriod; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom' },
];

const SCOPES: { value: BudgetScope; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'overall', label: 'Overall', description: 'Total spending limit across all categories', icon: Globe },
  { value: 'category', label: 'Category', description: 'Budget for a specific category', icon: Tag },
  { value: 'subcategory', label: 'Subcategory', description: 'Budget for a specific subcategory', icon: Tags },
  { value: 'account', label: 'Account', description: 'Budget for a specific account', icon: Wallet },
];

const ALERT_THRESHOLDS = [50, 75, 80, 90, 100];

const SetBudgetPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const prefillScope = searchParams.get('scope') as BudgetScope | null;
  const prefillTarget = searchParams.get('target');

  // Load existing budget if editing
  const existingBudget = React.useMemo(() => {
    if (!editId) return null;
    return budgetService.getBudgetById(editId);
  }, [editId]);

  const isEditMode = !!existingBudget;

  // Form state
  const [scope, setScope] = React.useState<BudgetScope>(
    existingBudget?.scope || prefillScope || 'category'
  );
  const [targetId, setTargetId] = React.useState(
    existingBudget?.targetId || prefillTarget || ''
  );
  const [amount, setAmount] = React.useState(existingBudget?.amount || 0);
  const [currency, setCurrency] = React.useState(existingBudget?.currency || 'USD');
  const [period, setPeriod] = React.useState<BudgetPeriod>(
    existingBudget?.period || 'monthly'
  );
  const [startDate, setStartDate] = React.useState(
    existingBudget?.startDate || new Date().toISOString().split('T')[0]
  );
  const [rollover, setRollover] = React.useState(existingBudget?.rollover || false);
  const [notes, setNotes] = React.useState(existingBudget?.notes || '');
  const [alertThresholds, setAlertThresholds] = React.useState<number[]>(
    existingBudget?.alertThresholds || [...DEFAULT_ALERT_THRESHOLDS]
  );

  // Data
  const accounts = React.useMemo(() => accountService.getAccounts(), []);
  const categories = React.useMemo(() => transactionService.getCategories(), []);
  const existingBudgets = React.useMemo(() => budgetService.getBudgets(), []);

  // Organize categories into hierarchy
  const parentCategories = React.useMemo(
    () => categories.filter(c => !c.parentId),
    [categories]
  );
  const subcategories = React.useMemo(
    () => categories.filter(c => c.parentId),
    [categories]
  );

  // Get targets based on scope
  const targets = React.useMemo(() => {
    switch (scope) {
      case 'overall':
        return []; // No target needed for overall
      case 'account':
        return accounts.map(a => ({ id: a.id, name: a.name, parentId: null }));
      case 'category':
        return parentCategories.map(c => ({ id: c.id, name: c.name, parentId: null }));
      case 'subcategory':
        // Group subcategories by parent
        return subcategories.map(c => {
          const parent = parentCategories.find(p => p.id === c.parentId);
          return { 
            id: c.id, 
            name: c.name, 
            parentId: c.parentId,
            parentName: parent?.name 
          };
        });
      default:
        return [];
    }
  }, [scope, accounts, parentCategories, subcategories]);

  // Check for existing budget conflict
  const existingBudgetConflict = React.useMemo(() => {
    if (scope === 'overall') {
      return existingBudgets.find(
        b => b.scope === 'overall' && b.id !== editId
      );
    }
    if (!targetId) return null;
    return existingBudgets.find(
      b => b.scope === scope && b.targetId === targetId && b.id !== editId
    );
  }, [scope, targetId, existingBudgets, editId]);

  // Get target name for display
  const getTargetName = (id: string) => {
    const target = targets.find(t => t.id === id);
    return target?.name || id;
  };

  // Handle scope change
  const handleScopeChange = (newScope: BudgetScope) => {
    setScope(newScope);
    setTargetId(''); // Reset target when scope changes
  };

  // Handle alert threshold toggle
  const toggleAlertThreshold = (threshold: number) => {
    setAlertThresholds(prev => 
      prev.includes(threshold)
        ? prev.filter(t => t !== threshold)
        : [...prev, threshold].sort((a, b) => a - b)
    );
  };

  // Handle save
  const handleSave = () => {
    // Validation
    if (scope !== 'overall' && !targetId) {
      toast({ title: 'Please select a target', variant: 'destructive' });
      return;
    }
    if (amount <= 0) {
      toast({ title: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }
    if (existingBudgetConflict) {
      toast({ title: 'A budget already exists for this target', variant: 'destructive' });
      return;
    }

    const budgetData: CreateBudgetInput = {
      scope,
      targetId: scope === 'overall' ? '' : targetId,
      amount,
      currency,
      period,
      startDate,
      rollover,
      notes,
      alertThresholds,
      isActive: true,
    };

    if (isEditMode && editId) {
      budgetService.updateBudget(editId, budgetData);
      toast({ title: 'Budget updated successfully' });
    } else {
      budgetService.addBudget(budgetData);
      toast({ title: 'Budget created successfully' });
    }

    navigate('/budget');
  };

  // Handle delete
  const handleDelete = () => {
    if (!editId) return;
    
    if (confirm('Are you sure you want to delete this budget?')) {
      budgetService.deleteBudget(editId);
      toast({ title: 'Budget deleted' });
      navigate('/budget');
    }
  };

  return (
    <Layout showBack>
      <div className="container px-4 py-6 pb-24 space-y-6 max-w-lg mx-auto">
        <div>
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Budget' : 'Create Budget'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isEditMode 
              ? 'Update your budget settings'
              : 'Set up a new spending limit'
            }
          </p>
        </div>

        {/* Scope Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Budget Scope</CardTitle>
            <CardDescription>What do you want to budget?</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {SCOPES.map(({ value, label, description, icon: Icon }) => (
              <div
                key={value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  scope === value 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-accent/5'
                }`}
                onClick={() => handleScopeChange(value)}
              >
                <div className={`p-2 rounded-full ${
                  scope === value ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <Icon className={`h-4 w-4 ${
                    scope === value ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                {scope === value && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Target Selection (not for overall) */}
        {scope !== 'overall' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Select {scope === 'account' ? 'Account' : scope === 'category' ? 'Category' : 'Subcategory'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${scope}`} />
                </SelectTrigger>
                <SelectContent>
                  {scope === 'subcategory' ? (
                    // Group subcategories by parent
                    parentCategories.map(parent => {
                      const children = targets.filter(t => t.parentId === parent.id);
                      if (children.length === 0) return null;
                      return (
                        <React.Fragment key={parent.id}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                            {parent.name}
                          </div>
                          {children.map(child => {
                            const hasBudget = existingBudgets.some(
                              b => b.scope === 'subcategory' && b.targetId === child.id && b.id !== editId
                            );
                            return (
                              <SelectItem 
                                key={child.id} 
                                value={child.id}
                                disabled={hasBudget}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="pl-2">{child.name}</span>
                                  {hasBudget && (
                                    <Badge variant="outline" className="text-xs">
                                      Has budget
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    targets.map(target => {
                      const hasBudget = existingBudgets.some(
                        b => b.scope === scope && b.targetId === target.id && b.id !== editId
                      );
                      return (
                        <SelectItem 
                          key={target.id} 
                          value={target.id}
                          disabled={hasBudget}
                        >
                          <div className="flex items-center gap-2">
                            <span>{target.name}</span>
                            {hasBudget && (
                              <Badge variant="outline" className="text-xs">
                                Has budget
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>

              {existingBudgetConflict && (
                <Alert className="mt-3" variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    A budget already exists for{' '}
                    <strong>{getTargetName(existingBudgetConflict.targetId)}</strong>.
                    Edit the existing budget instead.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Budget Amount */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Budget Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="amount" className="sr-only">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount || ''}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  className="text-lg font-medium"
                />
              </div>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Select value={period} onValueChange={val => setPeriod(val as BudgetPeriod)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <DatePicker 
                date={new Date(startDate)} 
                setDate={d => setStartDate(d?.toISOString().split('T')[0] || startDate)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Alert Thresholds */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alert Thresholds
            </CardTitle>
            <CardDescription>
              Get notified when you reach these spending levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ALERT_THRESHOLDS.map(threshold => (
                <Badge
                  key={threshold}
                  variant={alertThresholds.includes(threshold) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors"
                  onClick={() => toggleAlertThreshold(threshold)}
                >
                  {threshold}%
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rollover */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Rollover</CardTitle>
              </div>
              <Switch checked={rollover} onCheckedChange={setRollover} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              Carry over unused budget to the next period. 
              {rollover && ' Unused funds will be added to your next period\'s budget.'}
            </p>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add any notes about this budget..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          {isEditMode && (
            <Button 
              variant="destructive" 
              className="flex-1"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => navigate('/budget')}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1"
            onClick={handleSave}
            disabled={!!existingBudgetConflict || (scope !== 'overall' && !targetId) || amount <= 0}
          >
            {isEditMode ? 'Update' : 'Create'} Budget
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default SetBudgetPage;
