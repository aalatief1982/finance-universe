
// Define the SmsProvider interface
export interface SmsProvider {
  id: string;
  name: string;
  pattern: string;
  isSelected: boolean;
  isDetected: boolean;
}

// Service for handling SMS provider selection
class SmsProviderSelectionService {
  private selectedProviders: string[] = [];
  private isProviderSelectionComplete: boolean = false;
  private providers: SmsProvider[] = [];
  private smsStartDate: string | null = null;

  constructor() {
    // Initialize from localStorage if available
    const storedProviders = localStorage.getItem('selectedSmsProviders');
    if (storedProviders) {
      this.selectedProviders = JSON.parse(storedProviders);
    }
    
    this.isProviderSelectionComplete = localStorage.getItem('isProviderSelectionCompleted') === 'true';
    
    // Initialize providers list
    this.providers = this.getDefaultProviders();
    
    // Load start date if available
    this.smsStartDate = localStorage.getItem('smsStartDate');
  }

  // Get default providers list
  private getDefaultProviders(): SmsProvider[] {
    return [
      {
        id: 'bank-of-america',
        name: 'Bank of America',
        pattern: 'from BofA',
        isSelected: false,
        isDetected: false
      },
      {
        id: 'chase',
        name: 'Chase',
        pattern: 'Chase: A charge',
        isSelected: false,
        isDetected: false
      },
      {
        id: 'citibank',
        name: 'Citibank',
        pattern: 'Citi: Purchase',
        isSelected: false,
        isDetected: false
      },
      {
        id: 'wells-fargo',
        name: 'Wells Fargo',
        pattern: 'Wells Fargo: Purchase',
        isSelected: false,
        isDetected: false
      },
      {
        id: 'american-express',
        name: 'American Express',
        pattern: 'Amex: Charge',
        isSelected: false,
        isDetected: false
      },
      {
        id: 'capital-one',
        name: 'Capital One',
        pattern: 'Capital One: Transaction',
        isSelected: false,
        isDetected: false
      },
      {
        id: 'discover',
        name: 'Discover',
        pattern: 'Discover: Transaction',
        isSelected: false,
        isDetected: false
      }
    ];
  }

  // Get selected providers
  getSelectedProviders(): string[] {
    return this.selectedProviders;
  }

  // Get all SMS providers
  getSmsProviders(): SmsProvider[] {
    return this.providers;
  }

  // Save selected providers
  saveSelectedProviders(providers: string[]): void {
    this.selectedProviders = providers;
    localStorage.setItem('selectedSmsProviders', JSON.stringify(providers));
  }

  // Toggle provider selection
  toggleProviderSelection(providerId: string): SmsProvider[] {
    this.providers = this.providers.map(provider => {
      if (provider.id === providerId) {
        return {
          ...provider,
          isSelected: !provider.isSelected
        };
      }
      return provider;
    });
    
    // Update selectedProviders array
    this.selectedProviders = this.providers
      .filter(p => p.isSelected)
      .map(p => p.id);
    
    // Save to localStorage
    localStorage.setItem('selectedSmsProviders', JSON.stringify(this.selectedProviders));
    
    return this.providers;
  }

  // Mark provider selection as completed
  completeProviderSelection(isCompleted: boolean = true): void {
    this.isProviderSelectionComplete = isCompleted;
    localStorage.setItem('isProviderSelectionCompleted', isCompleted.toString());
  }

  // Check if provider selection is completed
  isProviderSelectionCompleted(): boolean {
    return this.isProviderSelectionComplete;
  }

  // Get the SMS start date
  getSmsStartDate(): string | null {
    return this.smsStartDate;
  }

  // Save the SMS start date
  saveSmsStartDate(date: string): void {
    this.smsStartDate = date;
    localStorage.setItem('smsStartDate', date);
  }

  // Simulates provider detection for demo purposes
  simulateProviderDetection(delayMs: number = 1500): SmsProvider[] {
    // Simulate finding common providers
    const detectedProviderIds = [
      'bank-of-america',
      'chase',
      'citibank',
      'wells-fargo',
      'american-express'
    ].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1);
    
    // Mark detected providers
    this.providers = this.providers.map(provider => ({
      ...provider,
      isDetected: detectedProviderIds.includes(provider.id),
      isSelected: provider.isSelected || detectedProviderIds.includes(provider.id)
    }));
    
    // Update selected providers
    this.selectedProviders = this.providers
      .filter(p => p.isSelected)
      .map(p => p.id);
    
    // Save to localStorage
    localStorage.setItem('selectedSmsProviders', JSON.stringify(this.selectedProviders));
    
    return this.providers;
  }

  // Simulate access to native SMS (would use Capacitor in real app)
  accessNativeSms(): Promise<boolean> {
    return new Promise((resolve) => {
      // Simulate permission request
      if (confirm('Allow this app to access your SMS messages?')) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  // Simulate detecting providers from messages
  detectProvidersFromMessages(messages: any[]): SmsProvider[] {
    // In a real implementation, this would analyze the messages
    // For now, just call simulateProviderDetection
    return this.simulateProviderDetection(2000);
  }
}

// Create singleton instance
export const smsProviderSelectionService = new SmsProviderSelectionService();

export default smsProviderSelectionService;
