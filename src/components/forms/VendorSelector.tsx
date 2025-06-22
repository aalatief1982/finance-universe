import React, { useEffect, useState } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import vendorData from '@/data/ksa_all_vendors_clean_final.json';
import { UseFormReturn } from 'react-hook-form';
import { TransactionFormValues } from './transaction-form-schema';
import { loadVendorFallbacks, addUserVendor } from '@/lib/smart-paste-engine/vendorFallbackUtils';

interface VendorSelectorProps {
  form: UseFormReturn<TransactionFormValues>;
}

const VendorSelector: React.FC<VendorSelectorProps> = ({ form }) => {
  const [vendors, setVendors] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    type: 'expense',
    category: '',
    subcategory: '',
  });

  useEffect(() => {
    const builtIn = Object.keys((vendorData as any) || {}).filter(v => v.trim());
    const stored = Object.keys(loadVendorFallbacks());
    const all = Array.from(new Set([...builtIn, ...stored]));
    setVendors(all);
  }, []);

  const handleSave = () => {
    if (!newVendor.name.trim()) return;
    addUserVendor(newVendor.name.trim(), {
      type: newVendor.type as any,
      category: newVendor.category.trim(),
      subcategory: newVendor.subcategory.trim(),
    });
    setVendors(prev => Array.from(new Set([...prev, newVendor.name.trim()])));
    form.setValue('vendor', newVendor.name.trim());
    setNewVendor({ name: '', type: 'expense', category: '', subcategory: '' });
    setAddOpen(false);
  };

  return (
    <>
      <FormField
        control={form.control}
        name="vendor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Vendor</FormLabel>
            <div className="flex items-center gap-1">
              <FormControl>
                <Input list="vendors-list" placeholder="e.g., Netflix" {...field} />
              </FormControl>
              <Button type="button" variant="outline" size="icon" onClick={() => setAddOpen(true)}>
                <Plus className="size-4" />
              </Button>
              <datalist id="vendors-list">
                {vendors.map(v => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Vendor</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Vendor Name*</label>
              <Input value={newVendor.name} onChange={e => setNewVendor(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Type*</label>
              <Select value={newVendor.type} onValueChange={val => setNewVendor(prev => ({ ...prev, type: val }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Category*</label>
              <Input value={newVendor.category} onChange={e => setNewVendor(prev => ({ ...prev, category: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Subcategory</label>
              <Input value={newVendor.subcategory} onChange={e => setNewVendor(prev => ({ ...prev, subcategory: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VendorSelector;
