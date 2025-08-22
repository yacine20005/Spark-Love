import { useState, useEffect, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Answer } from "../types/quiz";
import { RootStackParamList } from "../types/navigation";
import { QuizService } from "../api/quizService";
import { useAuth } from "../context/AuthContext";
import { useQuiz } from "../context/QuizContext"; // The main context

/**
 * Manages the state of a single, active quiz session.
 */
export const useQuizSession = (categoryId: string) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user, activeCouple } = useAuth();
  const { categories, loading: contextLoading, error: contextError } = useQuiz();

  // Find the specific category and its questions from the context
  const category = useMemo(() => categories.find(c => c.id === categoryId), [categories, categoryId]);
  const questions = useMemo(() => category?.questions || [], [category]);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [textInput, setTextInput] = useState("");
  const [scaleValue, setScaleValue] = useState<number | undefined>();

  const question = questions[current];
  const isLast = current === questions.length - 1;

  useEffect(() => {
    if (question?.type === "scale") {
      setScaleValue(question.min_scale ?? 0);
    }
  }, [question]);

  const handleAnswer = async (answer: any) => {
    if (!user?.id || !question) {
      console.error('User not authenticated or question not found');
      return;
    }

    const newAnswer: Answer = {
      question_id: question.id,
      answer,
      user_id: user.id,
      couple_id: activeCouple?.id || null,
    };

    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);
    setTextInput("");

    if (!isLast) {
      setCurrent((c) => c + 1);
    } else {
      // Quiz completed - save all answers
      try {
        await QuizService.saveAnswers(newAnswers);
      } catch (err) {
        console.error('❌ Error saving answers:', err);
        // Optionally, handle this error in the UI
      }

      // Navigate to completion screen
      navigation.replace("QuizCompletionScreen", {
        categoryId: categoryId,
        answers: newAnswers,
        coupleId: activeCouple?.id || null,
      });
    }
  };

  return {
    // Loading and error are now derived from the context
    loading: contextLoading,
    error: contextError,
    category,
    questions,
    question,
    current,
    isLast,
    handleAnswer,
    textInput,
    setTextInput,
    scaleValue,
    setScaleValue,
  };
};