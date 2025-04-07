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
      console.log('Detecting providers from real SMS messages...');
      
      // Get the stored start date if available
      const startDate = this.getSmsStartDate();
      
      // Get real SMS messages from the device
      const messages = await nativeSmsService.readSmsMessages(startDate || undefined);
      console.log(`Retrieved ${messages.length} messages for provider detection`);
      
      if (messages.length === 0) {
        console.log('No SMS messages found on device for detection');
        return this.getAllProviders();
      }
      
      // Analyze message senders to detect potential financial institutions
      const detectedProviders = this.analyzeMessagesForProviders(messages);
      console.log('Detected providers:', detectedProviders);
      
      // Update the existing provider list with detected providers
      const currentProviders = this.getAllProviders();
      const updatedProviders = this.updateProvidersWithDetections(currentProviders, detectedProviders);
      
      // Save the updated providers
      this.saveProviders(updatedProviders);
      
      return updatedProviders;
    } catch (error) {
      console.error('Error detecting providers from real messages:', error);
      return this.getAllProviders();
    }
  }
  
  // Analyze real SMS messages to detect financial institution providers
  private analyzeMessagesForProviders(messages: SmsMessage[]): SmsProvider[] {
    // Track unique senders and their frequencies
    const senderFrequency: Record<string, number> = {};
    
    // Keep track of message bodies for pattern analysis
    const messageBodies: Record<string, string[]> = {};
    
    // Process all messages to identify potential financial senders
    messages.forEach(message => {
      const sender = message.address;
      senderFrequency[sender] = (senderFrequency[sender] || 0) + 1;
      
      if (!messageBodies[sender]) {
        messageBodies[sender] = [];
      }
      
      // Store message body for pattern analysis (limit to first 3 messages per sender)
      if (messageBodies[sender].length < 3) {
        messageBodies[sender].push(message.body);
      }
    });
    
    // Financial keywords to detect in messages
    const financialKeywords = [
      'bank', 'credit', 'debit', 'transaction', 'transfer', 'payment', 'deposit', 'withdraw',
      'account', 'balance', 'card', 'atm', 'purchase', 'statement', 'bill', 'paid', 'due',
      'بنك', 'ائتمان', 'خصم', 'معاملة', 'تحويل', 'دفع', 'إيداع', 'سحب', 'حساب', 'رصيد', 'بطاقة',
      'صراف', 'شراء', 'كشف حساب', 'فاتورة'
    ];
    
    // Analyze message content to identify financial senders
    const detectedProviders: SmsProvider[] = [];
    
    // First check frequent senders (3+ messages) and analyze their content
    Object.entries(senderFrequency)
      .filter(([_, count]) => count >= 2) // Senders with 2+ messages
      .forEach(([sender, count]) => {
        const bodies = messageBodies[sender] || [];
        
        // Check if any bodies contain financial keywords
        const hasFinancialContent = bodies.some(body => 
          financialKeywords.some(keyword => 
            body.toLowerCase().includes(keyword.toLowerCase())
          )
        );
        
        if (hasFinancialContent) {
          // Extract patterns from the message bodies
          const patterns = this.extractPatternsFromMessages(bodies);
          
          // Clean up the sender name
          const cleanSender = this.cleanupSenderName(sender);
          
          detectedProviders.push({
            id: `detected-${sender.replace(/[^a-z0-9]/gi, '')}`,
            name: cleanSender,
            patterns: patterns,
            enabled: false,
            isSelected: false,
            isDetected: true
          });
        }
      });
    
    return detectedProviders;
  }
  
  // Extract common patterns from message bodies
  private extractPatternsFromMessages(bodies: string[]): string[] {
    const patterns: string[] = [];
    
    // Common financial message patterns to look for
    const patternKeywords = [
      'transaction', 'purchase', 'payment', 'transfer', 'withdrawn', 'deposited',
      'balance', 'spent', 'received', 'credited', 'debited', 'account',
      'معاملة', 'شراء', 'دفع', 'تحويل', 'سحب', 'إيداع', 'رصيد', 'إنفاق', 'استلام'
    ];
    
    // Extract unique words from the bodies that match our pattern keywords
    bodies.forEach(body => {
      const words = body.split(/\s+/).map(w => w.toLowerCase());
      
      patternKeywords.forEach(keyword => {
        if (words.some(word => word.includes(keyword.toLowerCase())) && !patterns.includes(keyword)) {
          patterns.push(keyword);
        }
      });
    });
    
    // If no specific patterns found, use a generic one based on the first body
    if (patterns.length === 0 && bodies.length > 0) {
      // Take the first few words of the first message as a pattern
      const firstMessageWords = bodies[0].split(/\s+/).slice(0, 3).join(' ');
      if (firstMessageWords) {
        patterns.push(firstMessageWords);
      }
    }
    
    // Ensure we have at least one pattern
    if (patterns.length === 0) {
      patterns.push('transaction alert');
    }
    
    return patterns;
  }
  
  // Clean up sender name for display
  private cleanupSenderName(sender: string): string {
    // If it's a numeric sender (phone number), make it more readable
    if (/^\+?\d+$/.test(sender)) {
      return `SMS ${sender.slice(-6)}`;
    }
    
    // Remove common prefixes
    let cleanName = sender
      .replace(/^sms from |^msg from |^alert from |^alert: /i, '')
      .trim();
    
    // Capitalize first letter of each word
    cleanName = cleanName.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return cleanName;
  }
  
  // Update existing providers list with newly detected providers
  private updateProvidersWithDetections(
    existingProviders: SmsProvider[],
    detectedProviders: SmsProvider[]
  ): SmsProvider[] {
    // First mark all existing providers as not detected
    const resetProviders = existingProviders.map(provider => ({
      ...provider,
      isDetected: false
    }));
    
    // For each detected provider, check if it matches an existing one
    for (const detected of detectedProviders) {
      let matchFound = false;
      
      for (const existing of resetProviders) {
        // Check if names or patterns match
        const nameMatch = existing.name.toLowerCase().includes(detected.name.toLowerCase()) ||
                          detected.name.toLowerCase().includes(existing.name.toLowerCase());
        
        const patternMatch = existing.patterns.some(p1 => 
          detected.patterns.some(p2 => 
            p1.toLowerCase().includes(p2.toLowerCase()) || 
            p2.toLowerCase().includes(p1.toLowerCase())
          )
        );
        
        if (nameMatch || patternMatch) {
          existing.isDetected = true;
          matchFound = true;
          break;
        }
      }
      
      // If no match found, add the new detected provider
      if (!matchFound) {
        resetProviders.push(detected);
      }
    }
    
    return resetProviders;
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
