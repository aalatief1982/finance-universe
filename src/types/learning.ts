
/**
 * Types for the local learning engine that improves message parsing
 */

import { TransactionType } from "./transaction";
import { SupportedCurrency } from "./locale";

/**
 * Represents a learned entry from a previously confirmed transaction
 */
export interface LearnedEntry {
  id: string;
  rawMessage: string;
  senderHint: string;
  confirmedFields: {
    type: TransactionType;
    amount: number;
    category: string;
    subcategory?: string;
    account: string;
    currency: SupportedCurrency;
    person?: string;
  };
  timestamp: string; // ISO date string
  tokens: string[]; // tokenized message for faster matching
  confidence?: number; // last matching confidence
}

/**
 * Configuration options for the learning engine
 */
export interface LearningEngineConfig {
  enabled: boolean;
  maxEntries: number;
  minConfidenceThreshold: number;
  saveAutomatically: boolean;
}

/**
 * Result of a match operation from the learning engine
 */
export interface MatchResult {
  entry: LearnedEntry | null;
  confidence: number;
  matched: boolean;
}
