import React, { useState, useEffect } from 'react';
import { subDays } from 'date-fns';
import { SmsReaderService, SmsEntry } from '@/services/SmsReaderService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { extractVendorName, inferIndirectFields } from '@/lib/smart-paste-engine/suggestionEngine';
import Layout from '@/components/Layout';
import { isFinancialTransactionMessage } from '@/lib/smart-paste-engine/messageFilter';

interface ProcessedSmsEntry extends SmsEntry {
  matchedKeyword?: string;
}

const THIRTY_DAYS_AGO = subDays(new Date(), 30);

const ProcessSmsMessages: React.FC = () => {
  const [messages, setMessages] = useState<ProcessedSmsEntry[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ProcessedSmsEntry[]>([]);
  const [messagesBySender, setMessagesBySender] = useState<Record<string, ProcessedSmsEntry[]>>({});
  const [filter, setFilter] = useState<'all' | 'matched' | 'skipped'>('all');
  const [loading, setLoading] = useState(false);
  const [senders, setSenders] = useState<string[]>([]);
  const [selectedSenders, setSelectedSenders] = useState<string[]>([]);
  const [collapsedSenders, setCollapsedSenders] = useState<Record<string, boolean>>(
    () => {
      try {
        return JSON.parse(localStorage.getItem('sms_collapsed_senders') || '{}');
      } catch {
        return {};
      }
    }
  );
  const { toast } = useToast();
  const navigate = useNavigate();

  const filteredBySender = React.useMemo(() => {
    const res: Record<string, ProcessedSmsEntry[]> = {};
    Object.entries(messagesBySender).forEach(([sender, msgs]) => {
      const filteredMsgs = msgs.filter((m) => {
        if (filter === 'matched') return !!m.matchedKeyword;
        if (filter === 'skipped') return !m.matchedKeyword;
        return true;
      });
      if (filteredMsgs.length > 0) res[sender] = filteredMsgs;
    });
    return res;
  }, [messagesBySender, filter]);

  useEffect(() => {
    if (messages.length > 0) {
      const distinctSenders = Array.from(new Set(messages.map((msg) => msg?.sender).filter(Boolean)));
      setSenders(distinctSenders);
    }
  }, [messages]);

  useEffect(() => {
    if (senders.length > 0) {
      setCollapsedSenders((prev) => {
        const updated = { ...prev };
        let changed = false;
        senders.forEach((s) => {
          if (!(s in updated)) {
            updated[s] = true;
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem('sms_collapsed_senders', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }
  }, [senders]);

  useEffect(() => {
    localStorage.setItem('sms_collapsed_senders', JSON.stringify(collapsedSenders));
  }, [collapsedSenders]);

  useEffect(() => {
    const selectedMsgs =
      selectedSenders.length > 0
        ? messages.filter((msg) => selectedSenders.includes(msg?.sender || ''))
        : messages;
    setFilteredMessages(selectedMsgs);

    const grouped: Record<string, ProcessedSmsEntry[]> = {};
    selectedMsgs.forEach((msg) => {
      const sender = msg.sender || 'Unknown';
      if (!grouped[sender]) grouped[sender] = [];
      grouped[sender].push(msg);
    });
    Object.keys(grouped).forEach((s) => {
      grouped[s].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });
    setMessagesBySender(grouped);
  }, [selectedSenders, messages]);

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

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const smsMessages = await SmsReaderService.readSmsMessages({ startDate: sixMonthsAgo });

    const validMessages: { msg: string }[] = [];
    const invalidMessages: { msg: string }[] = [];

    const filtered: ProcessedSmsEntry[] = smsMessages
      .map((msg) => {
        if (!msg || !msg.message) return null;

        const lower = msg.message.toLowerCase();

        const isRelevant = isFinancialTransactionMessage(msg.message);
        const otpKeywords = [
          'otp', 'code', 'password', 'passcode', 'one time', 'verification', 'auth', 'login code',
          'do not share', 'use this code', 'security code',
          'رمز', 'رمز الدخول', 'رمز التحقق', 'رمز الأمان',
          'كلمة مرور', 'رمز لمرة واحدة', 'لا تشارك', 'لا تستخدم', 'سرية', 'توثيق', 'حمايتك'
        ];

        const containsOtp = otpKeywords.some((kw) => lower.includes(kw));

        if (isRelevant && !containsOtp) {
          validMessages.push({ msg: msg.message });
          const matchedKeyword = keywords.find((kw) => lower.includes(kw));
          return { ...msg, matchedKeyword };
        } else {
          invalidMessages.push({ msg: msg.message });
          console.warn("[SmartPaste] Skipped message:", msg.message);
          return null;
        }
      })
      .filter((msg): msg is ProcessedSmsEntry => msg !== null);

    // Save both valid and invalid messages to localStorage
    localStorage.setItem('uat_valid_sms', JSON.stringify(validMessages));
    localStorage.setItem('uat_invalid_sms', JSON.stringify(invalidMessages));

    setMessages(filtered);

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

  const toggleSenderCollapse = (sender: string) => {
    setCollapsedSenders((prev) => {
      const updated = { ...prev, [sender]: !prev[sender] };
      localStorage.setItem('sms_collapsed_senders', JSON.stringify(updated));
      return updated;
    });
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

    navigate('/vendor-mapping', {
      state: {
        messages: filteredMessages,
        vendorMap,
        keywordMap
      }
    });
  };

  return (
    <Layout showBack withPadding={false} fullWidth>
      <div className="px-1 pt-4 space-y-[var(--card-gap)] pb-[var(--header-height)]">
        <div className="text-center">
          <h2 className="text-lg font-semibold flex items-center justify-center gap-1 mb-1">
            <span>📩</span> Import from Bank SMS
          </h2>
          <p className="text-sm text-muted-foreground px-2 mb-2">
            Choose your SMS senders and tap <b>Read SMS</b> to begin importing transactions.
          </p>
        </div>
        <Button
          variant="default"
          className="w-full"
          onClick={handleReadSms}
          disabled={loading}
        >
          {loading ? 'Reading...' : 'Read SMS'}
        </Button>

        {senders.length > 0 && (
          <Card className="p-[var(--card-padding)] space-y-2">
            <h2 className="text-lg font-semibold">Select Senders:</h2>
            <p className="text-sm text-muted-foreground">
              Select which senders to include:
            </p>
            {senders.map((sender) => (
              <div
                key={sender}
                className="p-2 rounded-md mb-2 border"
              >
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedSenders.includes(sender)}
                    onChange={() => toggleSenderSelect(sender)}
                    className="mr-2"
                  />
                  {sender}
                </label>
              </div>
            ))}

            <Button className="w-full" onClick={handleProceed}>
              Proceed to Vendor Mapping
            </Button>
          </Card>
        )}

        {Object.keys(messagesBySender).length > 0 && (
          <>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'matched' | 'skipped')} className="w-full">
              <TabsList className="w-full mb-2 grid grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="matched">Matched</TabsTrigger>
                <TabsTrigger value="skipped">Skipped</TabsTrigger>
              </TabsList>
            </Tabs>

            {Object.entries(filteredBySender).map(([sender, msgs]) => {
              const collapsed = collapsedSenders[sender] ?? true;
              const displayed = collapsed
                ? msgs.filter((m) => new Date(m.date) >= THIRTY_DAYS_AGO)
                : msgs;

              return (
                <Card key={sender} className="p-[var(--card-padding)] space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{sender}</h3>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => toggleSenderCollapse(sender)}
                    >
                      {collapsed ? 'Show older messages' : 'Hide older messages'}
                    </Button>
                  </div>
                  {displayed.map((msg, idx) => (
                    <div key={idx} className="border rounded bg-card p-2 space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(msg.date).toLocaleString()}</span>
                        <Badge variant={msg.matchedKeyword ? 'success' : 'outline'}>
                          {msg.matchedKeyword ? 'Matched' : 'Skipped'}
                        </Badge>
                      </div>
                      <pre className="whitespace-pre-wrap text-sm">{msg.message}</pre>
                    </div>
                  ))}
                  {collapsed && displayed.length < msgs.length && (
                    <p className="text-xs text-muted-foreground">
                      Showing recent messages only
                    </p>
                  )}
                </Card>
              );
            })}
          </>
        )}
      </div>
    </Layout>
  );
};

export default ProcessSmsMessages;
