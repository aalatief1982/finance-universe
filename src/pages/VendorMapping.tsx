import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getCategoryHierarchy } from "@/lib/category-utils";
import { useToast } from '@/components/ui/use-toast';
import { parseSmsMessage } from '@/lib/smart-paste-engine/smsParser';
import { useNavigate } from 'react-router-dom'; // At the top

interface VendorMappingEntry {
  vendor: string;
  updatedVendor: string;
  category: string;
  subcategory: string;
}

const VendorMapping: React.FC = () => {
	
	console.log('[Debug] Loaded vendor map:', localStorage.getItem('xpensia_vendor_map'));
	console.log('[Debug] Loaded keyword bank:', localStorage.getItem('xpensia_keyword_bank'));
  const [vendors, setVendors] = useState<VendorMappingEntry[]>([]);
  const { toast } = useToast();
  
  const navigate = useNavigate(); // After toast hook

  useEffect(() => {
    const vendorMap = JSON.parse(localStorage.getItem('xpensia_vendor_map') || '{}');
    const uniqueVendors = Object.keys(vendorMap);
    const initialMappings = uniqueVendors.map(vendor => ({
      vendor,
      updatedVendor: vendorMap[vendor],
      category: 'Other',
      subcategory: 'Miscellaneous',
    }));
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

  // Save mappings
  localStorage.setItem('xpensia_vendor_map', JSON.stringify(vendorMap));
  localStorage.setItem('xpensia_keyword_bank', JSON.stringify(keywordBank));

  // Parse messages and generate draft transactions
  const rawMessages = JSON.parse(localStorage.getItem('xpensia_selected_messages') || '[]');

  const draftTransactions = rawMessages.map((msg: any) => {
    const parsed = parseSmsMessage(msg.message);
    const rawVendor = parsed.vendor || msg.sender;
    const updatedVendor = vendorMap[rawVendor] || rawVendor;
    const kbMatch = keywordBank.find(kb => kb.keyword === rawVendor);

    return {
      ...parsed,
      vendor: updatedVendor,
      category: kbMatch?.mappings.find(m => m.field === 'category')?.value || parsed.category || 'Other',
      subcategory: kbMatch?.mappings.find(m => m.field === 'subcategory')?.value || parsed.subcategory || 'Miscellaneous',
      rawMessage: msg.message
    };
  });

  localStorage.setItem('xpensia_sms_draft_transactions', JSON.stringify(draftTransactions));

  toast({
    title: 'Success',
    description: 'Vendor mappings and parsed SMS transactions saved!',
  });

  navigate('/review-draft-transactions');
};

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Vendor Mapping</h1>

      <div className="space-y-4">
        {vendors.map((vendor, index) => (
          <Card key={vendor.vendor} className="p-4">
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
                {getCategoryHierarchy().find(c => c.name === vendor.category)?.subcategories.map(sub => (
                  <option key={sub.id} value={sub.name}>
                    {sub.name}
                  </option>
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
  );
};

export default VendorMapping;