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
import { QuizService } from "../api/quizService";
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

  // Emoji d'en-tête harmonisé avec Auth/NameSetup selon l'état
  const headerEmoji = saving || statusLoading
    ? "🔄"
    : saveError
      ? "⚠️"
      : !isCouple
        ? "🎉"
        : canCompare && bothCompleted
          ? "💕"
          : "⏳";

  const renderContent = () => {
    if (saving || statusLoading) {
      return (
        <GlassCard style={styles.card} opacity={OPACITY.glass}>
          <View style={styles.statusChipLoading}>
            <Text style={styles.statusChipText}>Saving</Text>
          </View>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={styles.loader}
          />
          <Text style={styles.title}>Saving your progress…</Text>
          <Text style={styles.subtitle}>Please wait while we save your answers.</Text>
        </GlassCard>
      );
    }

    if (saveError) {
      return (
        <GlassCard style={styles.card} opacity={OPACITY.glass}>
          <View style={styles.statusChipError}>
            <Text style={styles.statusChipText}>Error</Text>
          </View>
          <Text style={styles.title}>Save error</Text>
          <Text style={styles.subtitle}>{saveError}</Text>
          <View style={styles.actions}>
            <GradientButton
              title="Try again"
              onPress={handleRetry}
              style={styles.button}
            />
            <GradientButton
              title="Back to quizzes"
              onPress={handleReturnToQuiz}
              style={styles.secondaryButton}
            />
          </View>
        </GlassCard>
      );
    }

    // Solo mode
    if (!isCouple) {
      return (
        <GlassCard style={styles.card} opacity={OPACITY.glass}>
          <Text style={styles.title}>Quiz completed</Text>
          <Text style={styles.subtitle}>
            Great job! You completed this quiz in solo mode. Your answers are saved.
          </Text>
          <View style={styles.actions}>
            <GradientButton
              title="Back to quizzes"
              onPress={handleReturnToQuiz}
              style={styles.button}
            />
          </View>
        </GlassCard>
      );
    }

    // Couple mode - Quiz completed by both
    if (canCompare && bothCompleted) {
      return (
        <GlassCard style={styles.card} opacity={OPACITY.glass}>
          <View style={styles.statusChipSuccess}>
            <Text style={styles.statusChipText}>Ready</Text>
          </View>
          <Text style={styles.title}>Both completed</Text>
          <Text style={styles.subtitle}>
            Perfect! You and your partner finished this quiz. Compare your answers now.
          </Text>
          <View style={styles.actions}>
            <GradientButton
              title="Compare our answers"
              onPress={handleGoToComparison}
              style={styles.button}

            />
            <GradientButton
              title="Back to quizzes"
              onPress={handleReturnToQuiz}
              style={styles.secondaryButton}
            />
          </View>
        </GlassCard>
      );
    }

    // Couple mode - Waiting for partner
    return (
      <GlassCard style={styles.card} opacity={OPACITY.glass}>
        <View style={styles.statusChipInfo}>
          <Text style={styles.statusChipText}>Pending</Text>
        </View>
        <Text style={styles.title}>Waiting for your partner</Text>
        <Text style={styles.subtitle}>
          You finished your part. {activeCouple?.partner?.first_name || "Your partner"} still needs to answer. We’ll notify you when it’s ready.
        </Text>
        <View style={styles.actions}>
          <GradientButton
            title="Refresh status"
            onPress={handleRefreshStatus}
            style={styles.button}
          />
          <GradientButton
            title="Back to quizzes"
            onPress={handleReturnToQuiz}
            style={styles.secondaryButton}
          />
        </View>
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
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>{headerEmoji}</Text>
        </View>
        {renderContent()}
      </View>
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
  header: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  icon: {
    fontSize: 80,
    marginBottom: SPACING.sm,
  },
  card: {
    padding: SPACING.xl,
    alignItems: "center",
    width: "100%",
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
  actions: {
    width: "100%",
    alignItems: "center",
    maxWidth: 420,
    alignSelf: "center",
  },
  button: {
    width: "100%",
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  secondaryButton: {
    width: "100%",
    marginBottom: SPACING.md,
    opacity: 0.9,
  },
  statusChipBase: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 999,
    marginBottom: SPACING.md,
  },
  statusChipText: {
    ...FONTS.caption,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  statusChipSuccess: {
    backgroundColor: "rgba(46, 204, 113, 0.25)",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 999,
    marginBottom: SPACING.md,
  },
  statusChipError: {
    backgroundColor: "rgba(231, 76, 60, 0.25)",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 999,
    marginBottom: SPACING.md,
  },
  statusChipInfo: {
    backgroundColor: "rgba(52, 152, 219, 0.25)",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 999,
    marginBottom: SPACING.md,
  },
  statusChipLoading: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 999,
    marginBottom: SPACING.md,
  },
});
