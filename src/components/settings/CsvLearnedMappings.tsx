import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Check } from 'lucide-react';
import { getCsvLearnedVendors } from '@/lib/smart-paste-engine/csvLearningPipeline';
import { loadVendorFallbacks, saveVendorFallbacks, VendorFallbackData } from '@/lib/smart-paste-engine/vendorFallbackUtils';

interface VendorMapping {
  vendor: string;
  data: VendorFallbackData;
}

const CsvLearnedMappings: React.FC = () => {
  const [mappings, setMappings] = useState<VendorMapping[]>([]);
  useEffect(() => {
    loadMappings();
  }, []);
  const loadMappings = () => {
    setMappings(getCsvLearnedVendors());
  };
  const handleApprove = (vendor: string) => {
    const vendors = loadVendorFallbacks();
    if (vendors[vendor]) {
      vendors[vendor].user = true;
      vendors[vendor].confidence = 1.0;
      saveVendorFallbacks(vendors);
      loadMappings();
    }
  };
  const handleDelete = (vendor: string) => {
    const vendors = loadVendorFallbacks();
    delete vendors[vendor];
    saveVendorFallbacks(vendors);
    loadMappings();
  };
  if (mappings.length === 0) {
    return null;
  }
  return (
    <Card className="p-4 mt-4">
      <h3 className="font-semibold mb-3">
        CSV-Learned Vendor Mappings ({mappings.length})
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        These vendor-to-category mappings were learned from your CSV imports. 
        Approve to keep them or remove unwanted ones.
      </p>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {mappings.map(({ vendor, data }) => (
          <div 
            key={vendor} 
            className="flex items-center justify-between p-2 bg-muted/50 rounded"
          >
            <div className="flex-1">
              <div className="font-medium text-sm">{vendor}</div>
              <div className="text-xs text-muted-foreground">
                {data.type} → {data.category}
                {data.subcategory && ` → ${data.subcategory}`}
              </div>
              <div className="text-xs text-muted-foreground">
                Confidence: {((data.confidence || 0) * 100).toFixed(0)}% | 
                Samples: {data.sampleCount || 1}
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => handleDelete(vendor)}
              >
                <Trash2 size={14} />
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleApprove(vendor)}
              >
                <Check size={14} className="mr-1" />
                Keep
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default CsvLearnedMappings;
