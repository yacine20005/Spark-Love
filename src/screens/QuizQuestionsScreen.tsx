import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientButton } from "../components/GradientButton";
import { GlassCard } from "../components/GlassCard";
import { QuizCategory, QuestionType } from "../types/quiz";
import { SAMPLE_QUESTIONS } from "../constants/quiz";
import { COLORS, FONTS, SPACING, OPACITY } from "../constants";

interface QuizQuestionsScreenProps {
  route: { params: { category: QuizCategory } };
}

export const QuizQuestionsScreen: React.FC<QuizQuestionsScreenProps> = ({
  route,
}) => {
  const { category } = route.params;
  const insets = useSafeAreaInsets();
  const questions = SAMPLE_QUESTIONS.filter((q) => q.category === category);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [textInput, setTextInput] = useState("");

  const question = questions[current];
  const isLast = current === questions.length - 1;

  const handleAnswer = (answer: any) => {
    setAnswers((prev) => [...prev, answer]);
    setTextInput("");
    if (!isLast) {
      setCurrent((c) => c + 1);
    }
    // TODO: handle finish (show summary or send to backend)
  };

  if (!question) {
    // Fin du quiz ou aucune question
    if (questions.length > 0 && answers.length === questions.length) {
      // Toutes les questions ont été répondues
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
              Bravo ! Vous avez terminé la série 🎉
            </Text>
            <Text style={styles.progressText}>
              Vous avez répondu à toutes les questions.
            </Text>
            {/* Affichage du récapitulatif des réponses */}
            <View style={{ marginVertical: 24, width: "100%" }}>
              {questions.map((q, i) => (
                <View key={i} style={{ marginBottom: 12 }}>
                  <Text style={[styles.progressText, { fontWeight: "bold" }]}>
                    {q.text}
                  </Text>
                  <Text style={styles.progressText}>
                    Votre réponse : {answers[i]?.toString()}
                  </Text>
                </View>
              ))}
            </View>
            {/* TODO: bouton pour revenir à l'accueil ou partager */}
          </View>
        </SafeAreaView>
      );
    }
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
                  placeholder="Votre réponse..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={textInput}
                  onChangeText={setTextInput}
                  multiline
                />
              </View>
              <GradientButton
                title="Valider la réponse"
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
