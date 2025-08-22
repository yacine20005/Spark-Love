import { useState, useEffect, useCallback } from "react";
import { QuizCategory } from "../types/quiz";
import { QuizService } from "../api/quizService";
import { useAuth } from "../context/AuthContext";

/**
 * Hook to manage quiz completion status
 * Useful to know if a quiz can be started, is in progress, or is ready for comparison
 */
export const useQuizStatus = (category: QuizCategory, coupleId?: string | null) => {
  const { user, activeCouple } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState(0);
  const [partnerProgress, setPartnerProgress] = useState(0);
  const [bothCompleted, setBothCompleted] = useState(false);
  const [canCompare, setCanCompare] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const effectiveCoupleId = coupleId ?? activeCouple?.id ?? null;

  const checkQuizStatus = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {

      if (effectiveCoupleId) {
        // Couple mode: check both partners
        const progress = await QuizService.getQuizProgress(user.id, effectiveCoupleId);
        setUserProgress(progress[category] || 0);

        // Check if both partners have completed the quiz
        const completed = await QuizService.isQuizCompletedByBothPartners(effectiveCoupleId, category);
        setBothCompleted(completed);
        setCanCompare(completed);

        // For partner progress, we can make an estimation
        // (we could improve this later with more precise data)
        if (completed) {
          setPartnerProgress(100);
        } else {
          setPartnerProgress(0); // We don't know exact partner progress for now
        }
      } else {
        // Solo mode: only user counts
        const progress = await QuizService.getQuizProgress(user.id, null);
        setUserProgress(progress[category] || 0);
        setPartnerProgress(0);
        setBothCompleted(progress[category] === 100);
        setCanCompare(false); // No comparison in solo mode
      }
    } catch (err) {
      console.error('Error checking quiz status:', err);
      setError('Unable to check quiz status');
    } finally {
      setLoading(false);
    }
  }, [user, effectiveCoupleId, category, refreshKey]);

  useEffect(() => {
    checkQuizStatus();
  }, [checkQuizStatus]);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return {
    loading,
    error,
    userProgress,
    partnerProgress,
    bothCompleted,
    canCompare,
    isCouple: !!effectiveCoupleId,
    isSolo: !effectiveCoupleId,
    refresh,
  };
};
