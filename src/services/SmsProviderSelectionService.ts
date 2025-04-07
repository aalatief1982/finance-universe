
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
  
  // Detect providers from a list of SMS messages
  async detectProvidersFromMessages(): Promise<SmsProvider[]> {
    try {
      // Get all SMS messages
      const messages = await nativeSmsService.readSmsMessages();
      
      // Detect providers
      const detectedProviderNames = nativeSmsService.detectProvidersFromMessages(messages);
      
      // Update provider list with detected providers
      const providers = this.getAllProviders();
      const updatedProviders = providers.map(provider => {
        const isDetected = detectedProviderNames.some(name => 
          name.toLowerCase().includes(provider.name.toLowerCase()) ||
          provider.name.toLowerCase().includes(name.toLowerCase())
        );
        
        return {
          ...provider,
          isDetected
        };
      });
      
      return updatedProviders;
    } catch (error) {
      console.error('Error detecting providers:', error);
      return this.getAllProviders();
    }
  }
  
  // Added for backward compatibility - simulate provider detection
  simulateProviderDetection(): SmsProvider[] {
    const providers = this.getAllProviders();
    // Mark 2 random providers as detected for demo purposes
    const updatedProviders = [...providers];
    
    // Randomly select up to 2 providers to mark as detected
    const indices = Array.from({ length: providers.length }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    
    indices.forEach(index => {
      if (updatedProviders[index]) {
        updatedProviders[index] = {
          ...updatedProviders[index],
          isDetected: true,
          isSelected: true
        };
      }
    });
    
    // Save the updated providers
    this.saveProviders(updatedProviders);
    
    return updatedProviders;
  }
  
  // Access SMS in a native environment
  async accessNativeSms(): Promise<SmsMessage[]> {
    try {
      const messages = await nativeSmsService.readSmsMessages();
      
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
