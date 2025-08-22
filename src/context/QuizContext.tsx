import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { QuizService } from '../api/quizService';
import { QuizCategory, QuizProgress } from '../types/quiz';
import { useAuth } from './AuthContext';

// Define the shape of the context
interface QuizContextType {
  categories: QuizCategory[];
  progress: QuizProgress[];
  loading: boolean;
  error: string | null;
  refreshQuizData: () => void;
}

// Create the context
const QuizContext = createContext<QuizContextType | undefined>(undefined);

// Create the provider component
export const QuizProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, activeCouple } = useAuth();
  const [categories, setCategories] = useState<QuizCategory[]>([]);
  const [progress, setProgress] = useState<QuizProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return; // No user, no data to fetch
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch all categories and their questions
      const fetchedCategories = await QuizService.getQuizData();
      setCategories(fetchedCategories);

      // 2. Fetch user's progress for all these categories
      const effectiveCoupleId = activeCouple?.id ?? null;
      const fetchedProgress = await QuizService.getQuizProgress(user.id, effectiveCoupleId, fetchedCategories);
      setProgress(fetchedProgress);

    } catch (err) {
      console.error('Failed to fetch quiz data:', err);
      setError('Could not load quiz information. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user, activeCouple]);

  useEffect(() => {
    fetchQuizData();
  }, [fetchQuizData]);

  const refreshQuizData = fetchQuizData;

  return (
    <QuizContext.Provider
      value={{
        categories,
        progress,
        loading,
        error,
        refreshQuizData,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

// Create a custom hook to use the context
export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
