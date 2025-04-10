import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import Layout from '@/components/Layout';
import { smsMessageSchema } from '@/lib/validation';
import { validateData } from '@/lib/validation';
import { Transaction } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';

interface SmsMessage {
  id: string;
  sender: string;
  message: string;
  date?: string;
  title?: string;
  amount?: number;
  category?: string;
  type?: string;
  notes?: string;
  fromAccount?: string;
  toAccount?: string;
  person?: string;
  currency?: string;
  country?: string;
  subcategory?: string;
}

const ProcessSmsMessages = () => {
  const [smsMessages, setSmsMessages] = useState<SmsMessage[]>([]);
  const [sender, setSender] = useState('');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const addSmsMessage = () => {
    if (!sender || !message) {
      toast({
        title: 'Error',
        description: 'Sender and message are required.',
        variant: 'destructive',
      });
      return;
    }

    // Validate the SMS message
    const validationResult = validateData(smsMessageSchema, {
      sender: sender,
      message: message,
      date: new Date()
    });

    if (!validationResult.success) {
      toast({
        title: 'Validation Error',
        description: validationResult.error,
        variant: 'destructive',
      });
      return;
    }

    const newSmsMessage: SmsMessage = {
      id: uuidv4(),
      sender: sender,
      message: message,
      date: date,
    };

    setSmsMessages([...smsMessages, newSmsMessage]);
    setSender('');
    setMessage('');
    setDate('');
  };

  const removeSmsMessage = (id: string) => {
    setSmsMessages(smsMessages.filter((msg) => msg.id !== id));
  };

  const handleInputChange = (
    id: string,
    field: keyof SmsMessage,
    value: any
  ) => {
    setSmsMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === id ? { ...msg, [field]: value } : msg
      )
    );
  };

  const processMessages = () => {
    if (smsMessages.length === 0) {
      toast({
        title: 'No messages to process',
        description: 'Please add SMS messages to process.',
        variant: 'destructive',
      });
      return;
    }

    // Map SMS messages to Transaction objects
    const mappedTransactions: Transaction[] = smsMessages.map(msg => ({
      id: msg.id,
      title: msg.title,
      amount: msg.amount,
      category: msg.category,
      subcategory: msg.subcategory,
      date: msg.date || new Date().toISOString().split('T')[0],
      type: msg.type,
      notes: msg.notes,
      source: 'import', // Change from 'sms' to 'import'
      fromAccount: msg.fromAccount,
      toAccount: msg.toAccount,
      person: msg.person,
      currency: msg.currency,
      country: msg.country
    }));

    // Log the mapped transactions for debugging
    console.log('Mapped Transactions:', mappedTransactions);

    // Navigate to the dashboard and pass the transactions as state
    navigate('/dashboard', { state: { transactions: mappedTransactions } });
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto py-8"
      >
        <h1 className="text-2xl font-bold mb-4">Process SMS Messages</h1>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Add SMS Message</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sender">Sender</Label>
              <Input
                type="text"
                id="sender"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date (YYYY-MM-DD)</Label>
              <Input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <Button onClick={addSmsMessage}>Add Message</Button>
          </CardContent>
        </Card>

        {smsMessages.map((msg) => (
          <Card key={msg.id} className="mb-4">
            <CardHeader>
              <CardTitle>SMS Message</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>Sender</Label>
                <Input
                  type="text"
                  value={msg.sender}
                  onChange={(e) =>
                    handleInputChange(msg.id, 'sender', e.target.value)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Message</Label>
                <Textarea
                  value={msg.message}
                  onChange={(e) =>
                    handleInputChange(msg.id, 'message', e.target.value)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Date (YYYY-MM-DD)</Label>
                <Input
                  type="date"
                  value={msg.date || ''}
                  onChange={(e) =>
                    handleInputChange(msg.id, 'date', e.target.value)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Title</Label>
                <Input
                  type="text"
                  onChange={(e) =>
                    handleInputChange(msg.id, 'title', e.target.value)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  onChange={(e) =>
                    handleInputChange(msg.id, 'amount', parseFloat(e.target.value))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Input
                  type="text"
                  onChange={(e) =>
                    handleInputChange(msg.id, 'category', e.target.value)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Input
                  type="text"
                  onChange={(e) =>
                    handleInputChange(msg.id, 'type', e.target.value)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Input
                  type="text"
                  onChange={(e) =>
                    handleInputChange(msg.id, 'notes', e.target.value)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>From Account</Label>
                <Input
                  type="text"
                  onChange={(e) =>
                    handleInputChange(msg.id, 'fromAccount', e.target.value)
                  }
                />
              </div>
               <div className="grid gap-2">
                <Label>To Account</Label>
                <Input
                  type="text"
                  onChange={(e) =>
                    handleInputChange(msg.id, 'toAccount', e.target.value)
                  }
                />
              </div>
               <div className="grid gap-2">
                <Label>Person</Label>
                <Input
                  type="text"
                  onChange={(e) =>
                    handleInputChange(msg.id, 'person', e.target.value)
                  }
                />
              </div>
               <div className="grid gap-2">
                <Label>Currency</Label>
                <Input
                  type="text"
                  onChange={(e) =>
                    handleInputChange(msg.id, 'currency', e.target.value)
                  }
                />
              </div>
               <div className="grid gap-2">
                <Label>Country</Label>
                <Input
                  type="text"
                  onChange={(e) =>
                    handleInputChange(msg.id, 'country', e.target.value)
                  }
                />
              </div>
              <Button variant="destructive" onClick={() => removeSmsMessage(msg.id)}>
                Remove Message
              </Button>
            </CardContent>
          </Card>
        ))}

        <Button onClick={processMessages} className="w-full">
          Process Messages
        </Button>
      </motion.div>
    </Layout>
  );
};

export default ProcessSmsMessages;
