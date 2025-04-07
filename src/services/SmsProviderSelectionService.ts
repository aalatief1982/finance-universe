
// Define the SMS provider interface
export interface SmsProvider {
  id: string;
  name: string;
  patterns: string[];
  logo?: string;
  enabled: boolean;
}

// Define the SMS message interface
export interface SmsMessage {
  address: string;
  body: string;
  timestamp: string;
}

class SmsProviderSelectionService {
  private storageKey = 'selected_sms_providers';
  
  // Default providers for demonstration purposes
  private defaultProviders: SmsProvider[] = [
    {
      id: 'bank1',
      name: 'First National Bank',
      patterns: ['FNB', 'FirstNational'],
      enabled: false
    },
    {
      id: 'bank2',
      name: 'City Bank',
      patterns: ['CITY', 'CityBank'],
      enabled: false
    },
    {
      id: 'bank3',
      name: 'Universal Credit',
      patterns: ['UCARD', 'UniversalCredit'],
      enabled: false
    },
    {
      id: 'bank4',
      name: 'Global Finance',
      patterns: ['GLOBAL', 'GlobalFin'],
      enabled: false
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
  
  // Get only the selected/enabled providers
  getSelectedProviders(): SmsProvider[] {
    return this.getAllProviders().filter(provider => provider.enabled);
  }
  
  // Save the provider selection state
  saveProviders(providers: SmsProvider[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(providers));
    } catch (error) {
      console.error('Error saving SMS providers:', error);
    }
  }
  
  // Toggle a provider's selection state
  toggleProvider(providerId: string, enabled: boolean): void {
    const providers = this.getAllProviders();
    const updatedProviders = providers.map(provider => 
      provider.id === providerId ? { ...provider, enabled } : provider
    );
    
    this.saveProviders(updatedProviders);
  }
  
  // Check if providers have been configured
  hasConfiguredProviders(): boolean {
    return this.getSelectedProviders().length > 0;
  }
  
  // Detect providers from a list of SMS messages
  detectProvidersFromMessages(messages: SmsMessage[]): SmsProvider[] {
    const providers = this.getAllProviders();
    const detectedProviderIds = new Set<string>();
    
    messages.forEach(message => {
      providers.forEach(provider => {
        const isFromProvider = provider.patterns.some(pattern => 
          message.address.toLowerCase().includes(pattern.toLowerCase())
        );
        
        if (isFromProvider) {
          detectedProviderIds.add(provider.id);
        }
      });
    });
    
    return providers.filter(provider => detectedProviderIds.has(provider.id));
  }
  
  // Access SMS in a native environment (mock implementation)
  async accessNativeSms(): Promise<SmsMessage[]> {
    // In a real app, this would use a Capacitor plugin or other native bridge
    // For now, return mock data
    return [
      {
        address: 'FNB',
        body: 'Your account was debited with $50.00 for Coffee Shop purchase',
        timestamp: new Date().toISOString()
      },
      {
        address: 'CITY',
        body: 'You made a deposit of $100.00 to your savings account',
        timestamp: new Date().toISOString()
      },
      {
        address: 'UCARD',
        body: 'A payment of $25.99 was made to Online Store',
        timestamp: new Date().toISOString()
      }
    ];
  }
}

// Export a singleton instance
export const smsProviderSelectionService = new SmsProviderSelectionService();
