import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import { QuizCategory } from '../types/quiz';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage adapter to match Supabase storage interface
const AsyncStorageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

// Types for Supabase - updated for new schema
export type Database = {
  public: {
    Tables: {
      questions: {
        Row: any; // Keeping it simple for now
      };
      couples: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string | null;
          linking_code: string | null;
        };
        Insert: {
          user1_id: string;
          linking_code: string;
        };
        Update: {
          user2_id?: string;
          linking_code?: string | null;
        };
      };
      user_answers: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          couple_id: string | null;
          answer: string;
        };
        Insert: {
          user_id: string;
          question_id: string;
          couple_id: string | null;
          answer: string;
        }[]; // Expect an array for upserting
      };
    };
    Functions: {
      create_couple_and_get_code: {
        Args: {};
        Returns: string;
      };
      link_partner: {
        Args: { p_linking_code: string };
        Returns: string; // couple_id
      };
      get_my_couples: {
        Args: {};
        Returns: Array<{ couple_id: string; partner_id: string; partner_email: string | null }>
      };
      reset_couple_quiz_answers: {
        Args: { p_couple_id: string; p_category: QuizCategory };
        Returns: number;
      };
      is_quiz_completed_by_both_partners: {
        Args: { p_couple_id: string; p_category: QuizCategory };
        Returns: boolean;
      };
    };
  };
};

console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Anon Key:', SUPABASE_ANON_KEY ? 'Loaded' : 'Not Loaded');

// Create Supabase client
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      // Persist session using AsyncStorage to avoid SecureStore size limits
      storage: AsyncStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
