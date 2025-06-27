import React, { useState, useEffect } from 'react';
import { SmsReaderService, SmsEntry } from '@/services/SmsReaderService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { extractVendorName, inferIndirectFields } from '@/lib/smart-paste-engine/suggestionEngine';
import { setSelectedSmsSenders, getLastSmsImportDate, getSmsSenderImportMap } from '@/utils/storage-utils';
import Layout from '@/components/Layout';
import { isFinancialTransactionMessage } from '@/lib/smart-paste-engine/messageFilter';

interface ProcessedSmsEntry extends SmsEntry {
  matchedKeyword?: string;
}

const ProcessSmsMessages: React.FC = () => {
  const [messages, setMessages] = useState<ProcessedSmsEntry[]>([]);
  const [skippedMessages, setSkippedMessages] = useState<ProcessedSmsEntry[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ProcessedSmsEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [senders, setSenders] = useState<string[]>([]);
  const [selectedSenders, setSelectedSenders] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'matched' | 'skipped'>('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const all = [...messages, ...skippedMessages];
    if (all.length > 0) {
      const distinctSenders = Array.from(new Set(all.map((msg) => msg?.sender).filter(Boolean)));
      setSenders(distinctSenders);
    }
  }, [messages, skippedMessages]);

  useEffect(() => {
    let list: ProcessedSmsEntry[] = [];

    if (filter === 'skipped') {
      list = [...skippedMessages];
    } else {
      list = [...messages];
      if (filter === 'matched') {
        list = list.filter((msg) => !!msg.matchedKeyword);
      }
    }

    if (selectedSenders.length > 0) {
      list = list.filter((msg) => selectedSenders.includes(msg?.sender || ''));
    }

    setFilteredMessages(list);
  }, [selectedSenders, messages, skippedMessages, filter]);

const handleReadSms = async () => {
  setLoading(true);

  if (!Capacitor.isNativePlatform()) {
    toast({
      variant: 'destructive',
      title: 'Mobile only feature',
      description: 'SMS reading is only available on Android devices',
    });
    setLoading(false);
    return;
  }

  try {
    const granted = await SmsReaderService.requestPermission();
    if (!granted) {
      toast({
        variant: 'destructive',
        title: 'Permission denied',
        description: 'SMS Permission was not granted',
      });
      setLoading(false);
      return;
    }

    const keywordObjects = JSON.parse(localStorage.getItem('xpensia_type_keywords') || '[]') as { keyword: string, type: string }[];
    const keywords = keywordObjects.map(obj => obj.keyword.toLowerCase());

    const last = getLastSmsImportDate();
    const startDate = last ? new Date(last) : new Date(new Date().setMonth(new Date().getMonth() - 6));
    const senderMap = getSmsSenderImportMap();

    const smsMessages = await SmsReaderService.readSmsMessages({ startDate });

    const validMessages: ProcessedSmsEntry[] = [];
    const invalidMessages: ProcessedSmsEntry[] = [];

    const filtered: ProcessedSmsEntry[] = smsMessages
      .map((msg) => {
        if (!msg || !msg.message) return null;

        const lastForSender = senderMap[msg.sender];
        const senderDate = lastForSender ? new Date(lastForSender) : startDate;
        if (new Date(msg.date).getTime() <= senderDate.getTime()) return null;

        const lower = msg.message.toLowerCase();

        const isRelevant = isFinancialTransactionMessage(msg.message);
        const otpKeywords = [
          'otp', 'code', 'password', 'passcode', 'one time', 'verification', 'auth', 'login code',
          'do not share', 'use this code', 'security code',
          'رمز', 'رمز الدخول', 'رمز التحقق', 'رمز الأمان',
          'كلمة مرور', 'رمز لمرة واحدة', 'لا تشارك', 'لا تستخدم', 'سرية', 'توثيق', 'حمايتك'
        ];

        const containsOtp = otpKeywords.some((kw) => lower.includes(kw));

        const matchedKeyword = keywords.find((kw) => lower.includes(kw));

        if (isRelevant && !containsOtp) {
          const entry = { ...msg, matchedKeyword };
          validMessages.push(entry);
          return entry;
        } else {
          const skippedEntry = { ...msg, matchedKeyword };
          invalidMessages.push(skippedEntry);
          console.warn("[SmartPaste] Skipped message:", msg.message);
          return null;
        }
      })
      .filter((msg): msg is ProcessedSmsEntry => msg !== null);

    // Save both valid and invalid messages to localStorage
    localStorage.setItem('uat_valid_sms', JSON.stringify(validMessages));
    localStorage.setItem('uat_invalid_sms', JSON.stringify(invalidMessages));

    setMessages(filtered);
    setSkippedMessages(invalidMessages);
    setFilter('all');

    toast({ title: 'Success', description: `Fetched and filtered ${filtered.length} SMS messages` });
  } catch (error) {
    console.error('Error reading SMS:', error);
    toast({ variant: 'destructive', title: 'Error', description: 'Failed to read SMS messages' });
  } finally {
    setLoading(false);
  }
};


  const toggleSenderSelect = (sender: string) => {
    if (selectedSenders.includes(sender)) {
      setSelectedSenders(selectedSenders.filter((s) => s !== sender));
    } else {
      setSelectedSenders([...selectedSenders, sender]);
    }
  };

  const handleProceed = () => {
    const vendorMap: Record<string, string> = {};
    const keywordMap: { keyword: string; mappings: { field: string; value: string }[] }[] = [];

    filteredMessages.forEach((msg) => {
      const rawVendor = extractVendorName(msg.message);
      const inferred = inferIndirectFields(msg.message, { vendor: rawVendor });

      if (rawVendor && !vendorMap[rawVendor]) {
        vendorMap[rawVendor] = rawVendor;
        const mappings = [];
        if (inferred.category) mappings.push({ field: 'category', value: inferred.category });
        if (inferred.subcategory) mappings.push({ field: 'subcategory', value: inferred.subcategory });
        if (inferred.type) mappings.push({ field: 'type', value: inferred.type });

        if (mappings.length > 0) {
          keywordMap.push({ keyword: rawVendor, mappings });
        }
      }
    });

    setSelectedSmsSenders(selectedSenders);

    navigate('/vendor-mapping', {
      state: {
        messages: filteredMessages,
        vendorMap,
        keywordMap
      }
    });
  };

  return (
    <Layout showBack>
      <div className="pt-4 pb-4">
        <div className="px-2 mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
            <span role="img" aria-label="sms">📩</span> Import from Bank SMS
          </h2>
          <p className="text-sm text-muted-foreground px-2 mb-2">Choose your SMS senders and tap <b>Read SMS</b> to begin importing transactions.</p>
        </div>

      <Button className="w-full mb-4" onClick={handleReadSms} disabled={loading}>
        {loading ? 'Reading...' : 'Read SMS'}
      </Button>

      {messages.length > 0 && (
        <ToggleGroup type="single" value={filter} onValueChange={(val) => setFilter((val as any) || 'all')} className="mb-4">
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="matched">Matched</ToggleGroupItem>
          <ToggleGroupItem value="skipped">Skipped</ToggleGroupItem>
        </ToggleGroup>
      )}

      {senders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Select Senders:</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Choose the senders whose messages you want to analyze.
          </p>
          {senders.map((sender) => (
            <label
              key={sender}
              className="flex items-center mb-2 p-2 rounded-md border cursor-pointer"
            >
              <Input
                type="checkbox"
                checked={selectedSenders.includes(sender)}
                onChange={() => toggleSenderSelect(sender)}
                className="mr-2 dark:bg-white dark:text-black"
              />
              {sender}
            </label>
          ))}

          <Button className="mt-4 w-full" onClick={handleProceed}>
            Proceed to Vendor Mapping
          </Button>
        </div>
      )}

      <div className="space-y-4 pt-4 pb-24">
        {Object.entries(
          filteredMessages.reduce<Record<string, ProcessedSmsEntry[]>>((acc, msg) => {
            const sender = msg.sender || 'Unknown';
            if (!acc[sender]) acc[sender] = [];
            acc[sender].push(msg);
            return acc;
          }, {})
        ).map(([sender, msgs]) => (
          <Accordion type="multiple" key={sender} className="border rounded-md">
            <AccordionItem value={sender}>
              <AccordionTrigger className="px-4 py-2 font-medium">
                {sender} ({msgs.length})
              </AccordionTrigger>
              <AccordionContent className="space-y-2">
                {msgs
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((m, idx) => (
                    <Card key={idx} className="p-[var(--card-padding)]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">
                          {new Date(m.date).toLocaleString()}
                        </span>
                        <Badge variant={m.matchedKeyword ? 'success' : 'secondary'}>
                          {m.matchedKeyword ? 'Matched' : 'Skipped'}
                        </Badge>
                      </div>
                      <pre className="whitespace-pre-wrap break-words text-sm">
                        {m.message}
                      </pre>
                    </Card>
                  ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </div>
      </div>
    </Layout>
  );
};

export default ProcessSmsMessages;
