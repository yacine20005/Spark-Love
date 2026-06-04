import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { GradientButton } from "../components/GradientButton";
import { GlassCard } from "../components/GlassCard";
import { useQuizSession } from "../hooks/useQuizSession";
import { useQuiz } from "../context/QuizContext";
import { useAuth } from "../context/AuthContext";
import { QuizService } from "../api/quizService";
import { COLORS, FONTS, SPACING, OPACITY, SHADOWS } from "../constants";

interface QuizQuestionsScreenProps {
  route: { params: { categoryId: string } };
}

export const QuizQuestionsScreen: React.FC<QuizQuestionsScreenProps> = ({
  route,
}: QuizQuestionsScreenProps) => {
  const { categoryId } = route.params;
  const navigation = useNavigation();
  const { activeCouple } = useAuth();
  const { loading: contextLoading, error: contextError } = useQuiz();
  
  const {
    category,
    questions,
    question,
    current,
    handleAnswer,
    textInput,
    setTextInput,
    scaleValue,
    setScaleValue,
  } = useQuizSession(categoryId);

  // Option selection state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [partnerAnswered, setPartnerAnswered] = useState<boolean>(false);
  const [checkingPartner, setCheckingPartner] = useState<boolean>(false);

  // Check if partner answered whenever question changes
  useEffect(() => {
    const checkPartnerStatus = async () => {
      if (activeCouple && question) {
        try {
          setCheckingPartner(true);
          const answered = await QuizService.hasPartnerAnsweredQuestion(
            activeCouple.id,
            activeCouple.partner.id,
            question.id
          );
          setPartnerAnswered(answered);
        } catch (e) {
          console.error("Error checking partner answer status:", e);
        } finally {
          setCheckingPartner(false);
        }
      } else {
        setPartnerAnswered(false);
      }
    };

    setSelectedOption(null); // Reset local selection for new question
    checkPartnerStatus();
  }, [question, activeCouple]);

  if (contextLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.progressText}>Loading questions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (contextError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.questionText}>{contextError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!question || !category) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={styles.centered}>
          <Text style={styles.questionText}>No questions in this category yet!</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate progress
  const progressPercent = questions.length > 0 ? ((current) / questions.length) * 100 : 0;

  const handleSubmitChoice = () => {
    if (selectedOption) {
      handleAnswer(selectedOption);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Top Header App Bar */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{category.name}</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Progress Bar Info */}
        <View style={styles.progressHeader}>
          <Text style={styles.progressCategoryText}>{category.name}</Text>
          <Text style={styles.progressCounterText}>
            Question {current + 1} of {questions.length}
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Question Text & Helper */}
          <View style={styles.questionSection}>
            <Text style={styles.questionText}>{question.text}</Text>
            <Text style={styles.questionHelperText}>
              Be open and honest. Your partner will see your answer once both of you complete the quiz.
            </Text>
          </View>

          {/* Partner Status Banner */}
          {activeCouple && !checkingPartner && partnerAnswered && (
            <View style={styles.partnerAnsweredBanner}>
              <View style={styles.partnerAvatarCircle}>
                <Text style={styles.partnerAvatarText}>
                  {(activeCouple.partner.first_name || "P").substring(0, 1).toUpperCase()}
                </Text>
                <View style={styles.lockBadge}>
                  <MaterialIcons name="lock" size={10} color="#ffffff" />
                </View>
              </View>
              <View style={styles.partnerBannerDetails}>
                <Text style={styles.partnerBannerTitle}>
                  {activeCouple.partner.first_name || "Partner"} answered
                </Text>
                <Text style={styles.partnerBannerSubtitle}>
                  Waiting for you to complete to reveal!
                </Text>
              </View>
            </View>
          )}

          {/* Question Options Input Area */}
          <View style={styles.optionsArea}>
            
            {/* Multiple Choice Options */}
            {question.type === "multiple_choice" && question.options && (
              <View style={styles.choicesContainer}>
                {(question.options as string[]).map((opt: string, idx: number) => {
                  const isSelected = selectedOption === opt;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.choiceCard,
                        isSelected && styles.choiceCardSelected,
                      ]}
                      onPress={() => setSelectedOption(opt)}
                      activeOpacity={0.8}
                    >
                      <View style={[
                        styles.choiceIconWrapper,
                        isSelected && styles.choiceIconWrapperSelected,
                      ]}>
                        <MaterialIcons
                          name="chat-bubble-outline"
                          size={20}
                          color={isSelected ? "#ffffff" : COLORS.secondary}
                        />
                      </View>
                      <Text style={[
                        styles.choiceText,
                        isSelected && styles.choiceTextSelected,
                      ]}>
                        {opt}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkmarkWrapper}>
                          <MaterialIcons name="check" size={14} color="#ffffff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}

                <View style={styles.submitContainer}>
                  <TouchableOpacity
                    style={[styles.submitButton, !selectedOption && styles.submitButtonDisabled]}
                    onPress={handleSubmitChoice}
                    disabled={!selectedOption}
                  >
                    <Text style={styles.submitButtonText}>Lock in Answer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Yes/No Options */}
            {question.type === "yes_no" && (
              <View style={styles.yesNoContainer}>
                <View style={styles.yesNoRow}>
                  {["Yes", "No"].map((opt) => {
                    const isSelected = selectedOption === opt;
                    const isYes = opt === "Yes";
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.yesNoCard,
                          isSelected && styles.choiceCardSelected,
                        ]}
                        onPress={() => setSelectedOption(opt)}
                        activeOpacity={0.8}
                      >
                        <MaterialIcons
                          name={isYes ? "check-circle-outline" : "highlight-off"}
                          size={32}
                          color={isSelected ? COLORS.primary : COLORS.textSecondary}
                        />
                        <Text style={[
                          styles.yesNoText,
                          isSelected && styles.choiceTextSelected,
                        ]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.submitContainer}>
                  <TouchableOpacity
                    style={[styles.submitButton, !selectedOption && styles.submitButtonDisabled]}
                    onPress={handleSubmitChoice}
                    disabled={!selectedOption}
                  >
                    <Text style={styles.submitButtonText}>Lock in Answer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Scale Options */}
            {question.type === "scale" && (
              <View style={styles.scaleContainer}>
                <View style={styles.sliderWrapper}>
                  <Text style={styles.sliderValueText}>{scaleValue}</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={question.min_scale ?? 0}
                    maximumValue={question.max_scale ?? 10}
                    step={1}
                    value={scaleValue}
                    onValueChange={setScaleValue}
                    minimumTrackTintColor={COLORS.primary}
                    maximumTrackTintColor={COLORS.surfaceContainer}
                    thumbTintColor={COLORS.primary}
                  />
                  <View style={styles.scaleLabelsRow}>
                    <Text style={styles.scaleLabelText}>
                      {question.scale_labels?.min || "Min"}
                    </Text>
                    <Text style={styles.scaleLabelText}>
                      {question.scale_labels?.max || "Max"}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => handleAnswer(scaleValue)}
                >
                  <Text style={styles.submitButtonText}>Lock in Answer</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Text Option */}
            {question.type === "text" && (
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Type your answer here..."
                  placeholderTextColor={COLORS.textTertiary}
                  value={textInput}
                  onChangeText={setTextInput}
                  multiline
                  numberOfLines={4}
                />
                <TouchableOpacity
                  style={[styles.submitButton, !textInput.trim() && styles.submitButtonDisabled]}
                  onPress={() => textInput.trim() && handleAnswer(textInput.trim())}
                  disabled={!textInput.trim()}
                >
                  <Text style={styles.submitButtonText}>Lock in Answer</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  header: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainer,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 48,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  headerPlaceholder: {
    width: 32,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.md,
    marginBottom: 6,
  },
  progressCategoryText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 12,
    color: COLORS.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  progressCounterText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 9999,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 9999,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  questionSection: {
    marginVertical: SPACING.md,
  },
  questionText: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 26,
    color: COLORS.textPrimary,
    lineHeight: 34,
    marginBottom: SPACING.sm,
  },
  questionHelperText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  partnerAnsweredBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    marginBottom: SPACING.lg,
  },
  partnerAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffb8f8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
    position: "relative",
  },
  partnerAvatarText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    color: COLORS.secondary,
  },
  lockBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.surfaceContainerLow,
  },
  partnerBannerDetails: {
    flex: 1,
  },
  partnerBannerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  partnerBannerSubtitle: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  optionsArea: {
    marginTop: SPACING.xs,
  },
  choicesContainer: {
    gap: SPACING.md,
  },
  choiceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: "transparent",
    ...SHADOWS.light,
  },
  choiceCardSelected: {
    borderColor: "#ff6b6b",
    backgroundColor: "#ffdad8",
  },
  choiceIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  choiceIconWrapperSelected: {
    backgroundColor: COLORS.primary,
  },
  choiceText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
  },
  choiceTextSelected: {
    color: COLORS.textPrimary,
  },
  checkmarkWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  yesNoContainer: {
    gap: SPACING.xl,
  },
  yesNoRow: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  yesNoCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: SPACING.xl,
    borderWidth: 2,
    borderColor: "transparent",
    ...SHADOWS.light,
    gap: SPACING.sm,
  },
  yesNoText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  scaleContainer: {
    gap: SPACING.xl,
  },
  sliderWrapper: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: "center",
    ...SHADOWS.light,
  },
  sliderValueText: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 48,
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  scaleLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
    marginTop: SPACING.xs,
  },
  scaleLabelText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  textInputContainer: {
    gap: SPACING.lg,
  },
  textInput: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: SPACING.lg,
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 16,
    color: COLORS.textPrimary,
    minHeight: 120,
    textAlignVertical: "top",
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  submitContainer: {
    marginTop: SPACING.md,
  },
  submitButton: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: "center",
    ...SHADOWS.light,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 16,
    color: "#ffffff",
  },
  progressText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
});
