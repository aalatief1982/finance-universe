
// Service for handling SMS provider selection
class SmsProviderSelectionService {
  private selectedProviders: string[] = [];
  private isProviderSelectionComplete: boolean = false;

  constructor() {
    // Initialize from localStorage if available
    const storedProviders = localStorage.getItem('selectedSmsProviders');
    if (storedProviders) {
      this.selectedProviders = JSON.parse(storedProviders);
    }
    
    this.isProviderSelectionComplete = localStorage.getItem('isProviderSelectionCompleted') === 'true';
  }

  // Get selected providers
  getSelectedProviders(): string[] {
    return this.selectedProviders;
  }

  // Save selected providers
  saveSelectedProviders(providers: string[]): void {
    this.selectedProviders = providers;
    localStorage.setItem('selectedSmsProviders', JSON.stringify(providers));
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

  // Simulates provider detection for demo purposes
  simulateProviderDetection(delayMs: number = 1500): Promise<string[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate finding common providers
        const detectedProviders = [
          'Bank of America',
          'Chase',
          'Citibank',
          'Wells Fargo',
          'American Express'
        ].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1);
        
        resolve(detectedProviders);
      }, delayMs);
    });
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
  detectProvidersFromMessages(): Promise<string[]> {
    return this.simulateProviderDetection(2000);
  }
}

// Create singleton instance
export const smsProviderSelectionService = new SmsProviderSelectionService();

export default smsProviderSelectionService;
