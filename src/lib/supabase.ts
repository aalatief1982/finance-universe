
import { createClient } from '@supabase/supabase-js';

// These environment variables will need to be set in your deployed environment
// For local development, you can hardcode them here, but don't commit the actual values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey;
};

// Database types
export type Tables = {
  users: {
    Row: {
      id: string;
      email: string | null;
      phone: string;
      phone_verified: boolean;
      full_name: string;
      gender: 'male' | 'female' | null;
      birth_date: string | null;
      avatar_url: string | null;
      occupation: string | null;
      sms_providers: string[];
      completed_onboarding: boolean;
      created_at: string;
      last_active: string;
    };
  };
  transactions: {
    Row: {
      id: string;
      user_id: string;
      title: string;
      amount: number;
      currency: string;
      date: string;
      category: string;
      notes: string | null;
      from_account: string | null;
      to_account: string | null;
      tags: string[] | null;
      created_at: string;
      updated_at: string;
      sms_source: string | null;
    };
  };
  categories: {
    Row: {
      id: string;
      user_id: string;
      name: string;
      parent_id: string | null;
      icon: string | null;
      color: string | null;
      description: string | null;
      budget: number | null;
      is_hidden: boolean;
      is_system: boolean;
      created_at: string;
      updated_at: string;
    };
  };
};
