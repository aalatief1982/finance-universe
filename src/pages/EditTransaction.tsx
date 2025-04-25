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
//import { learningEngineService } from '@/services/LearningEngineService';
import { loadKeywordBank, saveKeywordBank } from '@/lib/smart-paste-engine/keywordBankUtils';
import { loadTemplateBank, saveTemplateBank } from '@/lib/smart-paste-engine/templateUtils';

import { saveNewTemplate } from '@/lib/smart-paste-engine/templateUtils';
import { extractTemplateStructure } from '@/lib/smart-paste-engine/templateUtils';
import { getAllTemplates } from '@/lib/smart-paste-engine/templateUtils';


function generateDefaultTitle(tx: Transaction): string {
  const { category, subcategory, amount, date } = tx;
  const valid = category && subcategory && amount && date;
  if (!valid) return '';

  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).replace(/ /g, '');

  return `${category}|${subcategory}|${amount}|${formattedDate}`;
}

const EditTransaction = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { addTransaction, updateTransaction, transactions } = useTransactions();
  const { toast } = useToast();
  const { learnFromTransaction, config, getLearnedEntries } = useLearningEngine();
  //const [saveForLearning, setSaveForLearning] = React.useState(config.saveAutomatically);
  const [matchDetails, setMatchDetails] = useState<{
    entry: LearnedEntry | null;
    confidence: number;
  } | null>(null);

  let transaction = location.state?.transaction as Transaction | undefined;

  const rawMessage = location.state?.rawMessage as string | undefined;
  const senderHint = location.state?.senderHint as string | undefined;
  const isSuggested = location.state?.isSuggested as boolean | undefined;
  const confidenceScore = location.state?.confidence as number | undefined;
  //const shouldTrain = location.state?.shouldTrain as boolean | undefined;
  const templateHash = location.state?.templateHash as string | undefined;

  const isNewTransaction = !transaction;

  /*const handleGoToTraining = () => {
    if (rawMessage) {
      navigate('/train-model', {
        state: {
          rawMessage,
          senderHint,
        },
      });
    }
  };*/

  const handleSave = (editedTransaction: Transaction) => {
	  
	  let directFields: Record<string, string> = {};
	if (rawMessage) {
	  const { placeholders } = extractTemplateStructure(rawMessage);
	  directFields = placeholders;
	}

    const newTransaction = {
      ...editedTransaction,
      id: editedTransaction.id || uuidv4(),
      source: editedTransaction.source || 'manual'
    };

    if (isNewTransaction) {
      addTransaction(newTransaction);
    } else {
      updateTransaction(newTransaction);
    }

    storeTransaction(newTransaction);

    if (rawMessage /*&& saveForLearning*/) {
      learnFromTransaction(rawMessage, newTransaction, senderHint || '');
	  
	      // ✅ Save structure template now if it's not already saved
			const { template, placeholders } = extractTemplateStructure(rawMessage);
			const fields = Object.keys(placeholders);
			const templateHash = btoa(unescape(encodeURIComponent(template))).slice(0, 24);

			const existingTemplates = getAllTemplates();
			const alreadyExists = existingTemplates.some(t => t.id === templateHash);
			if (!alreadyExists) {
			  saveNewTemplate(template, fields, rawMessage);
			}

			toast({
			  title: "Pattern saved for learning",
			  description: "Future similar messages will be recognized automatically",
			});

      // --- Vendor → Category/Subcategory Mapping ---
      if (newTransaction.vendor && newTransaction.category) {
        //const keyword = newTransaction.vendor.toLowerCase().split(' ')[0];
		const keyword = directFields?.vendor?.toLowerCase() || newTransaction.vendor.toLowerCase();

        const bank = loadKeywordBank();
        const existing = bank.find(k => k.keyword === keyword);

        const newMappings = [
          { field: 'category', value: newTransaction.category },
          { field: 'subcategory', value: newTransaction.subcategory || 'none' }
        ];

        if (existing) {
          newMappings.forEach(mapping => {
            const alreadyMapped = existing.mappings.some(m => m.field === mapping.field);
            if (!alreadyMapped) {
              existing.mappings.push(mapping);
            }
          });
        } else {
          bank.push({ keyword, mappings: newMappings });
        }

        saveKeywordBank(bank);
      }
	  
	  if (
		  rawMessage &&
		  /*saveForLearning &&*/
		  editedTransaction.vendor &&
		  directFields?.vendor &&
		  editedTransaction.vendor !== directFields.vendor
		) {
		  const vendorMap = JSON.parse(localStorage.getItem('xpensia_vendor_map') || '{}');
		  vendorMap[directFields.vendor] = editedTransaction.vendor;
		  localStorage.setItem('xpensia_vendor_map', JSON.stringify(vendorMap));
		}

      // --- FromAccount → TemplateHash Mapping ---
      if (templateHash && newTransaction.fromAccount) {
        const templates = loadTemplateBank();
        const template = templates.find(t => t.id === templateHash);
        if (template && !template.defaultValues?.fromAccount) {
          template.defaultValues = {
            ...template.defaultValues,
            fromAccount: newTransaction.fromAccount
          };
          saveTemplateBank(templates);
        }
      }

      toast({
        title: "Pattern saved for learning",
        description: "Future similar messages will be recognized automatically",
      });
    }

    toast({
      title: isNewTransaction ? "Transaction created" : "Transaction updated",
      description: `Your transaction has been successfully ${isNewTransaction ? 'created' : 'updated'}`,
    });

    navigate(-1);

  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full py-4 sm:py-6 space-y-4 sm:space-y-6 px-4 sm:px-6"
      >
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">
            {isNewTransaction ? "Add Transaction" : "Edit Transaction"}
          </h1>
        </div>
        
        {isSuggested && (
          <Alert>
            <AlertDescription className="text-sm">
              This transaction was automatically suggested based on previous patterns.
              You can edit any field before saving.
            </AlertDescription>
          </Alert>
        )}
        
        {rawMessage && (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-xs font-mono break-words">
              <span className="font-semibold">Source message:</span> {rawMessage}
            </p>
          </div>
        )}
        
        {confidenceScore !== undefined && location.state?.matchedCount !== undefined && location.state?.totalTemplates !== undefined && (
          <SmartPasteSummary
            confidence={confidenceScore}
            matchedCount={location.state.matchedCount}
            totalTemplates={location.state.totalTemplates}
          />
        )}

        {matchDetails?.confidence === 0.4 && (
          <Alert className="bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-300 border-purple-300">
            <AlertDescription className="text-sm">
              This transaction was matched using a saved <strong>template structure</strong> with partial confidence (40%).<br />
              You can review and adjust the fields before saving to improve future detection.
            </AlertDescription>
          </Alert>
        )}

        {matchDetails && matchDetails.entry && (
          <div className="border border-red-300 bg-red-50 dark:bg-red-950/20 p-4 rounded-md">
            <h3 className="text-red-600 dark:text-red-400 font-medium mb-2">Smart Matching Details</h3>
            <div className="text-sm text-red-600 dark:text-red-400 space-y-2">
              <p><strong>Match Confidence:</strong> {Math.round(matchDetails.confidence * 100)}%</p>
              <p><strong>Matched Template:</strong> {matchDetails.entry.rawMessage.substring(0, 50)}...</p>
              <div>
                <p className="font-semibold mb-1">Matched Fields:</p>
                <ul className="list-disc list-inside pl-2 space-y-1">
                  <li>Transaction Type: {matchDetails.entry.confirmedFields.type}</li>
                  <li>Amount: {matchDetails.entry.confirmedFields.amount} {matchDetails.entry.confirmedFields.currency}</li>
                  <li>Category: {matchDetails.entry.confirmedFields.category}</li>
                  <li>Account: {matchDetails.entry.confirmedFields.account}</li>
                  {matchDetails.entry.confirmedFields.person && (
                    <li>Person: {matchDetails.entry.confirmedFields.person}</li>
                  )}
                  {matchDetails.entry.confirmedFields.vendor && (
                    <li>Vendor: {matchDetails.entry.confirmedFields.vendor}</li>
                  )}
                </ul>
              </div>
              <p className="italic text-xs mt-2">
                The transaction details were auto-filled based on this previously learned pattern.
                You can still edit any field before saving.
              </p>
            </div>
          </div>
        )}
        
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle>
              {isNewTransaction ? "Create a new transaction" : "Edit transaction details"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <TransactionEditForm 
              transaction={transaction} 
              onSave={handleSave} 
            />
            
  
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default EditTransaction;
