import React, { useState, useEffect } from 'react';
import { SmsReaderService, SmsEntry } from '@/services/SmsReaderService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { extractVendorName, inferIndirectFields } from '@/lib/smart-paste-engine/suggestionEngine';
import Layout from '@/components/Layout';
import { ArrowLeft } from 'lucide-react';
import { isFinancialTransactionMessage } from '@/lib/smart-paste-engine/messageFilter';

interface ProcessedSmsEntry extends SmsEntry {
  matchedKeyword?: string;
}

const ProcessSmsMessages: React.FC = () => {
  const [messages, setMessages] = useState<ProcessedSmsEntry[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ProcessedSmsEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [senders, setSenders] = useState<string[]>([]);
  const [selectedSenders, setSelectedSenders] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (messages.length > 0) {
      const distinctSenders = Array.from(new Set(messages.map((msg) => msg?.sender).filter(Boolean)));
      setSenders(distinctSenders);
    }
  }, [messages]);

  useEffect(() => {
    if (selectedSenders.length > 0) {
      const selectedMsgs = messages.filter((msg) => selectedSenders.includes(msg?.sender || ''));
      setFilteredMessages(selectedMsgs);
    }
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
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">Process SMS Messages</h1>
        </div>
      </div>

      <Button className="w-full mb-4" onClick={handleReadSms} disabled={loading}>
        {loading ? 'Reading...' : 'Read SMS'}
      </Button>

      {senders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Select Senders:</h2>
          {senders.map((sender) => (
            <label key={sender} className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={selectedSenders.includes(sender)}
                onChange={() => toggleSenderSelect(sender)}
                className="mr-2"
              />
              {sender}
            </label>
          ))}

          <Button className="mt-4 w-full" onClick={handleProceed}>
            Proceed to Vendor Mapping
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {filteredMessages
          .filter((msg): msg is ProcessedSmsEntry => !!msg && typeof msg.sender === 'string')
          .map((msg, index) => (
            <Card key={index} className="p-[var(--card-padding)]">
              <p><strong>From:</strong> {msg.sender}</p>
              <p><strong>Date:</strong> {new Date(msg.date).toLocaleString()}</p>
              <p><strong>Message:</strong> {msg.message}</p>
            </Card>
        ))}
      </div>
    </Layout>
  );
};

export default ProcessSmsMessages;
