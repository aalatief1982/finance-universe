import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { getCategoryHierarchy } from '@/lib/categories-data';
import { extractTemplateStructure } from '@/lib/smart-paste-engine/templateUtils';

interface DraftTransaction {
  vendor: string;
  category: string;
  subcategory: string;
  amount?: string;
  currency?: string;
  date?: string;
  fromAccount?: string;
  type?: string;
  rawMessage: string;
}


//function safeToISOString(dateStr: any): string | undefined {
 //if (!dateStr) return undefined;
  //const parsed = new Date(dateStr);
 // return isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
//}



function safeToISOString(dateStr: string): string | undefined {
  if (!dateStr) return undefined;

  // Handle short yy-mm-dd (e.g. 25-3-26)
  const match = dateStr.match(/^(\d{2})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    const [_, yy, mm, dd] = match;
    const fullYear = parseInt(yy, 10) < 50 ? `20${yy}` : `19${yy}`;
    const iso = new Date(`${fullYear}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`).toISOString();
    return iso;
  }

  // Fallback
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}
const ReviewDraftTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<DraftTransaction[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    //const raw = localStorage.getItem('xpensia_sms_draft_transactions') || '[]';
    //const messages = JSON.parse(raw);
	
	const messages = JSON.parse(localStorage.getItem('xpensia_selected_messages') || '[]');
	

	//console.log('[Debug] All parsed messages before filter:', parsed);

    const parsed: DraftTransaction[] = messages
      .map((msg: any) => {
        const { placeholders } = extractTemplateStructure(msg.rawMessage || msg.message || '');
		if (!placeholders.amount) {
			  console.warn('[Debug] Missing amount field for message:', msg.rawMessage || msg.message);
			}
        const text = (msg.rawMessage || msg.message || '').toLowerCase();
		
		let dateStr = placeholders.date;

		if (!dateStr) {
		  //const fallbackMatch = msg.rawMessage?.match(/\d{4}-\d{2}-\d{2}/);
		  const fallbackMatch = msg.rawMessage?.match(/\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2}:\d{2})?/);
		  if (fallbackMatch) dateStr = fallbackMatch[0];
		}

        // Drop OTP-like noise or messages lacking basic structure
       const otpKeywords = [
		  // English
		  'otp', 'code', 'password', 'passcode', 'one time', 'verification', 'auth', 'login code',
		  'do not share', 'use this code', 'security code',

		  // Arabic
		  'رمز', 'رمز الدخول', 'رمز التحقق', 'رمز الأمان',
		  'كلمة مرور', 'رمز لمرة واحدة', 'لا تشارك', 'لا تستخدم', 'سرية', 'توثيق', 'حمايتك'
		];
				const hasOtpWords = otpKeywords.some(word => text.includes(word));
        //if (hasOtpWords || !placeholders.amount || !placeholders.currency || !placeholders.date) return null;
		//if (hasOtpWords || !placeholders.amount || !placeholders.date) return null;

		if (hasOtpWords || !placeholders.amount || !placeholders.date) {
		  console.warn('[Skipped ReviewDraft] Missing required fields:', {
			hasOtpWords,
			amount: placeholders.amount,
			date: placeholders.date,
			raw: msg.rawMessage
		  });
		  return null;
		}

        // Infer transaction type
        const typeKeywords = JSON.parse(localStorage.getItem('xpensia_type_keywords') || '[]');
        let type: string = 'expense';
        for (const entry of typeKeywords) {
          if (text.includes(entry.keyword.toLowerCase())) {
            type = entry.type;
            break;
          }
        }
		let vendor = placeholders.vendor || '';
		if (!vendor) {
		  if (/راتب|salary/i.test(text)) {
			vendor = 'Company';
		  } else if (/من[:\s]*([^\n]+)/i.test(text)) {
			vendor = text.match(/من[:\s]*([^\n]+)/i)?.[1]?.trim() || '';
		  }
		}
		
		console.log('[ReviewDraft] Parsed transaction placeholders:', JSON.stringify(placeholders)+' Message: '+ JSON.stringify(msg));
        return {
          vendor: (placeholders.vendor || '').replace(/^[:\s]+/, '').trim(),
          amount: placeholders.amount,
          currency: placeholders.currency,
          date: safeToISOString(placeholders.date),
          fromAccount: msg.sender || msg.fromAccount || '',
          type,
          category: msg.category || 'Other',
          subcategory: msg.subcategory || 'Miscellaneous',
          rawMessage: msg.rawMessage || msg.message || ''
        };
      })
      .filter((t): t is DraftTransaction => t !== null);
	  console.log('[Debug] Final transactions after filter:', parsed);

    setTransactions(parsed);
  }, []);

  const handleFieldChange = (index: number, field: keyof DraftTransaction, value: string) => {
    const updated = [...transactions];
    updated[index][field] = value;
    setTransactions(updated);
  };

