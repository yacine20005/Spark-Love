import type { Database, Tables } from './database.types';

export type Profile = Tables<'profiles'>;
export type Couple = Tables<'couples'>;
export type Category = Tables<'quiz_categories'>;
export type Question = Tables<'questions'>;
export type SwipeItem = Tables<'swipe_items'>;
export type JournalEntry = Tables<'journal_entries'>;
export type SwipeKind = Database['public']['Enums']['swipe_kind'];
export type JournalKind = Database['public']['Enums']['journal_kind'];
export type QuizProgress = Database['public']['Functions']['quiz_progress']['Returns'][number];
export type ComparedAnswer = Database['public']['Functions']['compare_category']['Returns'][number];
