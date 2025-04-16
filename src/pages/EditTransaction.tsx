// 📁 Path: src/pages/EditTransaction.tsx (✳️ Updated to reflect full integration with SmartPaste transaction builder)

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain } from 'lucide-react';
import { Transaction } from '@/types/transaction';
import { useTransactions } from '@/context/TransactionContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import TransactionEditForm from '@/components/TransactionEditForm';
import { v4 as uuidv4 } from 'uuid';
import { storeTransaction } from '@/utils/storage-utils';
import { useLearningEngine } from '@/hooks/useLearningEngine';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LearnedEntry } from '@/types/learning';
import SmartPasteSummary from '@/components/SmartPasteSummary';
import { learningEngineService } from '@/services/LearningEngineService';
import { useTransactionBuilder } from '@/context/transaction-builder';

const EditTransaction = () => {
  const { draft, clearDraft } = useTransactionBuilder();
  const location = useLocation();
  const navigate = useNavigate();
  const { addTransaction } = useTransactions();
  const { toast } = useToast();

  const [saveForLearning, setSaveForLearning] = useState(true);

  useEffect(() => {
    if (!draft) navigate('/');
  }, [draft, navigate]);

  const handleSave = () => {
    if (!draft) return;
    const confirmed = {
      id: uuidv4(),
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
    storeTransaction(confirmed);

    toast({
      title: 'Transaction saved',
      description: 'Your transaction was successfully added.'
    });

    clearDraft();
    navigate('/dashboard');
  };

  const renderField = (label: string, field: keyof typeof draft, editable = true) => (
    <div className="mb-4">
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
      <small className="text-gray-500">Source: {draft?.[field]?.source}</small>
    </div>
  );

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
