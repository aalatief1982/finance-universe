
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import TrainModelForm from '@/components/train-model/TrainModelForm';
import SelectionDropdown from '@/components/train-model/SelectionDropdown';
import TextAnnotator from '@/components/train-model/TextAnnotator';
import { Transaction, TransactionType } from '@/types/transaction';
import { SupportedCurrency } from '@/types/locale';
import { learningEngineService } from '@/services/LearningEngineService';
import { PositionedToken } from '@/types/learning';

export interface TextSelection {
  text: string;
  startOffset: number;
  endOffset: number;
  attributeType?: 'direct' | 'infer' | 'ignore';
  fieldName?: string;
  inferValue?: string;
}

interface TrainModelState {
  message: string;
  selections: TextSelection[];
  fieldTokenMap: Record<string, PositionedToken[]>;
  transaction: Partial<Transaction>;
}

const TrainModel: React.FC = () => {
  const navigate = useNavigate();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  // Sample message - in a real app, this would come from props or URL params
  const initialMessage = "شراء عبر نقاط البيع SAR 155.50 لدى TAMIMI MARKETS";
  
  const [state, setState] = useState<TrainModelState>({
    message: initialMessage,
    selections: [],
    fieldTokenMap: {},
    transaction: {
      amount: 0,
      currency: 'SAR' as SupportedCurrency,
      type: 'expense' as TransactionType,
      date: new Date().toISOString(),
      description: '',
      fromAccount: '',
      category: 'Uncategorized',
      subcategory: '',
      title: ''
    }
  });
  
  const [dropdownPosition, setDropdownPosition] = useState<{
    visible: boolean;
    top: number;
    left: number;
    selection?: {
      text: string;
      startOffset: number;
      endOffset: number;
    };
  }>({
    visible: false,
    top: 0,
    left: 0
  });

  // Initialize with data from the learning engine
  useEffect(() => {
    // Fetch initial field values using the learning engine
    try {
      // Extract field values from the message
      const inferredFields = learningEngineService.inferFieldsFromText(state.message);
      
      // Create fieldTokenMap from the message
      const fieldTokenMap = {
        amount: learningEngineService.extractAmountTokensWithPosition(state.message),
        currency: learningEngineService.extractCurrencyTokensWithPosition(state.message),
        vendor: learningEngineService.extractVendorTokensWithPosition(state.message),
        account: learningEngineService.extractAccountTokensWithPosition(state.message),
        date: learningEngineService.extractDateTokensWithPosition(state.message),
      };
      
      setState(prev => ({
        ...prev,
        fieldTokenMap,
        transaction: {
          ...prev.transaction,
          ...inferredFields
        }
      }));
    } catch (error) {
      console.error('Error initializing train model data:', error);
    }
  }, [state.message]);

  const handleTextSelection = () => {
    if (!textAreaRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      // Hide dropdown if no selection
      setDropdownPosition({ visible: false, top: 0, left: 0 });
      return;
    }
    
    const range = selection.getRangeAt(0);
    const textContent = textAreaRef.current.value;
    
    // Get selection details
    const selectedText = selection.toString().trim();
    if (!selectedText) {
      setDropdownPosition({ visible: false, top: 0, left: 0 });
      return;
    }
    
    // Find the start and end offsets of the selection in the text
    const startOffset = textContent.indexOf(selectedText);
    const endOffset = startOffset + selectedText.length;
    
    // Get position for dropdown
    const rangeRect = range.getBoundingClientRect();
    const textAreaRect = textAreaRef.current.getBoundingClientRect();
    
    setDropdownPosition({
      visible: true,
      top: rangeRect.bottom - textAreaRect.top + 10,
      left: rangeRect.left - textAreaRect.left + (rangeRect.width / 2),
      selection: {
        text: selectedText,
        startOffset,
        endOffset
      }
    });
  };

  const handleSelectionAction = (action: 'direct' | 'infer' | 'ignore', fieldName?: string, inferValue?: string) => {
    if (!dropdownPosition.selection) return;
    
    const newSelection: TextSelection = {
      text: dropdownPosition.selection.text,
      startOffset: dropdownPosition.selection.startOffset,
      endOffset: dropdownPosition.selection.endOffset,
      attributeType: action,
      fieldName,
      inferValue
    };
    
    // Add selection to state
    setState(prev => {
      // Create new positioned token for direct attributes
      const updatedFieldTokenMap = { ...prev.fieldTokenMap };
      
      if (action === 'direct' && fieldName) {
        const newToken: PositionedToken = {
          token: newSelection.text,
          position: newSelection.startOffset,
          context: {
            before: state.message.slice(Math.max(0, newSelection.startOffset - 20), newSelection.startOffset).split(/\s+/),
            after: state.message.slice(newSelection.endOffset, Math.min(state.message.length, newSelection.endOffset + 20)).split(/\s+/)
          }
        };
        
        if (!updatedFieldTokenMap[fieldName]) {
          updatedFieldTokenMap[fieldName] = [];
        }
        
        updatedFieldTokenMap[fieldName] = [...updatedFieldTokenMap[fieldName], newToken];
        
        // For specific fields, update the transaction directly
        if (fieldName === 'amount') {
          const amount = parseFloat(newSelection.text.replace(/[^\d.]/g, ''));
          if (!isNaN(amount)) {
            return {
              ...prev,
              selections: [...prev.selections, newSelection],
              fieldTokenMap: updatedFieldTokenMap,
              transaction: {
                ...prev.transaction,
                amount
              }
            };
          }
        }
        
        if (fieldName === 'vendor') {
          return {
            ...prev,
            selections: [...prev.selections, newSelection],
            fieldTokenMap: updatedFieldTokenMap,
            transaction: {
              ...prev.transaction,
              description: newSelection.text
            }
          };
        }
      }
      
      return {
        ...prev,
        selections: [...prev.selections, newSelection],
        fieldTokenMap: updatedFieldTokenMap
      };
    });
    
    // Hide dropdown
    setDropdownPosition({ visible: false, top: 0, left: 0 });
    
    // Clear selection
    window.getSelection()?.removeAllRanges();
  };

  const handleTransactionUpdate = (updatedTransaction: Partial<Transaction>) => {
    setState(prev => ({
      ...prev,
      transaction: {
        ...prev.transaction,
        ...updatedTransaction
      }
    }));
  };

  const handleSaveLearning = () => {
    try {
      if (!state.transaction.amount || !state.transaction.type) {
        toast.error('Transaction must have at least an amount and type');
        return;
      }
      
      // Save to learning engine
      learningEngineService.learnFromTransaction(
        state.message,
        state.transaction as Transaction,
        'user-training', // Sender hint
        state.fieldTokenMap
      );
      
      toast.success('Learning saved successfully');
      
      // Navigate back or clear form
      setTimeout(() => navigate('/'), 1000);
    } catch (error) {
      console.error('Error saving learning:', error);
      toast.error('Failed to save learning');
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Train Model</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline" 
            onClick={handleCancel}
            className="flex gap-2 items-center"
          >
            <X className="h-4 w-4" />
            <span>Discard</span>
          </Button>
          <Button 
            onClick={handleSaveLearning}
            className="flex gap-2 items-center"
          >
            <Save className="h-4 w-4" />
            <span>Save Learning</span>
          </Button>
        </div>
      </div>

      <Card className="p-4 mb-6 shadow-sm">
        <div className="mb-2 text-sm font-medium">Message Text</div>
        <div className="relative">
          <TextAnnotator
            value={state.message}
            onChange={message => setState(prev => ({ ...prev, message }))}
            selections={state.selections}
            onSelectionChange={handleTextSelection}
            textAreaRef={textAreaRef}
          />
          
          {dropdownPosition.visible && dropdownPosition.selection && (
            <SelectionDropdown
              top={dropdownPosition.top}
              left={dropdownPosition.left}
              selectedText={dropdownPosition.selection.text}
              onSelect={handleSelectionAction}
              onClose={() => setDropdownPosition({ visible: false, top: 0, left: 0 })}
            />
          )}
        </div>
      </Card>

      <TrainModelForm
        transaction={state.transaction}
        onUpdateTransaction={handleTransactionUpdate}
      />
    </div>
  );
};

export default TrainModel;
