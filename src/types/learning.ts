
/**
 * Types for the local learning engine that improves message parsing
 */

import { TransactionType } from "./transaction";
import { SupportedCurrency } from "./locale";
import { SmartPasteTemplate as Template } from "./template";

/**
 * Enhanced token structure with position information
 */
export interface PositionedToken {
  token: string;
  position: number;
  context?: {
    before?: string[];
    after?: string[];
  };
}

/**
 * Record of confirmation events
 */
export interface ConfirmationEvent {
  timestamp: string;
  source: 'auto' | 'user-explicit' | 'system' | 'system-migration';
  confidence?: number;
}

/**
 * Represents a learned entry from a previously confirmed transaction
 */
export interface LearnedEntry {
  id: string;
  rawMessage: string;
  senderHint: string;
  templateHash?: string;
  structureSignature?: string; // optional, coming in Step 5
  senderMatchCount?: number; // optional, inferred during learning
  confirmedFields: {
    type: TransactionType;
    amount: number;
    category: string;
    subcategory?: string;
    account: string;
    currency: SupportedCurrency;
    person?: string;
    vendor?: string;
  };
  tokens: string[]; // tokenized message for faster matching
  fieldTokenMap: {
    amount: PositionedToken[];
    currency: PositionedToken[];
    vendor: PositionedToken[];
    account: PositionedToken[];
    date: PositionedToken[]; // Adding date field explicitly
    title?: PositionedToken[]; // Optional fields
    type?: PositionedToken[];
  };
  timestamp: string; // ISO date string
  confidence?: number; // last matching confidence
  userConfirmed: boolean; // Flag to indicate if this entry was confirmed by user
  confirmationHistory?: ConfirmationEvent[]; // History of confirmations
}

/**
 * Configuration options for the learning engine
 */
export interface LearningEngineConfig {
  enabled: boolean;
  maxEntries: number;
  minConfidenceThreshold: number;
  saveAutomatically: boolean;
  validationRequired?: boolean; // Added: validate transaction data before learning
  userConfirmationWeight?: number; // Added: weight for user confirmations in scoring
}

/**
 * Result of a match operation from the learning engine
 */
export interface MatchResult {
  entry: LearnedEntry | null;
  confidence: number;
  matched: boolean;
  shouldTrain?: boolean;
  fallbackTemplate?: Template; // Added to support template fallback
}
