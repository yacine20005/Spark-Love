import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import { QuizCategory } from '../types/quiz';

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
    };
  };
};

// Create Supabase client
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Quiz Service
export class QuizService {
  // Get active questions by category
  static async getActiveQuestions(category: string) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .lte('release_date', new Date().toISOString())
      .order('release_date', { ascending: true });

    if (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }

    return data;
  }

  // Save an array of answers
  static async saveAnswers(answers: Database['public']['Tables']['user_answers']['Insert']) {
    const { data, error } = await supabase
      .from('user_answers')
      .upsert(answers, {
        onConflict: 'user_id,question_id,couple_id',
      })
      .select();

    if (error) {
      console.error('Error saving answers:', error);
      throw error;
    }

    return data;
  }

  // Get answers for comparison
  static async getComparisonAnswers(coupleId: string, categoryId: QuizCategory) {
    const { data, error } = await supabase
      .from('user_answers')
      .select(`
        answer,
        user_id,
        question:questions (*)
      `)
      .eq('couple_id', coupleId)
      .eq('question.category', categoryId);

    if (error) {
      console.error('Error fetching comparison answers:', error);
      throw error;
    }

    return data;
  }
} 