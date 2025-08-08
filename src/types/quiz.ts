// Quiz Categories
export enum QuizCategory {
  COMMUNICATION = 'communication',
  VALUES = 'values',
  HOBBIES = 'hobbies',
  INTIMACY = 'intimacy',
  FAMILY = 'family',
  FUTURE = 'future',
  ACTIVITIES = 'activities',
  PHYSICAL = 'physical',
  DATES = 'dates',
  PERSONALITY = 'personality'
}

// Question Types
export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  SCALE = 'scale',
  TEXT = 'text',
  YES_NO = 'yes_no'
}

// Question Interface
export interface Question {
  id: string;
  text: string;
  category: QuizCategory;
  type: QuestionType;
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
}

// User Answer Interface
export interface UserAnswer {
  id: string;
  user_id: string;
  question_id: string;
  answer: string | number;
  created_at: string;
}

// Interface pour les réponses en cours de saisie (avant sauvegarde)
export interface Answer {
  question_id: string;
  answer: string | number;
  user_id?: string;
  couple_id?: string | null;
}

// Quiz Session Interface
export interface QuizSession {
  id: string;
  couple_id: string;
  partner1_id: string;
  partner2_id: string;
  category: QuizCategory;
  questions: string[]; // Question IDs
  partner1_answers: UserAnswer[];
  partner2_answers: UserAnswer[];
  is_completed: boolean;
  created_at: string;
  completed_at?: string;
}

// Couple Profile Interface
export interface CoupleProfile {
  id: string;
  partner1_id: string;
  partner2_id: string;
  partner1_name: string;
  partner2_name: string;
  relationship_start_date: string;
  created_at: string;
  updated_at: string;
}

// Quiz Progress Interface
export interface QuizProgress {
  couple_id: string;
  category: QuizCategory;
  questions_answered: number;
  total_questions: number;
  last_quiz_date: string;
  compatibility_score?: number;
} 