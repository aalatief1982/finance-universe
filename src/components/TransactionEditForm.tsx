/**
 * @file TransactionEditForm.tsx
 * @description Main transaction form with validation, vendor/account
 *              suggestions, and confidence-driven UI hints.
 *
 * @module components/TransactionEditForm
 *
 * @responsibilities
 * 1. Render transaction input fields with category/subcategory selection
 * 2. Normalize date, amount, vendor, and account inputs
 * 3. Support vendor/account remapping and autocomplete
 * 4. Surface smart-paste confidence indicators
 *
 * @storage-keys
 * - xpensia_vendor_map: vendor remapping
 * - xpensia_fromaccount_map: account remapping
 * - xpensia_custom_currencies: custom currency list
 *
 * @dependencies
 * - categories-data.ts: category/subcategory sources
 * - vendorFallbackUtils.ts: vendor mapping persistence
 *
 * @review-tags
 * - @risk: date parsing and normalization (ISO conversion)
 * - @side-effects: writes vendor/account mappings to storage
 *
 * @review-checklist
 * - [ ] Date inputs normalized to ISO for storage
 * - [ ] Amounts maintain sign based on transaction type
 * - [ ] Vendor/account remaps saved only when user confirms
 */

import { safeStorage } from '@/utils/safe-storage';
import { useLanguage } from '@/i18n/LanguageContext';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, TransactionType } from '@/types/transaction';
import {
  getCategoriesForType,
  getSubcategoriesForCategory,
  getCategoryHierarchy,
} from '@/lib/categories-data';
import {
  Plus,
  Calculator,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  Pencil,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { addSuggestionsFeedbackEntry } from '@/utils/suggestions-feedback-log';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import vendorData from '@/data/ksa_all_vendors_clean_final.json';
import {
  loadVendorFallbacks,
  addUserVendor,
  findVendorByNormalizedName,
  sanitizeVendorName,
  saveVendorFallbacks,
} from '@/lib/smart-paste-engine/vendorFallbackUtils';
import { getVendorData } from '@/services/VendorSyncService';
import VendorAutocomplete from './VendorAutocomplete';
import FxEstimateDisplay from '@/components/forms/FxEstimateDisplay';
import {
  FxInfoDisplay,
  FxRateInput,
  ExchangeRateDialog,
} from '@/components/fx';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  getRate,
  getLatestRate,
  upsertRate,
} from '@/services/ExchangeRateService';
import { getUserSettings } from '@/utils/storage-utils';
import { applyFxConversion } from '@/services/FxConversionService';
import { roundToCurrencyPrecision } from '@/types/fx';
import { generateDefaultTitle } from '@/components/transaction-utils';
import AddCurrencyDialog from '@/components/currency/AddCurrencyDialog';
import { CustomCurrency } from '@/lib/currency-utils';
import CurrencyCombobox from '@/components/currency/CurrencyCombobox';
import { accountService } from '@/services/AccountService';
import { Account } from '@/models/account';
import AddAccountDialog from '@/components/budget/AddAccountDialog';
import {
  TransactionValidationError,
  TransactionValidationErrors,
  validateTransactionForm,
} from '@/lib/transaction-validation';
import { parseAmount } from '@/lib/amount';
import { resolveFieldTier, type ConfidenceTier } from '@/lib/inference/fieldTier';
import type { InferenceDecisionTrace, InferenceOrigin, InferenceParsingStatus } from '@/types/inference';

const VALIDATION_FIELD_ORDER: (keyof Transaction)[] = [
  'amount',
  'fromAccount',
  'toAccount',
  'category',
  'subcategory',
  'currency',
  'date',
  'title',
];

const TITLE_DRIVING_FIELDS: (keyof Transaction)[] = [
  'category',
  'subcategory',
  'vendor',
  'amount',
  'date',
  'type',
];

const dedupeVendorsCaseInsensitive = (vendorList: string[]) => {
  const seen = new Set<string>();
  const deduped: string[] = [];

  vendorList.forEach((vendor) => {
    const normalized = vendor.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    deduped.push(vendor.trim());
  });

  return deduped;
};

const parseAmountToNullableNumber = (value: string | number): number | null => {
  const parsedAmount = parseAmount(value);
  return Number.isFinite(parsedAmount) ? parsedAmount : null;
};

const normalizeText = (value?: string): string =>
  (value || '').trim().toLowerCase();

const normalizeTransactionForCompare = (tx: Partial<Transaction>) => ({
  amount: parseAmountToNullableNumber(tx.amount ?? Number.NaN),
  date: tx.date ? toISOFormat(String(tx.date)) : '',
  categoryId: normalizeText(tx.category),
  subcategoryId: normalizeText(tx.subcategory),
  vendorName: normalizeText(tx.vendor),
  type: normalizeText(tx.type),
});

const getRawMessageFromTransaction = (transaction?: Transaction): string => {
  if (!transaction) return '';

  if (typeof (transaction as { rawMessage?: unknown }).rawMessage === 'string') {
    return ((transaction as { rawMessage?: string }).rawMessage || '').trim();
  }

  return (transaction.details?.rawMessage || '').trim();
};

const getAmountValidationError = (
  amountNumber: number | null,
): string | undefined => {
  if (amountNumber === null) return 'Amount is required';
  if (amountNumber <= 0) return 'Amount must be greater than 0';
  return undefined;
};

interface TransactionEditFormProps {
  transaction?: Transaction;
  onSave: (transaction: Transaction) => void;
  /** Display form in a compact layout with reduced spacing */
  compact?: boolean;
  /** Whether to display the notes field */
  showNotes?: boolean;
  /** Optional confidence scores for fields */
  fieldConfidences?: Partial<Record<keyof Transaction, number>>;
  fieldSourceKinds?: Partial<Record<keyof Transaction, InferenceDecisionTrace['fields'][number]['sourceKind']>>;
  confidence?: number;
  origin?: InferenceOrigin | null;
  matchOrigin?: InferenceOrigin | null;
  parsingStatus?: InferenceParsingStatus | null;
  isSuggested?: boolean;
  /** Called when user starts editing any field */
  onEditStart?: () => void;
  /** Called when form dirty state changes */
  onDirtyChange?: (isDirty: boolean) => void;
}

const createInitialTransactionState = (
  transaction?: Transaction,
): Transaction => {
  if (transaction) {
    const mappedVendor = remapVendor(transaction.vendor);
    const mappedFromAccount = remapFromAccount(transaction.fromAccount);
    const displayDate = transaction.date ? toISOFormat(transaction.date) : '';
    const rawMessage = getRawMessageFromTransaction(transaction);

    const { person: _legacyPerson, ...transactionWithoutPerson } = transaction;

    return {
      ...transactionWithoutPerson,
      vendor: mappedVendor,
      fromAccount: mappedFromAccount,
      title: transaction.title?.trim() || generateDefaultTitle(transaction),
      date: displayDate,
      description: transaction.description?.trim() || rawMessage,
      toAccount: transaction.toAccount || '',
    };
  }

  return {
    id: '',
    title: '',
    amount: Number.NaN,
    type: 'expense',
    category: '',
    subcategory: '',
    date: new Date().toISOString().split('T')[0],
    fromAccount: '',
    toAccount: '',
    currency: 'SAR',
    description: '',
    notes: '',
    source: 'manual',
  };
};

const serializeTransactionForDirtyCheck = (tx: Transaction) =>
  JSON.stringify({
    title: tx.title || '',
    amount: Math.abs(Number(tx.amount || 0)),
    type: tx.type || 'expense',
    category: tx.category || '',
    subcategory: tx.subcategory || '',
    date: tx.date || '',
    fromAccount: tx.fromAccount || '',
    toAccount: tx.toAccount || '',
    currency: tx.currency || 'SAR',
    description: tx.description || '',
    notes: tx.notes || '',
    vendor: tx.vendor || '',
  });

function isDriven(
  field: keyof Transaction,
  drivenFields: Partial<Record<keyof Transaction, boolean>>,
) {
  return !!drivenFields[field];
}

function isLowTier(tier: ConfidenceTier) {
  return tier === 'low';
}

function isHighTier(tier: ConfidenceTier) {
  return tier === 'high';
}

function isMediumTier(tier: ConfidenceTier) {
  return tier === 'medium';
}

