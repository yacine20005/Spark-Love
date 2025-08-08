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
  QUESTIONS_PER_QUIZ: 10,
  DAILY_QUIZ_LIMIT: 3,
  WEEKLY_QUESTION_RELEASE: 10,
  COMPATIBILITY_THRESHOLD: 70,
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

// Sample Questions for Development
export const SAMPLE_QUESTIONS = [
  {
    text: "How do you prefer to spend a quiet evening together?",
    category: QuizCategory.ACTIVITIES,
    type: 'multiple_choice',
    options: ["Cuddling and watching TV", "Cooking together", "Reading books", "Playing games"],
  },
  {
    text: "On a scale of 1-10, how important is physical touch in our relationship?",
    category: QuizCategory.INTIMACY,
    type: 'scale',
    min_scale: 1,
    max_scale: 10,
    scale_labels: { min: "Not important", max: "Very important" },
  },
  {
    text: "What's your biggest fear about our future together?",
    category: QuizCategory.FUTURE,
    type: 'text',
  },
  {
    text: "Do you want to have children in the future?",
    category: QuizCategory.FAMILY,
    type: 'yes_no',
  },
]; 