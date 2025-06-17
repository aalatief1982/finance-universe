import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectItem } from '@/components/ui/select';
import { getAllCategories, getSubcategoriesForCategory } from '@/lib/category-utils';
import { TransactionCategory, TransactionSubcategory } from '@/types/transaction';
import { useToast } from '@/components/ui/use-toast';

interface VendorEntry {
  vendor: string;
  category: TransactionCategory;
  subcategory: TransactionSubcategory;
}

const ProcessVendors: React.FC = () => {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<VendorEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('xpensia_sms_vendors');
    if (stored) {
      try {
        const parsed: VendorEntry[] = JSON.parse(stored);
        setVendors(parsed);
      } catch (error) {
        console.error('Failed to parse xpensia_sms_vendors:', error);
      }
    }
  }, []);

  const handleCategoryChange = (index: number, newCategory: TransactionCategory) => {
    const updated = [...vendors];
    updated[index].category = newCategory;
    updated[index].subcategory = 'none'; // reset subcategory
    setVendors(updated);
  };

  const handleSubcategoryChange = (index: number, newSubcategory: TransactionSubcategory) => {
    const updated = [...vendors];
    updated[index].subcategory = newSubcategory;
    setVendors(updated);
  };

  const handleSave = () => {
    localStorage.setItem('xpensia_sms_vendors', JSON.stringify(vendors));
    toast({
      title: 'Vendors Saved',
      description: 'Vendor categorization saved successfully.',
    });
  };

  return (
    <Layout>
      <div className="p-[var(--card-padding)]">
        <h1 className="text-2xl font-bold mb-4">Vendor Categorization</h1>

      <div className="space-y-4">
        {vendors.map((vendor, index) => (
          <Card key={index} className="p-[var(--card-padding)] flex flex-col space-y-2">
            <p><strong>Vendor:</strong> {vendor.vendor}</p>

            <Select
              value={vendor.category}
              onValueChange={(val) => handleCategoryChange(index, val as TransactionCategory)}
            >
              {getAllCategories().map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </Select>

            <Select
              value={vendor.subcategory}
              onValueChange={(val) => handleSubcategoryChange(index, val as TransactionSubcategory)}
            >
              {getSubcategoriesForCategory(vendor.category).map((sub) => (
                <SelectItem key={sub} value={sub}>
                  {sub}
                </SelectItem>
              ))}
            </Select>
          </Card>
        ))}
      </div>

      {vendors.length > 0 && (
        <Button className="mt-6 w-full" onClick={handleSave}>
          Save Vendors
        </Button>
      )}
      </div>
    </Layout>
  );
};

export default ProcessVendors;