function areDrivenFieldsEqual(
  next: Partial<Record<keyof Transaction, boolean>>,
  prev: Partial<Record<keyof Transaction, boolean>>,
) {
  const keys = new Set([...Object.keys(next), ...Object.keys(prev)]);
  for (const key of keys) {
    if (next[key as keyof Transaction] !== prev[key as keyof Transaction]) {
      return false;
    }
  }
  return true;
}

function toISOFormat(input: string): string {
  if (!input || input.includes('undefined')) return '';
  const normalized = input.trim().replace(/\s+/g, ' ').replace(/[./]/g, '-');
  const dmy = normalized.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (dmy) {
    const [, rawDay, rawMonth, rawYear] = dmy;
    const dd = rawDay.padStart(2, '0');
    const mm = rawMonth.padStart(2, '0');
    let yyyy = rawYear;
    if (yyyy.length === 2)
      yyyy = parseInt(yyyy) < 50 ? `20${yyyy}` : `19${yyyy}`;
    return `${yyyy}-${mm}-${dd}`;
  }
  const ymd = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    const [_, yyyy, mm, dd] = ymd;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  const fallback = new Date(input);
  return isNaN(fallback.getTime()) ? '' : fallback.toISOString().split('T')[0];
}

function remapVendor(vendor?: string): string {
  if (!vendor) return '';
  const map = JSON.parse(safeStorage.getItem('xpensia_vendor_map') || '{}');
  return map[vendor] && map[vendor].trim() !== '' ? map[vendor] : vendor;
}

function remapFromAccount(fromAccount?: string): string {
  if (!fromAccount) return '';
  const map = JSON.parse(
    safeStorage.getItem('xpensia_fromaccount_map') || '{}',
  );
  return map[fromAccount] && map[fromAccount].trim() !== ''
    ? map[fromAccount]
    : fromAccount;
}

