/**
 * @file VendorSelector.tsx
 * @description UI component for VendorSelector.
 *
 * @module components/forms/VendorSelector
 *
 * @responsibilities
 * 1. Render UI for the feature area
 * 2. Accept props and emit user interactions
 * 3. Compose shared subcomponents where needed
 *
 * @review-tags
 * - @ui: visual/layout behavior
 *
 * @review-checklist
 * - [ ] Props have sensible defaults
 * - [ ] Component renders without crashing
 */
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
import { getVendorData } from '@/services/VendorSyncService';
import { getCategoriesForType, getSubcategoriesForCategory } from '@/lib/categories-data';
import { TransactionType } from '@/types/transaction';

interface VendorSelectorProps {
  form: UseFormReturn<TransactionFormValues>;
}

const VendorSelector: React.FC<VendorSelectorProps> = ({ form }) => {
  const [vendors, setVendors] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    type: 'expense' as TransactionType,
    category: '',
    subcategory: '',
  });
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);

  useEffect(() => {
    const loadVendorList = () => {
      // Prioritize synced vendor data, fallback to built-in data
      const syncedVendors = getVendorData();
      const builtIn = Object.keys(syncedVendors || (vendorData as any) || {});
      const stored = Object.keys(loadVendorFallbacks());
      const all = Array.from(new Set([...builtIn, ...stored]));
      setVendors(all);
    };

    // Initial load
    loadVendorList();

    // Listen for vendor data updates
    const handleVendorUpdate = () => {
      loadVendorList();
    };

    window.addEventListener('vendorDataUpdated', handleVendorUpdate);
    
    return () => {
      window.removeEventListener('vendorDataUpdated', handleVendorUpdate);
    };
  }, []);

  // Update subcategories when category changes
  useEffect(() => {
    if (newVendor.category) {
      const subcategories = getSubcategoriesForCategory(newVendor.category);
      setAvailableSubcategories(subcategories);
      
      // Reset subcategory if it's no longer valid
      if (newVendor.subcategory && !subcategories.includes(newVendor.subcategory)) {
        setNewVendor(prev => ({ ...prev, subcategory: '' }));
      }
    } else {
      setAvailableSubcategories([]);
      setNewVendor(prev => ({ ...prev, subcategory: '' }));
    }
  }, [newVendor.category]);

  const handleSave = () => {
    if (!newVendor.name.trim()) return;
    addUserVendor(newVendor.name.trim(), {
      type: newVendor.type,
      category: newVendor.category.trim(),
      subcategory: newVendor.subcategory.trim(),
    });
    setVendors(prev => Array.from(new Set([...prev, newVendor.name.trim()])));
    form.setValue('vendor', newVendor.name.trim());
    setNewVendor({ name: '', type: 'expense', category: '', subcategory: '' });
    setAvailableSubcategories([]);
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
              <Select value={newVendor.type} onValueChange={val => setNewVendor(prev => ({ ...prev, type: val as TransactionType, category: '', subcategory: '' }))}>
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
              <Select value={newVendor.category} onValueChange={val => setNewVendor(prev => ({ ...prev, category: val, subcategory: '' }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {getCategoriesForType(newVendor.type).map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {availableSubcategories.length > 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium">Subcategory</label>
                <Select value={newVendor.subcategory} onValueChange={val => setNewVendor(prev => ({ ...prev, subcategory: val }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="">None</SelectItem>
                    {availableSubcategories.map(subcategory => (
                      <SelectItem key={subcategory} value={subcategory}>
                        {subcategory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
