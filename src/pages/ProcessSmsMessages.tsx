
import React, { useState } from 'react';
import { SmsReaderService, SmsEntry } from '../services/SmsReaderService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Capacitor } from '@capacitor/core';

const ProcessSmsMessages: React.FC = () => {
  const [messages, setMessages] = useState<SmsEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleReadSms = async () => {
    setLoading(true);
    
    // Skip native checks if not on a mobile device
    if (!Capacitor.isNativePlatform()) {
      toast({
        variant: "destructive",
        title: "Mobile only feature",
        description: "SMS reading is only available on Android devices"
      });
      setLoading(false);
      return;
    }
    
    try {
      const granted = await SmsReaderService.requestPermission();
      if (!granted) {
        toast({
          variant: "destructive",
          title: "Permission denied",
          description: "SMS Permission was not granted"
        });
        setLoading(false);
        return;
      }

      const smsMessages = await SmsReaderService.readMessages({
        senders: ["Bank", "Card", "Credit"], // Filter for financial institutions
        limit: 100,
      });

      setMessages(smsMessages);
      
      toast({
        title: "Success",
        description: `Found ${smsMessages.length} messages`
      });
    } catch (error) {
      console.error('Error reading SMS:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to read SMS messages"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Process SMS Messages</h1>
      <Button
        className="w-full mb-4"
        onClick={handleReadSms}
        disabled={loading}
      >
        {loading ? 'Reading...' : 'Read SMS'}
      </Button>

      <div className="space-y-4">
        {messages.map((msg, index) => (
          <Card key={index} className="p-4">
            <p><strong>From:</strong> {msg.sender}</p>
            <p><strong>Date:</strong> {new Date(msg.date).toLocaleString()}</p>
            <p><strong>Message:</strong> {msg.message}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProcessSmsMessages;
