
import React, { useState } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { TransactionType } from '@/types/transaction';
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormValues } from './transaction-form-schema';
import { getCategoriesForType } from '@/lib/categories-data';

interface CategorySelectorProps {
  form: UseFormReturn<TransactionFormValues>;
  transactionType: TransactionType;
  selectedCategoryName: string;
  setSelectedCategoryName: (name: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  form,
  transactionType,
  selectedCategoryName,
  setSelectedCategoryName
}) => {
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get available categories for the current transaction type
  const categoriesForType = getCategoriesForType(transactionType);
  
  // Filter categories based on search query
  const filteredCategories = searchQuery 
    ? categoriesForType.filter(cat => 
        cat.toLowerCase().includes(searchQuery.toLowerCase()))
    : categoriesForType;
  
  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    form.setValue('category', categoryId, { shouldValidate: true });
    setSelectedCategoryName(categoryId);
    setShowCategorySelector(false);
    
    // Reset subcategory when category changes
    form.setValue('subcategory', "none", { shouldValidate: true });
  };

  return (
    <FormField
      control={form.control}
      name="category"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Category*</FormLabel>
          <Popover 
            open={showCategorySelector} 
            onOpenChange={setShowCategorySelector}
          >
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                  onClick={() => setShowCategorySelector(true)}
                >
                  {selectedCategoryName || "Select category"}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <div className="flex flex-col p-2 gap-2">
                <div className="flex items-center border rounded-md">
                  <Search className="h-4 w-4 mx-2 text-muted-foreground" />
                  <Input
                    placeholder="Search categories..."
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-[200px]">
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2">Available Categories for {transactionType}:</p>
                    <div className="space-y-1">
                      {filteredCategories.map(categoryName => (
                        <Button
                          key={categoryName}
                          variant={selectedCategoryName === categoryName ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => handleCategorySelect(categoryName)}
                        >
                          {categoryName}
                        </Button>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default CategorySelector;
