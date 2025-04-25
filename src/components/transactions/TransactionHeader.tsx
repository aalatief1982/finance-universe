
import React from 'react';
import { Plus, FileDown, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ExpenseForm from '@/components/ExpenseForm';

interface TransactionHeaderProps {
  isAddingExpense: boolean;
  setIsAddingExpense: (isAdding: boolean) => void;
  onAddTransaction: (formData: any) => void;
  categories: string[];
  filtersVisible?: boolean;
  setFiltersVisible?: (visible: boolean) => void;
}

const TransactionHeader: React.FC<TransactionHeaderProps> = ({
  isAddingExpense,
  setIsAddingExpense,
  onAddTransaction,
  categories,
  filtersVisible,
  setFiltersVisible
}) => {
  return (
    <TooltipProvider>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <div className="flex items-center gap-2">
          {setFiltersVisible && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setFiltersVisible(!filtersVisible)}
                  aria-label="Toggle filters"
                  className={filtersVisible ? 'bg-muted' : ''}
                >
                  <Filter size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {filtersVisible ? 'Hide filters' : 'Show filters'}
              </TooltipContent>
            </Tooltip>
          )}
          
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <FileDown size={18} />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Export options</TooltipContent>
            </Tooltip>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <div>Export as CSV</div>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <div>Export as PDF</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button className="gap-1" onClick={() => setIsAddingExpense(true)}>
                  <Plus size={18} />
                  <span className="hidden sm:inline">Add Transaction</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add a new transaction</TooltipContent>
            </Tooltip>
            <DialogContent className="sm:max-w-md">
              <ExpenseForm 
                onSubmit={onAddTransaction} 
                categories={categories}
                onCancel={() => setIsAddingExpense(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default TransactionHeader;