const handleSave = () => {
  const validTransactions: DraftTransaction[] = [];
  const skippedTransactions: DraftTransaction[] = [];

  transactions.forEach((txn, index) => {
    if (
      txn.amount &&
      txn.currency &&
      txn.date &&
      txn.category &&
      txn.subcategory
    ) {
      validTransactions.push(txn);
    } else {
      console.warn(`[DebugSave] Skipping incomplete transaction ${index + 1}:`, {
        vendor: txn.vendor,
        amount: txn.amount,
        currency: txn.currency,
        date: txn.date,
        category: txn.category,
        subcategory: txn.subcategory,
        rawMessage: txn.rawMessage,
      });
      skippedTransactions.push(txn);
    }
  });

  if (skippedTransactions.length > 0) {
    localStorage.setItem('xpensia_skipped_transactions', JSON.stringify(skippedTransactions));
    toast({
      variant: 'destructive',
      title: 'Some transactions skipped',
      description: `${skippedTransactions.length} incomplete transaction(s) were not saved. See console for details.`,
    });
  }

  if (validTransactions.length === 0) return;

  // Load existing saved transactions
  const existing = JSON.parse(localStorage.getItem('xpensia_transactions') || '[]');

  // Append and deduplicate
  const updated = [...existing, ...validTransactions];
  const seen = new Set();
  const deduped = updated.filter(txn => {
    const key = txn.rawMessage;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Save final list
  localStorage.setItem('xpensia_transactions', JSON.stringify(deduped));
  localStorage.removeItem('xpensia_sms_draft_transactions');

  setTransactions([]); // clear UI
  toast({
    title: 'Saved',
    description: `${validTransactions.length} transaction(s) saved successfully.`,
  });
};


  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'income': return '#a5d6a7';
      case 'transfer': return '#90caf9';
      default: return '#ef9a9a';
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Review SMS Transactions</h1>

      {transactions.map((txn, index) => (
        <Card key={index} className="p-4 mb-4">
          <p className="mb-2 text-sm text-gray-500">{txn.rawMessage}</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Vendor"
              value={txn.vendor || ''}
              onChange={(e) => handleFieldChange(index, 'vendor', e.target.value)}
              className="border rounded p-2"
            />
            <input
              placeholder="Amount"
              value={txn.amount || ''}
              onChange={(e) => handleFieldChange(index, 'amount', e.target.value)}
              className="border rounded p-2"
            />
            <input
              placeholder="Currency"
              value={txn.currency || ''}
              onChange={(e) => handleFieldChange(index, 'currency', e.target.value)}
              className="border rounded p-2"
            />
            <input
              placeholder="Date"
              type="date"
              value={txn.date?.split('T')[0] || ''}
              onChange={(e) => handleFieldChange(index, 'date', e.target.value)}
              className="border rounded p-2"
            />
            <select
              value={txn.category}
              onChange={(e) => handleFieldChange(index, 'category', e.target.value)}
              className="border rounded p-2"
            >
              {getCategoryHierarchy().filter(c => c.type === 'expense').map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <select
              value={txn.subcategory}
              onChange={(e) => handleFieldChange(index, 'subcategory', e.target.value)}
              className="border rounded p-2"
            >
              {getCategoryHierarchy().find(c => c.name === txn.category)?.subcategories.map(sub => (
                <option key={sub.id} value={sub.name}>{sub.name}</option>
              ))}
            </select>
            <input
              placeholder="From Account"
              value={txn.fromAccount || ''}
              onChange={(e) => handleFieldChange(index, 'fromAccount', e.target.value)}
              className="border rounded p-2"
            />
            <select
              value={txn.type || 'expense'}
              onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
              className="border rounded p-2"
              style={{ backgroundColor: getTypeColor(txn.type) }}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
        </Card>
      ))}

      <Button className="w-full mt-4" onClick={handleSave}>
        Save All
      </Button>
    </div>
  );
};

export default ReviewDraftTransactions;
