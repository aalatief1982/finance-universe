import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Edit, Globe, Coins, Building, ArrowRightLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { SupportedCurrency } from '@/types/locale';
import { CATEGORY_HIERARCHY, CURRENCIES, getCategoriesForType, getSubcategoriesForCategory } from '@/lib/categories-data';
import { getPeopleNames, addUserPerson } from '@/lib/people-utils';
import { Plus } from 'lucide-react';
import { TransactionType } from '@/types/transaction';
import { getCurrencySymbol } from '@/utils/format-utils';

export interface SmsTransaction {
  id: string;
  message: string;
  sender: string;
  amount: number;
  date: string;
  inferredCategory: string;
  subcategory?: string;
  description: string;
  currency?: SupportedCurrency;
  country?: string;
  fromAccount?: string;
  toAccount?: string;
  person?: string;
  type: TransactionType;
  providerDetails?: {
    providerName?: string;
    providerType?: 'bank' | 'payment_app' | 'card' | 'other';
    accountLastFourDigits?: string;
    balanceAfterTransaction?: number;
  };
}

interface SmsTransactionConfirmationProps {
  transaction: SmsTransaction;
  onConfirm: (transaction: SmsTransaction) => void;
  onDecline: (id: string) => void;
  onEdit: (transaction: SmsTransaction) => void;
}

