import React, { useState, useEffect } from 'react';
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
  AccordionTrigger
} from '@/components/ui/accordion';
import { getCategoryHierarchy } from "@/lib/category-utils";
import { useToast } from '@/components/ui/use-toast';
import {
  findClosestFallbackMatch,
  extractVendorName
} from '@/lib/smart-paste-engine/suggestionEngine';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { ArrowLeft, Trash2, Ban } from 'lucide-react';
import { updateSmsSenderImportDates } from '@/utils/storage-utils';

interface VendorMappingEntry {
  vendor: string;
  updatedVendor: string;
  category: string;
  subcategory: string;
  sampleMessage?: string;
  skipped?: boolean;
}

const VendorMapping: React.FC = () => {
  const [vendors, setVendors] = useState<VendorMappingEntry[]>([]);
  const location = useLocation();
  console.log('VendorMapping state:', location.state);
  const { toast } = useToast();
  const navigate = useNavigate();

  const hasRequiredState = () => {
    return !!location.state && (location.state?.messages?.length ?? 0) > 0;
  };

  const hasValidData = () => {
    return vendors.some(v => !v.skipped) && hasRequiredState();
  };

  // Notify if this page was accessed directly without required state
  useEffect(() => {
    if (!hasRequiredState()) {
      toast({
        variant: 'destructive',
        title: 'Missing vendor data',
        description: 'Please reprocess SMS messages.',
      });
    }
  }, [location.state, toast]);

  useEffect(() => {
    if (!hasRequiredState()) return;

    const incomingVendorMap = location.state?.vendorMap || {};
    const incomingKeywordBank = location.state?.keywordMap || [];
    const messages = location.state?.messages || [];

    if (Object.keys(incomingVendorMap).length === 0 || messages.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Missing vendor data',
        description: 'No vendor data passed. Please reprocess SMS messages.',
      });
      return;
    }

    const vendorSamples: Record<string, string> = {};
    messages.forEach((m: any) => {
      const extracted = extractVendorName(m.message);
      if (extracted && !vendorSamples[extracted]) {
        vendorSamples[extracted] = m.message;
      }
    });

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
        sampleMessage: vendorSamples[vendor],
        skipped: false
      };
    });

    setVendors(initialMappings);
    console.log('VendorMapping vendors:', initialMappings);
  }, [location.state]);

  const handleVendorChange = (index: number, field: keyof VendorMappingEntry, value: string) => {
    setVendors(prev => {
      const updated = [...prev];
      (updated[index] as any)[field] = value;
      return updated;
    });
  };

  const handleRemoveVendor = (index: number) => {
    setVendors(prev => prev.filter((_, i) => i !== index));
  };

  const toggleSkipVendor = (index: number) => {
    setVendors(prev => {
      const updated = [...prev];
      updated[index].skipped = !updated[index].skipped;
      return updated;
    });
  };

  const skipAllVendors = () => {
    setVendors(prev => prev.map(v => ({ ...v, skipped: true })));
  };

  const unskipAllVendors = () => {
    setVendors(prev => prev.map(v => ({ ...v, skipped: false })));
  };

  const handleConfirm = () => {
    console.log('VendorMapping: save clicked');

    if (!hasRequiredState()) {
      console.warn('Save attempted without required vendor data');
      toast({
        variant: 'destructive',
        title: 'Missing vendor data',
        description: 'Vendor information or messages are missing.'
      });
      navigate('/');
      return;
    }

    if (vendors.every(v => v.skipped)) {
      const allMessages = location.state?.messages || [];
      const senderDates: Record<string, string> = {};
      allMessages.forEach((m: any) => {
        if (m.sender) {
          const existing = senderDates[m.sender];
          if (!existing || new Date(m.date).getTime() > new Date(existing).getTime()) {
            senderDates[m.sender] = m.date;
          }
        }
      });
      updateSmsSenderImportDates(senderDates);
      navigate('/');
      return;
    }

    if (!hasValidData()) {
      console.warn('Save attempted without valid vendor data or messages');
      toast({
        variant: 'destructive',
        title: 'Missing vendor data',
        description: 'Vendor information or messages are missing.'
      });
      return;
    }

    const vendorMap: Record<string, string> = {};
    const keywordBank: { keyword: string; mappings: { field: string; value: string }[] }[] = [];

    const skippedVendors = vendors.filter(v => v.skipped).map(v => v.vendor);

    vendors.filter(v => !v.skipped).forEach(v => {
      vendorMap[v.vendor] = v.updatedVendor;

      keywordBank.push({
        keyword: v.vendor,
        mappings: [
          { field: 'category', value: v.category },
          { field: 'subcategory', value: v.subcategory },
        ],
      });
    });

    const allMessages = location.state?.messages || [];
    const allowed = new Set(vendors.filter(v => !v.skipped).map(v => v.vendor));
    const messages = allMessages.filter((m: any) => {
      const extracted = extractVendorName(m.message);
      return extracted && allowed.has(extracted);
    });

    const skippedMsgs = allMessages.filter((m: any) => {
      const extracted = extractVendorName(m.message);
      return extracted && skippedVendors.includes(extracted);
    });

    if (skippedMsgs.length > 0) {
      const senderDates: Record<string, string> = {};
      skippedMsgs.forEach(m => {
        if (m.sender) {
          const existing = senderDates[m.sender];
          if (!existing || new Date(m.date).getTime() > new Date(existing).getTime()) {
            senderDates[m.sender] = m.date;
          }
        }
      });
      updateSmsSenderImportDates(senderDates);
    }

    navigate('/review-sms-transactions', {
      state: {
        messages,
        vendorMap,
        keywordMap: keywordBank
      }
    });
  };

