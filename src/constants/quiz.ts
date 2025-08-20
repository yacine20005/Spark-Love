import { QuizCategory } from '../types/quiz';
import { COLORS, GRADIENTS } from './colors';

// Quiz Categories Configuration
export const QUIZ_CATEGORIES = {
  [QuizCategory.COMMUNICATION]: {
    name: 'Communication',
    icon: '💬',
    color: COLORS.primary,
    gradient: GRADIENTS.love,
    description: 'Improve how you talk and listen to each other',
  },
  [QuizCategory.VALUES]: {
    name: 'Values',
    icon: '💎',
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#A78BFA'],
    description: 'Discover what matters most to both of you',
  },
  [QuizCategory.HOBBIES]: {
    name: 'Hobbies',
    icon: '🎨',
    color: '#10B981',
    gradient: ['#10B981', '#34D399'],
    description: 'Find activities you both enjoy',
  },
  [QuizCategory.INTIMACY]: {
    name: 'Intimacy',
    icon: '💕',
    color: '#EC4899',
    gradient: ['#EC4899', '#F472B6'],
    description: 'Deepen your emotional and physical connection',
  },
  [QuizCategory.FAMILY]: {
    name: 'Family',
    icon: '👨‍👩‍👧‍👦',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#FBBF24'],
    description: 'Explore your family values and future plans',
  },
  [QuizCategory.FUTURE]: {
    name: 'Future',
    icon: '🔮',
    color: '#6366F1',
    gradient: ['#6366F1', '#818CF8'],
    description: 'Plan and dream about your future together',
  },
  [QuizCategory.ACTIVITIES]: {
    name: 'Activities',
    icon: '🎯',
    color: '#EF4444',
    gradient: ['#EF4444', '#F87171'],
    description: 'Discover fun things to do together',
  },
  [QuizCategory.PHYSICAL]: {
    name: 'Physical',
    icon: '💪',
    color: '#06B6D4',
    gradient: ['#06B6D4', '#22D3EE'],
    description: 'Explore physical activities and preferences',
  },
  [QuizCategory.DATES]: {
    name: 'Dates',
    icon: '🍷',
    color: '#8B5A2B',
    gradient: ['#8B5A2B', '#A0522D'],
    description: 'Plan perfect date nights together',
  },
  [QuizCategory.PERSONALITY]: {
    name: 'Personality',
    icon: '🌟',
    color: '#F97316',
    gradient: ['#F97316', '#FB923C'],
    description: 'Learn more about each other\'s personalities',
  },
};

// Quiz Settings
export const QUIZ_SETTINGS = {
  QUESTIONS_PER_QUIZ: 10
};

// Question Types Configuration
export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: {
    name: 'Multiple Choice',
    icon: '📝',
  },
  SCALE: {
    name: 'Scale',
    icon: '📊',
  },
  TEXT: {
    name: 'Text',
    icon: '✏️',
  },
  YES_NO: {
    name: 'Yes/No',
    icon: '✅',
  },
};