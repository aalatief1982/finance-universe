
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DndProvider } from 'react-dnd/dist/core';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, BrainCircuit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MatchResult, LearnedEntry } from '@/types/learning';
import { Transaction, TransactionType } from '@/types/transaction';
import { SupportedCurrency } from '@/types/locale';
import { useLearningEngine } from '@/hooks/useLearningEngine';

// Import our components
import MessageInput from './components/MessageInput';
import MatchResults from './components/MatchResults';
import PageHeader from './components/PageHeader';
import useLearningTester from './hooks/useLearningTester';



//New Logic - aalatief 16/04/2025
import { extractStructure } from "../../lib/structure-extractor";
import { getTemplateByHash, saveNewTemplate } from "../../lib/template-manager";
import { fallbackMLInference } from "../../services/transformers";
import { useTransactionBuilder } from "../../context/transaction-builder";
import { useNavigate } from "react-router-dom";
///////////////////////////////////////////


const LearningTester: React.FC = () => {
  const {
    message,
    setMessage,
    senderHint,
    setSenderHint,
    matchResult,
    setMatchResult,
    isLabelingMode,
    setIsLabelingMode,
    tokenLabels,
    setTokenLabels,
    manualFieldTokenMap,
    setManualFieldTokenMap,
    labelingHistory,
    setLabelingHistory,
    dummyTransaction,
    setDummyTransaction,
    messageTokens,
    confidenceBreakdown,
    findBestMatchHandler,
    toggleLabelingMode,
    handleDropToken,
    handleRemoveToken,
    clearAllLabels,
    undoLastLabeling,
    applyAutomaticLabels,
    learnFromCurrentMessage,
    getTokenFieldMatch,
    clearLearningEntriesHandler
  } = useLearningTester();
  
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full px-4 sm:px-6 md:px-8 max-w-full space-y-6 py-8"
      >
        <PageHeader 
          clearLearningEntriesHandler={clearLearningEntriesHandler} 
        />

        <Card>
          <MessageInput 
            message={message}
            setMessage={setMessage}
            senderHint={senderHint}
            setSenderHint={setSenderHint}
            isLabelingMode={isLabelingMode}
            toggleLabelingMode={toggleLabelingMode}
            onTestMatching={findBestMatchHandler}
          />
        </Card>

        {(matchResult || (isLabelingMode && messageTokens.length > 0)) && (
          <DndProvider backend={HTML5Backend}>
            <Card>
              <MatchResults 
                matchResult={matchResult}
                isLabelingMode={isLabelingMode}
                messageTokens={messageTokens}
                tokenLabels={tokenLabels}
                manualFieldTokenMap={manualFieldTokenMap}
                dummyTransaction={dummyTransaction}
                setDummyTransaction={setDummyTransaction}
                confidenceBreakdown={confidenceBreakdown}
                handleDropToken={handleDropToken}
                handleRemoveToken={handleRemoveToken}
                getTokenFieldMatch={getTokenFieldMatch}
                clearAllLabels={clearAllLabels}
                undoLastLabeling={undoLastLabeling}
                applyAutomaticLabels={applyAutomaticLabels}
                learnFromCurrentMessage={learnFromCurrentMessage}
                labelingHistory={labelingHistory}
              />
            </Card>
          </DndProvider>
        )}
      </motion.div>
    </Layout>
  );
};

////New Logic - aaaltief 16/04/2025

const handleCaptureMessage = async (rawMessage: string) => {
  const { structure, hash, detectedFields } = extractStructure(rawMessage);
  const { setDraft } = useTransactionBuilder();
  const navigate = useNavigate();

  let transactionDraft: any = {
    rawMessage,
    structureHash: hash,
    createdAt: new Date().toISOString(),
    type: { value: "expense", source: "manual" }, // default fallback
    person: { value: "", source: "manual" },
    description: { value: "", source: "manual" }
  };

  // Pull detected fields from regex
  Object.assign(transactionDraft, detectedFields);

  const existingTemplate = getTemplateByHash(hash);

  if (existingTemplate) {
    // Use template fields as known fields
    existingTemplate.fields.forEach(field => {
      if (!transactionDraft[field]) {
        transactionDraft[field] = {
          value: existingTemplate.defaultValues?.[field] || "",
          source: "template"
        };
      }
    });
  } else {
    // If structure new, save it for learning
    saveNewTemplate({
      hash,
      structure,
      fields: Object.keys(detectedFields) as any,
      createdAt: new Date().toISOString()
    });
  }

  // Fallback ML for missing important fields
  const missingKeys = ["type", "category", "subcategory", "vendor"] as const;
  const needML = missingKeys.some(k => !transactionDraft[k]);

  if (needML) {
    const mlResult = await fallbackMLInference(rawMessage);
    missingKeys.forEach(key => {
      if (mlResult[key]) {
        transactionDraft[key] = {
          value: mlResult[key],
          source: "ml",
          confidence: mlResult.confidence || 0.7
        };
      }
    });
  }

  // Push to context and navigate to edit page
  setDraft(transactionDraft);
  navigate("/edit-transaction");
};

export default LearningTester;
