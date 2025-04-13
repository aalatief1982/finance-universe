
import React, { useState, useRef, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import AttributeSelectionDropdown from '@/components/train-model/AttributeSelectionDropdown';
import TransactionAttributesForm from '@/components/train-model/TransactionAttributesForm';
import { useLearningEngine } from '@/hooks/useLearningEngine';
import { masterMindService } from '@/services/MasterMindService';
import { Transaction } from '@/types/transaction';
import { SupportedCurrency } from '@/types/locale';
import { PositionedToken } from '@/types/learning';
import { learningEngineService } from '@/services/LearningEngineService';
import { v4 as uuidv4 } from 'uuid';

// Interface for selected text ranges
interface TextSelection {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
  attributeType?: 'direct' | 'infer' | 'ignore';
  field?: string;
  value?: string;
  inferValue?: string;
}

// Interface for field token map
interface FieldTokenMap {
  [key: string]: PositionedToken[];
}

const TrainModel = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { learnFromTransaction, inferFieldsFromText } = useLearningEngine();
  
  // State for the message and selections
  const [message, setMessage] = useState<string>(location.state?.message || '');
  const [senderHint, setSenderHint] = useState<string>(location.state?.sender || '');
  const [selections, setSelections] = useState<TextSelection[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [currentSelection, setCurrentSelection] = useState<{ start: number; end: number; text: string } | null>(null);
  
  // State for transaction attributes
  const [transaction, setTransaction] = useState<Partial<Transaction>>({
    amount: 0,
    description: '',
    currency: 'SAR' as SupportedCurrency,
    type: 'expense',
    fromAccount: '',
    date: new Date().toISOString(),
    category: 'Uncategorized',
    subcategory: '',
    title: ''
  });
  
  // Create a state for manualFieldTokenMap
  const [manualFieldTokenMap, setManualFieldTokenMap] = useState<Record<string, string[]>>({
    amount: [],
    currency: [],
    vendor: [],
    account: [],
    date: [],
    title: []
  });
  
  const handleSaveTraining = () => {
    learningEngineService.saveUserTraining(message, transaction, senderHint, manualFieldTokenMap);
    toast({ title: 'Saved', description: 'Training data saved successfully.' });
    navigate('/dashboard');
  };
  
  // Initialize transaction data from passed message if available
  useEffect(() => {
    if (message) {
      const inferredFields = inferFieldsFromText(message);
      if (inferredFields) {
        setTransaction(prev => ({ ...prev, ...inferredFields }));
      }
    }
  }, [message, inferFieldsFromText]);

  // Handle text selection
  const handleTextSelection = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      if (start !== end) {
        const selectedText = message.substring(start, end);
        setCurrentSelection({ start, end, text: selectedText });
        
        // Position the dropdown near the selection
        const { selectionStart, selectionEnd } = textarea;
        const selection = window.getSelection();
        
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          setDropdownPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX
          });
          
          setShowDropdown(true);
        }
      } else {
        setShowDropdown(false);
      }
    }
  };

  // Handle attribute type selection from dropdown
  const handleAttributeSelect = (type: 'direct' | 'infer' | 'ignore', field?: string, value?: string) => {
    if (currentSelection) {
      const newSelection: TextSelection = {
        id: `selection-${Date.now()}`,
        text: currentSelection.text,
        startOffset: currentSelection.start,
        endOffset: currentSelection.end,
        attributeType: type,
        field,
        value: currentSelection.text,
        inferValue: value
      };
      
      setSelections(prev => [...prev, newSelection]);
      
      // Update transaction data if direct attribute
      if (type === 'direct' && field) {
        const updatedTransaction = { ...transaction };
        
        if (field === 'amount') {
          updatedTransaction.amount = parseFloat(currentSelection.text) || 0;
        } else if (field === 'currency') {
          updatedTransaction.currency = currentSelection.text as SupportedCurrency;
        } else if (field === 'vendor') {
          updatedTransaction.description = currentSelection.text;
        } else if (field === 'account') {
          updatedTransaction.fromAccount = currentSelection.text;
        } else if (field === 'date') {
          // Try to parse as date
          const parsedDate = new Date(currentSelection.text);
          if (!isNaN(parsedDate.getTime())) {
            updatedTransaction.date = parsedDate.toISOString();
          }
        } else if (field === 'title') {
          updatedTransaction.title = currentSelection.text;
        }
        
        setTransaction(updatedTransaction);
      }

      // Register with MasterMind if it's a direct attribute
      if (type === 'direct' && field) {
        masterMindService.registerTokenWithPosition(
          currentSelection.text,
          field,
          currentSelection.start,
          {
            before: message.substring(Math.max(0, currentSelection.start - 50), currentSelection.start).split(/\s+/).filter(Boolean),
            after: message.substring(currentSelection.end, Math.min(message.length, currentSelection.end + 50)).split(/\s+/).filter(Boolean)
          }
        );
      }
      
      setShowDropdown(false);
    }
  };

  // Create field token map from selections
  const createFieldTokenMap = (): FieldTokenMap => {
    const fieldTokenMap: FieldTokenMap = {
      amount: [],
      currency: [],
      vendor: [],
      account: [],
      date: [],
      title: []
    };
    
    selections.forEach(selection => {
      if (selection.attributeType === 'direct' && selection.field) {
        const positionedToken: PositionedToken = {
          token: selection.text,
          position: selection.startOffset,
          context: {
            before: message.substring(Math.max(0, selection.startOffset - 50), selection.startOffset).split(/\s+/).filter(Boolean),
            after: message.substring(selection.endOffset, Math.min(message.length, selection.endOffset + 50)).split(/\s+/).filter(Boolean)
          }
        };
        
        if (fieldTokenMap[selection.field]) {
          fieldTokenMap[selection.field].push(positionedToken);
        }
      }
    });
    
    return fieldTokenMap;
  };

  // Save learning data
  const handleSaveLearning = () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Message cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const fieldTokenMap = createFieldTokenMap();
      
      // Create transaction object with a generated ID
      const txn: Transaction = {
        id: uuidv4(), // Generate a unique ID
        amount: transaction.amount || 0,
        currency: transaction.currency as SupportedCurrency,
        description: transaction.description || '',
        fromAccount: transaction.fromAccount || '',
        type: transaction.type || 'expense',
        date: transaction.date || new Date().toISOString(),
        category: transaction.category || 'Uncategorized',
        subcategory: transaction.subcategory || '',
        title: transaction.title || '',
        source: 'manual'
      };
      
      // Learn from transaction
      learnFromTransaction(message, txn, senderHint, fieldTokenMap);
      
      toast({
        title: "Success",
        description: "Learning data saved successfully"
      });
      
      // Navigate back
      navigate(-1);
    } catch (error) {
      console.error("Error saving learning data:", error);
      toast({
        title: "Error",
        description: "Failed to save learning data",
        variant: "destructive"
      });
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(-1);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <Layout>
      <div className="container max-w-5xl py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Train Model</h1>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <X size={16} />
              <span>Cancel</span>
            </Button>
            <Button 
              onClick={handleSaveLearning}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              <span>Save Learning</span>
            </Button>
          </div>
        </div>
        
        {senderHint && (
          <div className="mb-4 p-2 bg-muted rounded-md">
            <p className="text-sm font-medium">Source: {senderHint}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="md:col-span-8">
            <Card className="mb-6">
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-2">Message</p>
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onMouseUp={handleTextSelection}
                  onKeyUp={handleTextSelection}
                  className="min-h-[200px] text-base"
                  placeholder="Message content here..."
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Select text to tag as transaction attributes.
                </p>
              </CardContent>
            </Card>
            
            {/* Selection summaries */}
            {selections.length > 0 && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-2">Tagged Selections</h3>
                  <div className="space-y-2">
                    {selections.map((selection) => (
                      <div 
                        key={selection.id} 
                        className="p-2 rounded-md bg-muted flex justify-between items-center"
                      >
                        <div>
                          <span className="text-sm font-medium">{selection.text}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {selection.attributeType === 'direct' ? 
                              `→ ${selection.field}` : 
                              selection.attributeType === 'infer' ? 
                                `infers ${selection.field} = ${selection.inferValue}` : 
                                'ignored'}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelections(prev => prev.filter(s => s.id !== selection.id))}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="md:col-span-4">
            <TransactionAttributesForm 
              transaction={transaction}
              onChange={setTransaction}
            />
          </div>
        </div>
        
        {/* Floating attribute selection dropdown */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="fixed z-50 animate-in fade-in"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`
            }}
          >
            <AttributeSelectionDropdown
              onSelect={handleAttributeSelect}
              onClose={() => setShowDropdown(false)}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TrainModel;
