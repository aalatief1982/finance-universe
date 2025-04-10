
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clipboard, Plus, AlertTriangle, CheckCircle2, RefreshCcw, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { messageProcessingService } from '@/services/MessageProcessingService';
import { Transaction, TransactionType } from '@/types/transaction';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SupportedCurrency } from '@/types/locale';
import { getCategoriesForType, getSubcategoriesForCategory, PEOPLE, CURRENCIES } from '@/lib/categories-data';

interface SmartPasteProps {
  onTransactionsDetected: (transactions: Transaction[]) => void;
}

const SmartPaste: React.FC<SmartPasteProps> = ({ onTransactionsDetected }) => {
  const [pasteContent, setPasteContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedTransactions, setDetectedTransactions] = useState<Transaction[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTransaction, setEditedTransaction] = useState<Transaction | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  const { toast } = useToast();

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardText = e.clipboardData.getData('text');
    if (clipboardText) {
      setPasteContent(clipboardText);
      processText(clipboardText);
    }
  };

  const processText = (text: string) => {
    setIsProcessing(true);
    try {
      // Process the pasted text to extract transaction data
      const transaction = messageProcessingService.processMessageText(text);
      
      if (transaction) {
        setDetectedTransactions([transaction]);
        toast({
          title: "Transaction detected!",
          description: `Found a ${transaction.type} of ${Math.abs(transaction.amount)} ${transaction.currency}`,
        });
      } else {
        toast({
          title: "No transaction detected",
          description: "We couldn't identify a transaction in the pasted text. Try adjusting the text or paste a different message.",
          variant: "destructive",
        });
        setDetectedTransactions([]);
      }
    } catch (error) {
      console.error("Error processing text:", error);
      toast({
        title: "Processing error",
        description: "An error occurred while processing the text. Please try again.",
        variant: "destructive",
      });
      setDetectedTransactions([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportTransactions = () => {
    if (detectedTransactions.length > 0) {
      onTransactionsDetected(detectedTransactions);
      setPasteContent('');
      setDetectedTransactions([]);
      toast({
        title: "Transactions imported",
        description: `Successfully imported ${detectedTransactions.length} transaction(s)`,
      });
    }
  };

  const handleClear = () => {
    setPasteContent('');
    setDetectedTransactions([]);
  };

  const handleEdit = (transaction: Transaction) => {
    // Set available categories based on transaction type
    const categories = getCategoriesForType(transaction.type);
    setAvailableCategories(categories);
    
    // If a category is selected, update subcategories
    if (transaction.category) {
      const subcategories = getSubcategoriesForCategory(transaction.category);
      setAvailableSubcategories(subcategories);
    }
    
    setEditedTransaction({...transaction});
    setIsEditing(true);
  };

  const handleChange = (field: keyof Transaction, value: string | number | TransactionType) => {
    if (!editedTransaction) return;
    
    setEditedTransaction(prev => {
      if (!prev) return prev;
      
      const updated = {...prev, [field]: value};
      
      // Handle special cases
      if (field === 'type') {
        const transactionType = value as TransactionType;
        const categories = getCategoriesForType(transactionType);
        setAvailableCategories(categories);
        
        // Reset category and subcategory when type changes
        updated.category = '';
        updated.subcategory = '';
      }
      
      if (field === 'category') {
        const subcategories = getSubcategoriesForCategory(value as string);
        setAvailableSubcategories(subcategories);
        
        // Reset subcategory when category changes
        updated.subcategory = '';
      }
      
      return updated;
    });
  };

  const handleSaveEdit = () => {
    if (editedTransaction) {
      setDetectedTransactions([editedTransaction]);
      setIsEditing(false);
      
      toast({
        title: "Transaction updated",
        description: "Transaction details have been updated",
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 border rounded-lg space-y-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Clipboard className="text-primary h-5 w-5" />
        <h3 className="text-lg font-medium">Smart Paste</h3>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="paste-area" className="text-sm text-muted-foreground">
          Paste your transaction message below:
        </label>
        <Textarea
          id="paste-area"
          value={pasteContent}
          onChange={(e) => setPasteContent(e.target.value)}
          onPaste={handlePaste}
          placeholder="Paste a bank transaction SMS or notification here..."
          className="min-h-[120px] font-mono text-sm"
        />
      </div>
      
      {detectedTransactions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-1">
            <CheckCircle2 className="text-green-500 h-4 w-4" />
            Detected Transaction
          </h4>
          
          {detectedTransactions.map(transaction => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-secondary rounded-md text-sm"
            >
              <div className="flex justify-between">
                <span className="font-medium">{transaction.title}</span>
                <span className={transaction.type === 'expense' ? 'text-red-500' : 'text-green-500'}>
                  {transaction.type === 'expense' ? '-' : '+'}{Math.abs(transaction.amount)} {transaction.currency}
                </span>
              </div>
              <div className="text-muted-foreground text-xs mt-1">
                {transaction.category} • {transaction.date}
              </div>
              <div className="flex justify-end mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEdit(transaction)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" /> Edit
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      <div className="flex gap-2">
        <Button 
          className="flex-1" 
          onClick={() => processText(pasteContent)}
          disabled={!pasteContent || isProcessing}
        >
          {isProcessing ? (
            <>
              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Detect Transaction
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleClear}
          disabled={!pasteContent && detectedTransactions.length === 0}
        >
          Clear
        </Button>
      </div>
      
      {detectedTransactions.length > 0 && (
        <Button 
          variant="default"
          className="w-full"
          onClick={handleImportTransactions}
        >
          Import Transaction
        </Button>
      )}
      
      <div className="text-xs text-muted-foreground border-t pt-2">
        <div className="flex items-start gap-1">
          <AlertTriangle className="text-amber-500 h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            For best results, paste the complete message from your bank notification.
            We support various message formats from major banks.
          </p>
        </div>
      </div>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditing} onOpenChange={(open) => !open && setIsEditing(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editedTransaction && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Transaction Type</label>
                <Select 
                  value={editedTransaction.type}
                  onValueChange={(value) => handleChange('type', value as TransactionType)}
                >
                  <SelectTrigger>
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
                <label className="text-sm font-medium">Title</label>
                <Input 
                  value={editedTransaction.title || ''}
                  onChange={(e) => handleChange('title', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">From Account</label>
                <Input 
                  value={editedTransaction.fromAccount || ''}
                  onChange={(e) => handleChange('fromAccount', e.target.value)}
                />
              </div>
              
              {editedTransaction.type === 'transfer' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">To Account</label>
                  <Input 
                    value={editedTransaction.toAccount || ''}
                    onChange={(e) => handleChange('toAccount', e.target.value)}
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <Input 
                    type="number" 
                    value={Math.abs(editedTransaction.amount)}
                    onChange={(e) => handleChange('amount', Number(e.target.value) * (editedTransaction.type === 'expense' ? -1 : 1))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Currency</label>
                  <Select 
                    value={editedTransaction.currency || 'USD'}
                    onValueChange={(value) => handleChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(currency => (
                        <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select 
                  value={editedTransaction.category}
                  onValueChange={(value) => handleChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {availableSubcategories.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subcategory</label>
                  <Select 
                    value={editedTransaction.subcategory || ''}
                    onValueChange={(value) => handleChange('subcategory', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubcategories.map(subcategory => (
                        <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Person (Optional)</label>
                <Select 
                  value={editedTransaction.person || ''}
                  onValueChange={(value) => handleChange('person', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select person" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {PEOPLE.map(person => (
                      <SelectItem key={person} value={person}>{person}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <Input 
                  value={editedTransaction.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input 
                  type="date"
                  value={editedTransaction.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Textarea 
                  value={editedTransaction.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                <Button onClick={handleSaveEdit}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default SmartPaste;
