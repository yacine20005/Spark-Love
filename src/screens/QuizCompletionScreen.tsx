import React, { useEffect } from "react";
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
import { useAuth } from "../context/AuthContext";
import { useQuiz } from "../context/QuizContext"; // The new context
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
  const { categoryId, coupleId } = route.params;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { activeCouple, user } = useAuth();
  const { loading, error, progress, refreshQuizData, categories } = useQuiz();

  // Refresh the progress data when entering this screen
  useEffect(() => {
    refreshQuizData();
  }, []);

  const category = categories.find(c => c.id === categoryId);
  const categoryProgress = progress.find(p => p.category_id === categoryId);

  const handleGoToComparison = () => {
    if (coupleId) {
      navigation.replace("QuizComparisonScreen", {
        categoryId: categoryId,
        coupleId: coupleId,
      });
    }
  };

  const handleReturnToQuiz = () => {
    navigation.navigate("MainTabNavigator", { screen: 'Quiz' });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <GlassCard style={styles.card} opacity={OPACITY.glass}>
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          <Text style={styles.title}>Loading status...</Text>
        </GlassCard>
      );
    }

    if (error || !category || !categoryProgress) {
      return (
        <GlassCard style={styles.card} opacity={OPACITY.glass}>
          <Text style={styles.title}>Error</Text>
          <Text style={styles.subtitle}>{error || "Could not load quiz status."}</Text>
          <GradientButton title="Back to Quizzes" onPress={handleReturnToQuiz} style={styles.button} />
        </GlassCard>
      );
    }

    const isCouple = !!activeCouple;
    if (!isCouple) {
      return (
        <GlassCard style={styles.card} opacity={OPACITY.glass}>
          <Text style={styles.icon}>🎉</Text>
          <Text style={styles.title}>Quiz Completed!</Text>
          <Text style={styles.subtitle}>Great job! You completed this quiz in solo mode. Your answers are saved.</Text>
          <GradientButton title="Back to Quizzes" onPress={handleReturnToQuiz} style={styles.button} />
        </GlassCard>
      );
    }

    // In couple mode, we need to check the partner's progress.
    // This logic assumes the `progress` object from the context is up-to-date for both users,
    // which might require a more advanced real-time setup (e.g., Supabase subscriptions)
    // For now, we rely on the refreshed data.
    const bothCompleted = false; // This needs to be properly determined, perhaps via a dedicated API call or context update

    if (bothCompleted) {
       return (
        <GlassCard style={styles.card} opacity={OPACITY.glass}>
          <Text style={styles.icon}>💕</Text>
          <Text style={styles.title}>You Both Finished!</Text>
          <Text style={styles.subtitle}>Perfect! You and your partner have both completed the {category.name} quiz. Ready to see how you compare?</Text>
          <GradientButton title="Compare Answers" onPress={handleGoToComparison} style={styles.button} />
          <GradientButton title="Later" onPress={handleReturnToQuiz} style={styles.secondaryButton} />
        </GlassCard>
      );
    }

    return (
      <GlassCard style={styles.card} opacity={OPACITY.glass}>
        <Text style={styles.icon}>⏳</Text>
        <Text style={styles.title}>Waiting for Partner</Text>
        <Text style={styles.subtitle}>You've completed the {category.name} quiz! We'll let you know when {activeCouple?.partner.first_name || 'your partner'} finishes.</Text>
        <GradientButton title="Refresh Status" onPress={refreshQuizData} style={styles.button} />
        <GradientButton title="Back to Quizzes" onPress={handleReturnToQuiz} style={styles.secondaryButton} />
      </GlassCard>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.content}>
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
