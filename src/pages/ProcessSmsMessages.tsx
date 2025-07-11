import { safeStorage } from "@/utils/safe-storage";
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
import { setSelectedSmsSenders, getSmsSenderImportMap } from '@/utils/storage-utils';
import { getSmsLookbackMonths } from '@/lib/env';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import Layout from '@/components/Layout';
import { isFinancialTransactionMessage } from '@/lib/smart-paste-engine/messageFilter';
import ImportAndMapModal from '@/components/sms/ImportAndMapModal';

interface ProcessedSmsEntry extends SmsEntry {
  matchedKeyword?: string;
}

interface ImportProgress {
  index: number;
  total: number;
  vendorMappings: Record<string, string>;
}

const IMPORT_PROGRESS_KEY = 'importProgress';

const loadImportProgress = (): ImportProgress | null => {
  try {
    const stored = safeStorage.getItem(IMPORT_PROGRESS_KEY);
    return stored ? (JSON.parse(stored) as ImportProgress) : null;
  } catch (err) {
    if (import.meta.env.MODE === 'development') {
      console.error('Failed to load import progress', err);
    }
    return null;
  }
};

const saveImportProgress = (progress: ImportProgress) => {
  safeStorage.setItem(IMPORT_PROGRESS_KEY, JSON.stringify(progress));
};

const clearImportProgress = () => {
  safeStorage.removeItem(IMPORT_PROGRESS_KEY);
};

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
  const [mapOpen, setMapOpen] = useState(false);
  const [showInitialDialog, setShowInitialDialog] = useState(false);

  const resumeHistoryImport = () => {
    const progress = loadImportProgress();
    if (!progress) {
      const mapSenders = Object.keys(getSmsSenderImportMap());
      if (mapSenders.length > 0) {
        setSenders(mapSenders);
        setSelectedSenders(mapSenders);
        setShowInitialDialog(true);
      }
      return;
    }

    try {
      const stored = safeStorage.getItem('uat_valid_sms');
      if (!stored) {
        clearImportProgress();
        return;
      }
      const msgs: ProcessedSmsEntry[] = JSON.parse(stored);
      if (progress.index >= progress.total || msgs.length === 0) {
        clearImportProgress();
        return;
      }

      setMessages(msgs);
      setFilter('all');
      const allSenders = Array.from(
        new Set(msgs.map(m => m.sender).filter(Boolean))
      ) as string[];
      setSenders(allSenders);
      setSelectedSenders(allSenders);
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.error('Failed to resume import', err);
      }
      clearImportProgress();
    }
  };

  useEffect(() => {
    resumeHistoryImport();
  }, []);

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

    const keywordObjects = JSON.parse(safeStorage.getItem('xpensia_type_keywords') || '[]') as { keyword: string, type: string }[];
    const keywords = keywordObjects.map(obj => obj.keyword.toLowerCase());

    // Determine the start date for reading messages. We consult the
    // per-sender import map and fall back to the default look-back
    // period. The earliest of these dates is used to minimize the query
    // range when fetching messages from the device.
    const senderMap = getSmsSenderImportMap();
    const monthsBack = getSmsLookbackMonths();
    const defaultStart = new Date();
    defaultStart.setMonth(defaultStart.getMonth() - monthsBack);

    const mapDates = Object.values(senderMap).map(d => new Date(d).getTime());
    const earliestMap = mapDates.length > 0 ? new Date(Math.min(...mapDates)) : null;
    const startDate = earliestMap && earliestMap.getTime() < defaultStart.getTime()
      ? earliestMap
      : defaultStart;

    const smsMessages = await SmsReaderService.readSmsMessages({ startDate });

    const validMessages: ProcessedSmsEntry[] = [];
    const invalidMessages: ProcessedSmsEntry[] = [];

    const filtered = smsMessages
      .map((msg) => {
        if (!msg || !msg.message) return null;

        const lastForSender = senderMap[msg.sender];
        const senderDate = lastForSender ? new Date(lastForSender) : defaultStart;
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
          if (import.meta.env.MODE === 'development') {
            console.warn("[SmartPaste] Skipped message:", msg.message);
          }
          return null;
        }
      })
      .filter((msg: ProcessedSmsEntry | null): msg is ProcessedSmsEntry => msg !== null);

    // Save both valid and invalid messages to localStorage
    safeStorage.setItem('uat_valid_sms', JSON.stringify(validMessages));
    safeStorage.setItem('uat_invalid_sms', JSON.stringify(invalidMessages));

    saveImportProgress({ index: 0, total: smsMessages.length, vendorMappings: {} });

    setMessages(filtered);
    setSkippedMessages(invalidMessages);
    setFilter('all');

    toast({ title: 'Success', description: `Fetched and filtered ${filtered.length} SMS messages` });
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('Error reading SMS:', error);
    }
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

    const progress = loadImportProgress();
    if (progress) {
      progress.vendorMappings = vendorMap;
      saveImportProgress(progress);
      clearImportProgress();
    }

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
        <Accordion type="single" collapsible defaultValue="senders" className="mb-6">
          <AccordionItem value="senders">
            <AccordionTrigger className="text-lg font-semibold">Select Senders</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground mb-4">
                Choose the senders whose messages you want to analyze.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {senders.map((sender) => (
                  <label
                    key={sender}
                    className="flex items-center p-2 rounded-md border cursor-pointer gap-2"
                  >
                    <Input
                      type="checkbox"
                      checked={selectedSenders.includes(sender)}
                      onChange={() => toggleSenderSelect(sender)}
                      className="dark:bg-white dark:text-black"
                    />
                    <span className="text-sm break-words">{sender}</span>
                  </label>
                ))}
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <Button className="w-full" onClick={handleProceed}>
                  Proceed to Vendor Mapping
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setMapOpen(true)}>
                  Quick Map &amp; Review
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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
      <ImportAndMapModal
        open={mapOpen}
        onOpenChange={setMapOpen}
        messages={filteredMessages}
        onComplete={(vendorMap, keywordMap) => {
          setMapOpen(false);
          setSelectedSmsSenders(selectedSenders);
          const progress = loadImportProgress();
          if (progress) {
            progress.vendorMappings = vendorMap;
            saveImportProgress(progress);
            clearImportProgress();
          }
          navigate('/review-sms-transactions', {
            state: {
              messages: filteredMessages,
              vendorMap,
              keywordMap,
            },
          });
        }}
      />
      <Dialog
        open={showInitialDialog}
        onOpenChange={(o) => {
          if (!o) {
            setShowInitialDialog(false);
            handleReadSms();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importing SMS</DialogTitle>
            <DialogDescription>
              Xpensia will read new SMS messages from your saved senders and process them as if you pressed "Read SMS".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => {
              setShowInitialDialog(false);
              handleReadSms();
            }}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ProcessSmsMessages;
