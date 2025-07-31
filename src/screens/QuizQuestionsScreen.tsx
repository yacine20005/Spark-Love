import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { GradientButton } from "../components/GradientButton";
import { GlassCard } from "../components/GlassCard";
import { QuizCategory, Question } from "../types/quiz";
import { RootStackParamList } from '../types/navigation';
import { QuizService } from "../lib/supabase";
import { COLORS, FONTS, SPACING, OPACITY } from "../constants";

interface QuizQuestionsScreenProps {
  route: { params: { category: QuizCategory } };
}

export const QuizQuestionsScreen: React.FC<QuizQuestionsScreenProps> = ({
  route,
}) => {
  const { category } = route.params;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [textInput, setTextInput] = useState("");

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const fetchedQuestions = await QuizService.getActiveQuestions(category);
        if (fetchedQuestions) {
          // @ts-ignore
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

  const question = questions[current];
  const isLast = current === questions.length - 1;

  const handleAnswer = (answer: any) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    setTextInput("");
    if (!isLast) {
      setCurrent((c) => c + 1);
    } else {
      navigation.replace('QuizCompletionScreen', { category, answers: newAnswers });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.progressText}>Loading questions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.questionText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!question) {
    // Pas de questions dans cette catégorie
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <View style={styles.backgroundGradient} />
        <View style={styles.centered}>
          <Text style={styles.questionText}>
            No questions in this category yet!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.backgroundGradient} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <GlassCard style={styles.questionCard} opacity={OPACITY.glass}>
          <Text style={styles.questionText}>{question.text}</Text>
          {question.type === "multiple_choice" && question.options && (
            <View style={styles.optionsContainer}>
              {question.options.map((opt, idx) => (
                <GradientButton
                  key={idx}
                  title={opt}
                  onPress={() => handleAnswer(opt)}
                  style={styles.optionButton}
                />
              ))}
            </View>
          )}
          {question.type === "scale" && (
            <View style={styles.optionsContainer}>
              {[
                ...Array(
                  (question.max_scale || 10) - (question.min_scale || 1) + 1
                ),
              ].map((_, i) => {
                const val = (question.min_scale || 1) + i;
                return (
                  <GradientButton
                    key={val}
                    title={val.toString()}
                    onPress={() => handleAnswer(val)}
                    style={styles.optionButton}
                  />
                );
              })}
              <View style={styles.scaleLabels}>
                <Text style={styles.scaleLabel}>
                  {question.scale_labels?.min}
                </Text>
                <Text style={styles.scaleLabel}>
                  {question.scale_labels?.max}
                </Text>
              </View>
            </View>
          )}
          {question.type === "yes_no" && (
            <View style={styles.optionsContainer}>
              <GradientButton
                title="Yes"
                onPress={() => handleAnswer("yes")}
                style={styles.optionButton}
              />
              <GradientButton
                title="No"
                onPress={() => handleAnswer("no")}
                style={styles.optionButton}
              />
            </View>
          )}
          {question.type === "text" && (
            <View style={styles.optionsContainer}>
              <View style={{ marginBottom: 12 }}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Your answer..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={textInput}
                  onChangeText={setTextInput}
                  multiline
                />
              </View>
              <GradientButton
                title="Submit Answer"
                onPress={() =>
                  textInput.trim() && handleAnswer(textInput.trim())
                }
                style={styles.optionButton}
                disabled={!textInput.trim()}
              />
            </View>
          )}
        </GlassCard>
        <Text style={styles.progressText}>
          Question {current + 1} / {questions.length}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

import { TextInput } from "react-native";
const styles = StyleSheet.create({
  textInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    borderRadius: 10,
    padding: 10,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  questionCard: {
    marginBottom: SPACING.xl,
  },
  questionText: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    textAlign: "center",
  },
  optionsContainer: {
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  optionButton: {
    marginBottom: SPACING.sm,
  },
  scaleLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.sm,
  },
  scaleLabel: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  progressText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.md,
  },
});
