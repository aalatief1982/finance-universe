import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getCategoryHierarchy } from '@/lib/category-utils';
import { extractVendorName, inferIndirectFields } from '@/lib/smart-paste-engine/suggestionEngine';

export interface ProcessedSmsEntry {
  message: string;
  date: string;
  sender?: string;
  matchedKeyword?: string;
}

interface VendorMappingEntry {
  vendor: string;
  updatedVendor: string;
  category: string;
  subcategory: string;
  sampleMessage?: string;
}

interface ImportAndMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ProcessedSmsEntry[];
  onComplete: (
    vendorMap: Record<string, string>,
    keywordMap: { keyword: string; mappings: { field: string; value: string }[] }[]
  ) => void;
}

const ImportAndMapModal: React.FC<ImportAndMapModalProps> = ({
  open,
  onOpenChange,
  messages,
  onComplete,
}) => {
  const [vendors, setVendors] = useState<VendorMappingEntry[]>([]);

  useEffect(() => {
    if (!open) return;
    const vendorSamples: Record<string, string> = {};
    messages.forEach((m) => {
      const v = extractVendorName(m.message);
      if (v && !vendorSamples[v]) {
        vendorSamples[v] = m.message;
      }
    });
    const unique = Object.keys(vendorSamples);
    const initial = unique.map((v) => {
      const inferred = inferIndirectFields(vendorSamples[v], { vendor: v });
      return {
        vendor: v,
        updatedVendor: v,
        category: inferred.category || 'Other',
        subcategory: inferred.subcategory || 'Miscellaneous',
        sampleMessage: vendorSamples[v],
      } as VendorMappingEntry;
    });
    setVendors(initial);
  }, [open, messages]);

  const handleVendorChange = (
    index: number,
    field: keyof VendorMappingEntry,
    value: string
  ) => {
    setVendors((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleConfirm = () => {
    const vendorMap: Record<string, string> = {};
    const keywordMap: { keyword: string; mappings: { field: string; value: string }[] }[] = [];

    vendors.forEach((v) => {
      vendorMap[v.vendor] = v.updatedVendor;
      keywordMap.push({
        keyword: v.vendor,
        mappings: [
          { field: 'category', value: v.category },
          { field: 'subcategory', value: v.subcategory },
        ],
      });
    });

    onComplete(vendorMap, keywordMap);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vendor Mapping</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 pb-4">
          <Accordion type="multiple" className="w-full">
            {vendors.map((vendor, index) => (
              <AccordionItem key={vendor.vendor} value={vendor.vendor}>
                <AccordionTrigger>{vendor.updatedVendor || vendor.vendor}</AccordionTrigger>
                <AccordionContent>
                  <Card className="p-[var(--card-padding)] space-y-3">
                    <div>
                      <label className="block mb-1 font-semibold">Vendor:</label>
                      <Input
                        type="text"
                        value={vendor.updatedVendor}
                        onChange={(e) => handleVendorChange(index, 'updatedVendor', e.target.value)}
                        className="w-full p-2 dark:bg-white dark:text-black"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold">Category:</label>
                      <Select
                        value={vendor.category}
                        onValueChange={(val) => handleVendorChange(index, 'category', val)}
                      >
                        <SelectTrigger className="w-full p-2 dark:bg-white dark:text-black">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {getCategoryHierarchy()
                            .filter((c) => c.type === 'expense')
                            .map((c) => (
                              <SelectItem key={c.id} value={c.name}>
                                {c.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold">Subcategory:</label>
                      <Select
                        value={vendor.subcategory}
                        onValueChange={(val) => handleVendorChange(index, 'subcategory', val)}
                      >
                        <SelectTrigger className="w-full p-2 dark:bg-white dark:text-black">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {getCategoryHierarchy()
                            .find((c) => c.name === vendor.category)?.subcategories.map((sub) => (
                              <SelectItem key={sub.id} value={sub.name}>
                                {sub.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {vendor.sampleMessage && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Sample SMS:</strong> {vendor.sampleMessage}
                      </p>
                    )}
                  </Card>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <DialogFooter className="flex gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleConfirm}>Apply &amp; Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportAndMapModal;
