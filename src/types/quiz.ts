export type QuestionType = 'multiple_choice' | 'scale' | 'text' | 'yes_no';

export interface Question {
  id: string;
  text: string;
  category_id: string;
  type: QuestionType;
  options: string[] | null;
  min_scale: number | null;
  max_scale: number | null;
  scale_labels: { min: string; max: string } | null;
  is_active: boolean;
  release_date: string;
  created_at: string;
  updated_at: string;
}

export interface QuizCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  questions: Question[];
  created_at: string;
}

export interface Answer {
  id?: string;
  user_id: string;
  question_id: string;
  couple_id: string | null;
  answer: string | number;
  created_at?: string;
}

export interface QuizProgress {
  category_id: string;
  category_name: string;
  questions_answered: number;
  total_questions: number;
  last_quiz_date: string;
  couple_id: string;
}