const SmsTransactionConfirmation: React.FC<SmsTransactionConfirmationProps> = ({
  transaction,
  onConfirm,
  onDecline,
  onEdit
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTransaction, setEditedTransaction] = useState({ ...transaction });
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  const [people, setPeople] = useState<string[]>(() => getPeopleNames());
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [newPerson, setNewPerson] = useState({ name: '', relation: '' });

  useEffect(() => {
    // Initialize categories based on transaction type
    if (editedTransaction.type) {
      const categories = getCategoriesForType(editedTransaction.type);
      setAvailableCategories(categories);
      
      // If a category is selected, update subcategories
      if (editedTransaction.inferredCategory) {
        const subcategories = getSubcategoriesForCategory(editedTransaction.inferredCategory);
        setAvailableSubcategories(subcategories);
      }
    }
  }, [editedTransaction.type, editedTransaction.inferredCategory]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onEdit(editedTransaction);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTransaction({ ...transaction });
    setIsEditing(false);
  };

  const handleSavePerson = () => {
    if (!newPerson.name.trim()) return;
    addUserPerson({ name: newPerson.name.trim(), relation: newPerson.relation.trim() || undefined });
    setPeople(getPeopleNames());
    setEditedTransaction(prev => ({ ...prev, person: newPerson.name.trim() }));
    setNewPerson({ name: '', relation: '' });
    setAddPersonOpen(false);
  };

  const handleChange = (field: keyof SmsTransaction, value: string | number | TransactionType) => {
    setEditedTransaction(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Handle special cases
    if (field === 'type') {
      const transactionType = value as TransactionType;
      const categories = getCategoriesForType(transactionType);
      setAvailableCategories(categories);
      
      // Reset category and subcategory when type changes
      setEditedTransaction(prev => ({
        ...prev,
        inferredCategory: '',
        subcategory: ''
      }));
    }
    
    if (field === 'inferredCategory') {
      const subcategories = getSubcategoriesForCategory(value as string);
      setAvailableSubcategories(subcategories);
      
      // Reset subcategory when category changes
      setEditedTransaction(prev => ({
        ...prev,
        subcategory: ''
      }));
    }
  };

  const formatAmount = (amount: number, currency?: SupportedCurrency) => {
    const symbol = getCurrencySymbol(currency || 'USD');
    return `${symbol}${Math.abs(amount).toFixed(2)}`;
  };

  const getTransactionTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'expense':
        return 'text-destructive';
      case 'income':
        return 'text-success';
      case 'transfer':
        return 'text-info';
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border rounded-lg p-4 bg-card"
    >
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="max-w-[60%]">
            <div className="flex items-center gap-1">
              <p className="text-sm text-muted-foreground truncate">
                {transaction.type === 'transfer' ? 'Transfer' : (transaction.fromAccount || transaction.sender)}
              </p>
              {transaction.providerDetails?.providerType && (
                <Badge variant="outline" className="text-xs">
                  {transaction.providerDetails.providerType}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <p className="text-sm truncate max-w-full">
                {transaction.description || transaction.inferredCategory}
                {transaction.subcategory && ` - ${transaction.subcategory}`}
              </p>
              {transaction.person && (
                <Badge variant="outline" className="text-xs flex items-center gap-0.5">
                  <User size={10} />
                  {transaction.person}
                </Badge>
              )}
            </div>
            
            {transaction.type === 'transfer' && transaction.toAccount && (
              <div className="flex items-center gap-1 mt-1">
                <ArrowRightLeft size={12} className="text-info" />
                <p className="text-xs">To: {transaction.toAccount}</p>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{transaction.message}</p>
          </div>
          <div className="shrink-0">
            <p className={`font-semibold ${getTransactionTypeColor(transaction.type)}`}>
              {formatAmount(transaction.amount, transaction.currency)}
            </p>
            <p className="text-xs text-muted-foreground text-right">{transaction.date}</p>
            {transaction.providerDetails?.balanceAfterTransaction !== undefined && (
              <p className="text-xs text-muted-foreground text-right">
                Balance: {formatAmount(transaction.providerDetails.balanceAfterTransaction, transaction.currency)}
              </p>
            )}
          </div>
        </div>

        {/* Metadata badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className={`text-xs flex items-center gap-1 ${getTransactionTypeColor(transaction.type)}`}>
            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
          </Badge>
          
          {transaction.currency && (
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Coins size={12} />
              {transaction.currency}
            </Badge>
          )}
          
          {transaction.country && (
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Globe size={12} />
              {transaction.country}
            </Badge>
          )}
          
          {transaction.providerDetails?.providerName && (
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Building size={12} />
              {transaction.providerDetails.providerName}
            </Badge>
          )}
          
          {transaction.providerDetails?.accountLastFourDigits && (
            <Badge variant="outline" className="text-xs">
              •••• {transaction.providerDetails.accountLastFourDigits}
            </Badge>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium">Category:</p>
            <p className="text-sm">
              {transaction.inferredCategory}
              {transaction.subcategory && ` / ${transaction.subcategory}`}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="p-1 h-8 w-8"
              onClick={handleEdit}
            >
              <Edit size={16} />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="p-1 h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={() => onDecline(transaction.id)}
            >
              <X size={16} />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="p-1 h-8 w-8 text-success hover:bg-success/10"
              onClick={() => onConfirm(transaction)}
            >
              <Check size={16} />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isEditing} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Transaction Type</label>
              <Select 
                value={editedTransaction.type}
                onValueChange={(value) => handleChange('type', value as TransactionType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">From Account</label>
              <Input 
                value={editedTransaction.fromAccount || editedTransaction.sender}
                onChange={(e) => handleChange('fromAccount', e.target.value)}
              />
            </div>
            
            {editedTransaction.type === 'transfer' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">To Account</label>
                <Input 
                  value={editedTransaction.toAccount || ''}
                  onChange={(e) => handleChange('toAccount', e.target.value)}
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input 
                  type="number" 
                  value={Math.abs(editedTransaction.amount)}
                  onChange={(e) => handleChange('amount', Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Currency</label>
                <Select 
                  value={editedTransaction.currency || 'USD'}
                  onValueChange={(value) => handleChange('currency', value as SupportedCurrency)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(currency => (
                      <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select 
                value={editedTransaction.inferredCategory}
                onValueChange={(value) => handleChange('inferredCategory', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {availableSubcategories.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Subcategory</label>
                <Select 
                  value={editedTransaction.subcategory || ''}
                  onValueChange={(value) => handleChange('subcategory', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubcategories.map(subcategory => (
                      <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Person (Optional)</label>
              <div className="flex items-center gap-1">
                <Select
                  value={editedTransaction.person || ''}
                  onValueChange={(value) => handleChange('person', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select person" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {people.map(person => (
                      <SelectItem key={person} value={person}>{person}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" onClick={() => setAddPersonOpen(true)}>
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input 
                value={editedTransaction.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input 
                type="date"
                value={editedTransaction.date}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addPersonOpen} onOpenChange={setAddPersonOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Person</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Name*</label>
              <Input value={newPerson.name} onChange={e => setNewPerson(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Relation</label>
              <Input value={newPerson.relation} onChange={e => setNewPerson(prev => ({ ...prev, relation: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setAddPersonOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePerson}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default SmsTransactionConfirmation;
