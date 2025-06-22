import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getCategoryHierarchy } from "@/lib/category-utils";
import { useToast } from '@/components/ui/use-toast';
import { findClosestFallbackMatch } from '@/lib/smart-paste-engine/suggestionEngine';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';

interface VendorMappingEntry {
  vendor: string;
  updatedVendor: string;
  category: string;
  subcategory: string;
}

const VendorMapping: React.FC = () => {
  const [vendors, setVendors] = useState<VendorMappingEntry[]>([]);
  const location = useLocation();
  const { toast } = useToast();
  const navigate = useNavigate();
 

  useEffect(() => {
    const incomingVendorMap = location.state?.vendorMap || {};
    const incomingKeywordBank = location.state?.keywordMap || [];
    const messages = location.state?.messages || [];

    if (Object.keys(incomingVendorMap).length === 0 || messages.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Missing vendor data',
        description: 'No vendor data passed. Please reprocess SMS messages.',
      });
      navigate('/');
      return;
    }

    const uniqueVendors = Object.keys(incomingVendorMap);

    const initialMappings = uniqueVendors.map(vendor => {
      const kbEntry = incomingKeywordBank.find((entry: any) => entry.keyword === vendor);
      const categoryFromKB = kbEntry?.mappings.find((m: any) => m.field === 'category')?.value;
      const subcategoryFromKB = kbEntry?.mappings.find((m: any) => m.field === 'subcategory')?.value;
      const fallbackMatch = findClosestFallbackMatch(vendor);


	const inferredType = fallbackMatch?.type || 'expense';
	let category = categoryFromKB || fallbackMatch?.category;
	let subcategory = subcategoryFromKB || fallbackMatch?.subcategory;

	if (!category && !subcategory && inferredType === 'income') {
	  category = 'Earnings';
	  subcategory = 'Benefits';
	}

      return {
         vendor,
		  updatedVendor: incomingVendorMap[vendor],
		  category: category || 'Other',
		  subcategory: subcategory || 'Miscellaneous',
      };
    });

    setVendors(initialMappings);
  }, []);

  const handleVendorChange = (index: number, field: keyof VendorMappingEntry, value: string) => {
    setVendors(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleConfirm = () => {
    const vendorMap: Record<string, string> = {};
    const keywordBank: { keyword: string; mappings: { field: string; value: string }[] }[] = [];

    vendors.forEach(v => {
      vendorMap[v.vendor] = v.updatedVendor;

      keywordBank.push({
        keyword: v.vendor,
        mappings: [
          { field: 'category', value: v.category },
          { field: 'subcategory', value: v.subcategory },
        ],
      });
    });

    const messages = location.state?.messages || [];

    navigate('/review-draft-transactions', {
      state: {
        messages,
        vendorMap,
        keywordMap: keywordBank
      }
    });
  };

  return (
    <Layout showBack withPadding={false} fullWidth>
      <div className="px-1">
        <div className="space-y-[var(--card-gap)]">
          {vendors.map((vendor, index) => (
            <Card key={vendor.vendor} className="p-[var(--card-padding)]">
              <div className="mb-2">
                <label className="block mb-1 font-semibold">Vendor:</label>
                <input
                  type="text"
                  value={vendor.updatedVendor}
                  onChange={e => handleVendorChange(index, 'updatedVendor', e.target.value)}
                  className="w-full border rounded p-2"
                />
              </div>

            <div className="mb-2">
              <label className="block mb-1 font-semibold">Category:</label>
              <select
                value={vendor.category}
                onChange={e => handleVendorChange(index, 'category', e.target.value)}
                className="w-full border rounded p-2"
              >
                {getCategoryHierarchy().filter(c => c.type === 'expense').map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-semibold">Subcategory:</label>
              <select
                value={vendor.subcategory}
                onChange={e => handleVendorChange(index, 'subcategory', e.target.value)}
                className="w-full border rounded p-2"
              >
                {getCategoryHierarchy().find(c => c.name === vendor.category)?.subcategories.map(sub => (
                  <option key={sub.id} value={sub.name}>{sub.name}</option>
                ))}
              </select>
            </div>
          </Card>
        ))}
      </div>

        <Button className="mt-6 w-full" onClick={handleConfirm}>
          Confirm
        </Button>
      </div>
    </Layout>
  );
};

export default VendorMapping;
