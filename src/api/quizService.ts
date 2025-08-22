import { supabase } from '../lib/supabase';
import { Answer, QuizCategory, QuizProgress } from '../types/quiz';

export class QuizService {
  /**
   * Fetches all quiz categories and their associated active questions in one go.
   * This is the primary method to get all quiz-related data.
   */
  static async getQuizData(): Promise<QuizCategory[]> {
    const { data, error } = await supabase
      .from('quiz_categories')
      .select(`
        id,
        name,
        icon,
        color,
        description,
        questions (*)
      `)
      .eq('questions.is_active', true)
      .lte('questions.release_date', new Date().toISOString());

    if (error) {
      console.error('Error fetching quiz data:', error);
      throw error;
    }

    return data as QuizCategory[];
  }

  // Save an array of answers
  static async saveAnswers(answers: Answer[]) {

    // Convert answers to the correct format for database
    const formattedAnswers = answers.map(answer => ({
      user_id: answer.user_id,
      question_id: answer.question_id,
      couple_id: answer.couple_id, // null for solo mode, UUID for couple mode
      answer: typeof answer.answer === 'number' ? answer.answer.toString() : answer.answer
    }));

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

    return data;
  }

  // Get answers for comparison
  static async getComparisonAnswers(coupleId: string, categoryId: string) {
    const { data, error } = await supabase
      .from('user_answers')
      .select(`
        answer,
        user_id,
        question:questions!inner(*)
      `)
      .eq('couple_id', coupleId)
      .eq('questions.category_id', categoryId);

    if (error) {
      console.error('Error fetching comparison answers:', error);
      throw error;
    }

    return data;
  }

  /**
   * Calculates the quiz progress for all categories for a given user and context (solo or couple).
   */
  static async getQuizProgress(userId: string, coupleId: string | null, allCategories: QuizCategory[]): Promise<QuizProgress[]> {
    try {
      const progressPromises = allCategories.map(async (category) => {
        const totalQuestions = category.questions.length;

        if (totalQuestions === 0) {
          return {
            category_id: category.id,
            category_name: category.name,
            questions_answered: 0,
            total_questions: 0,
            last_quiz_date: '',
            couple_id: coupleId || '',
          };
        }

        const questionIds = category.questions.map(q => q.id);

        let answersQuery = supabase
          .from('user_answers')
          .select('question_id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .in('question_id', questionIds);

        if (coupleId === null) {
          answersQuery = answersQuery.is('couple_id', null);
        } else {
          answersQuery = answersQuery.eq('couple_id', coupleId);
        }

        const { count, error: answersError } = await answersQuery;

        if (answersError) {
          console.error(`Error getting answers for ${category.name}:`, answersError);
          // Return 0 progress for this category on error
          return {
            category_id: category.id,
            category_name: category.name,
            questions_answered: 0,
            total_questions: totalQuestions,
            last_quiz_date: '',
            couple_id: coupleId || '',
          };
        }

        return {
          category_id: category.id,
          category_name: category.name,
          questions_answered: count || 0,
          total_questions: totalQuestions,
          last_quiz_date: '', // Note: last_quiz_date logic might need to be implemented separately
          couple_id: coupleId || '',
        };
      });

      return Promise.all(progressPromises);

    } catch (error) {
      console.error('Error fetching quiz progress:', error);
      throw error;
    }
  }

  /**
   * Checks if a quiz for a specific category is completed by both partners of a couple.
   */
  static async isQuizCompletedByBothPartners(coupleId: string, categoryId: string) {
    try {
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
        .eq('category_id', categoryId)
        .eq('is_active', true);

      if (questionsError || !activeQuestions) {
        return false;
      }

      const totalQuestions = activeQuestions.length;
      if (totalQuestions === 0) return true;

      const questionIds = activeQuestions.map(q => q.id);

      const { data: answersRows, error: answersError } = await supabase
        .from('user_answers')
        .select('user_id, question_id')
        .eq('couple_id', coupleId)
        .in('question_id', questionIds)
        .in('user_id', [coupleData.user1_id, coupleData.user2_id]);

      if (answersError) return false;

      const user1Set = new Set(answersRows?.filter(r => r.user_id === coupleData.user1_id).map(r => r.question_id));
      const user2Set = new Set(answersRows?.filter(r => r.user_id === coupleData.user2_id).map(r => r.question_id));

      return user1Set.size === totalQuestions && user2Set.size === totalQuestions;
    } catch (error) {
      console.error('Error checking if quiz is completed by both partners:', error);
      return false;
    }
  }

  /**
   * Resets all answers for a given category and context (solo or couple).
   */
  static async resetQuizAnswers(categoryId: string, coupleId: string | null, userId: string) {
    try {
      const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('id')
        .eq('category_id', categoryId);

      if (qError) {
        console.error('Error fetching questions to reset:', qError);
        throw qError;
      }

      const questionIds = (questions || []).map(q => q.id);
      if (questionIds.length === 0) return { count: 0 };

      let query = supabase
        .from('user_answers')
        .delete()
        .in('question_id', questionIds);

      if (coupleId) {
        // For couples, delete all answers for that couple in the category
        query = query.eq('couple_id', coupleId);
      } else {
        // For solo, delete only the specific user's answers where couple_id is null
        query = query.eq('user_id', userId).is('couple_id', null);
      }

      const { count, error: dError } = await query.select('*', { count: 'exact', head: true });

      if (dError) {
        console.error('Error deleting answers:', dError);
        throw dError;
      }

      return { count: count || 0 };
    } catch (error) {
      console.error('Failed to reset quiz answers:', error);
      throw error;
    }
  }
}