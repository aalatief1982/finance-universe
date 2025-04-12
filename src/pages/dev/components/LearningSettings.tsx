
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import { Transaction, TransactionType } from '@/types/transaction';
import { SupportedCurrency } from '@/types/locale';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Form validation schema
const learningFormSchema = z.object({
  amount: z.number().min(0.01, {
    message: "Amount must be greater than 0",
  }),
  currency: z.string().min(1, {
    message: "Currency is required",
  }),
  description: z.string().min(1, {
    message: "Vendor/Description is required",
  }),
  fromAccount: z.string().min(1, {
    message: "Account is required",
  }),
  type: z.enum(["expense", "income", "transfer"], {
    message: "Please select a valid transaction type",
  }),
  category: z.string().min(1, {
    message: "Category is required",
  })
});

type LearningFormValues = z.infer<typeof learningFormSchema>;

interface LearningSettingsProps {
  dummyTransaction: Transaction;
  setDummyTransaction: React.Dispatch<React.SetStateAction<Transaction>>;
  onLearnFromCurrentMessage: () => void;
}

const LearningSettings: React.FC<LearningSettingsProps> = ({
  dummyTransaction,
  setDummyTransaction,
  onLearnFromCurrentMessage
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formStatus, setFormStatus] = React.useState<{ success?: boolean; message?: string }>({});

  // Initialize form with current transaction values
  const form = useForm<LearningFormValues>({
    resolver: zodResolver(learningFormSchema),
    defaultValues: {
      amount: dummyTransaction.amount || 0,
      currency: dummyTransaction.currency || '',
      description: dummyTransaction.description || '',
      fromAccount: dummyTransaction.fromAccount || '',
      type: dummyTransaction.type || 'expense',
      category: dummyTransaction.category || ''
    }
  });

  // Update form when dummyTransaction changes
  React.useEffect(() => {
    form.reset({
      amount: dummyTransaction.amount || 0,
      currency: dummyTransaction.currency || '',
      description: dummyTransaction.description || '',
      fromAccount: dummyTransaction.fromAccount || '',
      type: dummyTransaction.type || 'expense',
      category: dummyTransaction.category || ''
    });
  }, [dummyTransaction, form]);

  // Update transaction when form values change
  const handleFormChange = (values: Partial<LearningFormValues>) => {
    setDummyTransaction(prev => ({
      ...prev,
      ...values
    }));
  };

  // Handle form submission
  const onSubmit = (values: LearningFormValues) => {
    setIsSubmitting(true);
    setFormStatus({});

    try {
      // Update transaction with form values
      setDummyTransaction(prev => ({
        ...prev,
        amount: values.amount,
        currency: values.currency as SupportedCurrency,
        description: values.description,
        fromAccount: values.fromAccount,
        type: values.type,
        category: values.category
      }));

      // Trigger learning function
      onLearnFromCurrentMessage();
      
      // Show success message
      setFormStatus({
        success: true,
        message: "Transaction saved as learning pattern"
      });
    } catch (error) {
      // Show error message
      setFormStatus({
        success: false,
        message: error instanceof Error ? error.message : "Failed to save learning pattern"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 rounded-md border">
      <h3 className="text-sm font-medium mb-4">Transaction Data</h3>
      
      {formStatus.message && (
        <Alert variant={formStatus.success ? "default" : "destructive"} className="mb-4">
          {formStatus.success ? (
            <CheckCircle className="h-4 w-4 mr-2" />
          ) : (
            <AlertCircle className="h-4 w-4 mr-2" />
          )}
          <AlertDescription>{formStatus.message}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      placeholder="100.00"
                      {...field}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? 0 : value);
                        handleFormChange({ amount: isNaN(value) ? 0 : value });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="USD"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        handleFormChange({ currency: e.target.value });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor/Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Vendor name"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        handleFormChange({ description: e.target.value });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fromAccount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Account"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        handleFormChange({ fromAccount: e.target.value });
                      }}
                    />
                  </FormControl>
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
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleFormChange({ type: value as TransactionType });
                    }}
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

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Category"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        handleFormChange({ category: e.target.value });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-6">
            <Button 
              type="submit"
              className="w-full flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save as New Learned Entry"}
            </Button>
            <FormDescription className="text-center mt-2 text-xs">
              This will save the current message with transaction details as a new learning pattern
            </FormDescription>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default LearningSettings;
