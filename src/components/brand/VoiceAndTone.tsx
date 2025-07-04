import React from 'react';

// Standard voice and tone guidelines for Xpensia
export const VOICE_GUIDELINES = {
  // Error Messages
  errors: {
    validation: "Please check your input and try again.",
    network: "Unable to connect. Please check your connection and retry.",
    server: "Something went wrong on our end. Please try again in a moment.",
    notFound: "We couldn't find what you're looking for.",
    unauthorized: "Please sign in to continue.",
    forbidden: "You don't have permission to access this.",
    generic: "An unexpected error occurred. Please try again."
  },

  // Success Messages
  success: {
    save: "Successfully saved!",
    delete: "Successfully removed.",
    update: "Changes saved successfully.",
    create: "Created successfully!",
    import: "Import completed successfully.",
    export: "Export completed successfully."
  },

  // Help Text
  help: {
    amount: "Enter the transaction amount",
    category: "Choose a category that best describes this expense",
    date: "Select the date when this transaction occurred",
    description: "Add a brief description to help you remember this transaction",
    vendor: "Who did you pay or receive money from?",
    account: "Which account was used for this transaction?",
    notes: "Add any additional details or context"
  },

  // Loading States
  loading: {
    generic: "Loading...",
    saving: "Saving...",
    processing: "Processing...",
    importing: "Importing transactions...",
    analyzing: "Analyzing data...",
    uploading: "Uploading..."
  },

  // Empty States
  empty: {
    transactions: "No transactions yet. Start by adding your first expense!",
    search: "No transactions match your search.",
    filters: "No transactions match your current filters.",
    analytics: "Add some transactions to see your spending insights.",
    categories: "No categories found.",
    accounts: "No accounts configured yet."
  },

  // Confirmation Messages
  confirmations: {
    delete: "Are you sure you want to delete this transaction?",
    clear: "This will clear all your current filters. Continue?",
    reset: "This will reset all settings to default. Continue?",
    logout: "Are you sure you want to sign out?",
    import: "This will import all detected transactions. Continue?"
  },

  // Action Labels
  actions: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    create: "Create",
    update: "Update",
    remove: "Remove",
    clear: "Clear",
    reset: "Reset",
    search: "Search",
    filter: "Filter",
    import: "Import",
    export: "Export",
    upload: "Upload",
    download: "Download",
    retry: "Try Again",
    continue: "Continue",
    back: "Go Back",
    next: "Next",
    previous: "Previous",
    close: "Close",
    open: "Open"
  }
};

// Helper functions for consistent messaging
export const getErrorMessage = (type: keyof typeof VOICE_GUIDELINES.errors, context?: string) => {
  const baseMessage = VOICE_GUIDELINES.errors[type] || VOICE_GUIDELINES.errors.generic;
  return context ? `${baseMessage} ${context}` : baseMessage;
};

export const getSuccessMessage = (type: keyof typeof VOICE_GUIDELINES.success, context?: string) => {
  const baseMessage = VOICE_GUIDELINES.success[type] || "Operation completed successfully.";
  return context ? `${context} ${baseMessage.toLowerCase()}` : baseMessage;
};

export const getHelpText = (field: keyof typeof VOICE_GUIDELINES.help) => {
  return VOICE_GUIDELINES.help[field] || "";
};

export const getLoadingMessage = (type: keyof typeof VOICE_GUIDELINES.loading) => {
  return VOICE_GUIDELINES.loading[type] || VOICE_GUIDELINES.loading.generic;
};

export const getEmptyStateMessage = (type: keyof typeof VOICE_GUIDELINES.empty) => {
  return VOICE_GUIDELINES.empty[type] || "No items found.";
};

export const getConfirmationMessage = (type: keyof typeof VOICE_GUIDELINES.confirmations) => {
  return VOICE_GUIDELINES.confirmations[type] || "Are you sure?";
};

export const getActionLabel = (action: keyof typeof VOICE_GUIDELINES.actions) => {
  return VOICE_GUIDELINES.actions[action] || action;
};

// Component for displaying consistent help text
interface HelpTextProps {
  field: keyof typeof VOICE_GUIDELINES.help;
  className?: string;
}

export const HelpText: React.FC<HelpTextProps> = ({ field, className = "" }) => {
  return (
    <p className={`text-sm text-muted-foreground ${className}`}>
      {getHelpText(field)}
    </p>
  );
};

// Component for displaying error messages
interface ErrorTextProps {
  type: keyof typeof VOICE_GUIDELINES.errors;
  context?: string;
  className?: string;
}

export const ErrorText: React.FC<ErrorTextProps> = ({ type, context, className = "" }) => {
  return (
    <p className={`text-sm text-destructive ${className}`}>
      {getErrorMessage(type, context)}
    </p>
  );
};