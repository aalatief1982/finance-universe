
import { ErrorType } from '@/types/error';
import { handleError } from '@/utils/error-utils';

export interface SmsProvider {
  id: string;
  name: string;
  pattern: string;
  isSelected: boolean;
}

const SMS_PROVIDERS_STORAGE_KEY = 'sms_providers';
const SMS_START_DATE_STORAGE_KEY = 'sms_start_date';

class SmsProviderSelectionService {
  // Default SMS providers
  private defaultProviders: SmsProvider[] = [
    { id: "bank-abc", name: "Bank ABC", pattern: "Transaction alert: $AMOUNT at...", isSelected: false },
    { id: "credit-xyz", name: "Credit Card XYZ", pattern: "Your card was charged $AMOUNT...", isSelected: false },
    { id: "investment", name: "Investment Corp", pattern: "Portfolio update: $AMOUNT deposited...", isSelected: false },
    { id: "digital-wallet", name: "Digital Wallet", pattern: "Payment of $AMOUNT received...", isSelected: false },
    { id: "mobile-banking", name: "Mobile Banking", pattern: "You spent $AMOUNT at...", isSelected: false }
  ];
  
  // Get all available SMS providers
  getSmsProviders(): SmsProvider[] {
    try {
      const storedProviders = localStorage.getItem(SMS_PROVIDERS_STORAGE_KEY);
      if (!storedProviders) {
        return this.defaultProviders;
      }
      
      return JSON.parse(storedProviders);
    } catch (error) {
      handleError({
        type: ErrorType.STORAGE,
        message: 'Failed to load SMS providers from storage',
        originalError: error
      });
      return this.defaultProviders;
    }
  }
  
  // Save selected SMS providers
  saveSelectedProviders(providers: SmsProvider[]): void {
    try {
      localStorage.setItem(SMS_PROVIDERS_STORAGE_KEY, JSON.stringify(providers));
    } catch (error) {
      handleError({
        type: ErrorType.STORAGE,
        message: 'Failed to save SMS providers to storage',
        originalError: error
      });
    }
  }
  
  // Get selected SMS providers only
  getSelectedProviders(): SmsProvider[] {
    return this.getSmsProviders().filter(provider => provider.isSelected);
  }
  
  // Toggle selection status of a provider
  toggleProviderSelection(providerId: string): SmsProvider[] {
    const providers = this.getSmsProviders();
    const updatedProviders = providers.map(provider => {
      if (provider.id === providerId) {
        return { ...provider, isSelected: !provider.isSelected };
      }
      return provider;
    });
    
    this.saveSelectedProviders(updatedProviders);
    return updatedProviders;
  }
  
  // Save SMS start date
  saveSmsStartDate(date: string): void {
    try {
      localStorage.setItem(SMS_START_DATE_STORAGE_KEY, date);
    } catch (error) {
      handleError({
        type: ErrorType.STORAGE,
        message: 'Failed to save SMS start date to storage',
        originalError: error
      });
    }
  }
  
  // Get SMS start date
  getSmsStartDate(): string | null {
    try {
      return localStorage.getItem(SMS_START_DATE_STORAGE_KEY);
    } catch (error) {
      handleError({
        type: ErrorType.STORAGE,
        message: 'Failed to get SMS start date from storage',
        originalError: error
      });
      return null;
    }
  }
  
  // Check if SMS permissions have been granted
  hasSmsPermission(): boolean {
    try {
      return localStorage.getItem('smsPermissionGranted') === 'true';
    } catch (error) {
      return false;
    }
  }
  
  // Save SMS permission status
  saveSmsPermissionStatus(granted: boolean): void {
    try {
      localStorage.setItem('smsPermissionGranted', granted ? 'true' : 'false');
    } catch (error) {
      handleError({
        type: ErrorType.STORAGE,
        message: 'Failed to save SMS permission status to storage',
        originalError: error
      });
    }
  }
  
  // Check if SMS provider selection is completed
  isProviderSelectionCompleted(): boolean {
    const selectedProviders = this.getSelectedProviders();
    return selectedProviders.length > 0;
  }
}

// Export a singleton instance
export const smsProviderSelectionService = new SmsProviderSelectionService();
