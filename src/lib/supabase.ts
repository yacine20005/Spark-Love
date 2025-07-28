import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

// Types for Supabase
export type Database = {
  public: {
    Tables: {
      questions: {
        Row: {
          id: string;
          text: string;
          category: string;
          type: string;
          options?: string[];
          min_scale?: number;
          max_scale?: number;
          scale_labels?: {
            min: string;
            max: string;
          };
          is_active: boolean;
          release_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          text: string;
          category: string;
          type: string;
          options?: string[];
          min_scale?: number;
          max_scale?: number;
          scale_labels?: {
            min: string;
            max: string;
          };
          is_active?: boolean;
          release_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          text?: string;
          category?: string;
          type?: string;
          options?: string[];
          min_scale?: number;
          max_scale?: number;
          scale_labels?: {
            min: string;
            max: string;
          };
          is_active?: boolean;
          release_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_answers: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          answer: string | number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          answer: string | number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question_id?: string;
          answer?: string | number;
          created_at?: string;
        };
      };
      couple_profiles: {
        Row: {
          id: string;
          partner1_id: string;
          partner2_id: string;
          partner1_name: string;
          partner2_name: string;
          relationship_start_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          partner1_id: string;
          partner2_id: string;
          partner1_name: string;
          partner2_name: string;
          relationship_start_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          partner1_id?: string;
          partner2_id?: string;
          partner1_name?: string;
          partner2_name?: string;
          relationship_start_date?: string;
          created_at?: string;
          updated_at?: string;
        };
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

  // Save user answer
  static async saveAnswer(userId: string, questionId: string, answer: string | number) {
    const { data, error } = await supabase
      .from('user_answers')
      .upsert({
        user_id: userId,
        question_id: questionId,
        answer: answer,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving answer:', error);
      throw error;
    }

    return data;
  }

  // Get user answers for a question
  static async getUserAnswers(questionId: string) {
    const { data, error } = await supabase
      .from('user_answers')
      .select('*')
      .eq('question_id', questionId);

    if (error) {
      console.error('Error fetching user answers:', error);
      throw error;
    }

    return data;
  }

  // Create couple profile
  static async createCoupleProfile(profile: {
    partner1_id: string;
    partner2_id: string;
    partner1_name: string;
    partner2_name: string;
    relationship_start_date: string;
  }) {
    const { data, error } = await supabase
      .from('couple_profiles')
      .insert(profile)
      .select()
      .single();

    if (error) {
      console.error('Error creating couple profile:', error);
      throw error;
    }

    return data;
  }

  // Get couple profile
  static async getCoupleProfile(partner1Id: string, partner2Id: string) {
    const { data, error } = await supabase
      .from('couple_profiles')
      .select('*')
      .or(`partner1_id.eq.${partner1Id},partner2_id.eq.${partner1Id}`)
      .or(`partner1_id.eq.${partner2Id},partner2_id.eq.${partner2Id}`)
      .single();

    if (error) {
      console.error('Error fetching couple profile:', error);
      throw error;
    }

    return data;
  }
} 