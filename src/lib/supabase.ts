
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env';

// Create a single supabase client for interacting with your database
// Use default placeholder values for development to prevent crashes
const supabaseUrl = SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
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
