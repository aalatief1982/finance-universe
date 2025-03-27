import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import CategoryHierarchy from '@/components/categories/CategoryHierarchy';
import { transactionService } from '@/services/TransactionService';
import { Category } from '@/types/transaction';

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  amount: z.coerce.number().min(0.01, {
    message: "Amount must be greater than 0.",
  }),
  category: z.string().min(1, {
    message: "Please select a category.",
  }),
  date: z.string().min(1, {
    message: "Please select a date.",
  }),
  type: z.enum(["expense", "income"]),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  onSubmit: (values: FormValues) => void;
  categories: string[];
  defaultValues?: Partial<FormValues>;
  onCancel?: () => void;
}

const ExpenseForm = ({
  onSubmit,
  categories,
  defaultValues = {
    title: "",
    amount: undefined,
    category: "",
    date: new Date().toISOString().split('T')[0],
    type: "expense",
    notes: "",
  },
  onCancel,
}: ExpenseFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  const [hierarchicalCategories, setHierarchicalCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState(defaultValues.category || '');
  
  // Fetch hierarchical categories
  useEffect(() => {
    const fetchCategories = async () => {
      const cats = transactionService.getCategories();
      setHierarchicalCategories(cats);
      
      // If a category is selected, get its name for display
      if (defaultValues.category) {
        updateSelectedCategoryName(defaultValues.category);
      }
    };
    
    fetchCategories();
  }, [defaultValues.category]);
  
  // Update selected category name when a category is selected
  const updateSelectedCategoryName = (categoryId: string) => {
    if (!categoryId) {
      setSelectedCategoryName('');
      return;
    }
    
    // Get category path for display
    const path = transactionService.getCategoryPath(categoryId);
    setSelectedCategoryName(path.join(' > '));
  };

  const handleSubmit = (values: FormValues) => {
    // If type is expense, make amount negative
    if (values.type === "expense") {
      values.amount = -Math.abs(values.amount);
    } else {
      values.amount = Math.abs(values.amount);
    }
    onSubmit(values);
    form.reset();
  };
  
  // Filter categories based on search query
  const filteredCategories = searchQuery 
    ? hierarchicalCategories.filter(cat => 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : hierarchicalCategories;
    
  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    form.setValue('category', categoryId, { shouldValidate: true });
    updateSelectedCategoryName(categoryId);
    setShowCategorySelector(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-medium text-center">
            {defaultValues.title ? "Edit Transaction" : "Add New Transaction"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Grocery shopping" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
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
                              <CategoryHierarchy
                                categories={filteredCategories}
                                selectedCategoryId={field.value}
                                onSelectCategory={handleCategorySelect}
                                maxHeight="200px"
                              />
                            </ScrollArea>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="expense">Expense</SelectItem>
                          <SelectItem value="income">Income</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Additional details..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-2">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit">
                  {defaultValues.title ? "Update" : "Add"} Transaction
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExpenseForm;
