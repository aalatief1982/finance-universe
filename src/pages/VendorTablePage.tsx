import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VendorEntry {
  vendor: string;
  category: string;
  subcategory: string;
}

const defaultCategories = [
  { name: "Dining", subcategories: ["Cafe", "Restaurant"] },
  { name: "Grocery", subcategories: ["Supermarket", "Convenience Store"] },
  { name: "Other", subcategories: ["Misc", "ATM Withdrawal"] },
];

const VendorTablePage: React.FC = () => {
  const [vendors, setVendors] = useState<VendorEntry[]>([]);

  useEffect(() => {
    // Load extracted vendors from localStorage
    const rawVendors = JSON.parse(localStorage.getItem('xpensia_extracted_vendors') || '[]') as string[];

    const vendorEntries = rawVendors.map((vendor) => ({
      vendor,
      category: "Other",
      subcategory: "Misc",
    }));

    setVendors(vendorEntries);
  }, []);

  const updateVendor = (index: number, field: 'category' | 'subcategory', value: string) => {
    const updated = [...vendors];
    updated[index][field] = value;
    setVendors(updated);
  };

  const handleSave = () => {
    localStorage.setItem('xpensia_vendor_mappings', JSON.stringify(vendors));
    alert("Vendor mappings saved successfully!");
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Review Vendors</h1>

      {vendors.map((vendorEntry, index) => (
        <Card key={index} className="p-4 mb-4 flex flex-col gap-2">
          <p><strong>Vendor:</strong> {vendorEntry.vendor}</p>

          <div className="flex gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-sm">Category</label>
              <Select
                value={vendorEntry.category}
                onValueChange={(val) => updateVendor(index, 'category', val)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {defaultCategories.map((cat) => (
                    <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm">Subcategory</label>
              <Select
                value={vendorEntry.subcategory}
                onValueChange={(val) => updateVendor(index, 'subcategory', val)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {defaultCategories
                    .find((cat) => cat.name === vendorEntry.category)?.subcategories.map((sub) => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      ))}

      {vendors.length > 0 && (
        <Button className="mt-6 w-full" onClick={handleSave}>
          Save Mappings
        </Button>
      )}
    </div>
  );
};

export default VendorTablePage;
