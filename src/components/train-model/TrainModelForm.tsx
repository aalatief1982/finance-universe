
import React from 'react';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Transaction, TransactionType } from '@/types/transaction';
import { SupportedCurrency } from '@/types/locale';

interface TrainModelFormProps {
  transaction: Partial<Transaction>;
  onUpdateTransaction: (updatedTransaction: Partial<Transaction>) => void;
}

const TrainModelForm: React.FC<TrainModelFormProps> = ({
  transaction,
  onUpdateTransaction
}) => {
  const handleChange = (field: keyof Transaction, value: any) => {
    onUpdateTransaction({ [field]: value });
  };

  const getFormattedDate = () => {
    if (!transaction.date) return '';
    
    try {
      const date = new Date(transaction.date);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch (error) {
      return '';
    }
  };

  return (
    <Card className="sticky bottom-0 shadow-lg border-t border-border bg-background/95 backdrop-blur-sm">
      <CardHeader className="py-4">
        <CardTitle className="text-lg">Transaction Details</CardTitle>
        <CardDescription>
          Edit extracted transaction attributes that will be learned
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={transaction.amount || ''}
              onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={transaction.currency || 'SAR'}
              onValueChange={(value) => handleChange('currency', value)}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SAR">SAR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="AED">AED</SelectItem>
                <SelectItem value="EGP">EGP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type</Label>
            <Select
              value={transaction.type || 'expense'}
              onValueChange={(value) => handleChange('type', value as TransactionType)}
            >
              <SelectTrigger id="type">
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
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={getFormattedDate()}
              onChange={(e) => handleChange('date', new Date(e.target.value).toISOString())}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor/Description</Label>
            <Input
              id="vendor"
              value={transaction.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Vendor or description"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="account">Account</Label>
            <Input
              id="account"
              value={transaction.fromAccount || ''}
              onChange={(e) => handleChange('fromAccount', e.target.value)}
              placeholder="Source account"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={transaction.category || ''}
              onChange={(e) => handleChange('category', e.target.value)}
              placeholder="Category"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory</Label>
            <Input
              id="subcategory"
              value={transaction.subcategory || ''}
              onChange={(e) => handleChange('subcategory', e.target.value)}
              placeholder="Subcategory"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainModelForm;
