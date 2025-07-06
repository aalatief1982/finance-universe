
import React, { useState, useEffect } from 'react';
import { MoreHorizontal, ChevronDown, ChevronUp, Edit, Trash, ArrowUpRight, ArrowDownRight, List, Grid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Transaction } from '@/types/transaction';
import { formatCurrency } from '@/utils/format-utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { format } from 'date-fns';
import { TYPE_ICON_MAP } from '@/constants/typeIconMap';
import CategoryIcon from '@/components/CategoryIcon';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  showCheckboxes?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  emptyMessage?: string;
  showPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  getCategoryPath?: (categoryId: string) => string;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  isLoading = false,
  onEdit,
  onDelete,
  sortField = 'date',
  sortDirection = 'desc',
  onSort,
  showCheckboxes = false,
  onSelectionChange,
  emptyMessage = 'No transactions found',
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  getCategoryPath
}) => {
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Reset selection when transactions change
  useEffect(() => {
    setSelectedTransactions([]);
  }, [transactions]);

  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedTransactions);
    }
  }, [selectedTransactions, onSelectionChange]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions(transactions.map(t => t.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleSelectTransaction = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTransactions(prev => [...prev, id]);
    } else {
      setSelectedTransactions(prev => prev.filter(tId => tId !== id));
    }
  };

  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSort = (field: string) => {
    if (onSort) {
      onSort(field);
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' ? 
      <ChevronUp className="ml-1 h-4 w-4" /> : 
      <ChevronDown className="ml-1 h-4 w-4" />;
  };

  const renderAmount = (transaction: Transaction) => {
    const isIncome = transaction.amount >= 0;
    const Icon = isIncome ? ArrowUpRight : ArrowDownRight;
    
    return (
      <div className="flex items-center">
        <Icon 
          className={`mr-1 h-4 w-4 ${isIncome ? 'text-success' : 'text-destructive'}`} 
        />
        <span className={isIncome ? 'text-success' : 'text-destructive'}>
          {formatCurrency(Math.abs(transaction.amount), transaction.currency || 'USD')}
        </span>
      </div>
    );
  };

  const renderCategory = (transaction: Transaction) => {
    const typeInfo = TYPE_ICON_MAP[transaction.type];
    const TypeIcon = typeInfo.icon;

    return (
      <div className="flex items-center gap-1">
        <CategoryIcon category={transaction.category} size={16} />
        <TypeIcon className={`w-4 h-4 ${typeInfo.color}`} />
        <span className="text-sm">{transaction.category}</span>
      </div>
    );
  };

  const renderType = (type: string) => {
    switch (type) {
      case 'income':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Income</Badge>;
      case 'expense':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Expense</Badge>;
      case 'transfer':
        return <Badge variant="outline" className="bg-info/10 text-info border-info/20">Transfer</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const renderDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Render loading skeletons
  if (isLoading) {
    return (
      <Card>
        <div className="p-[var(--card-padding)]">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
                <Skeleton className="h-4 w-[100px]" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Render empty state
  if (transactions.length === 0) {
    return (
      <Card>
        <div className="p-[var(--card-padding)] text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      </Card>
    );
  }

  // Render mobile view
  if (isMobile) {
    return (
      <div className="space-y-3">
        {transactions.map((transaction, idx) => (
          <Card key={transaction.id || idx} className="overflow-hidden">
            <div className="p-[var(--card-padding)]">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">{transaction.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {renderDate(transaction.date)}
                  </p>
                </div>
                {renderAmount(transaction)}
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  {renderCategory(transaction)}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(transaction)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(transaction.id)}
                        className="text-destructive"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Expandable details */}
              {transaction.notes && (
                <div className="mt-2 pt-2 border-t text-sm text-muted-foreground">
                  <p>{transaction.notes}</p>
                </div>
              )}
            </div>
          </Card>
        ))}
        
        {/* Mobile pagination */}
        {showPagination && totalPages > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange && onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <span className="py-2 px-3 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange && onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Render desktop view
  return (
    <Card>
      <ScrollArea className="h-[calc(100vh-300px)]">
        <Table>
          <TableHeader>
            <TableRow>
              {showCheckboxes && (
                <TableHead className="w-[40px]">
                  <Checkbox 
                    checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center">
                  Title
                  {renderSortIcon('title')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center">
                  Amount
                  {renderSortIcon('amount')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center">
                  Category
                  {renderSortIcon('category')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center">
                  Date
                  {renderSortIcon('date')}
                </div>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction, idx) => {
              const isExpanded = expandedRows[transaction.id] || false;
              
              return (
                <React.Fragment key={transaction.id || idx}>
                  <TableRow>
                    {showCheckboxes && (
                      <TableCell>
                        <Checkbox 
                          checked={selectedTransactions.includes(transaction.id)}
                          onCheckedChange={(checked) => 
                            handleSelectTransaction(transaction.id, checked as boolean)
                          }
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="font-medium">{transaction.title}</div>
                      {transaction.notes && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1 text-xs text-muted-foreground"
                          onClick={() => toggleRowExpand(transaction.id)}
                        >
                          {isExpanded ? 'Hide details' : 'Show details'}
                          {isExpanded ? 
                            <ChevronUp className="ml-1 h-3 w-3" /> : 
                            <ChevronDown className="ml-1 h-3 w-3" />
                          }
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>{renderAmount(transaction)}</TableCell>
                    <TableCell>{renderCategory(transaction)}</TableCell>
                    <TableCell>{renderDate(transaction.date)}</TableCell>
                    <TableCell>{renderType(transaction.type)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(transaction)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(transaction.id)}
                            className="text-destructive"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded details row */}
                  {isExpanded && (
                    <TableRow>
                      <TableCell 
                        colSpan={showCheckboxes ? 7 : 6} 
                        className="bg-muted/50"
                      >
                        <div className="p-2">
                          <div className="grid grid-cols-2 gap-4">
                            {transaction.notes && (
                              <div>
                                <h4 className="text-sm font-medium mb-1">Notes</h4>
                                <p className="text-sm text-muted-foreground">{transaction.notes}</p>
                              </div>
                            )}
                            {transaction.fromAccount && (
                              <div>
                                <h4 className="text-sm font-medium mb-1">Account</h4>
                                <p className="text-sm text-muted-foreground">{transaction.fromAccount}</p>
                              </div>
                            )}
                            {transaction.person && transaction.person !== 'none' && (
                              <div>
                                <h4 className="text-sm font-medium mb-1">Person</h4>
                                <p className="text-sm text-muted-foreground">{transaction.person}</p>
                              </div>
                            )}
                            {transaction.subcategory && (
                              <div>
                                <h4 className="text-sm font-medium mb-1">Subcategory</h4>
                                <p className="text-sm text-muted-foreground">{transaction.subcategory}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
      
      {/* Desktop pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between p-[var(--card-padding)] border-t">
          <div className="text-sm text-muted-foreground">
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange && onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange && onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TransactionList;
