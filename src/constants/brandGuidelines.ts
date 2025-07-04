// Xpensia Brand Guidelines
export const BRAND_GUIDELINES = {
  // Brand Identity
  name: 'Xpensia',
  tagline: 'Smart Expense Tracking for Modern Life',
  mission: 'Simplify personal finance management through intelligent automation and beautiful design',

  // Voice & Tone
  voice: {
    primary: 'Friendly and approachable',
    secondary: 'Professional yet conversational',
    avoid: ['Technical jargon without explanation', 'Overwhelming complexity', 'Cold or robotic language']
  },

  // Messaging Guidelines
  messaging: {
    errorMessages: {
      tone: 'Helpful and reassuring',
      structure: 'Problem + Solution + Next Steps',
      examples: {
        validation: 'Please check the amount field. Valid amounts should be positive numbers.',
        network: 'Connection issue detected. Your data is saved locally and will sync when reconnected.',
        permission: 'SMS permission is needed to automatically track your transactions. Grant permission to continue.'
      }
    },
    successMessages: {
      tone: 'Celebratory but not overwhelming',
      examples: {
        save: 'Transaction saved successfully!',
        import: 'All SMS messages processed. {count} new transactions added.',
        setup: 'Great! Your account is now set up and ready to use.'
      }
    },
    helpText: {
      tone: 'Clear and concise',
      examples: {
        category: 'Choose the category that best describes this expense',
        smartPaste: 'Paste your bank SMS or transaction text to automatically extract details',
        currency: 'Select your primary currency for displaying amounts'
      }
    }
  },

  // Color Psychology
  colorMeaning: {
    primary: 'Trust, reliability, financial security',
    secondary: 'Energy, enthusiasm, action',
    success: 'Achievement, positive outcomes, income',
    warning: 'Caution, requires attention',
    destructive: 'Expenses, deletion, errors',
    info: 'Information, transfers, neutral actions'
  },

  // Typography Scale
  typography: {
    hierarchy: {
      h1: 'text-3xl font-bold', // Page titles
      h2: 'text-2xl font-semibold', // Section headers
      h3: 'text-xl font-medium', // Subsection headers
      h4: 'text-lg font-medium', // Card titles
      body: 'text-base', // Regular text
      small: 'text-sm', // Helper text
      tiny: 'text-xs' // Labels and captions
    },
    weights: {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold'
    }
  },

  // Component Standards
  components: {
    buttons: {
      primary: 'Main actions, form submissions',
      secondary: 'Alternative actions, cancel operations',
      outline: 'Less important actions, toggles',
      ghost: 'Subtle actions, icon buttons'
    },
    cards: {
      elevation: 'Use shadows sparingly for important content',
      spacing: 'Consistent padding using --card-padding variable',
      borders: 'Subtle borders using semantic border colors'
    },
    forms: {
      validation: 'Real-time feedback with clear error messages',
      layout: 'Logical grouping with consistent spacing',
      accessibility: 'Proper labels, ARIA attributes, keyboard navigation'
    }
  }
} as const;

// Utility functions for consistent messaging
export const getBrandMessage = (type: keyof typeof BRAND_GUIDELINES.messaging, key: string): string => {
  const messages = BRAND_GUIDELINES.messaging[type];
  return (messages as any).examples?.[key] || `${type} message for ${key}`;
};

export const getBrandClass = (element: keyof typeof BRAND_GUIDELINES.typography.hierarchy): string => {
  return BRAND_GUIDELINES.typography.hierarchy[element];
};