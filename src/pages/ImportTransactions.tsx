// 📁 Path: src/pages/ImportTransactions.tsx (✳️ Updated to integrate SmartPaste parsing flow)

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useTransactionBuilder } from '@/context/transaction-builder';
import { useNavigate } from 'react-router-dom';
import { extractStructure } from '@/lib/structure-extractor';
import { getTemplateByHash, saveNewTemplate } from '@/lib/template-manager';
import { fallbackMLInference } from '@/services/transformers';
import { inferTypeByKeywords } from '@/lib/type-inference';
import { Button } from '@/components/ui/button';

const ImportTransactions: React.FC = () => {
  const [rawMessages, setRawMessages] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();
  const { setDraft } = useTransactionBuilder();

  const handleImport = async () => {
    const messages = rawMessages.split(/\n\n+/).map(msg => msg.trim()).filter(Boolean);
    if (messages.length === 0) return;

    setProcessing(true);

    for (const rawMessage of messages) {
      const { structure, hash, detectedFields } = extractStructure(rawMessage);
      let transactionDraft: any = {
        rawMessage,
        structureHash: hash,
        createdAt: new Date().toISOString(),
        person: { value: '', source: 'manual' },
        description: { value: '', source: 'manual' }
      };

      Object.assign(transactionDraft, detectedFields);

      const template = getTemplateByHash(hash);
      if (template) {
        template.fields.forEach(field => {
          if (!transactionDraft[field]) {
            transactionDraft[field] = {
              value: template.defaultValues?.[field] || '',
              source: 'template'
            };
          }
        });
      } else {
        saveNewTemplate({
          hash,
          structure,
          fields: Object.keys(detectedFields) as any,
          createdAt: new Date().toISOString()
        });
      }

      if (!transactionDraft.type) {
        const inferredType = inferTypeByKeywords(rawMessage);
        if (inferredType) {
          transactionDraft.type = {
            value: inferredType,
            source: 'suggestion'
          };
        }
      }

      const missingKeys = ["type", "category", "subcategory", "vendor"] as const;
      const needML = missingKeys.some(k => !transactionDraft[k]);
      if (needML) {
        const mlResult = await fallbackMLInference(rawMessage);
        missingKeys.forEach(key => {
          if (mlResult[key] && !transactionDraft[key]) {
            transactionDraft[key] = {
              value: mlResult[key],
              source: 'ml',
              confidence: mlResult.confidence || 0.7
            };
          }
        });
      }

      setDraft(transactionDraft);
      navigate('/edit-transaction');
      break; // Process one at a time with review
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto py-8 px-4">
        <h1 className="text-xl font-bold mb-4">Import Transactions</h1>
        <textarea
          value={rawMessages}
          onChange={(e) => setRawMessages(e.target.value)}
          rows={12}
          className="w-full border border-gray-300 rounded p-3 mb-4"
          placeholder="Paste multiple SMS messages separated by blank lines..."
        />
        <Button onClick={handleImport} disabled={processing || !rawMessages.trim()}>
          {processing ? 'Processing...' : 'Parse & Review'}
        </Button>
      </div>
    </Layout>
  );
};

export default ImportTransactions;
