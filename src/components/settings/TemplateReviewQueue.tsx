import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTemplatesForReview, approveTemplate, deprecateTemplate } from '@/lib/smart-paste-engine/templateUtils';
import { SmartPasteTemplate } from '@/types/template';

const TemplateReviewQueue: React.FC = () => {
  const [templates, setTemplates] = useState<SmartPasteTemplate[]>([]);
  useEffect(() => {
    loadQueue();
  }, []);
  const loadQueue = () => {
    setTemplates(getTemplatesForReview());
  };
  const handleApprove = (t: SmartPasteTemplate) => {
    approveTemplate(t.id);
    loadQueue();
  };
  const handleDeprecate = (t: SmartPasteTemplate) => {
    deprecateTemplate(t.id, undefined, 'User rejected');
    loadQueue();
  };
  if (templates.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No templates pending review
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Templates Pending Review ({templates.length})</h3>
      {templates.map(t => (
        <Card key={t.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <Badge variant={t.meta?.status === 'learning' ? 'secondary' : 'outline'}>
                {t.meta?.status || 'unknown'}
              </Badge>
              <div className="text-sm mt-2 font-mono truncate max-w-md">
                {t.template}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Confidence: {t.meta?.confidenceScore?.toFixed(0)}% | Uses: {t.meta?.usageCount || 0} | Success: {t.meta?.successCount || 0}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleDeprecate(t)}>
                Reject
              </Button>
              <Button size="sm" onClick={() => handleApprove(t)}>
                Approve
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default TemplateReviewQueue;