const handleRetry = () => {
    console.log('VendorMapping: retry clicked');

    if (!hasRequiredState() || !hasValidData()) {
      console.warn('Retry attempted without valid vendor data or messages');
      toast({
        variant: 'destructive',
        title: 'Missing vendor data',
        description: 'Vendor information or messages are missing.'
      });
      if (!hasRequiredState()) navigate('/');
      return;
    }

    navigate('/process-sms');
  };

  const handleBack = () => {
    console.log('VendorMapping: back clicked');
    if (!hasRequiredState()) {
      console.warn('Back navigation attempted without valid vendor data or messages');
      toast({
        variant: 'destructive',
        title: 'Missing vendor data',
        description: 'Vendor information or messages are missing.'
      });
      navigate('/');
      return;
    }
    if (!hasValidData()) {
      console.warn('Back navigation attempted without valid vendor data or messages');
      toast({
        variant: 'destructive',
        title: 'Missing vendor data',
        description: 'Vendor information or messages are missing.'
      });
    }
    navigate(-1);
  };

  if (!hasRequiredState()) {
    return (
      <Layout>
        <div className="flex flex-col items-center gap-4 py-8">
          <p className="text-center">Missing vendor data. Please reprocess SMS messages.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">Vendor Mapping</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const allSkipped = vendors.every(v => v.skipped);
            if (allSkipped) {
              unskipAllVendors();
            } else {
              skipAllVendors();
            }
          }}
        >
          {vendors.every(v => v.skipped) ? 'Unskip All' : 'Skip All'}
        </Button>
      </div>

      <div className="space-y-2 pb-24">
        <Accordion type="multiple" className="w-full">
          {vendors.map((vendor, index) => (
            <AccordionItem key={vendor.vendor} value={vendor.vendor}>
              <AccordionTrigger>
                <div className="flex items-center justify-between w-full">
                  <span>{vendor.updatedVendor || vendor.vendor}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={e => {
                        e.stopPropagation();
                        toggleSkipVendor(index);
                      }}
                    >
                      <Ban className={`h-4 w-4 ${vendor.skipped ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={e => {
                        e.stopPropagation();
                        handleRemoveVendor(index);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card className="p-[var(--card-padding)] space-y-3">
                  <div>
                    <label className="block mb-1 font-semibold">Vendor:</label>
                    <Input
                      type="text"
                      value={vendor.updatedVendor}
                      onChange={e => handleVendorChange(index, 'updatedVendor', e.target.value)}
                      className="w-full p-2 dark:bg-white dark:text-black"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold">Category:</label>
                    <Select value={vendor.category} onValueChange={value => handleVendorChange(index, 'category', value)}>
                      <SelectTrigger className="w-full p-2 dark:bg-white dark:text-black">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCategoryHierarchy().filter(c => c.type === 'expense').map(c => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold">Subcategory:</label>
                    <Select value={vendor.subcategory} onValueChange={value => handleVendorChange(index, 'subcategory', value)}>
                      <SelectTrigger className="w-full p-2 dark:bg-white dark:text-black">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCategoryHierarchy().find(c => c.name === vendor.category)?.subcategories.map(sub => (
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

      <div className="fixed bottom-16 left-0 right-0 px-4 flex gap-4 z-40">
        <Button className="flex-1" variant="outline" onClick={handleRetry}>
          Retry
        </Button>
        <Button className="flex-1" onClick={handleConfirm}>
          Save
        </Button>
      </div>
    </Layout>
  );
};

export default VendorMapping;
