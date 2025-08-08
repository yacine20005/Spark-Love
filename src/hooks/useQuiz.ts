import { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { QuizCategory, Question, Answer } from "../types/quiz";
import { RootStackParamList } from "../types/navigation";
import { QuizService } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export const useQuiz = (category: QuizCategory) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user, activeCouple } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [textInput, setTextInput] = useState("");
  const [scaleValue, setScaleValue] = useState<number | undefined>();

  const question = questions[current];
  const isLast = current === questions.length - 1;

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const fetchedQuestions = await QuizService.getActiveQuestions(category);
        if (fetchedQuestions) {
          setQuestions(fetchedQuestions);
        }
      } catch (err) {
        setError("Failed to load questions. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [category]);

  useEffect(() => {
    if (question?.type === "scale") {
      setScaleValue(question.min_scale ?? 0);
    }
  }, [question]);

  const handleAnswer = async (answer: any) => {
    if (!user?.id) {
      console.error('User not authenticated');
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
      console.log('🎯 Quiz completed, saving answers...');
      
      try {
        await QuizService.saveAnswers(newAnswers.map(ans => ({
          question_id: ans.question_id,
          answer: ans.answer,
          user_id: ans.user_id!,
          couple_id: ans.couple_id || null,
        })));
        
        console.log('✅ Answers saved successfully');
      } catch (err) {
        console.error('❌ Error saving answers:', err);
      }
      
      // Navigate to completion screen with saved answers
      navigation.replace("QuizCompletionScreen", {
        category,
        answers: newAnswers,
        coupleId: activeCouple?.id || null,
      });
    }
  };

  const saveQuizAnswers = async (finalAnswers: Answer[]) => {
    try {
      // Sauvegarder toutes les réponses en une fois
      await QuizService.saveAnswers(finalAnswers.map(ans => ({
        question_id: ans.question_id,
        answer: ans.answer,
        user_id: ans.user_id!,
        couple_id: ans.couple_id || null,
      })));

      // Naviguer vers l'écran de completion
      navigation.replace("QuizCompletionScreen", {
        category,
        answers: finalAnswers,
        coupleId: activeCouple?.id || null,
      });
    } catch (err) {
      console.error('Error saving quiz answers:', err);
      // Même en cas d'erreur, on navigue quand même (on pourra retry plus tard)
      navigation.replace("QuizCompletionScreen", {
        category,
        answers: finalAnswers,
        coupleId: activeCouple?.id || null,
      });
    }
  };

  return {
    loading,
    error,
    questions,
    question,
    current,
    isLast,
    handleAnswer,
    textInput,
    setTextInput,
    scaleValue,
    setScaleValue,
    saveQuizAnswers,
  };
};