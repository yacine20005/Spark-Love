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
  static async saveAnswers(answers: Array<{
    question_id: string;
    answer: string | number;
    user_id: string;
    couple_id: string | null;
  }>) {
    console.log(`💾 Saving ${answers.length} answers...`);
    console.log(`📝 Mode: ${answers[0]?.couple_id ? 'Couple' : 'Solo'}`);
    
    // Convert answers to the correct format for database
    const formattedAnswers = answers.map(answer => ({
      user_id: answer.user_id,
      question_id: answer.question_id,
      couple_id: answer.couple_id, // null for solo mode, UUID for couple mode
      answer: typeof answer.answer === 'number' ? answer.answer.toString() : answer.answer
    }));

    console.log('📋 Formatted answers:', formattedAnswers.map(a => ({
      question_id: a.question_id.substring(0, 8) + '...',
      couple_id: a.couple_id ? a.couple_id.substring(0, 8) + '...' : 'null (solo)',
      answer: a.answer
    })));

    const { data, error } = await supabase
      .from('user_answers')
      .upsert(formattedAnswers, {
        onConflict: 'user_id,question_id,couple_id',
      })
      .select();

    if (error) {
      console.error('❌ Error saving answers:', error);
      throw error;
    }

    console.log(`✅ ${data?.length || 0} answers saved successfully`);
    return data;
  }

  // Get answers for comparison
  static async getComparisonAnswers(coupleId: string, categoryId: QuizCategory) {
    // Direct client query (requires RLS disabled or permissive policy)
    const { data, error } = await supabase
      .from('user_answers')
      .select(`
        answer,
        user_id,
        question:questions (*)
      `)
      .eq('couple_id', coupleId)
      .eq('question.category', categoryId)
      .eq('question.is_active', true)
      .lte('question.release_date', new Date().toISOString());

    if (error) {
      console.error('Error fetching comparison answers:', error);
      throw error;
    }

    return data;
  }

  // Get quiz progress for a user in a specific context (couple or solo)
  static async getQuizProgress(userId: string, coupleId: string | null) {
    try {
      // Get all available categories
      const categories = Object.values(QuizCategory);
      const progress: Record<QuizCategory, number> = {} as Record<QuizCategory, number>;

      // For each category, calculate progression percentage
      for (const category of categories) {
        // Get IDs of active questions for this category
        const { data: activeQuestions, error: questionsError } = await supabase
          .from('questions')
          .select('id')
          .eq('category', category)
          .eq('is_active', true)
          .lte('release_date', new Date().toISOString());

        if (questionsError) {
          console.error(`Error fetching questions for ${category}:`, questionsError);
          progress[category] = 0;
          continue;
        }

        const totalQuestions = activeQuestions?.length || 0;

        if (totalQuestions === 0) {
          progress[category] = 0;
          continue;
        }

        // Extract question IDs
        const questionIds = activeQuestions.map(q => q.id);

        // Count questions answered by this user for this context
        let answersQuery = supabase
          .from('user_answers')
          .select('question_id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .in('question_id', questionIds);

        // Handle couple_id null differently to avoid Supabase errors
        if (coupleId === null) {
          answersQuery = answersQuery.is('couple_id', null);
        } else {
          answersQuery = answersQuery.eq('couple_id', coupleId);
        }

        const { count: answersCount, error: answersError } = await answersQuery;

        if (answersError) {
          // If error, assume 0 answers rather than failing
          console.error(`Error getting answers for ${category}:`, answersError);
          progress[category] = 0;
        } else {
          const percentage = totalQuestions > 0 
            ? Math.round(((answersCount || 0) / totalQuestions) * 100)
            : 0;
          progress[category] = percentage;
        }
      }

      return progress;
    } catch (error) {
      console.error('Error fetching quiz progress:', error);
      throw error;
    }
  }

  // Check if a quiz is completed by both partners of a couple
  static async isQuizCompletedByBothPartners(coupleId: string, category: QuizCategory) {
    try {
      // Client-side check (requires visibility on partner answers)
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('user1_id, user2_id')
        .eq('id', coupleId)
        .single();

      if (coupleError || !coupleData || !coupleData.user2_id) {
        return false; // Couple doesn't exist or is not complete
      }

      const { data: activeQuestions, error: questionsError } = await supabase
        .from('questions')
        .select('id')
        .eq('category', category)
        .eq('is_active', true)
        .lte('release_date', new Date().toISOString());

      if (questionsError || !activeQuestions) {
        return false;
      }

      const questionIds = activeQuestions.map(q => q.id);
      const totalQuestions = questionIds.length;

      if (totalQuestions === 0) {
        return true; // No questions = completed
      }

      const { data: answersRows, error: answersError } = await supabase
        .from('user_answers')
        .select('user_id, question_id')
        .eq('couple_id', coupleId)
        .in('question_id', questionIds)
        .in('user_id', [coupleData.user1_id, coupleData.user2_id]);

      if (answersError) {
        return false;
      }

      const user1Set = new Set<string>();
      const user2Set = new Set<string>();
      for (const row of answersRows || []) {
        if (row.user_id === coupleData.user1_id) user1Set.add(row.question_id as string);
        if (row.user_id === coupleData.user2_id && typeof row.question_id === 'string' && row.question_id) {
          user2Set.add(row.question_id);
        }
      }

      return user1Set.size === totalQuestions && user2Set.size === totalQuestions;
    } catch (error) {
      console.error('Error checking if quiz is completed by both partners:', error);
      return false;
    }
  }

  // Get answers from a specific user for a category and context
  static async getUserAnswersForCategory(userId: string, coupleId: string | null, category: QuizCategory) {
    try {
      const { data, error } = await supabase
        .from('user_answers')
        .select(`
          *,
          question:questions (*)
        `)
        .eq('user_id', userId)
        .eq('couple_id', coupleId)
        .eq('question.category', category);

      if (error) {
        console.error('Error fetching user answers:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user answers for category:', error);
      throw error;
    }
  }

  // Diagnostic function to check basic data
  static async getDiagnosticInfo() {
    try {
      // Compter le total de questions
      const { count: totalQuestions, error: totalError } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

      // Compter les questions actives
      const { count: activeQuestions, error: activeError } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Compter par catégorie
      const categoryBreakdown: Record<string, number> = {};
      const categories = Object.values(QuizCategory);
      
      for (const category of categories) {
        const { count, error } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('category', category)
          .eq('is_active', true);
        
        if (!error) {
          categoryBreakdown[category] = count || 0;
        }
      }

      // Test des réponses utilisateur
      const { count: totalAnswers, error: answersError } = await supabase
        .from('user_answers')
        .select('*', { count: 'exact', head: true });

      return {
        totalQuestions: totalQuestions || 0,
        activeQuestions: activeQuestions || 0,
        totalUserAnswers: totalAnswers || 0,
        categoryBreakdown,
        errors: {
          totalError: totalError?.message,
          activeError: activeError?.message,
          answersError: answersError?.message
        }
      };
    } catch (error) {
      console.error('Error getting diagnostic info:', error);
      return null;
    }
  }

  // Version simplifiée pour debugger le problème
  static async getSimpleQuizProgress(userId: string, coupleId: string | null) {
    try {
      const progress: Record<QuizCategory, number> = {} as Record<QuizCategory, number>;
      const categories = Object.values(QuizCategory);

      console.log('🔍 Starting simple diagnostic - userId:', userId, 'coupleId:', coupleId);

      for (const category of categories) {
        try {
          // Test simple: compter toutes les questions pour cette catégorie
          const { data: questions, error: qError } = await supabase
            .from('questions')
            .select('id')
            .eq('category', category)
            .eq('is_active', true);

          if (qError) {
            console.log(`❌ Erreur questions ${category}:`, qError);
            progress[category] = 0;
            continue;
          }

          const totalQuestions = questions?.length || 0;
          console.log(`📊 ${category}: ${totalQuestions} questions found`);

          if (totalQuestions === 0) {
            progress[category] = 0;
            continue;
          }

          // Test simple: compter les réponses spécifiquement pour cette catégorie
          const questionIds = questions.map(q => q.id);
          
          let answersQuery = supabase
            .from('user_answers')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .in('question_id', questionIds);

          if (coupleId === null) {
            answersQuery = answersQuery.is('couple_id', null);
          } else {
            answersQuery = answersQuery.eq('couple_id', coupleId);
          }

          const { count: categoryAnswers, error: aError } = await answersQuery;

          if (aError) {
            console.log(`❌ Error answers ${category}:`, aError);
            progress[category] = 0;
            continue;
          }

          console.log(`📋 ${category}: ${categoryAnswers || 0} answers found for this category`);
          
          // Calculer le pourcentage réel
          const percentage = totalQuestions > 0 
            ? Math.round(((categoryAnswers || 0) / totalQuestions) * 100)
            : 0;
          
          progress[category] = percentage;

        } catch (err) {
          console.log(`💥 Exception ${category}:`, err);
          progress[category] = 0;
        }
      }

      console.log('🎯 Calculated progress:', progress);
      return progress;

    } catch (error) {
      console.error('💥 Erreur globale:', error);
      throw error;
    }
  }

  // Reset answers for a given category and context
  // - Couple mode: call secure RPC to delete all answers for BOTH partners where couple_id matches
  // - Solo mode: delete only current user's answers where couple_id IS NULL
  static async resetQuizAnswers(category: QuizCategory, coupleId: string | null, userId: string) {
    try {
      if (coupleId) {
        // Direct delete for couple mode (security disabled)
        const { data: questions, error: qError } = await supabase
          .from('questions')
          .select('id')
          .eq('category', category);

        if (qError) {
          console.error('Error fetching questions to reset (couple):', qError);
          throw qError;
        }

        const questionIds = (questions || []).map(q => q.id);
        if (questionIds.length === 0) return { deleted: 0 };

        const { data: delData, error: dError } = await supabase
          .from('user_answers')
          .delete()
          .in('question_id', questionIds)
          .eq('couple_id', coupleId)
          .select();

        if (dError) {
          console.error('Error deleting couple answers:', dError);
          throw dError;
        }

        const count = delData?.length || 0;
        console.log(`🗑️ Couple reset for ${category}. Deleted: ${count}`);
        return { deleted: count };
      }

      // Solo mode path: delete only this user's answers for the category where couple_id IS NULL
      const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('id')
        .eq('category', category);

      if (qError) {
        console.error('Error fetching questions to reset (solo):', qError);
        throw qError;
      }

      const questionIds = (questions || []).map(q => q.id);
      if (questionIds.length === 0) return { deleted: 0 };

      const { data: delData, error: dError } = await supabase
        .from('user_answers')
        .delete()
        .in('question_id', questionIds)
        .eq('user_id', userId)
        .is('couple_id', null)
        .select();

      if (dError) {
        console.error('Error deleting solo answers:', dError);
        throw dError;
      }

      const count = delData?.length || 0;
      console.log(`🗑️ Solo reset for ${category}. Deleted: ${count}`);
      return { deleted: count };
    } catch (error) {
      console.error('Failed to reset quiz answers:', error);
      throw error;
    }
  }
}