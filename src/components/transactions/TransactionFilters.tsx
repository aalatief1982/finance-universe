
import React, { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DatePicker } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Category } from '@/types/transaction';
import CategoryHierarchy from '@/components/categories/CategoryHierarchy';
import { ScrollArea } from '@/components/ui/scroll-area';
import { transactionService } from '@/services/TransactionService';
import { useLanguage } from '@/i18n/LanguageContext';

interface TransactionFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
  clearFilters: () => void;
  uniqueCategories: string[];
  filtersVisible: boolean;
  setFiltersVisible: (visible: boolean) => void;
  advancedMode?: boolean;
  setAdvancedMode?: (mode: boolean) => void;
  minAmount?: number;
  setMinAmount?: (amount: number) => void;
  maxAmount?: number;
  setMaxAmount?: (amount: number) => void;
  sortBy?: string;
  setSortBy?: (field: string) => void;
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  searchQuery, setSearchQuery, selectedCategory, setSelectedCategory,
  selectedType, setSelectedType, startDate, setStartDate, endDate, setEndDate,
  clearFilters, uniqueCategories, filtersVisible, setFiltersVisible,
  advancedMode = false, setAdvancedMode, minAmount, setMinAmount, maxAmount, setMaxAmount, sortBy, setSortBy
}) => {
  const { t } = useLanguage();
  const [showCategoryHierarchy, setShowCategoryHierarchy] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  useEffect(() => { setCategories(transactionService.getCategories()); }, []);
  
  const getCategoryName = (categoryId: string): string => {
    if (!categoryId) return t('filters.allCategories');
    const category = categories.find(c => c.id === categoryId);
    if (!category) return categoryId;
    const path = transactionService.getCategoryPath(categoryId);
    return path.join(' > ');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder={t('transactions.searchPlaceholder')}
            className="ltr:pl-10 rtl:pr-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className={filtersVisible ? "bg-primary/10" : ""} aria-label={t('filters.title')}>
                <SlidersHorizontal size={18} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-4" align="end">
              <div className="space-y-4">
                <h3 className="font-medium">{t('filters.title')}</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="transaction-filter-category">{t('filters.category')}</label>
                  <Popover open={showCategoryHierarchy} onOpenChange={setShowCategoryHierarchy}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start font-normal text-left h-10" id="transaction-filter-category">
                        {getCategoryName(selectedCategory)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <div className="p-2">
                        <Button variant="ghost" className="w-full justify-start mb-2 text-sm" onClick={() => { setSelectedCategory(''); setShowCategoryHierarchy(false); }}>
                          {t('filters.allCategories')}
                        </Button>
                        <ScrollArea className="h-[300px]">
                          <CategoryHierarchy categories={categories} selectedCategoryId={selectedCategory} onSelectCategory={(categoryId) => { setSelectedCategory(categoryId); setShowCategoryHierarchy(false); }} />
                        </ScrollArea>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="transaction-filter-type">{t('filters.type')}</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger id="transaction-filter-type"><SelectValue placeholder={t('filters.allTypes')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('filters.allTypes')}</SelectItem>
                      <SelectItem value="income">{t('filters.income')}</SelectItem>
                      <SelectItem value="expense">{t('filters.expense')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="transaction-filter-date-start">{t('filters.dateRange')}</label>
                  <div className="flex gap-2">
                    <DatePicker date={startDate} setDate={setStartDate} placeholder={t('datePicker.from')} inputId="transaction-filter-date-start" />
                    <DatePicker date={endDate} setDate={setEndDate} placeholder={t('datePicker.to')} inputId="transaction-filter-date-end" />
                  </div>
                </div>
                
                {setAdvancedMode && (
                  <div className="flex items-center justify-between pt-2">
                    <Label htmlFor="advanced-mode" className="text-sm cursor-pointer">{t('filters.advancedFilters')}</Label>
                    <Switch id="advanced-mode" checked={advancedMode} onCheckedChange={setAdvancedMode} />
                  </div>
                )}
                
                <Collapsible open={advancedMode} className="space-y-3">
                  <CollapsibleContent>
                    {setMinAmount && setMaxAmount && (
                      <div className="space-y-2 py-2">
                        <label className="text-sm font-medium" htmlFor="transaction-filter-amount-min">{t('filters.amountRange')}</label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Input id="transaction-filter-amount-min" type="number" placeholder={t('filter.min')} value={minAmount || ''} onChange={(e) => setMinAmount(Number(e.target.value))} className="w-full" />
                          </div>
                          <div className="flex-1">
                            <Input id="transaction-filter-amount-max" type="number" placeholder={t('filter.max')} value={maxAmount || ''} onChange={(e) => setMaxAmount(Number(e.target.value))} className="w-full" />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {setSortBy && (
                      <div className="space-y-2 py-2">
                        <label className="text-sm font-medium" htmlFor="transaction-filter-sort">{t('filters.sortBy')}</label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger id="transaction-filter-sort"><SelectValue placeholder={t('filters.dateNewest')} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date_desc">{t('filters.dateNewest')}</SelectItem>
                            <SelectItem value="date_asc">{t('filters.dateOldest')}</SelectItem>
                            <SelectItem value="amount_desc">{t('filters.amountHighest')}</SelectItem>
                            <SelectItem value="amount_asc">{t('filters.amountLowest')}</SelectItem>
                            <SelectItem value="title_asc">{t('filters.titleAZ')}</SelectItem>
                            <SelectItem value="title_desc">{t('filters.titleZA')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
                
                <div className="flex justify-between pt-2">
                  <Button variant="outline" size="sm" onClick={clearFilters}>{t('filters.clearAll')}</Button>
                  <Button size="sm" onClick={() => setFiltersVisible(false)}>{t('filters.applyFilters')}</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <div className="hidden sm:flex gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[150px] h-10 px-3">
                  <span className="truncate">{getCategoryName(selectedCategory)}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <div className="p-2">
                  <Button variant="ghost" className="w-full justify-start mb-2 text-sm" onClick={() => setSelectedCategory('')}>
                    {t('filters.allCategories')}
                  </Button>
                  <ScrollArea className="h-[300px]">
                    <CategoryHierarchy categories={categories} selectedCategoryId={selectedCategory} onSelectCategory={setSelectedCategory} />
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder={t('filters.type')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allTypes')}</SelectItem>
                <SelectItem value="income">{t('filters.income')}</SelectItem>
                <SelectItem value="expense">{t('filters.expense')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-10">
                  <Calendar size={16} className="ltr:mr-2 rtl:ml-2" />
                  {t('filters.dateRange')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="end">
                <div className="flex flex-col gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">{t('filters.startDate')}</Label>
                    <DatePicker date={startDate} setDate={setStartDate} placeholder={t('datePicker.from')} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('filters.endDate')}</Label>
                    <DatePicker date={endDate} setDate={setEndDate} placeholder={t('datePicker.to')} />
                  </div>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => { setStartDate(null); setEndDate(null); }}>
                    {t('filters.clearDates')}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            
            {(searchQuery || selectedCategory || selectedType || startDate || endDate || 
              (minAmount && minAmount > 0) || (maxAmount && maxAmount > 0)) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} aria-label={t('filters.clearAll')}>
                <Filter className="text-muted-foreground ltr:mr-1 rtl:ml-1" size={16} />
                {t('filters.clear')}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {advancedMode && setMinAmount && setMaxAmount && setSortBy && (
        <div className="flex flex-wrap gap-3 items-center bg-muted/30 p-3 rounded-md">
          <div className="flex items-center gap-2 flex-grow md:flex-grow-0">
            <Label className="text-sm whitespace-nowrap">{t('filters.amount')}</Label>
            <div className="flex gap-2 flex-1">
              <Input type="number" placeholder={t('filter.min')} value={minAmount || ''} onChange={(e) => setMinAmount(Number(e.target.value))} className="w-20 flex-1" />
              <span className="text-muted-foreground">-</span>
              <Input type="number" placeholder={t('filter.max')} value={maxAmount || ''} onChange={(e) => setMaxAmount(Number(e.target.value))} className="w-20 flex-1" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">{t('filters.sortBy')}:</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('filters.dateNewest')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">{t('filters.dateNewest')}</SelectItem>
                <SelectItem value="date_asc">{t('filters.dateOldest')}</SelectItem>
                <SelectItem value="amount_desc">{t('filters.amountHighest')}</SelectItem>
                <SelectItem value="amount_asc">{t('filters.amountLowest')}</SelectItem>
                <SelectItem value="title_asc">{t('filters.titleAZ')}</SelectItem>
                <SelectItem value="title_desc">{t('filters.titleZA')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionFilters;
