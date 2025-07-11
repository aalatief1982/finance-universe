
import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Layout from '@/components/Layout';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { TemplateStructureService } from '@/services/TemplateStructureService';
import { StructureTemplateEntry } from '@/types/template';
import { saveStructureTemplate } from '@/utils/storage-utils';

const BuildTemplate: React.FC = () => {
  const [message, setMessage] = useState('');
  const [template, setTemplate] = useState('');
  const [senderHint, setSenderHint] = useState('');
  const [type, setType] = useState('');
  const [fromAccount, setFromAccount] = useState('');
  const [currency, setCurrency] = useState('SAR');
  const [generatedTemplate, setGeneratedTemplate] = useState('');
  const [detectedFields, setDetectedFields] = useState<string[]>([]);
  const { toast } = useToast();

  const handleGenerateTemplate = () => {
    const structure = TemplateStructureService.generateTemplateStructure(message);
    setGeneratedTemplate(structure.template);
    setDetectedFields(structure.fields);
  };

  const handleSave = () => {
    const newEntry: StructureTemplateEntry = {
      id: uuidv4(),
      structure: generatedTemplate,
      fields: detectedFields,
      createdAt: new Date().toISOString(),
    };
    saveStructureTemplate(newEntry);
    toast({ title: "Template saved", description: "You can now match messages with this structure." });
  };

  return (
    <Layout>
      <Card className="m-4">
        <CardHeader>
          <CardTitle>Build Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Raw Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Paste message..." />
          </div>
          <Button onClick={handleGenerateTemplate}>Generate Template</Button>
          {generatedTemplate && (
            <>
              <div>
                <Label>Generated Template</Label>
                <Textarea value={generatedTemplate} readOnly />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Sender Hint</Label>
                  <Input value={senderHint} onChange={(e) => setSenderHint(e.target.value)} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Input value={type} onChange={(e) => setType(e.target.value)} />
                </div>
                <div>
                  <Label>From Account</Label>
                  <Input value={fromAccount} onChange={(e) => setFromAccount(e.target.value)} />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleSave}>Save Template</Button>
            </>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};

export default BuildTemplate;
