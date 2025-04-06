import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Edit, Globe, DollarSign, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CATEGORIES } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { SupportedCurrency } from '@/types/locale';

export interface SmsTransaction {
  id: string;
  message: string;
  sender: string;
  amount: number;
  date: string;
  inferredCategory: string;
  description: string;
  currency?: SupportedCurrency;
  country?: string;
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

const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'SAR': 'SR',
  'EGP': 'E£',
  'INR': '₹',
  'AED': 'AED',
};

const SmsTransactionConfirmation: React.FC<SmsTransactionConfirmationProps> = ({
  transaction,
  onConfirm,
  onDecline,
  onEdit
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTransaction, setEditedTransaction] = useState({ ...transaction });

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

  const handleChange = (field: keyof SmsTransaction, value: string | number) => {
    setEditedTransaction(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getCurrencySymbol = (currency?: SupportedCurrency) => {
    if (!currency) return '$';
    return CURRENCY_SYMBOLS[currency] || currency;
  };

  const formatAmount = (amount: number, currency?: SupportedCurrency) => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${Math.abs(amount).toFixed(2)}`;
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
              <p className="text-sm text-muted-foreground truncate">From: {transaction.sender}</p>
              {transaction.providerDetails?.providerType && (
                <Badge variant="outline" className="text-xs">
                  {transaction.providerDetails.providerType}
                </Badge>
              )}
            </div>
            <p className="text-sm truncate max-w-full">{transaction.description}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{transaction.message}</p>
          </div>
          <div className="shrink-0">
            <p className={`font-semibold ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
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
          {transaction.currency && (
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <DollarSign size={12} />
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
            <p className="text-sm">{transaction.inferredCategory}</p>
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
              className="p-1 h-8 w-8 text-red-500 hover:bg-red-500/10"
              onClick={() => onDecline(transaction.id)}
            >
              <X size={16} />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="p-1 h-8 w-8 text-green-500 hover:bg-green-500/10"
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input 
                  type="number" 
                  value={Math.abs(editedTransaction.amount)}
                  onChange={(e) => handleChange('amount', Number(e.target.value) * (editedTransaction.amount < 0 ? -1 : 1))}
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
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="SAR">SAR (SR)</SelectItem>
                    <SelectItem value="EGP">EGP (E£)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select 
                value={editedTransaction.amount < 0 ? "expense" : "income"}
                onValueChange={(value) => {
                  const newAmount = Math.abs(editedTransaction.amount) * (value === "expense" ? -1 : 1);
                  handleChange('amount', newAmount);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
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
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
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
    </motion.div>
  );
};

export default SmsTransactionConfirmation;
