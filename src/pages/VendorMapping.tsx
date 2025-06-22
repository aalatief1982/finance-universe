import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getCategoryHierarchy } from "@/lib/category-utils";
import { useToast } from '@/components/ui/use-toast';
import { findClosestFallbackMatch, extractVendorName } from '@/lib/smart-paste-engine/suggestionEngine';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';

interface VendorMappingEntry {
  vendor: string;
  updatedVendor: string;
  category: string;
  subcategory: string;
  sampleMessage: string;
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

    const sampleByVendor: Record<string, string> = {};
    messages.forEach((m: any) => {
      const extracted = extractVendorName(m.message || m.rawMessage || '');
      if (extracted && !sampleByVendor[extracted]) {
        sampleByVendor[extracted] = m.message || m.rawMessage || '';
      }
    });

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
        sampleMessage: sampleByVendor[vendor] || ''
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
      <div className="px-1 pb-[var(--header-height)]">
        <Accordion type="multiple" className="space-y-[var(--card-gap)]">
          {vendors.map((vendor, index) => (
            <AccordionItem key={vendor.vendor} value={vendor.vendor}>
              <AccordionTrigger className="px-[var(--card-padding)] text-left font-medium">
                {vendor.vendor}
              </AccordionTrigger>
              <AccordionContent>
                <Card className="p-[var(--card-padding)] space-y-2">
                  <div>
                    <label className="block mb-1 font-semibold">Vendor:</label>
                    <input
                      type="text"
                      value={vendor.updatedVendor}
                      onChange={e => handleVendorChange(index, 'updatedVendor', e.target.value)}
                      className="w-full border rounded p-2"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-semibold">Category:</label>
                    <select
                      value={vendor.category}
                      onChange={e => handleVendorChange(index, 'category', e.target.value)}
                      className="w-full border rounded p-2"
                    >
                      {getCategoryHierarchy()
                        .filter(c => c.type === 'expense')
                        .map(c => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
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
                      {getCategoryHierarchy()
                        .find(c => c.name === vendor.category)?.subcategories.map(sub => (
                          <option key={sub.id} value={sub.name}>
                            {sub.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  {vendor.sampleMessage && (
                    <div className="bg-muted rounded-md p-2 text-xs font-mono break-words">
                      {vendor.sampleMessage}
                    </div>
                  )}
                </Card>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="fixed bottom-16 left-0 right-0 px-4 pb-4">
        <div className="flex gap-2">
          <Button className="flex-1" onClick={handleConfirm}>Save</Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>
            Retry
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default VendorMapping;
