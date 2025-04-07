
import { nativeSmsService, SmsMessage } from './NativeSmsService';

// Define the SMS provider interface
export interface SmsProvider {
  id: string;
  name: string;
  patterns: string[];
  logo?: string;
  enabled: boolean;
  isSelected?: boolean;
  isDetected?: boolean;
  pattern?: string; // Added for backward compatibility
}

class SmsProviderSelectionService {
  private storageKey = 'selected_sms_providers';
  private startDateKey = 'sms_start_date';
  
  // Default providers for demonstration purposes
  private defaultProviders: SmsProvider[] = [
    {
      id: 'bank1',
      name: 'First National Bank',
      patterns: ['FNB', 'FirstNational'],
      enabled: false,
      isSelected: false,
      isDetected: false
    },
    {
      id: 'bank2',
      name: 'City Bank',
      patterns: ['CITY', 'CityBank'],
      enabled: false,
      isSelected: false,
      isDetected: false
    },
    {
      id: 'bank3',
      name: 'Universal Credit',
      patterns: ['UCARD', 'UniversalCredit'],
      enabled: false,
      isSelected: false,
      isDetected: false
    },
    {
      id: 'bank4',
      name: 'Global Finance',
      patterns: ['GLOBAL', 'GlobalFin'],
      enabled: false,
      isSelected: false,
      isDetected: false
    }
  ];
  
  constructor() {
    // Initialize providers if not already stored
    if (!localStorage.getItem(this.storageKey)) {
      this.saveProviders(this.defaultProviders);
    }
  }
  
  // Get all available SMS providers
  getAllProviders(): SmsProvider[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return this.defaultProviders;
      }
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading SMS providers:', error);
      return this.defaultProviders;
    }
  }
  
  // For backward compatibility with SmsProviderSelectionScreen
  getSmsProviders(): SmsProvider[] {
    return this.getAllProviders();
  }
  
  // Get only the selected/enabled providers
  getSelectedProviders(): SmsProvider[] {
    return this.getAllProviders().filter(provider => provider.enabled || provider.isSelected);
  }
  
  // Save the provider selection state
  saveProviders(providers: SmsProvider[]): void {
    try {
      // Ensure both enabled and isSelected are synced
      const updatedProviders = providers.map(provider => ({
        ...provider,
        isSelected: provider.enabled
      }));
      
      localStorage.setItem(this.storageKey, JSON.stringify(updatedProviders));
    } catch (error) {
      console.error('Error saving SMS providers:', error);
    }
  }
  
  // Toggle a provider's selection state
  toggleProvider(providerId: string, enabled: boolean): void {
    const providers = this.getAllProviders();
    const updatedProviders = providers.map(provider => 
      provider.id === providerId ? { ...provider, enabled, isSelected: enabled } : provider
    );
    
    this.saveProviders(updatedProviders);
  }
  
  // Toggle provider selection (for backward compatibility)
  toggleProviderSelection(providerId: string): SmsProvider[] {
    const providers = this.getAllProviders();
    const provider = providers.find(p => p.id === providerId);
    
    if (provider) {
      const newState = !provider.isSelected;
      this.toggleProvider(providerId, newState);
    }
    
    return this.getAllProviders();
  }
  
  // Check if providers have been configured
  hasConfiguredProviders(): boolean {
    return this.getSelectedProviders().length > 0;
  }
  
  // Check if provider selection is completed (for MobileSmsButton)
  isProviderSelectionCompleted(): boolean {
    return this.getSelectedProviders().length > 0;
  }
  
  // Detect providers from actual SMS messages on the device
  async detectProvidersFromMessages(): Promise<SmsProvider[]> {
    try {
      console.log('Detecting providers from SMS messages...');
      
      // Get the stored start date if available
      const startDate = this.getSmsStartDate();
      
      // Get all SMS messages from the device
      const messages = await nativeSmsService.readSmsMessages(startDate || undefined);
      console.log(`Retrieved ${messages.length} messages for provider detection`);
      
      // Extract provider names from messages
      const detectedProviderNames = nativeSmsService.detectProvidersFromMessages(messages);
      console.log('Detected provider names:', detectedProviderNames);
      
      // Update provider list with detected providers
      const providers = this.getAllProviders();
      const updatedProviders = providers.map(provider => {
        const isDetected = detectedProviderNames.some(name => 
          name.toLowerCase().includes(provider.name.toLowerCase()) ||
          provider.name.toLowerCase().includes(name.toLowerCase()) ||
          provider.patterns.some(pattern => 
            detectedProviderNames.some(name => 
              name.toLowerCase().includes(pattern.toLowerCase()) ||
              pattern.toLowerCase().includes(name.toLowerCase())
            )
          )
        );
        
        return {
          ...provider,
          isDetected
        };
      });
      
      // Save the updated providers
      this.saveProviders(updatedProviders);
      
      return updatedProviders;
    } catch (error) {
      console.error('Error detecting providers:', error);
      return this.getAllProviders();
    }
  }
  
  // Access SMS in a native environment
  async accessNativeSms(): Promise<SmsMessage[]> {
    try {
      console.log('Accessing native SMS...');
      
      // Get the stored start date if available
      const startDate = this.getSmsStartDate();
      
      // Get all SMS messages from the device
      const messages = await nativeSmsService.readSmsMessages(startDate || undefined);
      console.log(`Retrieved ${messages.length} messages from native SMS`);
      
      // Filter messages by selected providers if any
      const selectedProviders = this.getSelectedProviders();
      if (selectedProviders.length > 0) {
        const selectedProviderNames = selectedProviders.map(p => p.name);
        return nativeSmsService.filterMessagesByProviders(messages, selectedProviderNames);
      }
      
      return messages;
    } catch (error) {
      console.error('Error accessing SMS:', error);
      return [];
    }
  }
  
  // Get SMS start date (for SmsProviderSelectionScreen)
  getSmsStartDate(): string | null {
    return localStorage.getItem(this.startDateKey);
  }
  
  // Save SMS start date (for SmsProviderSelectionScreen)
  saveSmsStartDate(date: string): void {
    localStorage.setItem(this.startDateKey, date);
  }
}

// Export a singleton instance
export const smsProviderSelectionService = new SmsProviderSelectionService();
