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

  const handleAnswer = (answer: any) => {
    const newAnswer: Answer = {
      question_id: question.id,
      answer,
      user_id: user?.id,
      couple_id: activeCouple?.id || null,
    };

    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);
    setTextInput("");

    if (!isLast) {
      setCurrent((c) => c + 1);
    } else {
      navigation.replace("QuizCompletionScreen", {
        category,
        answers: newAnswers,
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
  };
};