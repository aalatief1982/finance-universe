// 📁 Path: src/pages/EditTransaction.tsx (✳️ Updated with validation, source-based coloring, and field confidence display)

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain } from 'lucide-react';
import { Transaction } from '@/types/transaction';
import { useTransactions } from '@/context/TransactionContext';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTransactionBuilder } from '@/context/transaction-builder';

const EditTransaction = () => {
  const { draft, clearDraft } = useTransactionBuilder();
  const navigate = useNavigate();
  const { addTransaction } = useTransactions();
  const { toast } = useToast();

  const [saveForLearning, setSaveForLearning] = useState(true);

  useEffect(() => {
    if (!draft) navigate('/');
  }, [draft, navigate]);

  const handleSave = () => {
    if (!draft) return;

    const requiredFields: (keyof typeof draft)[] = [
      'type', 'amount', 'currency', 'date', 'fromAccount', 'vendor', 'category'
    ];

    const hasMissing = requiredFields.some(field => !draft[field]?.value);
    if (hasMissing) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields before saving.',
        variant: 'destructive'
      });
      return;
    }

    const confirmed = {
      id: crypto.randomUUID(),
      source: 'smart-paste',
      type: draft.type.value,
      amount: draft.amount.value,
      currency: draft.currency.value,
      date: draft.date.value,
      fromAccount: draft.fromAccount.value,
      toAccount: draft.toAccount?.value || '',
      vendor: draft.vendor.value,
      category: draft.category.value,
      subcategory: draft.subcategory.value,
      person: draft.person.value,
      description: draft.description.value,
      createdAt: draft.createdAt,
      updatedAt: new Date().toISOString()
    };

    addTransaction(confirmed);
    toast({
      title: 'Transaction saved',
      description: 'Your transaction was successfully added.'
    });

    clearDraft();
    navigate('/dashboard');
  };
}

export function listSuggestions(): Record<string, SuggestionEntry> {
  return vendorSuggestions;
}

export function clearSuggestions(): void {
  Object.keys(vendorSuggestions).forEach(k => delete vendorSuggestions[k]);
}
  const renderField = (label: string, field: keyof typeof draft, editable = true) => {
    const source = draft?.[field]?.source;
    const confidence = draft?.[field]?.confidence;
    const colorMap = {
      template: 'bg-blue-50 border-blue-300',
      regex: 'bg-green-50 border-green-300',
      suggestion: 'bg-yellow-50 border-yellow-300',
      ml: 'bg-purple-50 border-purple-300',
      manual: 'bg-white'
    };

    return (
      <div className={`mb-4 p-2 border rounded ${colorMap[source] || 'bg-white'}`}>
        <label className="block text-sm font-semibold mb-1">{label}</label>
        <input
          className="w-full p-2 border rounded"
          value={draft?.[field]?.value || ''}
          onChange={(e) => {
            if (draft) {
              draft[field] = { value: e.target.value, source: 'manual' };
            }
          }}
          disabled={!editable}
        />
        <div className="text-xs text-gray-600 mt-1">
          Source: {source} {confidence !== undefined ? `(Confidence: ${Math.round(confidence * 100)}%)` : ''}
        </div>
      </div>
    );
  };

  if (!draft) return null;

  return (
    <Layout>
      <motion.div className="max-w-md mx-auto p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Review & Confirm Transaction</h1>
        </div>

        {renderField('Type', 'type')}
        {renderField('Amount', 'amount')}
        {renderField('Currency', 'currency')}
        {renderField('Date', 'date')}
        {renderField('From Account', 'fromAccount')}
        {renderField('To Account', 'toAccount')}
        {renderField('Vendor', 'vendor')}
        {renderField('Category', 'category')}
        {renderField('Subcategory', 'subcategory')}
        {renderField('Main Person', 'person')}
        {renderField('Description', 'description')}

        <div className="flex items-center space-x-2 pt-4 border-t mt-4">
          <Switch
            id="save-for-learning"
            checked={saveForLearning}
            onCheckedChange={setSaveForLearning}
          />
          <Label htmlFor="save-for-learning" className="flex items-center">
            <Brain className="h-4 w-4 mr-2" />
            Save this pattern for future suggestions
          </Label>
        </div>

        <div className="flex gap-2 mt-6">
          <Button className="flex-1" onClick={handleSave}>Save</Button>
          <Button className="flex-1" variant="secondary" onClick={() => { clearDraft(); navigate(-1); }}>Cancel</Button>
        </div>
      </motion.div>
    </Layout>
  );
};

export default EditTransaction;
