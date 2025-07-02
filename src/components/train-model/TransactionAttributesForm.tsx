
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Transaction, TransactionType } from '@/types/transaction';
import { SupportedCurrency } from '@/types/locale';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TransactionAttributesFormProps {
  transaction: Partial<Transaction>;
  onChange: (transaction: Partial<Transaction>) => void;
}

const TransactionAttributesForm: React.FC<TransactionAttributesFormProps> = ({ 
  transaction,
  onChange
}) => {
  const handleChange = (field: keyof Transaction, value: any) => {
    onChange({
      ...transaction,
      [field]: value
    });
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const currencies: SupportedCurrency[] = ['SAR', 'USD', 'EUR', 'AED', 'EGP', 'BHD'];
  const transactionTypes: TransactionType[] = ['expense', 'income', 'transfer'];

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Transaction Attributes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            value={transaction.amount?.toString() || '0'}
            onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={transaction.currency || 'SAR'}
            onValueChange={(value) => handleChange('currency', value as SupportedCurrency)}
          >
            <SelectTrigger id="currency" className="h-9">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            value={transaction.type || 'expense'}
            onValueChange={(value) => handleChange('type', value as TransactionType)}
          >
            <SelectTrigger id="type" className="h-9">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {transactionTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vendor">Vendor</Label>
          <Input
            id="vendor"
            value={transaction.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="account">Account</Label>
          <Input
            id="account"
            value={transaction.fromAccount || ''}
            onChange={(e) => handleChange('fromAccount', e.target.value)}
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formatDate(transaction.date)}
            onChange={(e) => handleChange('date', new Date(e.target.value).toISOString())}
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={transaction.category || ''}
            onChange={(e) => handleChange('category', e.target.value)}
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subcategory">Subcategory</Label>
          <Input
            id="subcategory"
            value={transaction.subcategory || ''}
            onChange={(e) => handleChange('subcategory', e.target.value)}
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={transaction.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            className="h-9"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionAttributesForm;
