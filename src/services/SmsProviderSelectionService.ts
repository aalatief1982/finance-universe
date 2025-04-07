
export interface SmsProvider {
  id: string;
  name: string;
  pattern: string;
  isSelected: boolean;
  isDetected?: boolean;
}

// Mock service for SMS provider selection
class SmsProviderSelectionService {
  private providers: SmsProvider[] = [
    { id: 'bank-alrajhi', name: 'Al Rajhi Bank', pattern: 'ALRAJHI', isSelected: false },
    { id: 'bank-ncb', name: 'Saudi National Bank', pattern: 'SNB', isSelected: false },
    { id: 'bank-riyadh', name: 'Riyad Bank', pattern: 'RIYADBANK', isSelected: false },
    { id: 'bank-alinma', name: 'Alinma Bank', pattern: 'ALINMA', isSelected: false },
    { id: 'bank-albilad', name: 'Bank Albilad', pattern: 'ALBILAD', isSelected: false },
    { id: 'bank-nbe', name: 'National Bank of Egypt', pattern: 'NBE', isSelected: false },
    { id: 'bank-cib', name: 'Commercial International Bank', pattern: 'CIB', isSelected: false },
    { id: 'bank-sbi', name: 'State Bank of India', pattern: 'SBI', isSelected: false },
    { id: 'payment-stcpay', name: 'STC Pay', pattern: 'STCPAY', isSelected: false },
    { id: 'payment-paypal', name: 'PayPal', pattern: 'PAYPAL', isSelected: false },
  ];

  private smsStartDate: string | null = null;

  // Get all providers
  getSmsProviders(): SmsProvider[] {
    // Return a copy of the providers
    return [...this.providers];
  }

  // Toggle selection of a provider
  toggleProviderSelection(providerId: string): SmsProvider[] {
    this.providers = this.providers.map(provider => 
      provider.id === providerId 
        ? { ...provider, isSelected: !provider.isSelected } 
        : provider
    );
    
    // Save the updated selection to localStorage
    this.saveProvidersToStorage();
    
    return [...this.providers];
  }

  // Save the SMS start date
  saveSmsStartDate(date: string): void {
    this.smsStartDate = date;
    localStorage.setItem('smsStartDate', date);
  }

  // Get the SMS start date
  getSmsStartDate(): string | null {
    if (!this.smsStartDate) {
      this.smsStartDate = localStorage.getItem('smsStartDate');
    }
    return this.smsStartDate;
  }

  // Save providers to localStorage
  private saveProvidersToStorage(): void {
    const selectedProviders = this.providers
      .filter(p => p.isSelected)
      .map(p => p.id);
    
    localStorage.setItem('selectedSmsProviders', JSON.stringify(selectedProviders));
  }

  // Load providers from localStorage
  loadProvidersFromStorage(): void {
    try {
      const storedProviders = localStorage.getItem('selectedSmsProviders');
      if (storedProviders) {
        const selectedIds = JSON.parse(storedProviders) as string[];
        
        this.providers = this.providers.map(provider => ({
          ...provider,
          isSelected: selectedIds.includes(provider.id)
        }));
      }
    } catch (error) {
      console.error('Error loading SMS providers from storage:', error);
    }
  }

  // Simulate detection of providers from SMS messages
  simulateProviderDetection(): SmsProvider[] {
    // Randomly detect 2-4 providers
    const detectedCount = Math.floor(Math.random() * 3) + 2;
    const allProviders = [...this.providers];
    
    // Shuffle array for random selection
    const shuffled = allProviders.sort(() => 0.5 - Math.random());
    
    // Select the first few providers as "detected"
    const detected = shuffled.slice(0, detectedCount);
    
    // Update the providers list with detection status
    this.providers = this.providers.map(provider => {
      const isDetected = detected.some(d => d.id === provider.id);
      return {
        ...provider,
        isDetected,
        // Auto-select detected providers
        isSelected: isDetected ? true : provider.isSelected
      };
    });
    
    this.saveProvidersToStorage();
    
    return [...this.providers];
  }

  // Get provider by ID
  getProviderById(providerId: string): SmsProvider | undefined {
    return this.providers.find(p => p.id === providerId);
  }
}

// Create singleton instance
export const smsProviderSelectionService = new SmsProviderSelectionService();
