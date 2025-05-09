import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCategoryHierarchy } from "@/lib/category-utils";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

interface VendorEntry {
  vendor: string;
  category: string;
  subcategory: string;
}

const VendorCategorization: React.FC = () => {
  const [vendors, setVendors] = useState<VendorEntry[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const rawMessages = JSON.parse(localStorage.getItem("xpensia_filtered_sms") || "[]");

    const vendorSet = new Set<string>();
    rawMessages.forEach((msg: any) => {
      // Extract vendor name (similar to SmartPaste fallback logic)
      const vendorMatch = msg.message.match(/(?:at|@|في|لدى)\s+([^\n,;]+)/i);
      if (vendorMatch) {
        vendorSet.add(vendorMatch[1].trim()||'');
      }
    });

    const vendorArray = Array.from(vendorSet);

    const preparedVendors: VendorEntry[] = vendorArray.map((v) => ({
      vendor: v,
      category: "Others",
      subcategory: "Misc",
    }));

    setVendors(preparedVendors);
  }, []);

  const handleCategoryChange = (index: number, newCategory: string) => {
    const updatedVendors = [...vendors];
    updatedVendors[index].category = newCategory;
    updatedVendors[index].subcategory = ""; // Reset subcategory when category changes
    setVendors(updatedVendors);
  };

  const handleSubcategoryChange = (index: number, newSubcategory: string) => {
    const updatedVendors = [...vendors];
    updatedVendors[index].subcategory = newSubcategory;
    setVendors(updatedVendors);
  };

  const handleSave = () => {
    localStorage.setItem("xpensia_vendor_categorization", JSON.stringify(vendors));
    toast({
      title: "Saved!",
      description: "Vendor categorization saved successfully.",
    });
    navigate("/process-sms"); // Optional: back to SMS flow
  };

  const getAvailableCategories = () => {
    return getCategoryHierarchy().filter((cat) => cat.type === "expense");
  };

  const getSubcategories = (categoryName: string) => {
    const category = getCategoryHierarchy().find((c) => c.name === categoryName);
    return category ? category.subcategories : [];
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Vendor Categorization</h1>

      <div className="space-y-4">
        {vendors.map((vendor, index) => (
          <Card key={index} className="p-4">
            <p className="font-semibold mb-2">{vendor.vendor}</p>

            <div className="flex gap-4 mb-2">
              <Select value={vendor.category} onValueChange={(value) => handleCategoryChange(index, value)}>
                <SelectTrigger className="w-1/2">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableCategories().map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={vendor.subcategory} onValueChange={(value) => handleSubcategoryChange(index, value)}>
                <SelectTrigger className="w-1/2">
                  <SelectValue placeholder="Select Subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {getSubcategories(vendor.category).map((sub) => (
                    <SelectItem key={sub.id} value={sub.name}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        ))}
      </div>

      {vendors.length > 0 && (
        <Button className="mt-6 w-full" onClick={handleSave}>
          Save Categorization
        </Button>
      )}
    </div>
  );
};

export default VendorCategorization;
