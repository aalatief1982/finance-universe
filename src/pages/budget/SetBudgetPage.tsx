import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/utils/format-utils';
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
  ArrowUp
} from 'lucide-react';

const PERIODS: { value: BudgetPeriod; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
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

const SetBudgetPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const prefillScope = searchParams.get('scope') as BudgetScope | null;
  const prefillTarget = searchParams.get('target');
  const prefillPeriod = searchParams.get('period') as BudgetPeriod | null;

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
  const [currency, setCurrency] = React.useState(existingBudget?.currency || 'USD');
  const [period, setPeriod] = React.useState<BudgetPeriod>(
    existingBudget?.period || prefillPeriod || 'yearly'
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

  // Data
  const accounts = React.useMemo(() => accountService.getAccounts(), []);
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
      case 'account':
        return accounts.map(a => ({ id: a.id, name: a.name, parentId: null }));
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
  }, [scope, accounts, parentCategories, subcategories]);

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

  // Handle period index change (month/quarter/week) - check for existing budget
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

  // Create cascaded budgets (quarters, months, weeks) from yearly budget
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
    
    // Create weekly budgets (52 weeks)
    const weeklyAmount = yearlyBudget.amount / 52;
    for (let w = 1; w <= 52; w++) {
      budgetService.addBudget({
        ...yearlyBudget,
        period: 'weekly',
        periodIndex: w,
        amount: weeklyAmount,
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
    if (existingBudgetMatch && confirm('Are you sure you want to delete this budget?')) {
      budgetService.deleteBudget(existingBudgetMatch.id);
      toast({ title: 'Budget deleted' });
      // Reset form or refresh
      window.location.reload();
    }
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

  // Period label for display
  const periodLabel = formatPeriodLabel(period, year, periodIndex);

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

        {/* Target Selection - Hidden for Overall scope */}
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

              {/* Existing budget actions - Edit or Delete */}
              {existingBudgetMatch && !isEditMode && (
                <Alert className="mt-3" variant="default">
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
            </CardContent>
          </Card>
        )}

        {/* Overall Scope Info Card */}
        {scope === 'overall' && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">Overall Budget</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This is your total spending budget. It distributes across time periods (yearly → quarterly → monthly → weekly).
                  </p>
                  
                  {/* Show edit/delete for existing overall budget */}
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
            </CardContent>
          </Card>
        )}

        {/* Period Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Budget Period
            </CardTitle>
            <CardDescription>
              Select the time period for this budget
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Period Type</Label>
                <Select value={period} onValueChange={val => handlePeriodChange(val as BudgetPeriod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_OPTIONS.map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Period Index Selection (not shown for yearly) */}
            {period !== 'yearly' && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  {period === 'weekly' ? 'Week' : period === 'monthly' ? 'Month' : 'Quarter'}
                </Label>
                {period === 'monthly' && (
                  <Select value={periodIndex.toString()} onValueChange={val => handlePeriodIndexChange(parseInt(val))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTH_OPTIONS.map(m => (
                        <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {period === 'quarterly' && (
                  <Select value={periodIndex.toString()} onValueChange={val => handlePeriodIndexChange(parseInt(val))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUARTER_OPTIONS.map(q => (
                        <SelectItem key={q.value} value={q.value.toString()}>{q.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {period === 'weekly' && (
                  <Input
                    type="number"
                    min={1}
                    max={53}
                    value={periodIndex}
                    onChange={e => handlePeriodIndexChange(parseInt(e.target.value) || 1)}
                    placeholder="Week number (1-53)"
                  />
                )}
              </div>
            )}

            <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
              Budget for: <strong>{periodLabel}</strong>
            </div>
          </CardContent>
        </Card>

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

            {/* Cascade Preview for Overall scope */}
            {cascadePreview && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {cascadePreview.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Parent Period Warning */}
            {parentPeriodWarning && (
              <Alert className="mt-4" variant="default">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-sm">
                  <span className="font-medium text-amber-600">Exceeds parent budget allocation</span>
                  <br />
                  <span className="text-muted-foreground">
                    Your {parentPeriodWarning.parentBudget.period} budget of{' '}
                    <strong>{formatCurrency(parentPeriodWarning.parentBudget.amount, currency)}</strong>{' '}
                    suggests ~<strong>{formatCurrency(parentPeriodWarning.derivedAmount, currency)}</strong> for this period.
                    You're over by {formatCurrency(parentPeriodWarning.excess, currency)}.
                  </span>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Parent Impact Preview */}
            {parentImpactPreview && (
              <ParentImpactPreview 
                propagationResult={parentImpactPreview}
                currency={currency}
                year={year}
              />
            )}
            
            {/* Sibling Budgets Context */}
            {siblingBudgets.length > 0 && (
              <div className="mt-4">
                <SiblingBudgetsContext
                  siblings={siblingBudgets}
                  currentAmount={amount}
                  currentPeriodIndex={periodIndex}
                  period={period}
                  year={year}
                  currency={currency}
                  parentPeriodLabel={parentPeriodLabel}
                />
              </div>
            )}
            
            {/* Upward Propagation Option */}
            {parentImpactPreview && (parentImpactPreview.quarterUpdate || parentImpactPreview.yearlyUpdate) && (
              <div className="mt-4 flex items-center justify-between p-3 rounded-lg border bg-muted/30">
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
            onClick={handleSaveClick}
            disabled={(!targetId && scope !== 'overall') || amount <= 0}
          >
            {isEditMode ? 'Update' : 'Create'} Budget
          </Button>
        </div>

        {/* Cascade Confirmation Dialog for yearly budgets */}
        {showCascadeConfirm && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Distribute to Child Periods?</CardTitle>
                <CardDescription>
                  Your yearly budget of {formatCurrency(amount, currency)} can be automatically distributed to quarters, months, and weeks.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• 4 quarterly budgets: ~{formatCurrency(amount / 4, currency)} each</p>
                <p>• 12 monthly budgets: ~{formatCurrency(amount / 12, currency)} each</p>
                <p>• 52 weekly budgets: ~{formatCurrency(amount / 52, currency)} each</p>
              </CardContent>
              <div className="flex gap-2 p-6 pt-0">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowCascadeConfirm(false);
                    handleSave(false);
                  }}
                >
                  Just Yearly
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    setShowCascadeConfirm(false);
                    handleSave(true);
                  }}
                >
                  Distribute All
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SetBudgetPage;
