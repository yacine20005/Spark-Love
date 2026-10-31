import { dayIndex } from './dates';

// One light prompt per day; both partners get the same one.
export const SPARK_PROMPTS: readonly string[] = [
  'What made you smile today?',
  'What is one small thing I did recently that you loved?',
  'Where would you teleport us right now?',
  'What song reminds you of us?',
  'What are you looking forward to this week?',
  'What is a memory of us you replay often?',
  'What should we do on our next free evening?',
  'What is something you are proud of lately?',
  'If today had a title, what would it be?',
  'What is one thing you want to learn together?',
  'What food would you cook for me tonight?',
  'What made you feel loved this week?',
  'What is a tiny habit of mine you secretly like?',
  'Describe our perfect lazy Sunday.',
  'What is something you have never told me?',
  'What is a place you want to show me?',
  'Which movie should we watch next and why?',
  'What would make tomorrow a good day for you?',
  'What is your favorite photo of us?',
  'What is one thing you would like more of from me?',
  'What did you dream about recently?',
  'What are three words that describe us?',
  'What is a goal you want us to reach this year?',
  'Who would play us in the movie of our life?',
  'What is something that stressed you today?',
  'What is your favorite thing about our home?',
  'What adventure should we plan next?',
  'What was the best part of your day?',
  'What is a compliment you never said out loud?',
  'What are you grateful for right now?',
];

export function sparkForDate(date = new Date()): string {
  return SPARK_PROMPTS[dayIndex(date) % SPARK_PROMPTS.length];
}
