import React, { useState } from 'react';
import { SmsReaderService, SmsEntry } from '../services/SmsReaderService';

const ProcessSmsMessages: React.FC = () => {
  const [messages, setMessages] = useState<SmsEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const reader = new SmsReaderService();

  const handleReadSms = async () => {
    setLoading(true);
    const granted = await reader.requestPermission();
    if (!granted) {
      alert('SMS Permission not granted!');
      setLoading(false);
      return;
    }

    const smsMessages = await reader.readMessages({
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // Last 30 days
      limit: 100,
    });

    setMessages(smsMessages);
    setLoading(false);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Process SMS Messages</h1>
      <button
        className="bg-blue-600 text-white py-2 px-4 rounded"
        onClick={handleReadSms}
        disabled={loading}
      >
        {loading ? 'Reading...' : 'Read SMS'}
      </button>

      <div className="mt-6 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className="border rounded-lg p-4 shadow bg-white">
            <p><strong>Sender:</strong> {msg.sender}</p>
            <p><strong>Date:</strong> {new Date(msg.date).toLocaleString()}</p>
            <p><strong>Message:</strong> {msg.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessSmsMessages;
