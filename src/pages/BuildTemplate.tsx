import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Layout from '@/components/Layout';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast'; 

interface Template {
  id: string;
    raw: string;
      generated: string;
        senderHint: string;
          type: string;
            fromAccount: string;
            }

            const handleGenerateTemplate = () => {
              const structure = TemplateStructureService.generateTemplateStructure(rawMessage);
              setGeneratedTemplate(structure.template);
              setDetectedFields(structure.fields);
            };

            const handleSave = () => {
              const newEntry: StructureTemplateEntry = {
                id: uuidv4(),
                template: generatedTemplate,
                rawExample: rawMessage,
                defaultValues: {
                  type,
                  fromAccount,
                  currency,
                  sender,
                },
                fields: detectedFields,
                createdAt: new Date().toISOString()
              };
              saveStructureTemplate(newEntry);
              toast({ title: "Template saved", description: "You can now match messages with this structure." });
            };
            

            const BuildTemplate: React.FC = () => {
              const [message, setMessage] = useState('');
                const [template, setTemplate] = useState('');
                  const [senderHint, setSenderHint] = useState('');
                    const [type, setType] = useState('');
                      const [fromAccount, setFromAccount] = useState('');
                        const { toast } = useToast();

                          const generateTemplate = () => {
                              const generated = message
                                    .replace(/\d{4}-\d{2}-\d{2}/g, '{date}')
                                          .replace(/\d{2}:\d{2}:\d{2}/g, '')
                                                .replace(/\d+\.\d{2}/g, '{amount}')
                                                      .replace(/SAR|USD|EGP|AED/gi, '{currency}')
                                                            .replace(/\*{2,}\d+/g, '{account}')
                                                                  .replace(/لدى:\s?(.+?)(?=\n|$)/g, 'لدى: {vendor}');

                                                                      setTemplate(generated.trim());
                                                                        };

                                                                          const saveTemplate = () => {
                                                                              const entry: Template = {
                                                                                    id: uuidv4(),
                                                                                          raw: message.trim(),
                                                                                                generated: template.trim(),
                                                                                                      senderHint,
                                                                                                            type,
                                                                                                                  fromAccount
                                                                                                                      };

                                                                                                                          const existing = JSON.parse(localStorage.getItem('xpensia_template_registry') || '[]');
                                                                                                                              existing.push(entry);
                                                                                                                                  localStorage.setItem('xpensia_template_registry', JSON.stringify(existing));

                                                                                                                                      toast({ title: 'Template saved', description: 'This pattern will now be used for structure matching.' });

                                                                                                                                          setMessage('');
                                                                                                                                              setTemplate('');
                                                                                                                                                  setSenderHint('');
                                                                                                                                                      setType('');
                                                                                                                                                          setFromAccount('');
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
                                                                                                                                                                                                                                                                <Button onClick={generateTemplate}>Generate Template</Button>
                                                                                                                                                                                                                                                                          {template && (
                                                                                                                                                                                                                                                                                      <>
                                                                                                                                                                                                                                                                                                    <div>
                                                                                                                                                                                                                                                                                                                    <Label>Generated Template</Label>
                                                                                                                                                                                                                                                                                                                                    <Textarea value={template} readOnly />
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <Button onClick={saveTemplate}>Save Template</Button>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    </>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              )}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      </CardContent>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            </Card>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                </Layout>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  };

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  export default BuildTemplate;