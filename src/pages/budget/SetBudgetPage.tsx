/**
 * @file SetBudgetPage.tsx
 * @description Page component for SetBudgetPage.
 *
 * @module pages/budget/SetBudgetPage
 *
 * @responsibilities
 * 1. Compose layout and section components
 * 2. Load data or invoke services for the page
 * 3. Handle navigation and page-level actions
 *
 * @review-tags
 * - @ui: page composition
 *
 * @review-checklist
 * - [ ] Data loading handles empty states
 * - [ ] Navigation hooks are wired correctly
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CurrencySelect from '@/components/currency/CurrencySelect';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatCurrency } from '@/utils/format-utils';
import { addUserAccount, getStoredAccounts } from '@/lib/account-utils';
import { budgetService } from '@/services/BudgetService';
import { 
  findParentPeriodBudget, 
  calculateDerivedBudgetAmount,
  calculateParentPeriodUpdates,
  getSiblingBudgets,
  getParentBudget,
  PropagationResult
} from '@/services/BudgetHierarchyService';
import { accountService } from '@/services/AccountService';
import { getCategoryHierarchy } from '@/lib/categories-data';
import { Budget, BudgetScope, BudgetPeriod, DEFAULT_ALERT_THRESHOLDS, CreateBudgetInput } from '@/models/budget';
import { getCurrentPeriodInfo, formatPeriodLabel } from '@/utils/budget-period-utils';
import { CURRENCIES } from '@/lib/categories-data';
import { toast } from '@/hooks/use-toast';
import { getUserSettings } from '@/utils/storage-utils';
import { ParentImpactPreview } from '@/components/budget/ParentImpactPreview';
import { SiblingBudgetsContext } from '@/components/budget/SiblingBudgetsContext';
import { 
  Wallet, 
  Tag, 
  Tags, 
  AlertTriangle,
  Bell,
  RotateCcw,
  Check,
  Trash2,
  Calendar,
  PiggyBank,
  Info,
  ArrowUp,
  Plus
} from 'lucide-react';

const PERIODS: { value: BudgetPeriod; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const SCOPES: { value: BudgetScope; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'overall', label: 'Overall', description: 'Total budget for all spending', icon: PiggyBank },
  { value: 'category', label: 'Category', description: 'Budget for a specific category', icon: Tag },
  { value: 'subcategory', label: 'Subcategory', description: 'Budget for a specific subcategory', icon: Tags },
  { value: 'account', label: 'Account', description: 'Budget for a specific account', icon: Wallet },
];

const ALERT_THRESHOLDS = [50, 75, 80, 90, 100];

// Generate year options (current year +/- 2 years)
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

// Month options
const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

// Quarter options
const QUARTER_OPTIONS = [
  { value: 1, label: 'Q1 (Jan-Mar)' },
  { value: 2, label: 'Q2 (Apr-Jun)' },
  { value: 3, label: 'Q3 (Jul-Sep)' },
  { value: 4, label: 'Q4 (Oct-Dec)' },
];


const ALLOWED_PERIODS: BudgetPeriod[] = ['monthly', 'quarterly', 'yearly'];

function normalizeBudgetPeriod(period: BudgetPeriod | null | undefined): BudgetPeriod {
  if (!period) return 'yearly';
  return ALLOWED_PERIODS.includes(period) ? period : 'monthly';
}

const SetBudgetPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const prefillScope = searchParams.get('scope') as BudgetScope | null;
  const prefillTarget = searchParams.get('target');
  const prefillPeriod = normalizeBudgetPeriod(searchParams.get('period') as BudgetPeriod | null);

  // Load existing budget if editing
  const existingBudget = React.useMemo(() => {
    if (!editId) return null;
    return budgetService.getBudgetById(editId);
  }, [editId]);

  const isEditMode = !!existingBudget;

  // Get current period info for defaults
  const currentPeriodInfo = React.useMemo(() => getCurrentPeriodInfo('monthly'), []);

  // Form state
  // Default to 'overall' scope and 'yearly' period
  const [scope, setScope] = React.useState<BudgetScope>(
    existingBudget?.scope || prefillScope || 'overall'
  );
  const [targetId, setTargetId] = React.useState(
    existingBudget?.targetId || prefillTarget || (prefillScope === 'overall' || (!prefillScope && !existingBudget) ? '_overall' : '')
  );
  const [amount, setAmount] = React.useState(existingBudget?.amount || 0);
  const [currency, setCurrency] = React.useState(existingBudget?.currency || getUserSettings().currency || 'USD');
  const [period, setPeriod] = React.useState<BudgetPeriod>(
    normalizeBudgetPeriod(existingBudget?.period || prefillPeriod)
  );
  const [year, setYear] = React.useState(existingBudget?.year || currentPeriodInfo.year);
  const [periodIndex, setPeriodIndex] = React.useState<number>(
    existingBudget?.periodIndex || currentPeriodInfo.periodIndex
  );
  const [rollover, setRollover] = React.useState(existingBudget?.rollover || false);
  const [notes, setNotes] = React.useState(existingBudget?.notes || '');
  const [alertThresholds, setAlertThresholds] = React.useState<number[]>(
    existingBudget?.alertThresholds || [...DEFAULT_ALERT_THRESHOLDS]
  );
  const [propagateUp, setPropagateUp] = React.useState(false);
  const [addAccountOpen, setAddAccountOpen] = React.useState(false);
  const [newAccount, setNewAccount] = React.useState({ name: '', iban: '' });
  // Handle saving a new account from the dialog
  const handleSaveNewAccount = () => {
    if (!newAccount.name.trim()) return;
    addUserAccount({ name: newAccount.name.trim(), iban: newAccount.iban.trim() || undefined });
    // Auto-select the new account
    const updatedAccounts = accountService.getAccounts();
    const storedAccounts = getStoredAccounts();
    const existingNames = new Set(updatedAccounts.map(a => a.name.toLowerCase()));
    const additional = storedAccounts
      .filter(sa => !existingNames.has(sa.name.toLowerCase()))
      .map((sa, i) => ({ id: `stored_${sa.name}_${i}`, name: sa.name }));
    const allAccounts = [...updatedAccounts, ...additional];
    const match = allAccounts.find(a => a.name.toLowerCase() === newAccount.name.trim().toLowerCase());
    if (match) setTargetId(match.id);
    setNewAccount({ name: '', iban: '' });
    setAddAccountOpen(false);
    toast({ title: 'Account added successfully' });
  };
  const existingBudgets = React.useMemo(() => budgetService.getBudgets(), []);

  // Get category hierarchy and convert to flat structure for budget selection
  const categoryHierarchy = React.useMemo(() => getCategoryHierarchy(), []);
  
  // Parent categories (top-level)
  const parentCategories = React.useMemo(
    () => categoryHierarchy.map(c => ({ id: c.id, name: c.name, type: c.type })),
    [categoryHierarchy]
  );
  
  // Subcategories with parent reference
  const subcategories = React.useMemo(
    () => categoryHierarchy.flatMap(parent => 
      parent.subcategories.map(sub => ({ 
        id: sub.id, 
        name: sub.name, 
        parentId: parent.id,
        parentName: parent.name
      }))
    ),
    [categoryHierarchy]
  );

  // Get targets based on scope
  const targets = React.useMemo(() => {
    switch (scope) {
      case 'overall':
        return []; // No target needed for overall
      case 'account': {
        const serviceAccounts = accountService.getAccounts();
        const storedAccounts = getStoredAccounts();
        const existingNames = new Set(serviceAccounts.map(a => a.name.toLowerCase()));
        const additionalAccounts = storedAccounts
          .filter(sa => !existingNames.has(sa.name.toLowerCase()))
          .map((sa, i) => ({ id: `stored_${sa.name}_${i}`, name: sa.name, parentId: null }));
        return [
          ...serviceAccounts.map(a => ({ id: a.id, name: a.name, parentId: null })),
          ...additionalAccounts,
        ];
      }
      case 'category':
        return parentCategories.map(c => ({ id: c.id, name: c.name, parentId: null }));
      case 'subcategory':
        // Subcategories already have parentId and parentName from our useMemo
        return subcategories.map(c => ({ 
          id: c.id, 
          name: c.name, 
          parentId: c.parentId,
          parentName: c.parentName 
        }));
      default:
        return [];
    }
  }, [scope, parentCategories, subcategories]);

  // Calculate time-based cascade preview ONLY for overall + yearly scope
  const cascadePreview = React.useMemo(() => {
    // Only show cascade preview for overall scope and yearly period
    if (amount <= 0 || period !== 'yearly' || scope !== 'overall') return null;
    
    // Show time distribution preview for yearly overall budgets
    const quarterlyAmount = amount / 4;
    const monthlyAmount = amount / 12;
    
    return {
      message: `Will distribute to ~${formatCurrency(quarterlyAmount, currency)}/quarter or ~${formatCurrency(monthlyAmount, currency)}/month`
    };
  }, [amount, period, currency, scope]);

  // Check for existing budget with same criteria (for edit/delete options)
  const existingBudgetMatch = React.useMemo(() => {
    if (!targetId && scope !== 'overall') return null;
    const searchTargetId = scope === 'overall' ? '_overall' : targetId;
    return existingBudgets.find(
      b => b.scope === scope && 
           b.targetId === searchTargetId && 
           b.period === period &&
           b.year === year &&
           (period === 'yearly' || b.periodIndex === periodIndex) &&
           b.id !== editId
    );
  }, [scope, targetId, period, year, periodIndex, existingBudgets, editId]);

  // State for cascade confirmation dialog
  const [showCascadeConfirm, setShowCascadeConfirm] = React.useState(false);
  const [pendingDeleteAction, setPendingDeleteAction] = React.useState<null | 'existing' | 'editing'>(null);

  // Check for parent period budget and calculate if current amount exceeds allocation
  const parentPeriodWarning = React.useMemo(() => {
    if (amount <= 0) return null;
    
    const currentConfig = {
      scope,
      targetId: scope === 'overall' ? '_overall' : targetId,
      period,
      year,
      periodIndex: period === 'yearly' ? undefined : periodIndex,
    };
    
    const parentBudget = findParentPeriodBudget(currentConfig, existingBudgets);
    if (!parentBudget) return null;
    
    const derivedAmount = calculateDerivedBudgetAmount(
      parentBudget,
      period,
      periodIndex,
      year
    );
    
    if (amount > derivedAmount) {
      return {
        parentBudget,
        derivedAmount,
        excess: amount - derivedAmount,
      };
    }
    
    return null;
  }, [scope, targetId, period, year, periodIndex, amount, existingBudgets]);

  // Calculate parent period impact preview (for upward propagation awareness)
  const parentImpactPreview = React.useMemo((): PropagationResult | null => {
    if (amount <= 0) return null;
    if (period === 'yearly') return null; // Yearly has no parent
    
    // Create a mock budget for calculation
    const mockBudget: Budget = {
      id: editId || 'temp',
      scope,
      targetId: scope === 'overall' ? '_overall' : targetId,
      amount: existingBudget?.amount || 0,
      currency,
      period,
      year,
      periodIndex,
      isOverride: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const result = calculateParentPeriodUpdates(mockBudget, amount, existingBudgets);
    
    // Only show if there are actual parent budgets to update
    if (!result.quarterUpdate && !result.yearlyUpdate) return null;
    
    return result;
  }, [amount, period, scope, targetId, currency, year, periodIndex, existingBudgets, editId, existingBudget]);

  // Get sibling budgets for context
  const siblingBudgets = React.useMemo(() => {
    if (period === 'yearly') return [];
    
    const mockBudget: Budget = {
      id: editId || 'temp',
      scope,
      targetId: scope === 'overall' ? '_overall' : targetId,
      amount,
      currency,
      period,
      year,
      periodIndex,
      isOverride: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return getSiblingBudgets(mockBudget, existingBudgets);
  }, [period, scope, targetId, amount, currency, year, periodIndex, existingBudgets, editId]);

  // Get parent period label for sibling context
  const parentPeriodLabel = React.useMemo(() => {
    if (period === 'monthly') {
      const quarter = Math.ceil((periodIndex || 1) / 3);
      return `Q${quarter} ${year}`;
    }
    if (period === 'quarterly') {
      return `${year}`;
    }
    return undefined;
  }, [period, periodIndex, year]);

  // Get target name for display
  const getTargetName = (id: string) => {
    const target = targets.find(t => t.id === id);
    return target?.name || id;
  };

  // Handle scope change
  const handleScopeChange = (newScope: BudgetScope) => {
    setScope(newScope);
    // For overall scope, set a special targetId
    setTargetId(newScope === 'overall' ? '_overall' : '');
  };

  // Handle period change - check if there's an existing budget for the new period
  const handlePeriodChange = (newPeriod: BudgetPeriod) => {
    const info = getCurrentPeriodInfo(newPeriod);
    const newPeriodIndex = info.periodIndex;
    
    // Check if there's an existing budget for the new period configuration
    const searchTargetId = scope === 'overall' ? '_overall' : targetId;
    const existingForNewPeriod = existingBudgets.find(
      b => b.scope === scope && 
           b.targetId === searchTargetId && 
           b.period === newPeriod &&
           b.year === year &&
           (newPeriod === 'yearly' || b.periodIndex === newPeriodIndex) &&
           b.id !== editId
    );
    
    if (existingForNewPeriod) {
      // Navigate to edit that budget instead
      navigate(`/budget/set?edit=${existingForNewPeriod.id}`, { replace: true });
    } else {
      // Switch to create mode for new period
      setPeriod(newPeriod);
      setPeriodIndex(newPeriodIndex);
      if (isEditMode) {
        // Clear edit ID and switch to create mode
        navigate('/budget/set', { replace: true });
      }
    }
  };

  // Handle year change - check for existing budget
  const handleYearChange = (newYear: number) => {
    const searchTargetId = scope === 'overall' ? '_overall' : targetId;
    const existingForYear = existingBudgets.find(
      b => b.scope === scope && 
           b.targetId === searchTargetId && 
           b.period === period &&
           b.year === newYear &&
           (period === 'yearly' || b.periodIndex === periodIndex) &&
           b.id !== editId
    );
    
    if (existingForYear) {
      navigate(`/budget/set?edit=${existingForYear.id}`, { replace: true });
    } else {
      setYear(newYear);
      if (isEditMode) {
        navigate('/budget/set', { replace: true });
      }
    }
  };

  // Handle period index change (month/quarter) - check for existing budget
  const handlePeriodIndexChange = (newIndex: number) => {
    const searchTargetId = scope === 'overall' ? '_overall' : targetId;
    const existingForIndex = existingBudgets.find(
      b => b.scope === scope && 
           b.targetId === searchTargetId && 
           b.period === period &&
           b.year === year &&
           b.periodIndex === newIndex &&
           b.id !== editId
    );
    
    if (existingForIndex) {
      navigate(`/budget/set?edit=${existingForIndex.id}`, { replace: true });
    } else {
      setPeriodIndex(newIndex);
      if (isEditMode) {
        navigate('/budget/set', { replace: true });
      }
    }
  };

  // Handle alert threshold toggle
  const toggleAlertThreshold = (threshold: number) => {
    setAlertThresholds(prev => 
      prev.includes(threshold)
        ? prev.filter(t => t !== threshold)
        : [...prev, threshold].sort((a, b) => a - b)
    );
  };

  // Create cascaded budgets (quarters, months) from yearly budget
  const createCascadedBudgets = (yearlyBudget: CreateBudgetInput) => {
    const quarterlyAmount = yearlyBudget.amount / 4;
    const monthlyAmount = yearlyBudget.amount / 12;
    
    // Create quarterly budgets
    for (let q = 1; q <= 4; q++) {
      budgetService.addBudget({
        ...yearlyBudget,
        period: 'quarterly',
        periodIndex: q,
        amount: quarterlyAmount,
        isOverride: false, // Derived from parent
        notes: `Auto-distributed from ${year} yearly budget`,
      });
    }
    
    // Create monthly budgets
    for (let m = 1; m <= 12; m++) {
      budgetService.addBudget({
        ...yearlyBudget,
        period: 'monthly',
        periodIndex: m,
        amount: monthlyAmount,
        isOverride: false,
        notes: `Auto-distributed from ${year} yearly budget`,
      });
    }
    
  };

  // Handle save
  const handleSave = (cascade: boolean = false) => {
    // For overall scope, targetId is '_overall', for others require selection
    if (!targetId && scope !== 'overall') {
      toast({ title: 'Please select a target', variant: 'destructive' });
      return;
    }
    if (amount <= 0) {
      toast({ title: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    const budgetData: CreateBudgetInput = {
      scope,
      targetId: scope === 'overall' ? '_overall' : targetId,
      amount,
      currency,
      period,
      year,
      periodIndex: period === 'yearly' ? undefined : periodIndex,
      isOverride: true,
      rollover,
      notes,
      alertThresholds,
      isActive: true,
    };

    if (isEditMode && editId) {
      budgetService.updateBudget(editId, budgetData);
      
      // Handle upward propagation if enabled
      if (propagateUp && period !== 'yearly') {
        const mockBudget: Budget = {
          id: editId,
          ...budgetData,
          periodIndex: budgetData.periodIndex,
          createdAt: existingBudget?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        const updates = calculateParentPeriodUpdates(mockBudget, amount, existingBudgets);
        
        // Update quarterly parent if exists
        if (updates.quarterUpdate) {
          budgetService.updateBudget(updates.quarterUpdate.id, {
            amount: updates.quarterUpdate.newAmount,
            isOverride: false,
            notes: `Auto-updated from child period changes`,
          });
        }
        
        // Update yearly parent if exists
        if (updates.yearlyUpdate) {
          budgetService.updateBudget(updates.yearlyUpdate.id, {
            amount: updates.yearlyUpdate.newAmount,
            isOverride: false,
            notes: `Auto-updated from child period changes`,
          });
        }
        
        toast({ title: 'Budget and parent periods updated' });
      } else {
        toast({ title: 'Budget updated successfully' });
      }
    } else {
      budgetService.addBudget(budgetData);
      
      // If yearly and user confirmed cascade, create child period budgets
      if (cascade && period === 'yearly') {
        createCascadedBudgets(budgetData);
        toast({ title: 'Budget created with time distribution' });
      } else {
        toast({ title: 'Budget created successfully' });
      }
    }

    navigate('/budget');
  };

  // Handle save button click - show cascade confirmation ONLY for overall + yearly budgets
  const handleSaveClick = () => {
    if (period === 'yearly' && scope === 'overall' && !isEditMode) {
      setShowCascadeConfirm(true);
    } else {
      handleSave(false);
    }
  };

  // Navigate to edit existing budget
  const handleEditExisting = () => {
    if (existingBudgetMatch) {
      navigate(`/budget/set?edit=${existingBudgetMatch.id}`);
    }
  };

  // Delete existing budget
  const handleDeleteExisting = () => {
    if (existingBudgetMatch) {
      setPendingDeleteAction('existing');
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (!editId) return;

    setPendingDeleteAction('editing');
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteAction === 'existing' && existingBudgetMatch) {
      budgetService.deleteBudget(existingBudgetMatch.id);
      toast({ title: 'Budget deleted' });
      window.location.reload();
      return;
    }

    if (pendingDeleteAction === 'editing' && editId) {
      budgetService.deleteBudget(editId);
      toast({ title: 'Budget deleted' });
      navigate('/budget');
    }
  };

  // Period label for display
  const periodLabel = formatPeriodLabel(period, year, periodIndex);

  return (
    <>
    <Layout>
      <div className="container px-4 py-3 pb-24 space-y-4 max-w-lg mx-auto">
        <h1 className="text-xl font-bold">
          {isEditMode ? 'Edit Budget' : 'Create Budget'}
        </h1>

        {/* Scope Selection — inline chips */}
        <div className="space-y-1.5">
          <h2 className="text-xs font-medium text-muted-foreground">Scope</h2>
          <div className="flex flex-wrap gap-2">
            {SCOPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                  scope === value 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border text-muted-foreground hover:bg-accent/5'
                )}
                onClick={() => handleScopeChange(value)}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Target Selection */}
        {scope !== 'overall' && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              Select {scope === 'account' ? 'Account' : scope === 'category' ? 'Category' : 'Subcategory'}
            </h2>
            <div className="flex items-center gap-1">
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${scope}`} />
                </SelectTrigger>
                <SelectContent>
                  {scope === 'subcategory' ? (
                    parentCategories.map(parent => {
                      const children = targets.filter(t => t.parentId === parent.id);
                      if (children.length === 0) return null;
                      return (
                        <React.Fragment key={parent.id}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                            {parent.name}
                          </div>
                          {children.map(child => (
                            <SelectItem key={child.id} value={child.id}>
                              <span className="pl-2">{child.name}</span>
                            </SelectItem>
                          ))}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    targets.map(target => (
                      <SelectItem key={target.id} value={target.id}>
                        {target.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {scope === 'account' && (
                <Button variant="outline" size="icon" type="button" onClick={() => setAddAccountOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>

            {existingBudgetMatch && !isEditMode && (
              <Alert className="mt-2" variant="default">
                <Info className="h-4 w-4" />
                <AlertDescription className="flex flex-col gap-2">
                  <span>
                    A budget already exists for{' '}
                    <strong>{getTargetName(existingBudgetMatch.targetId)}</strong>{' '}
                    for {formatPeriodLabel(existingBudgetMatch.period, existingBudgetMatch.year, existingBudgetMatch.periodIndex)}.
                  </span>
                  <div className="flex gap-2 mt-1">
                    <Button size="sm" variant="outline" onClick={handleEditExisting}>
                      Edit Existing
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleDeleteExisting}>
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Overall Scope Info */}
        {scope === 'overall' && (
          <div className="flex items-start gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">Overall Budget</p>
              <p className="text-xs text-muted-foreground mt-1">
                Total spending budget — distributes across time periods.
              </p>
              {existingBudgetMatch && !isEditMode && (
                <div className="mt-3 pt-3 border-t border-primary/20">
                  <p className="text-xs text-muted-foreground mb-2">
                    An overall budget exists for {formatPeriodLabel(existingBudgetMatch.period, existingBudgetMatch.year, existingBudgetMatch.periodIndex)}.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleEditExisting}>
                      Edit Existing
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleDeleteExisting}>
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Period Selection */}
        <div className="space-y-2">
          <h2 className="text-xs font-medium text-muted-foreground">Period</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={period} onValueChange={val => handlePeriodChange(val as BudgetPeriod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERIODS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Year</Label>
              <Select value={year.toString()} onValueChange={val => handleYearChange(parseInt(val))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {period !== 'yearly' && (
            <div>
              <Label className="text-xs text-muted-foreground">
                {period === 'monthly' ? 'Month' : 'Quarter'}
              </Label>
              {period === 'monthly' && (
                <Select value={periodIndex.toString()} onValueChange={val => handlePeriodIndexChange(parseInt(val))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTH_OPTIONS.map(m => (
                      <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {period === 'quarterly' && (
                <Select value={periodIndex.toString()} onValueChange={val => handlePeriodIndexChange(parseInt(val))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {QUARTER_OPTIONS.map(q => (
                      <SelectItem key={q.value} value={q.value.toString()}>{q.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

        </div>

        {/* Budget Amount */}
        <div className="space-y-2">
          <h2 className="text-xs font-medium text-muted-foreground">Amount — {periodLabel}</h2>
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
            <CurrencySelect
              value={currency}
              onChange={setCurrency}
              currencies={CURRENCIES}
              className="w-24"
            />
          </div>

          {cascadePreview && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{cascadePreview.message}</p>
              </div>
            </div>
          )}

          {parentPeriodWarning && (
            <Alert variant="default">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-sm">
                <span className="font-medium text-amber-600">Exceeds parent budget allocation</span>
                <br />
                <span className="text-muted-foreground">
                  Your {parentPeriodWarning.parentBudget.period} budget of{' '}
                  <strong>{formatCurrency(parentPeriodWarning.parentBudget.amount, currency)}</strong>{' '}
                  suggests ~<strong>{formatCurrency(parentPeriodWarning.derivedAmount, currency)}</strong> for this period.
                  You&apos;re over by {formatCurrency(parentPeriodWarning.excess, currency)}.
                </span>
              </AlertDescription>
            </Alert>
          )}
          
          {parentImpactPreview && (
            <ParentImpactPreview 
              propagationResult={parentImpactPreview}
              currency={currency}
              year={year}
            />
          )}
          
          {siblingBudgets.length > 0 && (
            <SiblingBudgetsContext
              siblings={siblingBudgets}
              currentAmount={amount}
              currentPeriodIndex={periodIndex}
              period={period}
              year={year}
              currency={currency}
              parentPeriodLabel={parentPeriodLabel}
            />
          )}
          
          {parentImpactPreview && (parentImpactPreview.quarterUpdate || parentImpactPreview.yearlyUpdate) && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <ArrowUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Update parent budgets</p>
                  <p className="text-xs text-muted-foreground">Adjust parent totals to match</p>
                </div>
              </div>
              <Switch checked={propagateUp} onCheckedChange={setPropagateUp} />
            </div>
          )}
        </div>

        {/* Alert Thresholds */}
        <div className="space-y-1.5">
          <h2 className="text-xs font-medium text-muted-foreground">Alerts</h2>
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
        </div>

        {/* Rollover */}
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Rollover</p>
              <p className="text-xs text-muted-foreground">
                Carry over unused budget to the next period
              </p>
            </div>
          </div>
          <Switch checked={rollover} onCheckedChange={setRollover} />
        </div>

        {/* Notes — collapsible feel */}
        <div className="space-y-1.5">
          <h2 className="text-xs font-medium text-muted-foreground">Notes (optional)</h2>
          <Textarea
            placeholder="Add notes..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </div>

        {/* Actions — sticky CTA */}
        <div className="sticky bottom-4 z-10 flex gap-2 bg-background pt-2 pb-1">
          {isEditMode && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
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
            onClick={handleSaveClick}
            disabled={(!targetId && scope !== 'overall') || amount <= 0}
          >
            {isEditMode ? 'Update' : 'Create'} Budget
          </Button>
        </div>

      </div>
    </Layout>

      <Dialog open={showCascadeConfirm} onOpenChange={setShowCascadeConfirm}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Distribute to Child Periods?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Your yearly budget of {formatCurrency(amount, currency)} can be automatically distributed to quarters and months.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• 4 quarterly budgets: ~{formatCurrency(amount / 4, currency)} each</p>
            <p>• 12 monthly budgets: ~{formatCurrency(amount / 12, currency)} each</p>
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setShowCascadeConfirm(false);
                handleSave(false);
              }}
            >
              Just Yearly
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setShowCascadeConfirm(false);
                handleSave(true);
              }}
            >
              Distribute All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingDeleteAction !== null} onOpenChange={(open) => !open && setPendingDeleteAction(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete budget?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this budget? This action cannot be undone.
          </p>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setPendingDeleteAction(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() => {
                handleConfirmDelete();
                setPendingDeleteAction(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Account Dialog */}
      <Dialog open={addAccountOpen} onOpenChange={setAddAccountOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-account-name">Account Name *</Label>
              <Input
                id="new-account-name"
                value={newAccount.name}
                onChange={e => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. My Savings"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-account-iban">IBAN (optional)</Label>
              <Input
                id="new-account-iban"
                value={newAccount.iban}
                onChange={e => setNewAccount(prev => ({ ...prev, iban: e.target.value }))}
                placeholder="e.g. SA0380000000608010167519"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAccountOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNewAccount} disabled={!newAccount.name.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SetBudgetPage;
