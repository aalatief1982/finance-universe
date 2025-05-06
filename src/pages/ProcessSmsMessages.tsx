	// Updated ProcessSmsMessages.tsx with vendor extraction

	import React, { useState, useEffect } from 'react';
	import { SmsReaderService, SmsEntry } from '@/services/SmsReaderService';
	import { Button } from '@/components/ui/button';
	import { Card } from '@/components/ui/card';
	import { useToast } from '@/components/ui/use-toast';
	import { Capacitor } from '@capacitor/core';
	import { useNavigate } from 'react-router-dom';
	import { extractVendorName } from '@/lib/smart-paste-engine/suggestionEngine';
	
	

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
		  const distinctSenders = Array.from(new Set(messages.map((msg) => msg.sender)));
		  setSenders(distinctSenders);
		}
	  }, [messages]);

	  useEffect(() => {
		if (selectedSenders.length > 0) {
		  const selectedMsgs = messages.filter((msg) => selectedSenders.includes(msg.sender));
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

		  const filtered: ProcessedSmsEntry[] = smsMessages
			.map((msg) => {
			 const lower = msg.message.toLowerCase();
			 
			   

			  const otpKeywords = [
				'otp', 'code', 'password', 'passcode', 'one time', 'verification', 'auth', 'login code',
				'do not share', 'use this code', 'security code',
				'رمز', 'رمز الدخول', 'رمز التحقق', 'رمز الأمان',
				'كلمة مرور', 'رمز لمرة واحدة', 'لا تشارك', 'لا تستخدم', 'سرية', 'توثيق', 'حمايتك'
			  ];

			  // Skip OTP or sensitive login messages
			  const isOtpLike = otpKeywords.some((kw) => lower.includes(kw));
			  if (isOtpLike) return null;
			 
			 
				const matchedKeyword = keywords.find((kw) => lower.includes(kw));
				
				// Structural fallback: if no keyword match but it has amount + currency + date
				const hasAmount = /\b(?:SAR|EGP|\$|ر\.س|ج\.م)?\s?\d{1,3}(?:,\d{3})*(?:[.,]\d{1,2})?\s?(?:SAR|EGP|\$|ر\.س|ج\.م)?\b/i.test(msg.message);
				//const hasDate = /(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/.test(msg.message);
				
				const hasDate = new RegExp(
				  String.raw`(?<!\d)(?:` +
					[
					  // dd-mm-yyyy / dd/mm/yyyy / dd.mm.yyyy / dd mm yyyy
					  String.raw`\d{1,2}[\/\-. ]\d{1,2}[\/\-. ]\d{2,4}`,

					  // yyyy-mm-dd / yyyy/mm/dd / yyyy.mm.dd / yyyy mm dd
					  String.raw`\d{4}[\/\-. ]\d{1,2}[\/\-. ]\d{1,2}`,

					  // yy-mm-dd / dd-mm-yy / all 2-digit year variants
					  String.raw`\d{2}[\/\-. ]\d{1,2}[\/\-. ]\d{1,2}`,

					  // compact numeric: ddmmyyyy, yyyymmdd, mmddyy
					  String.raw`\b\d{6,8}\b`,

					  // dd Month yyyy or dd-Mon-yyyy (e.g. 04 May 2025, 04-May-2025)
					  String.raw`\d{1,2}[\s\-]?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-]?\d{2,4}`,

					  // Month dd, yyyy (e.g. May 4, 2025)
					  String.raw`(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-]?\d{1,2},?\s+\d{2,4}`
					].join('|') +
				  String.raw`)(?!\d)`,
				  'i' // case-insensitive match for month names
				).test(msg.message);
				
				
				if (matchedKeyword || (hasAmount && hasDate)) {
				  return { ...msg, matchedKeyword };
				}

				return null;
			})
			.filter((msg): msg is ProcessedSmsEntry => msg !== null);

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
		console.log('[Debug] Filtered messages to store:', JSON.stringify(filteredMessages, null, 2));
	  
		localStorage.setItem('xpensia_selected_messages', JSON.stringify(filteredMessages));

		// Extract vendors using SmartPaste logic
		const vendorMap: Record<string, string> = {};
		const keywordMap: { keyword: string; mappings: { field: string; value: string }[] }[] = [];

		filteredMessages.forEach((msg) => {
		  const rawVendor = extractVendorName(msg.message);
		  if (rawVendor && !vendorMap[rawVendor]) {
			vendorMap[rawVendor] = rawVendor;
			keywordMap.push({
			  keyword: rawVendor,
			  mappings: [
				{ field: 'category', value: 'Others' },
				{ field: 'subcategory', value: 'Misc' }
			  ]
			});
		  }
		});
		console.log('[Debug] Proceeding with messages:', JSON.stringify(filteredMessages, null, 2));
		console.log('[Debug] Vendor map to be stored:', JSON.stringify(vendorMap, null, 2));
		console.log('[Debug] Keyword bank to be stored:', JSON.stringify(keywordMap, null, 2));

		localStorage.setItem('xpensia_vendor_map', JSON.stringify(vendorMap));
		localStorage.setItem('xpensia_keyword_bank', JSON.stringify(keywordMap));

		navigate('/vendor-mapping');
	  };

	  return (
		<div className="p-4">
		  <h1 className="text-2xl font-bold mb-4">Process SMS Messages</h1>

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
			{filteredMessages.map((msg, index) => (
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
		