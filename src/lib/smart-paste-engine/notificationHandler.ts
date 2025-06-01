
import { LocalNotifications } from '@capacitor/local-notifications';
import { Transaction } from '@/types/transaction';

export const showTransactionNotification = async (transaction: Transaction) => {
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: 'New Transaction Detected',
          body: `${transaction.title}: $${Math.abs(transaction.amount)}`,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 1000) },
          sound: undefined,
          attachments: undefined,
          actionTypeId: '',
          extra: {
            transactionId: transaction.id
          }
        }
      ]
    });
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
};

export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { display } = await LocalNotifications.checkPermissions();
    
    if (display === 'granted') {
      return true;
    }
    
    const { display: newPermission } = await LocalNotifications.requestPermissions();
    return newPermission === 'granted';
  } catch (error) {
    console.error('Failed to request notification permissions:', error);
    return false;
  }
};
