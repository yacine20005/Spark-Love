import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useNavigation, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { GradientButton } from "../components/GradientButton";
import { GlassCard } from "../components/GlassCard";
import { RootStackParamList } from "../types/navigation";
import { QuizService } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useQuizStatus } from "../hooks/useQuizStatus";
import { COLORS, FONTS, SPACING, OPACITY } from "../constants";

type QuizCompletionScreenRouteProp = RouteProp<
  RootStackParamList,
  "QuizCompletionScreen"
>;

interface QuizCompletionScreenProps {
  route: QuizCompletionScreenRouteProp;
}

export const QuizCompletionScreen: React.FC<QuizCompletionScreenProps> = ({
  route,
}) => {
  const { category, answers, coupleId } = route.params;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user, activeCouple } = useAuth();
  const [saving, setSaving] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Use our hook to check quiz status
  const {
    loading: statusLoading,
    canCompare,
    bothCompleted,
    isCouple,
    refresh: refreshStatus,
  } = useQuizStatus(category, coupleId);

  useEffect(() => {
    // Answers have already been saved by useQuiz
    // We'll just update status to display the right interface
    console.log(
      "Quiz completion screen - answers already saved, updating status..."
    );

    setSaving(false);
    // Refresh status to get latest data
    refreshStatus();
  }, [user]); // Remove refreshStatus from dependencies to avoid loops

  const handleGoToComparison = () => {
    if (coupleId && canCompare) {
      navigation.replace("ComparisonScreen", {
        categoryId: category,
        coupleId: coupleId,
      });
    }
  };

  const handleReturnToQuiz = () => {
    navigation.navigate("MainTabNavigator");
  };

  const handleRetry = async () => {
    if (user) {
      setSaving(true);
      setSaveError(null);

      try {
        await QuizService.saveAnswers(
          answers.map((a) => ({
            ...a,
            user_id: user.id,
            couple_id: coupleId,
          }))
        );
        setSaving(false);
        refreshStatus();
      } catch (error) {
        console.error("Error retrying save:", error);
        setSaveError("Error saving answers. Please try again.");
        setSaving(false);
      }
    }
  };

  const handleRefreshStatus = () => {
    console.log("🔄 Manual status refresh...");
    refreshStatus();
  };

  const renderContent = () => {
    if (saving || statusLoading) {
      return (
        <GlassCard style={styles.card} opacity={OPACITY.glass}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={styles.loader}
          />
          <Text style={styles.title}>Saving in progress...</Text>
          <Text style={styles.subtitle}>We are saving your answers</Text>
        </GlassCard>
      );
    }

    if (saveError) {
      return (
        <GlassCard style={styles.card} opacity={OPACITY.glass}>
          <Text style={styles.title}>Save Error</Text>
          <Text style={styles.subtitle}>{saveError}</Text>
          <GradientButton
            title="Try Again"
            onPress={handleRetry}
            style={styles.button}
          />
          <GradientButton
            title="Back to Quizzes"
            onPress={handleReturnToQuiz}
            style={styles.secondaryButton}
          />
        </GlassCard>
      );
    }

    // Solo mode
    if (!isCouple) {
      return (
        <GlassCard style={styles.card} opacity={OPACITY.glass}>
          <Text style={styles.title}>Quiz Completed!</Text>
          <Text style={styles.subtitle}>
            Excellent work! You have completed this quiz in solo mode. Your
            answers have been saved.
          </Text>
          <GradientButton
            title="Back to Quizzes"
            onPress={handleReturnToQuiz}
            style={styles.button}
          />
        </GlassCard>
      );
    }

    // Couple mode - Quiz completed by both
    if (canCompare && bothCompleted) {
      return (
        <GlassCard style={styles.card} opacity={OPACITY.glass}>
          <Text style={styles.title}>Quiz Completed by Both!</Text>
          <Text style={styles.subtitle}>
            Perfect! You and your partner have both completed this
            quiz. You can now compare your answers!
          </Text>
          <GradientButton
            title="Compare Our Answers"
            onPress={handleGoToComparison}
            style={styles.button}
          />
          <GradientButton
            title="Back to Quizzes"
            onPress={handleReturnToQuiz}
            style={styles.secondaryButton}
          />
        </GlassCard>
      );
    }

    // Couple mode - Waiting for partner
    return (
      <GlassCard style={styles.card} opacity={OPACITY.glass}>
        <Text style={styles.title}>Waiting for Your Partner</Text>
        <Text style={styles.subtitle}>
          You have completed your part of the quiz!{" "}
          {activeCouple?.partner?.email || "Your partner"} must now
          answer the same questions. You will receive a notification when
          you can compare your answers.
        </Text>
        <GradientButton
          title="Check Status"
          onPress={handleRefreshStatus}
          style={styles.button}
        />
        <GradientButton
          title="Back to Quizzes"
          onPress={handleReturnToQuiz}
          style={styles.secondaryButton}
        />
      </GlassCard>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
  },
  card: {
    padding: SPACING.xl,
    alignItems: "center",
  },
  loader: {
    marginBottom: SPACING.lg,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  subtitle: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  button: {
    width: "100%",
    marginBottom: SPACING.md,
  },
  secondaryButton: {
    width: "100%",
    marginBottom: SPACING.md,
    opacity: 0.8,
  },
});
