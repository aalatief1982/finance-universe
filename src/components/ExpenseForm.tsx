
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import CategoryHierarchy from '@/components/categories/CategoryHierarchy';
import { transactionService } from '@/services/TransactionService';
import { Category, TransactionType, CategoryWithSubcategories } from '@/types/transaction';
import { CATEGORY_HIERARCHY, getCategoriesForType, getSubcategoriesForCategory } from '@/lib/categories-data';

const ACCOUNTS = [
  "Cash", "Bank Account", "Credit Card", "Savings", "Investment", "Other"
];

const CURRENCIES = [
  { code: "SAR", name: "Saudi Riyal" },
  { code: "EGP", name: "Egyptian Pound" },
  { code: "USD", name: "US Dollar" },
  { code: "BHD", name: "Bahraini Dinar" },
  { code: "AED", name: "UAE Dirham" }
];

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  amount: z.coerce.number().min(0.01, {
    message: "Amount must be greater than 0.",
  }),
  type: z.enum(["expense", "income", "transfer"]),
  fromAccount: z.string().min(1, {
    message: "From Account is required.",
  }),
  toAccount: z.string().optional(),
  category: z.string().min(1, {
    message: "Please select a category.",
  }),
  subcategory: z.string().optional(),
  date: z.string().min(1, {
    message: "Please select a date.",
  }),
  description: z.string().optional(),
  notes: z.string().optional(),
  person: z.enum(["Ahmed", "Marwa", "Youssef", "Salma", "Mazen", "none"]).optional(),
  currency: z.string().min(1, {
    message: "Please select a currency.",
  }),
}).refine(data => {
  // If transaction type is transfer, toAccount is required
  if (data.type === 'transfer' && !data.toAccount) {
    return false;
  }
  return true;
}, {
  message: "To Account is required for transfer transactions",
  path: ["toAccount"]
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
    subcategory: "none", // Set default to "none" instead of empty string
    date: new Date().toISOString().split('T')[0],
    type: "expense",
    fromAccount: "",
    toAccount: "",
    description: "",
    notes: "",
    person: "none", // Set default to "none"
    currency: "SAR",
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
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  
  // Watch the transaction type to conditionally render fields
  const transactionType = form.watch("type") as TransactionType;
  const selectedCategory = form.watch("category");
  
  // Update available subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      const subcategories = getSubcategoriesForCategory(selectedCategory);
      setAvailableSubcategories(subcategories);
      
      // If current subcategory is not available, reset it to "none"
      const currentSubcategory = form.getValues("subcategory");
      if (currentSubcategory && currentSubcategory !== "none" && !subcategories.includes(currentSubcategory)) {
        form.setValue("subcategory", "none");
      }
    } else {
      setAvailableSubcategories([]);
      form.setValue("subcategory", "none");
    }
  }, [selectedCategory, form]);
  
  // Update available categories when transaction type changes
  useEffect(() => {
    const categoryNames = getCategoriesForType(transactionType);
    
    // If current category doesn't match transaction type, reset it
    const currentCategory = form.getValues("category");
    if (currentCategory && !categoryNames.includes(currentCategory)) {
      form.setValue("category", "");
      form.setValue("subcategory", "none");
      setSelectedCategoryName("");
    }
  }, [transactionType, form]);
  
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
    // Include subcategory in the submitted values
    onSubmit(values);
    form.reset();
  };
  
  // Filter categories based on search query and transaction type
  const filteredCategories = searchQuery 
    ? hierarchicalCategories.filter(cat => 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : hierarchicalCategories;
    
  // Get available categories for the current transaction type
  const categoriesForType = getCategoriesForType(transactionType);
  
  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    form.setValue('category', categoryId, { shouldValidate: true });
    updateSelectedCategoryName(categoryId);
    setShowCategorySelector(false);
    
    // Reset subcategory when category changes
    form.setValue('subcategory', "none", { shouldValidate: true });
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
              {/* Transaction Type - First field for logical flow */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Type*</FormLabel>
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
                        <SelectItem value="transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title*</FormLabel>
                    <FormControl>
                      <Input placeholder="Transaction title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount*</FormLabel>
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
                
                {/* Currency */}
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency*</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCIES.map(currency => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.code} - {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Accounts Section */}
              <div className="grid grid-cols-1 gap-4">
                {/* From Account */}
                <FormField
                  control={form.control}
                  name="fromAccount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Account*</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ACCOUNTS.map(account => (
                            <SelectItem key={account} value={account}>
                              {account}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* To Account - Only shown for Transfer */}
                {transactionType === 'transfer' && (
                  <FormField
                    control={form.control}
                    name="toAccount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To Account*</FormLabel>
                        <Select
                          value={field.value || ""}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select destination account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ACCOUNTS.map(account => (
                              <SelectItem key={account} value={account}>
                                {account}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
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
                                  {categoriesForType.map(categoryName => (
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
                
                {/* Subcategory - Only shown when category is selected and subcategories are available */}
                {selectedCategory && availableSubcategories.length > 0 && (
                  <FormField
                    control={form.control}
                    name="subcategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategory</FormLabel>
                        <Select
                          value={field.value || "none"}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subcategory" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {availableSubcategories.map(subcategory => (
                              <SelectItem key={subcategory} value={subcategory}>
                                {subcategory}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {/* Date - Show in the grid if subcategory is not shown */}
                {!selectedCategory || !availableSubcategories.length ? (
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date*</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}
              </div>
              
              {/* Date - Show in another row if subcategory is shown */}
              {selectedCategory && availableSubcategories.length > 0 && (
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date*</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Person */}
              <FormField
                control={form.control}
                name="person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Person</FormLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select person (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="Ahmed">Ahmed</SelectItem>
                        <SelectItem value="Marwa">Marwa</SelectItem>
                        <SelectItem value="Youssef">Youssef</SelectItem>
                        <SelectItem value="Salma">Salma</SelectItem>
                        <SelectItem value="Mazen">Mazen</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter a detailed description..." 
                        className="resize-none min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Additional notes..." {...field} />
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
