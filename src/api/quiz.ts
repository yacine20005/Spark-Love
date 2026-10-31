import { supabase } from '../lib/supabase';
import { unwrap } from './unwrap';

export const fetchCategories = async () =>
  unwrap(await supabase.from('quiz_categories').select('*').order('sort_order'));

export const fetchProgress = async () => unwrap(await supabase.rpc('quiz_progress'));

export const fetchQuestions = async (categoryId: string) =>
  unwrap(
    await supabase.from('questions').select('*').eq('category_id', categoryId).eq('is_active', true).order('sort_order'),
  );

/** My own answers for a category, keyed by question id (RLS only returns mine). */
export async function fetchMyAnswers(questionIds: string[]): Promise<Record<string, string>> {
  const rows = unwrap(await supabase.from('answers').select('question_id, answer').in('question_id', questionIds));
  return Object.fromEntries(rows.map((r) => [r.question_id, r.answer]));
}

export async function saveAnswer(coupleId: string, userId: string, questionId: string, answer: string) {
  unwrap(
    await supabase
      .from('answers')
      .upsert({ couple_id: coupleId, user_id: userId, question_id: questionId, answer, created_at: new Date().toISOString() }),
  );
}

export async function resetMyAnswers(questionIds: string[]) {
  unwrap(await supabase.from('answers').delete().in('question_id', questionIds));
}

export const compareCategory = async (categoryId: string) =>
  unwrap(await supabase.rpc('compare_category', { p_category_id: categoryId }));