const TransactionEditForm: React.FC<TransactionEditFormProps> = ({
  transaction,
  onSave,
  compact = false,
  showNotes = true,
  fieldConfidences = {},
  fieldSourceKinds = {},
  confidence,
  origin,
  matchOrigin,
  parsingStatus,
  isSuggested = false,
  onEditStart,
  onDirtyChange,
}) => {
  // Serialize fieldConfidences to prevent object reference changes triggering re-renders
  const fieldConfidencesKey = JSON.stringify(fieldConfidences);
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const didMountRef = useRef(false);
  const initialTitleDriversRef = useRef(
    normalizeTransactionForCompare(createInitialTransactionState(transaction)),
  );
  const [hasUserEditedTitleDrivers, setHasUserEditedTitleDrivers] =
    useState(false);
  const [initialTitle, setInitialTitle] = useState('');
  const [lastAutoTitle, setLastAutoTitle] = useState('');
  const [suggestedTitle, setSuggestedTitle] = useState('');
  const [dismissedSuggestionSignature, setDismissedSuggestionSignature] =
    useState('');
  const [descriptionManuallyEdited, setDescriptionManuallyEdited] =
    useState(false);
  const [drivenFields, setDrivenFields] = useState<
    Partial<Record<keyof Transaction, boolean>>
  >({});

  const [initialTransactionState, setInitialTransactionState] =
    useState<Transaction>(() => createInitialTransactionState(transaction));
  const [editedTransaction, setEditedTransaction] = useState<Transaction>(
    () => {
      const initial = createInitialTransactionState(transaction);
      return {
        ...initial,
        amount: Number.isFinite(initial.amount)
          ? Math.abs(initial.amount)
          : initial.amount,
      };
    },
  );
  const [amountText, setAmountText] = useState<string>(() => {
    const initialState = createInitialTransactionState(transaction);
    return Number.isFinite(initialState.amount)
      ? Math.abs(initialState.amount).toFixed(2)
      : '';
  });
  const [amountNumber, setAmountNumber] = useState<number | null>(() => {
    const initialState = createInitialTransactionState(transaction);
    const parsed = parseAmountToNullableNumber(initialState.amount);
    return parsed !== null ? Math.abs(parsed) : null;
  });

  const fieldTierByField = useMemo(() => {
    const tiers: Partial<Record<keyof Transaction, ConfidenceTier>> = {};

    (Object.keys(editedTransaction) as (keyof Transaction)[]).forEach((field) => {
      tiers[field] = resolveFieldTier(field, {
        fieldConfidences,
        confidence,
        origin,
        matchOrigin,
        parsingStatus,
        transaction: editedTransaction,
      }).tier;
    });

    return tiers;
  }, [
    editedTransaction,
    fieldConfidences,
    confidence,
    origin,
    matchOrigin,
    parsingStatus,
  ]);

  const getFieldTier = (field: keyof Transaction): ConfidenceTier =>
    fieldTierByField[field] ?? 'low';
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<
    string[]
  >([]);
  const [addCurrencyOpen, setAddCurrencyOpen] = useState(false);
  const [editRateDialogOpen, setEditRateDialogOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calcExpr, setCalcExpr] = useState('');
  const [manualExchangeRate, setManualExchangeRate] = useState<string>('');

  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<
    Partial<Record<keyof Transaction, boolean>>
  >({});
  const [accounts, setAccounts] = useState<Account[]>(() =>
    accountService.getAccounts(),
  );
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [accountTargetField, setAccountTargetField] = useState<
    'fromAccount' | 'toAccount'
  >('fromAccount');

  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<{
    type: TransactionType;
    category: string;
    subcategory: string;
  }>({ type: 'expense', category: '', subcategory: '' });

  const [vendors, setVendors] = useState<string[]>(() => {
    const syncedVendors = getVendorData();
    const builtIn = Object.keys(
      syncedVendors || (vendorData as Record<string, unknown>) || {},
    );
    const stored = Object.keys(loadVendorFallbacks());
    return dedupeVendorsCaseInsensitive([...builtIn, ...stored]);
  });
  const [addVendorOpen, setAddVendorOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<string | null>(null);
  const [newVendor, setNewVendor] = useState<{
    name: string;
    type: TransactionType;
    category: string;
    subcategory: string;
  }>({ name: '', type: 'expense', category: '', subcategory: '' });
  const [vendorAvailableSubcategories, setVendorAvailableSubcategories] =
    useState<string[]>([]);

  // Track user interactions to prevent auto-opening dropdowns
  const [userInteractions, setUserInteractions] = useState<{
    vendor: boolean;
    fromAccount: boolean;
    toAccount: boolean;
  }>({
    vendor: false,
    fromAccount: false,
    toAccount: false,
  });
  const [fromAccountOpen, setFromAccountOpen] = useState(false);
  const [toAccountOpen, setToAccountOpen] = useState(false);


  const rawMessageDescriptionDefault = useMemo(
    () => getRawMessageFromTransaction(transaction),
    [transaction],
  );

  const filteredFromAccounts = useMemo(() => {
    const query = normalizeText(editedTransaction.fromAccount);

    if (!query) {
      return accounts;
    }

    return accounts.filter((account) =>
      normalizeText(account.name).includes(query),
    );
  }, [accounts, editedTransaction.fromAccount]);

  const filteredToAccounts = useMemo(() => {
    const query = normalizeText(editedTransaction.toAccount);

    if (!query) {
      return accounts;
    }

    return accounts.filter((account) =>
      normalizeText(account.name).includes(query),
    );
  }, [accounts, editedTransaction.toAccount]);

  const hydrationSnapshotKey = useMemo(() => {
    const baseline = createInitialTransactionState(transaction);
    return JSON.stringify({
      ...normalizeTransactionForCompare(baseline),
      title: (baseline.title || '').trim(),
      fromAccount: normalizeText(baseline.fromAccount),
      currency: normalizeText(baseline.currency),
    });
  }, [transaction]);
  const [formErrors, setFormErrors] = useState<TransactionValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<keyof Transaction, boolean>>
  >({});
  const fieldRefs = useRef<
    Partial<Record<keyof Transaction, HTMLElement | null>>
  >({});

  // FX state derived from editedTransaction
  const baseCurrency = getUserSettings()?.currency || 'SAR';
  const needsFxConversion =
    editedTransaction.currency?.toUpperCase() !== baseCurrency.toUpperCase();

  // Calculate converted amount based on manual rate or lookup
  const currentRate = manualExchangeRate
    ? parseFloat(manualExchangeRate)
    : null;
  const convertedAmount = useMemo(() => {
    if (!needsFxConversion) return editedTransaction.amount;
    if (currentRate && currentRate > 0) {
      return roundToCurrencyPrecision(
        Math.abs(editedTransaction.amount) * currentRate,
        baseCurrency,
      );
    }
    // Try to get rate from permanent lookup
    const lookupResult = getRate(
      editedTransaction.currency || '',
      baseCurrency,
      editedTransaction.date || new Date().toISOString(),
    );
    if (lookupResult) {
      return roundToCurrencyPrecision(
        Math.abs(editedTransaction.amount) * lookupResult.rate,
        baseCurrency,
      );
    }
    return null;
  }, [
    needsFxConversion,
    editedTransaction.amount,
    editedTransaction.currency,
    editedTransaction.date,
    currentRate,
    baseCurrency,
  ]);

  // Auto-populate rate from lookup when currency changes
  useEffect(() => {
    if (needsFxConversion && !manualExchangeRate) {
      const lookupResult = getLatestRate(
        editedTransaction.currency || '',
        baseCurrency,
      );
      if (lookupResult) {
        setManualExchangeRate(lookupResult.rate.toString());
      }
    } else if (!needsFxConversion) {
      setManualExchangeRate('');
    }
  }, [
    editedTransaction.currency,
    baseCurrency,
    needsFxConversion,
    manualExchangeRate,
  ]);

  useEffect(() => {
    setIsHydrating(true);
    const nextInitialState = createInitialTransactionState(transaction);
    const normalizedInitialTitle = nextInitialState.title?.trim() || '';
    initialTitleDriversRef.current =
      normalizeTransactionForCompare(nextInitialState);
    setInitialTransactionState(nextInitialState);
    setEditedTransaction({
      ...nextInitialState,
      amount: Number.isFinite(nextInitialState.amount)
        ? Math.abs(nextInitialState.amount)
        : nextInitialState.amount,
    });
    setAmountText(
      Number.isFinite(nextInitialState.amount)
        ? Math.abs(nextInitialState.amount).toFixed(2)
        : '',
    );
    setAmountNumber(() => {
      const parsed = parseAmountToNullableNumber(nextInitialState.amount);
      return parsed !== null ? Math.abs(parsed) : null;
    });
    setInitialTitle(normalizedInitialTitle);
    setLastAutoTitle(normalizedInitialTitle);
    setSuggestedTitle('');
    setDismissedSuggestionSignature('');
    setHasUserEditedTitleDrivers(false);
    setTitleManuallyEdited(false);
    setDescriptionManuallyEdited(false);
    setFormErrors({});
    setTouchedFields({});
    onDirtyChange?.(false);

    const hydrationTimeout = window.setTimeout(() => {
      didMountRef.current = true;
      setIsHydrating(false);
    }, 0);

    return () => window.clearTimeout(hydrationTimeout);
  }, [hydrationSnapshotKey, onDirtyChange, transaction]);

  const shouldAutoUpdateTitle = React.useCallback(
    (currentTitle: string) => {
      if (titleManuallyEdited) {
        return false;
      }

      const normalizedTitle = currentTitle.trim();
      const initialNormalized = initialTitle.trim();
      const lastAutoNormalized = lastAutoTitle.trim();

      if (!transaction) {
        return true;
      }

      if (!initialNormalized) {
        return true;
      }

      if (normalizedTitle === lastAutoNormalized) {
        return true;
      }

      return (
        normalizedTitle === initialNormalized &&
        initialNormalized === lastAutoNormalized
      );
    },
    [initialTitle, lastAutoTitle, titleManuallyEdited, transaction],
  );


  useEffect(() => {
    if (descriptionManuallyEdited) {
      return;
    }

    if ((editedTransaction.description || '').trim()) {
      return;
    }

    if (!rawMessageDescriptionDefault) {
      return;
    }

    setEditedTransaction((prev) => {
      if ((prev.description || '').trim()) {
        return prev;
      }

      return {
        ...prev,
        description: rawMessageDescriptionDefault,
      };
    });
  }, [
    descriptionManuallyEdited,
    editedTransaction.description,
    rawMessageDescriptionDefault,
  ]);

  useEffect(() => {
    const initialSerialized = serializeTransactionForDirtyCheck(
      initialTransactionState,
    );
    const editedSerialized =
      serializeTransactionForDirtyCheck(editedTransaction);
    onDirtyChange?.(initialSerialized !== editedSerialized);
  }, [editedTransaction, initialTransactionState, onDirtyChange]);

  useEffect(() => {
    if (!userInteractions.fromAccount) {
      setFromAccountOpen(false);
      return;
    }

    setFromAccountOpen(true);
  }, [editedTransaction.fromAccount, userInteractions.fromAccount]);

  useEffect(() => {
    if (!transaction) {
      setDrivenFields({});
      return;
    }

    const hasInferenceSignals =
      Boolean(isSuggested || origin || matchOrigin || parsingStatus) ||
      Object.keys(fieldConfidences || {}).length > 0;

    if (!hasInferenceSignals) {
      setDrivenFields({});
      return;
    }

    const driven: Partial<Record<keyof Transaction, boolean>> = {};
    (Object.keys(transaction) as (keyof Transaction)[]).forEach((field) => {
      const value = transaction[field];
      const hasValue =
        typeof value === 'string'
          ? value.trim().length > 0
          : typeof value === 'number'
            ? Number.isFinite(value)
            : Boolean(value);

      if (!hasValue) {
        return;
      }

      const tierResult = resolveFieldTier(field, {
        fieldConfidences,
        confidence,
        origin,
        matchOrigin,
        parsingStatus,
        transaction,
      });

      if (tierResult.score > 0) {
        driven[field] = true;
      }
    });

    setDrivenFields((prev) => {
      if (areDrivenFieldsEqual(driven, prev)) {
        return prev;
      }
      return driven;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    transaction,
    fieldConfidencesKey,
    confidence,
    origin,
    matchOrigin,
    parsingStatus,
    isSuggested,
  ]);

  useEffect(() => {
    const categories = getCategoriesForType(editedTransaction.type) || [];
    setAvailableCategories(categories);
    const subcategories =
      getSubcategoriesForCategory(editedTransaction.category) || [];
    setAvailableSubcategories(subcategories);
  }, [editedTransaction.type, editedTransaction.category]);

  useEffect(() => {
    const loadVendorList = () => {
      const syncedVendors = getVendorData();
      const builtIn = Object.keys(
        syncedVendors || (vendorData as Record<string, unknown>) || {},
      );
      const stored = Object.keys(loadVendorFallbacks());
      setVendors(dedupeVendorsCaseInsensitive([...builtIn, ...stored]));
    };

    loadVendorList();
    window.addEventListener('vendorDataUpdated', loadVendorList);
    return () =>
      window.removeEventListener('vendorDataUpdated', loadVendorList);
  }, []);

  // Update vendor subcategories when vendor category changes
  useEffect(() => {
    if (newVendor.category) {
      const subcategories = getSubcategoriesForCategory(newVendor.category);
      setVendorAvailableSubcategories(subcategories);

      // Reset subcategory if it's no longer valid
      if (
        newVendor.subcategory &&
        !subcategories.includes(newVendor.subcategory)
      ) {
        setNewVendor((prev) => ({ ...prev, subcategory: '' }));
      }
    } else {
      setVendorAvailableSubcategories([]);
      setNewVendor((prev) => ({ ...prev, subcategory: '' }));
    }
  }, [newVendor.category, newVendor.subcategory]);

  const handleAmountBlur = () => {
    if (amountNumber === null) {
      setAmountText('');
      return;
    }

    setAmountText(Math.abs(amountNumber).toFixed(2));
  };

  const handleChange = (
    field: keyof Transaction,
    value: string | number | TransactionType,
  ) => {
    // Call onEditStart when user starts editing
    onEditStart?.();

    setEditedTransaction((prev) => {
      const updated = { ...prev, [field]: value };

      if (drivenFields[field]) {
        setDrivenFields((prev) => ({ ...prev, [field]: false }));
      }

      setTouchedFields((prev) => ({ ...prev, [field]: true }));

      if (field === 'type') {
        updated.category = '';
        updated.subcategory = '';
        if (value !== 'transfer') {
          updated.toAccount = '';
        }
      }

      if (field === 'category') {
        const subcategories =
          getSubcategoriesForCategory(value as string) || [];
        setAvailableSubcategories(subcategories);
        updated.subcategory = '';
      }

      if (field === 'amount') {
        const rawInput = String(value ?? '');
        const parsedAmount = parseAmountToNullableNumber(rawInput);

        setAmountText(rawInput);
        setAmountNumber(parsedAmount);
        updated.amount = parsedAmount ?? Number.NaN;
      }

      let hasEditedTitleDrivers = hasUserEditedTitleDrivers;
      if (
        TITLE_DRIVING_FIELDS.includes(field) &&
        !isHydrating &&
        didMountRef.current
      ) {
        const updatedNormalized = normalizeTransactionForCompare(updated);
        if (
          JSON.stringify(updatedNormalized) !==
          JSON.stringify(initialTitleDriversRef.current)
        ) {
          hasEditedTitleDrivers = true;
          setHasUserEditedTitleDrivers(true);
        }
      }

      const nextSuggestionSignature = JSON.stringify({
        type: updated.type || '',
        category: updated.category || '',
        subcategory: updated.subcategory || '',
        vendor: updated.vendor || '',
        amount:
          field === 'amount'
            ? parseAmountToNullableNumber(String(value ?? ''))
            : parseAmountToNullableNumber(updated.amount),
        date: updated.date || '',
      });

      if (field !== 'title') {
        const autoTitle = generateDefaultTitle(updated);

        if (
          TITLE_DRIVING_FIELDS.includes(field) &&
          !titleManuallyEdited &&
          shouldAutoUpdateTitle(updated.title || '')
        ) {
          updated.title = autoTitle;
          setLastAutoTitle(autoTitle);
          setSuggestedTitle('');
        } else if (
          TITLE_DRIVING_FIELDS.includes(field) &&
          !titleManuallyEdited &&
          hasEditedTitleDrivers &&
          autoTitle &&
          autoTitle !== (updated.title || '') &&
          dismissedSuggestionSignature !== nextSuggestionSignature
        ) {
          setSuggestedTitle(autoTitle);
        } else if (TITLE_DRIVING_FIELDS.includes(field)) {
          setSuggestedTitle('');
        }

        if (
          TITLE_DRIVING_FIELDS.includes(field) &&
          dismissedSuggestionSignature &&
          dismissedSuggestionSignature !== nextSuggestionSignature
        ) {
          setDismissedSuggestionSignature('');
        }
      }

      const validationErrors = validateTransactionForm(updated, updated.type);
      delete validationErrors.amount;

      const nextAmountValue =
        field === 'amount'
          ? parseAmountToNullableNumber(String(value ?? ''))
          : parseAmountToNullableNumber(updated.amount);
      const amountError = getAmountValidationError(
        nextAmountValue !== null ? Math.abs(nextAmountValue) : null,
      );
      if (amountError) {
        validationErrors.amount = amountError;
      }

      setFormErrors(validationErrors);

      return updated;
    });
  };

  const handleSaveCurrency = (currencyObj: CustomCurrency) => {
    // Also save the rate to ExchangeRateService for permanent lookup
    if (currencyObj.conversionRate && currencyObj.conversionRate > 0) {
      upsertRate(
        currencyObj.code,
        baseCurrency,
        currencyObj.conversionRate,
        new Date().toISOString().split('T')[0],
        'manual',
      );
      // Set the manual rate in form
      setManualExchangeRate(currencyObj.conversionRate.toString());
    }

    handleChange('currency', currencyObj.code);
  };

  const refreshAccounts = () => {
    setAccounts(accountService.getAccounts());
  };

  const handleSaveCategory = () => {
    if (!newCategory.category.trim()) return;

    const hierarchy = getCategoryHierarchy();
    const normalizedCategory = newCategory.category.trim();
    const normalizedSubcategory = newCategory.subcategory.trim();

    let cat = hierarchy.find(
      (c) =>
        c.type === newCategory.type &&
        c.name.toLowerCase() === normalizedCategory.toLowerCase(),
    );

    if (!cat) {
      cat = {
        id: normalizedCategory.toLowerCase().replace(/\s+/g, '-'),
        name: normalizedCategory,
        type: newCategory.type,
        subcategories: [],
        user: true,
      };
      hierarchy.push(cat);
    }

    if (normalizedSubcategory) {
      const exists = cat.subcategories.some(
        (sc) => sc.name.toLowerCase() === normalizedSubcategory.toLowerCase(),
      );
      if (!exists) {
        cat.subcategories.push({
          id: normalizedSubcategory.toLowerCase().replace(/\s+/g, '-'),
          name: normalizedSubcategory,
          user: true,
        });
      }
    }

    safeStorage.setItem(
      'xpensia_category_hierarchy',
      JSON.stringify(hierarchy),
    );

    setAvailableCategories(getCategoriesForType(editedTransaction.type));
    setAvailableSubcategories(
      getSubcategoriesForCategory(editedTransaction.category),
    );

    setNewCategory({
      type: editedTransaction.type,
      category: '',
      subcategory: '',
    });
    setAddCategoryOpen(false);
  };

  const handleSaveVendor = () => {
    if (!newVendor.name.trim()) return;

    if (vendorToEdit) {
      const sanitizedName = sanitizeVendorName(newVendor.name);
      const fallbacks = loadVendorFallbacks();
      const existingKey = findVendorByNormalizedName(
        Object.keys(fallbacks),
        vendorToEdit,
      );

      if (existingKey) {
        delete fallbacks[existingKey];
      }

      fallbacks[sanitizedName] = {
        type: newVendor.type,
        category: newVendor.category.trim(),
        subcategory: newVendor.subcategory.trim(),
        user: true,
      };
      saveVendorFallbacks(fallbacks);

      setVendors((prev) =>
        dedupeVendorsCaseInsensitive([
          ...prev.filter(
            (vendorName) =>
              vendorName.toLowerCase() !== vendorToEdit.toLowerCase(),
          ),
          sanitizedName,
        ]),
      );
      handleChange('vendor', sanitizedName);
      setVendorToEdit(null);
      setNewVendor({
        name: '',
        type: 'expense',
        category: '',
        subcategory: '',
      });
      setAddVendorOpen(false);
      return;
    }

    addUserVendor(newVendor.name.trim(), {
      type: newVendor.type,
      category: newVendor.category.trim(),
      subcategory: newVendor.subcategory.trim(),
    });
    setVendors((prev) =>
      dedupeVendorsCaseInsensitive([...prev, newVendor.name.trim()]),
    );
    handleChange('vendor', newVendor.name.trim());

    // Set the category and subcategory from the new vendor
    if (newVendor.category.trim()) {
      handleChange('category', newVendor.category.trim());
      if (newVendor.subcategory.trim()) {
        handleChange('subcategory', newVendor.subcategory.trim());
      }
    }

    setNewVendor({ name: '', type: 'expense', category: '', subcategory: '' });
    setVendorToEdit(null);
    setAddVendorOpen(false);
  };

  const handleCalcInput = (val: string) => {
    setCalcExpr((prev) => prev + val);
  };

  const clearCalc = () => setCalcExpr('');

  const evaluateCalc = () => {
    try {
      const result = Function(`return (${calcExpr || 0})`)();
      setCalcExpr(String(result));
    } catch {
      // ignore
    }
  };

  const handleUseCalc = () => {
    try {
      const result = Function(`return (${calcExpr || 0})`)();
      handleChange('amount', parseFloat(result));
    } catch {
      // ignore
    }
    setCalculatorOpen(false);
    setCalcExpr('');
  };

  const handleFeedback = (field: keyof Transaction, positive: boolean) => {
    addSuggestionsFeedbackEntry({
      field,
      positive,
      value: editedTransaction[field],
      timestamp: new Date().toISOString(),
    });
    setFeedbackGiven((prev) => ({ ...prev, [field]: true }));
  };

  const handleCurrencyPencilClick = () => {
    console.info('[UI] Currency pencil clicked');
    setEditRateDialogOpen(true);
  };

  const handleAccountPencilClick = (
    field: 'fromAccount' | 'toAccount' = 'fromAccount',
  ) => {
    console.info('[UI] Account pencil clicked');
    const selectedAccountName = editedTransaction[field]?.trim();
    if (!selectedAccountName) return;

    const existingAccount =
      accountService.getAccountByName(selectedAccountName);
    if (!existingAccount) return;

    setAccountTargetField(field);
    setAccountToEdit(existingAccount);
    setAddAccountOpen(true);
  };

  const handlePayeePencilClick = () => {
    console.info('[UI] Payee pencil clicked');
    const selectedPayee = editedTransaction.vendor?.trim();
    if (!selectedPayee) return;

    const fallbacks = loadVendorFallbacks();
    const existingKey = findVendorByNormalizedName(
      Object.keys(fallbacks),
      selectedPayee,
    );
    const fallback = existingKey ? fallbacks[existingKey] : undefined;

    setVendorToEdit(existingKey || selectedPayee);
    setNewVendor({
      name: existingKey || selectedPayee,
      type: fallback?.type || editedTransaction.type,
      category: fallback?.category || editedTransaction.category || '',
      subcategory: fallback?.subcategory || editedTransaction.subcategory || '',
    });
    setAddVendorOpen(true);
  };

  const renderFeedbackIcons = (field: keyof Transaction) => {
    const tier = getFieldTier(field);
    const showTier = isDriven(field, drivenFields);
    const sourceKind = fieldSourceKinds[field];

    return (
      <span className="ml-1 flex items-center gap-1">
        {showTier && isHighTier(tier) && (
          <span className="text-[10px] text-success font-medium">
            {sourceKind === 'promoted_by_history' ? 'Learned (Detected)' : sourceKind === 'direct_extract' ? 'Detected' : 'Detected'}
          </span>
        )}
        {showTier && isMediumTier(tier) && (
          <span className="text-[10px] text-info font-medium">Suggested</span>
        )}
        {showTier && isLowTier(tier) && (
          <span className="text-[10px] text-warning font-medium">Needs review</span>
        )}
        {showFeedback && showTier && !feedbackGiven[field] && (
          <>
            <ThumbsUp
              className="size-4 cursor-pointer text-success hover:text-success/80"
              onClick={() => handleFeedback(field, true)}
            />
            <ThumbsDown
              className="size-4 cursor-pointer text-destructive hover:text-destructive/80"
              onClick={() => handleFeedback(field, false)}
            />
          </>
        )}
      </span>
    );
  };

  const focusFirstInvalidField = (errors: TransactionValidationErrors) => {
    const firstInvalidField = VALIDATION_FIELD_ORDER.find(
      (field) => errors[field],
    );
    if (!firstInvalidField) return;

    const target = fieldRefs.current[firstInvalidField];
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof target.focus === 'function') {
      target.focus();
    }
  };

  const handleValidationFailure = (errors: TransactionValidationErrors) => {
    setFormErrors(errors);
    const nextTouched: Partial<Record<keyof Transaction, boolean>> = {};
    (Object.keys(errors) as (keyof Transaction)[]).forEach((key) => {
      nextTouched[key] = true;
    });
    setTouchedFields((prev) => ({ ...prev, ...nextTouched }));
    focusFirstInvalidField(errors);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTransaction = { ...editedTransaction };
    delete finalTransaction.person;

    if (!finalTransaction.title?.trim()) {
      finalTransaction.title = generateDefaultTitle(finalTransaction);
    }

    const canonicalAmount = amountNumber;

    const preSubmitErrors = validateTransactionForm(
      finalTransaction,
      finalTransaction.type,
    );
    delete preSubmitErrors.amount;

    const amountError = getAmountValidationError(
      canonicalAmount !== null ? Math.abs(canonicalAmount) : null,
    );
    if (amountError) {
      preSubmitErrors.amount = amountError;
    }

    if (Object.keys(preSubmitErrors).length > 0) {
      handleValidationFailure(preSubmitErrors);
      return;
    }

    if (canonicalAmount !== null) {
      finalTransaction.amount =
        finalTransaction.type === 'expense'
          ? -Math.abs(canonicalAmount)
          : Math.abs(canonicalAmount);

      if (!titleManuallyEdited) {
        const autoTitle = generateDefaultTitle({
          ...finalTransaction,
          amount: canonicalAmount,
        });
        if (shouldAutoUpdateTitle(finalTransaction.title || '')) {
          finalTransaction.title = autoTitle;
        } else {
          setSuggestedTitle(autoTitle);
        }
      }
    }

    if (typeof finalTransaction.date === 'string') {
      finalTransaction.date = toISOFormat(finalTransaction.date);
    }

    const rateValue = manualExchangeRate
      ? parseFloat(manualExchangeRate)
      : undefined;
    const shouldRecalculateFx =
      canonicalAmount !== Math.abs(initialTransactionState.amount || 0) ||
      finalTransaction.currency !== initialTransactionState.currency ||
      finalTransaction.date !==
        toISOFormat(initialTransactionState.date || '') ||
      rateValue !== undefined ||
      finalTransaction.amountInBase === null ||
      finalTransaction.amountInBase === undefined ||
      finalTransaction.fxSource === undefined ||
      finalTransaction.fxSource === 'missing';

    if (shouldRecalculateFx) {
      const fxResult = applyFxConversion(
        Math.abs(canonicalAmount ?? 0),
        finalTransaction.currency || baseCurrency,
        finalTransaction.date,
        rateValue,
      );

      finalTransaction.currency = fxResult.fields.currency;
      finalTransaction.baseCurrency = fxResult.fields.baseCurrency;
      finalTransaction.amountInBase =
        fxResult.fields.amountInBase !== null
          ? finalTransaction.amount < 0
            ? -Math.abs(fxResult.fields.amountInBase)
            : Math.abs(fxResult.fields.amountInBase)
          : null;
      finalTransaction.fxRateToBase = fxResult.fields.fxRateToBase;
      finalTransaction.fxSource = fxResult.fields.fxSource;
      finalTransaction.fxLockedAt = fxResult.fields.fxLockedAt;
      finalTransaction.fxPair = fxResult.fields.fxPair;
    }

    if (rateValue !== undefined && rateValue > 0) {
      upsertRate(
        finalTransaction.currency || '',
        baseCurrency,
        rateValue,
        finalTransaction.date,
        'manual',
      );
    }

    try {
      onSave(finalTransaction);
      setFormErrors({});
      setTouchedFields({});
      setShowFeedback(true);
    } catch (error) {
      if (error instanceof TransactionValidationError) {
        handleValidationFailure(error.errors);
        return;
      }

      throw error;
    }
  };

  const rowClass = cn('flex items-center', compact ? 'gap-1' : 'gap-2');
  const labelClass = cn(
    compact ? 'w-24 md:w-28' : 'w-32',
    'inline-flex shrink-0 items-center text-sm font-semibold text-foreground',
  );
  const inputPadding = compact ? 'py-1 px-2' : 'py-2 px-3';
  const darkFieldClass =
    'bg-background text-foreground border-border placeholder:text-muted-foreground';
  const formClass = cn(
    'bg-card p-4 rounded-md shadow-sm',
    compact ? 'space-y-1' : 'space-y-2',
  );

  const hasError = (field: keyof Transaction) =>
    Boolean(touchedFields[field] && formErrors[field]);

  return (
    <form
      onSubmit={handleSubmit}
      className={formClass}
      style={{
        paddingBottom:
          'calc(var(--safe-area-bottom, 0px) + var(--bottom-nav-height, 0px) + 0.75rem)',
      }}
      noValidate
    >
      <div className={rowClass}>
        <label className={labelClass} htmlFor="transaction-type">
          Type*
        </label>

        <Select
          value={editedTransaction.type}
          onValueChange={(value) =>
            handleChange('type', value as TransactionType)
          }
        >
          <SelectTrigger
            ref={(el) => {
              fieldRefs.current.type = el;
            }}
            id="transaction-type"
            className={cn(
              'w-full text-sm',
              inputPadding,
              'rounded-md border-border focus:ring-ring',
              darkFieldClass,
              hasError('type') && 'border-destructive',
              isMediumTier(getFieldTier('type')) && 'border-info/60',
              isLowTier(getFieldTier('type')) && 'border-amber-500',
            )}
            isAutoFilled={isDriven('type', drivenFields) && isHighTier(getFieldTier('type'))}
          >
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
        {renderFeedbackIcons('type')}
      </div>
      {hasError('type') && (
        <p className="text-xs text-destructive ml-[calc(6rem)]">
          {formErrors.type}
        </p>
      )}

      <div className={rowClass}>
        <label className={labelClass} htmlFor="transaction-currency">
          Currency*
        </label>

        <div className="flex min-w-0 flex-1 items-center gap-1">
          <div
            ref={(el) => {
              fieldRefs.current.currency = el;
            }}
            className="min-w-0 flex-1"
          >
            <CurrencyCombobox
              id="transaction-currency"
              value={editedTransaction.currency || 'SAR'}
              onChange={(value) => handleChange('currency', value)}
              displayMode="codeOnly"
              className={cn(
                'w-full text-sm',
                inputPadding,
                isDriven('currency', drivenFields) &&
                  isHighTier(getFieldTier('currency')) &&
                  'bg-[#dfffe0]',
                hasError('currency') && 'border-destructive',
                isMediumTier(getFieldTier('currency')) && 'border-info/60',
                isLowTier(getFieldTier('currency')) &&
                  'border-warning',
              )}
            />
          </div>
          <div className="relative z-10 flex shrink-0 items-center gap-1 overflow-visible">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setAddCurrencyOpen(true)}
              title="Add new currency"
            >
              <Plus className="size-4" />
            </Button>
            {needsFxConversion && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCurrencyPencilClick}
                title="Edit exchange rate"
              >
                <Pencil className="size-4" />
              </Button>
            )}
            {renderFeedbackIcons('currency')}
          </div>
        </div>
        {hasError('currency') && (
          <p className="text-xs text-destructive ml-[calc(6rem)]">
            {formErrors.currency}
          </p>
        )}
      </div>

      {/* Editable Exchange Rate field - only visible when currency differs from base */}
      {needsFxConversion && (
        <div className={rowClass}>
          <label className={labelClass} htmlFor="transaction-exchange-rate">
            Rate
          </label>
          <div className="flex w-full items-center gap-1">
            <Input
              id="transaction-exchange-rate"
              type="number"
              step="0.00000001"
              min="0"
              value={manualExchangeRate}
              onChange={(e) => setManualExchangeRate(e.target.value)}
              placeholder={`1 ${editedTransaction.currency || 'USD'} = ? ${baseCurrency}`}
              className={cn(
                'w-full text-sm',
                inputPadding,
                'rounded-md border-border focus:ring-ring',
                darkFieldClass,
              )}
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              1 {editedTransaction.currency} = {manualExchangeRate || '?'}{' '}
              {baseCurrency}
            </span>
          </div>
        </div>
      )}

      {/* Converted Amount display - read-only calculated field */}
      {needsFxConversion && (
        <div className={rowClass}>
          <span className={labelClass}>Converted</span>
          <div className="flex w-full items-center">
            <div
              className={cn(
                'w-full text-sm px-3 py-2 rounded-md bg-muted border border-border',
                convertedAmount === null && 'text-muted-foreground',
              )}
            >
              {convertedAmount !== null
                ? `${convertedAmount.toFixed(2)} ${baseCurrency}`
                : 'Rate required'}
            </div>
          </div>
        </div>
      )}

      {/* FX Info Display - shows saved FX metadata for existing transactions */}
      {transaction &&
        transaction.baseCurrency &&
        transaction.currency?.toUpperCase() !==
          transaction.baseCurrency?.toUpperCase() && (
          <Collapsible className="mt-2">
            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <span>FX Details</span>
              <ChevronDown className="size-3" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <FxInfoDisplay transaction={transaction} size="sm" />
            </CollapsibleContent>
          </Collapsible>
        )}

      {/* Exchange Rate Edit Dialog */}
      <ExchangeRateDialog
        open={editRateDialogOpen}
        onOpenChange={setEditRateDialogOpen}
        defaultFromCurrency={editedTransaction.currency}
        onSave={(rate) => {
          setManualExchangeRate(rate.rate.toString());
        }}
      />

      <AddCurrencyDialog
        open={addCurrencyOpen}
        onOpenChange={setAddCurrencyOpen}
        onSaved={handleSaveCurrency}
        inputClassName={darkFieldClass}
      />

      <AddAccountDialog
        open={addAccountOpen}
        initialAccount={accountToEdit}
        onClose={() => {
          setAddAccountOpen(false);
          setAccountToEdit(null);
        }}
        onAccountCreated={(newAccount) => {
          refreshAccounts();
          handleChange(accountTargetField, newAccount.name);
        }}
      />

      <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div>
              <label
                className="mb-1 block text-sm font-medium dark:text-white"
                htmlFor="new-category-type"
              >
                Type*
              </label>
              <Select
                value={newCategory.type}
                onValueChange={(val) =>
                  setNewCategory((prev) => ({
                    ...prev,
                    type: val as TransactionType,
                  }))
                }
              >
                <SelectTrigger
                  id="new-category-type"
                  className={cn('w-full', darkFieldClass)}
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-medium dark:text-white"
                htmlFor="new-category-name"
              >
                Category*
              </label>
              <Input
                id="new-category-name"
                value={newCategory.category}
                onChange={(e) =>
                  setNewCategory((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                className={darkFieldClass}
              />
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-medium dark:text-white"
                htmlFor="new-category-subcategory"
              >
                Subcategory*
              </label>
              <Input
                id="new-category-subcategory"
                value={newCategory.subcategory}
                onChange={(e) =>
                  setNewCategory((prev) => ({
                    ...prev,
                    subcategory: e.target.value,
                  }))
                }
                className={darkFieldClass}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddCategoryOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveCategory}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={addVendorOpen}
        onOpenChange={(open) => {
          setAddVendorOpen(open);
          if (!open) {
            setVendorToEdit(null);
            setNewVendor({
              name: '',
              type: 'expense',
              category: '',
              subcategory: '',
            });
          }
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {vendorToEdit ? 'Edit Payee' : 'Add Payee'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div>
              <label
                className="mb-1 block text-sm font-medium dark:text-white"
                htmlFor="new-vendor-name"
              >
                Payee Name*
              </label>
              <Input
                id="new-vendor-name"
                value={newVendor.name}
                onChange={(e) =>
                  setNewVendor((prev) => ({ ...prev, name: e.target.value }))
                }
                className={darkFieldClass}
              />
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-medium dark:text-white"
                htmlFor="new-vendor-type"
              >
                Type*
              </label>
              <Select
                value={newVendor.type}
                onValueChange={(val) =>
                  setNewVendor((prev) => ({
                    ...prev,
                    type: val as TransactionType,
                    category: '',
                    subcategory: '',
                  }))
                }
              >
                <SelectTrigger
                  id="new-vendor-type"
                  className={cn('w-full', darkFieldClass)}
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label
                className="mb-1 block text-sm font-medium dark:text-white"
                htmlFor="new-vendor-category"
              >
                Category*
              </label>
              <Select
                value={newVendor.category}
                onValueChange={(val) =>
                  setNewVendor((prev) => ({
                    ...prev,
                    category: val,
                    subcategory: '',
                  }))
                }
              >
                <SelectTrigger
                  id="new-vendor-category"
                  className={cn('w-full', darkFieldClass)}
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {getCategoriesForType(newVendor.type).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {vendorAvailableSubcategories.length > 0 && (
              <div>
                <label
                  className="mb-1 block text-sm font-medium dark:text-white"
                  htmlFor="new-vendor-subcategory"
                >
                  Subcategory*
                </label>
                <Select
                  value={newVendor.subcategory || 'none'}
                  onValueChange={(val) =>
                    setNewVendor((prev) => ({
                      ...prev,
                      subcategory: val === 'none' ? '' : val,
                    }))
                  }
                >
                  <SelectTrigger
                    id="new-vendor-subcategory"
                    className={cn('w-full', darkFieldClass)}
                  >
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {vendorAvailableSubcategories.map((subcategory) => (
                      <SelectItem key={subcategory} value={subcategory}>
                        {subcategory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddVendorOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveVendor}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={calculatorOpen} onOpenChange={setCalculatorOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm">
          <DialogHeader>
            <DialogTitle>Calculator</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Input readOnly value={calcExpr} className={darkFieldClass} />
            <div className="grid grid-cols-4 gap-2 text-sm">
              {[
                '7',
                '8',
                '9',
                '/',
                '4',
                '5',
                '6',
                '*',
                '1',
                '2',
                '3',
                '-',
                '0',
                '.',
                'C',
                '+',
              ].map((ch) => (
                <Button
                  key={ch}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (ch === 'C') return clearCalc();
                    handleCalcInput(ch);
                  }}
                >
                  {ch}
                </Button>
              ))}
              <Button
                type="button"
                variant="default"
                className="col-span-4"
                onClick={evaluateCalc}
              >
                =
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCalculatorOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleUseCalc}>
              Use
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className={rowClass}>
        <label className={labelClass} htmlFor="transaction-amount">
          Amount*
        </label>

        <div className="flex w-full items-center gap-1">
          <Input
            ref={(el) => {
              fieldRefs.current.amount = el;
            }}
            id="transaction-amount"
            type="text"
            inputMode="decimal"
            value={amountText}
            isAutoFilled={isDriven('amount', drivenFields) && isHighTier(getFieldTier('amount'))}
            onChange={(e) => handleChange('amount', e.target.value)}
            onBlur={handleAmountBlur}
            placeholder="0.00"
            required
            title={
              isLowTier(getFieldTier('amount'))
                ? 'Needs review'
                : undefined
            }
            className={cn(
              'w-full text-sm rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
              inputPadding,
              darkFieldClass,
              hasError('amount') && 'border-destructive',
              isMediumTier(getFieldTier('amount')) && 'border-info/60',
              isLowTier(getFieldTier('amount')) &&
                'border-amber-500',
            )}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setCalculatorOpen(true)}
          >
            <Calculator className="size-4" />
          </Button>
          {renderFeedbackIcons('amount')}
        </div>
      </div>
      {hasError('amount') && (
        <p className="text-xs text-destructive ml-[calc(6rem)]">
          {formErrors.amount}
        </p>
      )}

      <div className={rowClass}>
        <label className={labelClass} htmlFor="transaction-from-account">
          From Account*
        </label>

        <div className="flex w-full items-center gap-1">
          <div className="relative min-w-0 flex-1">
            <Input
              ref={(el) => {
                fieldRefs.current.fromAccount = el;
              }}
              id="transaction-from-account"
              value={editedTransaction.fromAccount || ''}
              isAutoFilled={isDriven('fromAccount', drivenFields) && isHighTier(getFieldTier('fromAccount'))}
              onChange={(event) => {
                setUserInteractions((prev) => ({ ...prev, fromAccount: true }));
                handleChange('fromAccount', event.target.value);
              }}
              onFocus={() => {
                setUserInteractions((prev) => ({ ...prev, fromAccount: true }));
                setFromAccountOpen(true);
              }}
              onBlur={() => {
                window.setTimeout(() => {
                  setFromAccountOpen(false);
                }, 120);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setFromAccountOpen(false);
                }
              }}
              placeholder="Type account name"
              required
              title={
                isLowTier(getFieldTier('fromAccount'))
                  ? 'Needs review'
                  : undefined
              }
              className={cn(
                'w-full text-sm rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
                inputPadding,
                darkFieldClass,
                hasError('fromAccount') && 'border-destructive',
                isMediumTier(getFieldTier('fromAccount')) && 'border-info/60',
                isLowTier(getFieldTier('fromAccount')) &&
                  'border-amber-500',
              )}
            />
            {fromAccountOpen && (
              <div className="absolute z-50 mt-1 w-full overflow-y-auto rounded-md border border-border bg-background shadow-lg">
                {filteredFromAccounts.map((account) => (
                  <button
                    type="button"
                    key={account.id}
                    className="block w-full border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      handleChange('fromAccount', account.name);
                      setFromAccountOpen(false);
                    }}
                  >
                    {account.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative z-10 flex shrink-0 items-center gap-1 overflow-visible">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => handleAccountPencilClick('fromAccount')}
              title={
                editedTransaction.fromAccount
                  ? 'Edit selected account'
                  : 'Select an account to edit'
              }
              aria-label="Edit selected from account"
              disabled={!editedTransaction.fromAccount}
              className="shrink-0"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                setAccountToEdit(null);
                setAccountTargetField('fromAccount');
                setAddAccountOpen(true);
              }}
              title="Add account"
              className="shrink-0"
            >
              <Plus className="size-4" />
            </Button>
            {renderFeedbackIcons('fromAccount')}
          </div>
          <input
            tabIndex={-1}
            autoComplete="off"
            value={editedTransaction.fromAccount || ''}
            onChange={() => undefined}
            required
            className="absolute h-0 w-0 opacity-0 pointer-events-none"
            aria-hidden="true"
          />
        </div>
      </div>
      {hasError('fromAccount') && (
        <p className="text-xs text-destructive ml-[calc(6rem)]">
          {formErrors.fromAccount}
        </p>
      )}

      {editedTransaction.type === 'transfer' && (
        <>
          <div className={rowClass}>
            <label className={labelClass} htmlFor="transaction-to-account">
              To Account*
            </label>

            <div className="flex w-full items-center gap-1">
              <div className="relative min-w-0 flex-1">
                <Input
                  ref={(el) => {
                    fieldRefs.current.toAccount = el;
                  }}
                  id="transaction-to-account"
                  value={editedTransaction.toAccount || ''}
                  isAutoFilled={isDriven('toAccount', drivenFields) && isHighTier(getFieldTier('toAccount'))}
                  onChange={(event) => {
                    setUserInteractions((prev) => ({ ...prev, toAccount: true }));
                    handleChange('toAccount', event.target.value);
                  }}
                  onFocus={() => {
                    setUserInteractions((prev) => ({ ...prev, toAccount: true }));
                    setToAccountOpen(true);
                  }}
                  onBlur={() => {
                    window.setTimeout(() => {
                      setToAccountOpen(false);
                    }, 120);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      setToAccountOpen(false);
                    }
                  }}
                  placeholder="Type account name"
                  required
                  title={
                    isLowTier(getFieldTier('toAccount')) ? 'Needs review' : undefined
                  }
                  className={cn(
                    'w-full text-sm rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
                    inputPadding,
                    darkFieldClass,
                    hasError('toAccount') && 'border-destructive',
                    isMediumTier(getFieldTier('toAccount')) && 'border-info/60',
                    isLowTier(getFieldTier('toAccount')) && 'border-amber-500',
                  )}
                />
                {toAccountOpen && (
                  <div className="absolute z-50 mt-1 w-full overflow-y-auto rounded-md border border-border bg-background shadow-lg">
                    {filteredToAccounts.map((account) => (
                      <button
                        type="button"
                        key={account.id}
                        className="block w-full border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          handleChange('toAccount', account.name);
                          setToAccountOpen(false);
                        }}
                      >
                        {account.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative z-10 flex shrink-0 items-center gap-1 overflow-visible">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleAccountPencilClick('toAccount')}
                  title={
                    editedTransaction.toAccount
                      ? 'Edit selected account'
                      : 'Select an account to edit'
                  }
                  aria-label="Edit selected to account"
                  disabled={!editedTransaction.toAccount}
                  className="shrink-0"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setAccountToEdit(null);
                    setAccountTargetField('toAccount');
                    setAddAccountOpen(true);
                  }}
                  title="Add account"
                  className="shrink-0"
                >
                  <Plus className="size-4" />
                </Button>
                {renderFeedbackIcons('toAccount')}
              </div>
              <input
                tabIndex={-1}
                autoComplete="off"
                value={editedTransaction.toAccount || ''}
                onChange={() => undefined}
                required
                className="absolute h-0 w-0 opacity-0 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>
          {hasError('toAccount') && (
            <p className="text-xs text-destructive ml-[calc(6rem)]">
              {formErrors.toAccount}
            </p>
          )}
        </>
      )}

      <div className={rowClass}>
        <label className={labelClass} htmlFor="transaction-category">
          Category*
        </label>

        <div className="flex w-full items-center gap-1">
          <Select
            value={editedTransaction.category || ''}
            onValueChange={(value) => handleChange('category', value)}
          >
            <SelectTrigger
              ref={(el) => {
                fieldRefs.current.category = el;
              }}
              id="transaction-category"
              className={cn(
                'w-full text-sm',
                inputPadding,
                'rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
                darkFieldClass,
                hasError('category') && 'border-destructive',
                isMediumTier(getFieldTier('category')) && 'border-info/60',
                isLowTier(getFieldTier('category')) &&
                  'border-amber-500',
              )}
              isAutoFilled={isDriven('category', drivenFields) && isHighTier(getFieldTier('category'))}
              title={
                isLowTier(getFieldTier('category'))
                  ? 'Needs review'
                  : undefined
              }
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {availableCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              setNewCategory({
                type: editedTransaction.type,
                category: '',
                subcategory: '',
              });
              setAddCategoryOpen(true);
            }}
          >
            <Plus className="size-4" />
          </Button>
          {renderFeedbackIcons('category')}
        </div>
      </div>
      {hasError('category') && (
        <p className="text-xs text-destructive ml-[calc(6rem)]">
          {formErrors.category}
        </p>
      )}

      <div className={rowClass}>
        <label className={labelClass} htmlFor="transaction-subcategory">
          Subcategory*
        </label>

        <div className="flex w-full items-center gap-1">
          <>
            <Select
              value={editedTransaction.subcategory || ''}
              onValueChange={(value) => handleChange('subcategory', value)}
              disabled={availableSubcategories.length === 0}
            >
              <SelectTrigger
                ref={(el) => {
                  fieldRefs.current.subcategory = el;
                }}
                id="transaction-subcategory"
                className={cn(
                  'w-full text-sm',
                  inputPadding,
                  'rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
                  darkFieldClass,
                  hasError('subcategory') && 'border-destructive',
                  isMediumTier(getFieldTier('subcategory')) && 'border-info/60',
                  isLowTier(getFieldTier('subcategory')) &&
                    'border-amber-500',
                )}
                isAutoFilled={isDriven('subcategory', drivenFields) && isHighTier(getFieldTier('subcategory'))}
                title={
                  isLowTier(getFieldTier('subcategory'))
                    ? 'Needs review'
                    : undefined
                }
              >
                <SelectValue
                  placeholder={
                    availableSubcategories.length > 0
                      ? 'Select subcategory'
                      : 'Select category first'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableSubcategories.map((subcategory) => (
                  <SelectItem key={subcategory} value={subcategory}>
                    {subcategory}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {renderFeedbackIcons('subcategory')}
          </>
        </div>
      </div>
      {hasError('subcategory') && (
        <p className="text-xs text-destructive ml-[calc(6rem)]">
          {formErrors.subcategory}
        </p>
      )}
      <div className={rowClass}>
        <label className={labelClass} htmlFor="transaction-vendor">
          Payee
        </label>

        <div className="flex w-full items-center gap-1">
          <div className="min-w-0 flex-1">
            <VendorAutocomplete
              inputId="transaction-vendor"
              value={editedTransaction.vendor || ''}
              onChange={(value) => {
                setUserInteractions((prev) => ({ ...prev, vendor: true }));
                handleChange('vendor', value);
              }}
              vendors={vendors}
              onAddClick={() => {
                setVendorToEdit(null);
                setNewVendor({
                  name: '',
                  type: editedTransaction.type,
                  category: '',
                  subcategory: '',
                });
                setAddVendorOpen(true);
              }}
              isAutoFilled={isDriven('vendor', drivenFields) && isHighTier(getFieldTier('vendor'))}
              hasLowConfidence={isLowTier(getFieldTier('vendor'))}
              userHasInteracted={userInteractions.vendor}
              className={cn(
                'w-full text-sm',
                inputPadding,
                'rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
                darkFieldClass,
                isMediumTier(getFieldTier('vendor')) && 'border-info/60',
                isLowTier(getFieldTier('vendor')) && 'border-amber-500',
              )}
            />
          </div>
          <div className="relative z-10 flex shrink-0 items-center gap-1 overflow-visible">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handlePayeePencilClick}
              title={
                editedTransaction.vendor
                  ? 'Edit selected payee'
                  : 'Select a payee to edit'
              }
              aria-label="Edit selected payee"
              disabled={!editedTransaction.vendor}
              className="shrink-0"
            >
              <Pencil className="size-4" />
            </Button>
            {renderFeedbackIcons('vendor')}
          </div>
        </div>
      </div>

      <div className={rowClass}>
        <label className={labelClass} htmlFor="transaction-date">
          Date*
        </label>

        <Input
          ref={(el) => {
            fieldRefs.current.date = el;
          }}
          id="transaction-date"
          type="date"
          value={editedTransaction.date || ''}
          onChange={(e) => handleChange('date', e.target.value)}
          isAutoFilled={isDriven('date', drivenFields) && isHighTier(getFieldTier('date'))}
          title={
            isLowTier(getFieldTier('date'))
              ? 'Needs review'
              : undefined
          }
          required
          className={cn(
            'w-full text-sm',
            inputPadding,
            'rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
            darkFieldClass,
            hasError('date') && 'border-destructive',
            isMediumTier(getFieldTier('date')) && 'border-info/60',
            isLowTier(getFieldTier('date')) && 'border-amber-500',
          )}
        />
        {renderFeedbackIcons('date')}
      </div>
      {hasError('date') && (
        <p className="text-xs text-destructive ml-[calc(6rem)]">
          {formErrors.date}
        </p>
      )}

      <div className={rowClass}>
        <label className={labelClass} htmlFor="transaction-title">
          Title*
        </label>

        <Input
          ref={(el) => {
            fieldRefs.current.title = el;
          }}
          id="transaction-title"
          value={editedTransaction.title || ''}
          onChange={(e) => {
            setTitleManuallyEdited(true);
            setSuggestedTitle('');
            handleChange('title', e.target.value);
          }}
          isAutoFilled={isDriven('title', drivenFields) && isHighTier(getFieldTier('title'))}
          placeholder="Transaction title"
          required
          className={cn(
            'w-full text-sm',
            inputPadding,
            'rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
            darkFieldClass,
            hasError('title') && 'border-destructive',
          )}
        />
        {renderFeedbackIcons('title')}
      </div>
      {hasError('title') && (
        <p className="text-xs text-destructive ml-[calc(6rem)]">
          {formErrors.title}
        </p>
      )}
      {!hasError('title') &&
        !isHydrating &&
        hasUserEditedTitleDrivers &&
        !titleManuallyEdited &&
        suggestedTitle &&
        suggestedTitle !== (editedTransaction.title || '') && (
          <div className="ml-[calc(6rem)] text-xs text-green-600 flex items-center gap-2">
            <span>Suggested: {suggestedTitle}</span>
            <button
              type="button"
              className="underline"
              onClick={() => {
                setTitleManuallyEdited(false);
                setLastAutoTitle(suggestedTitle);
                handleChange('title', suggestedTitle);
                setSuggestedTitle('');
              }}
            >
              Apply
            </button>
            <button
              type="button"
              className="underline"
              onClick={() => {
                setDismissedSuggestionSignature(
                  JSON.stringify({
                    type: editedTransaction.type || '',
                    category: editedTransaction.category || '',
                    subcategory: editedTransaction.subcategory || '',
                    vendor: editedTransaction.vendor || '',
                    amount: amountNumber,
                    date: editedTransaction.date || '',
                  }),
                );
                setSuggestedTitle('');
              }}
            >
              Discard
            </button>
          </div>
        )}

      <div className={rowClass}>
        <label className={labelClass} htmlFor="transaction-description">
          Description (Optional)
        </label>

        <Textarea
          id="transaction-description"
          value={editedTransaction.description || ''}
          onChange={(e) => {
            setDescriptionManuallyEdited(true);
            handleChange('description', e.target.value);
          }}
          placeholder="Enter a detailed description..."
          rows={2}
          isAutoFilled={isDriven('description', drivenFields) && isHighTier(getFieldTier('description'))}
          className={cn(
            'w-full text-sm min-h-[72px] h-[clamp(72px,10vh,120px)] max-h-[120px]',
            inputPadding,
            'rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
            darkFieldClass,
            hasError('title') && 'border-destructive',
          )}
        />
        {renderFeedbackIcons('description')}
      </div>

      {showNotes && (
        <div className={rowClass}>
          <label className={labelClass} htmlFor="transaction-notes">
            Notes (Optional)
          </label>

          <Textarea
            id="transaction-notes"
            value={editedTransaction.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Additional notes..."
            rows={2}
            isAutoFilled={isDriven('notes', drivenFields) && isHighTier(getFieldTier('notes'))}
            className={cn(
              'w-full text-sm',
              inputPadding,
              'rounded-md border-gray-300 dark:border-gray-600 focus:ring-primary',
              darkFieldClass,
            )}
          />
          {renderFeedbackIcons('notes')}
        </div>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          className={cn(
            'bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md',
            compact ? 'py-2' : 'py-3',
          )}
        >
          {transaction ? 'Update Transaction' : 'Create Transaction'}
        </Button>
      </div>
    </form>
  );
};

export default TransactionEditForm;
