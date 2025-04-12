
import { useState } from 'react';
import useTokenOperations from './useTokenOperations';
import useMatchOperations from './useMatchOperations';
import useLearningOperations from './useLearningOperations';

/**
 * Main hook that coordinates token, matching and learning operations
 */
const useLearningTester = () => {
  const [message, setMessage] = useState<string>('');
  const [senderHint, setSenderHint] = useState<string>('');
  const [isLabelingMode, setIsLabelingMode] = useState(false);

  // Use the token operations hook
  const {
    tokenLabels,
    setTokenLabels,
    manualFieldTokenMap,
    setManualFieldTokenMap,
    labelingHistory,
    setLabelingHistory,
    messageTokens,
    handleDropToken,
    handleRemoveToken,
    clearAllLabels,
    undoLastLabeling,
    applyAutomaticLabels
  } = useTokenOperations(message, isLabelingMode);

  // Use the match operations hook
  const {
    matchResult,
    setMatchResult,
    confidenceBreakdown,
    findBestMatchHandler,
    getTokenFieldMatch
  } = useMatchOperations(message, senderHint, messageTokens, isLabelingMode, tokenLabels);

  // Use the learning operations hook
  const {
    dummyTransaction,
    setDummyTransaction,
    learnFromCurrentMessage,
    clearLearningEntriesHandler
  } = useLearningOperations(message, senderHint, isLabelingMode, manualFieldTokenMap);

  const toggleLabelingMode = () => {
    if (!isLabelingMode) {
      // Entering labeling mode, save current state for undo
      setLabelingHistory([{ ...tokenLabels }]);
    }
    setIsLabelingMode(!isLabelingMode);
  };

  return {
    // Input state
    message,
    setMessage,
    senderHint, 
    setSenderHint,
    
    // Mode state
    isLabelingMode,
    setIsLabelingMode,
    toggleLabelingMode,
    
    // Token operations
    tokenLabels,
    setTokenLabels,
    manualFieldTokenMap,
    setManualFieldTokenMap,
    labelingHistory,
    setLabelingHistory,
    messageTokens,
    handleDropToken,
    handleRemoveToken,
    clearAllLabels,
    undoLastLabeling,
    applyAutomaticLabels,
    
    // Match operations
    matchResult,
    setMatchResult,
    confidenceBreakdown,
    findBestMatchHandler,
    getTokenFieldMatch,
    
    // Learning operations
    dummyTransaction,
    setDummyTransaction,
    learnFromCurrentMessage,
    clearLearningEntriesHandler
  };
};

export default useLearningTester;
