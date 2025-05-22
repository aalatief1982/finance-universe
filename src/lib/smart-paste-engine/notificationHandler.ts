import { parseAndInferTransaction } from './parseAndInferTransaction';
import { Transaction } from '@/types/transaction';
import { navigateToSmartPasteFlow } from '@/utils/navigation'; // helper to navigate if not already

export const handleNotificationSmartPaste = async (message: string, navigate: ReturnType<typeof useNavigate>) => { 
  try {
    const { transaction } = parseAndInferTransaction(message, undefined);
    console.log('[NOTIFICATION] Navigating to edit with transaction:', transaction);

    navigate('/edit-transaction', { state: { transaction } });
  } catch (error) {
    console.error('[NOTIFICATION] Failed to parse SMS message:', error);
  }
};

