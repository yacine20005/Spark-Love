import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { GradientButton } from "../components/GradientButton";
import { GlassCard } from "../components/GlassCard";
import { RootStackParamList } from "../types/navigation";
import { useAuth } from "../context/AuthContext";
import { useQuiz } from "../context/QuizContext"; // The new context
import { QuizService } from "../api/quizService";
import { QuizCategory, QuizProgress } from "../types/quiz";
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
}: QuizCompletionScreenProps) => {
  const { categoryId, coupleId } = route.params;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { activeCouple, user } = useAuth();
  const { categories, loading, error, progress, refreshQuizData } = useQuiz();

  const [bothCompleted, setBothCompleted] = useState(false);
  const [checkingCompletion, setCheckingCompletion] = useState(true);

  // Refresh the progress data when entering this screen
  useEffect(() => {
    refreshQuizData();
  }, []);

  // Fetch whether the quiz is completed by both partners
  useEffect(() => {
    const checkCompletion = async () => {
      if (coupleId && categoryId) {
        try {
          setCheckingCompletion(true);
          const completed = await QuizService.isQuizCompletedByBothPartners(coupleId, categoryId);
          setBothCompleted(completed);
        } catch (err) {
          console.error("Error checking dual completion:", err);
        } finally {
          setCheckingCompletion(false);
        }
      } else {
        setCheckingCompletion(false);
      }
    };

    checkCompletion();
  }, [coupleId, categoryId, progress]);

  const category = categories.find((c: QuizCategory) => c.id === categoryId);
  const categoryProgress = progress.find((p: QuizProgress) => p.category_id === categoryId);

  const handleGoToComparison = () => {
    if (coupleId && category) {
      navigation.replace("ComparisonScreen", {
        categoryId: category.id,
        coupleId: coupleId,
      });
    }
  };

  const handleReturnToQuiz = () => {
    navigation.navigate("MainTabNavigator", { screen: 'Quiz' });
  };

  const renderContent = () => {
    if (loading || checkingCompletion) {
      return (
        <GlassCard style={styles.card} opacity={OPACITY.glass}>
          <View style={styles.cardContentWrapper}>
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
            <Text style={styles.title}>Loading status...</Text>
          </View>
        </GlassCard>
      );
    }

    if (error || !category || !categoryProgress) {
      return (
        <GlassCard style={styles.card} opacity={OPACITY.glass}>
          <View style={styles.cardContentWrapper}>
            <Text style={styles.title}>Error</Text>
            <Text style={styles.subtitle}>{error || "Could not load quiz status."}</Text>
            <GradientButton title="Back to Quizzes" onPress={handleReturnToQuiz} style={styles.button} />
          </View>
        </GlassCard>
      );
    }

    const isCouple = !!activeCouple;
    if (!isCouple) {
      return (
        <GlassCard style={styles.card} opacity={OPACITY.glass}>
          <View style={styles.cardContentWrapper}>
            <Text style={styles.icon}>🎉</Text>
            <Text style={styles.title}>Quiz Completed!</Text>
            <Text style={styles.subtitle}>Great job! You completed this quiz in solo mode. Your answers are saved.</Text>
            <GradientButton title="Back to Quizzes" onPress={handleReturnToQuiz} style={styles.button} />
          </View>
        </GlassCard>
      );
    }

    // bothCompleted is determined via the state variable which fetches from the database.

    if (bothCompleted) {
       return (
        <GlassCard style={styles.card} opacity={OPACITY.glass}>
          <View style={styles.cardContentWrapper}>
            <Text style={styles.icon}>💕</Text>
            <Text style={styles.title}>You Both Finished!</Text>
            <Text style={styles.subtitle}>Perfect! You and your partner have both completed the {category.name} quiz. Ready to see how you compare?</Text>
            <GradientButton title="Compare Answers" onPress={handleGoToComparison} style={styles.button} />
            <GradientButton title="Later" onPress={handleReturnToQuiz} style={styles.secondaryButton} />
          </View>
        </GlassCard>
      );
    }

    return (
      <GlassCard style={styles.card} opacity={OPACITY.glass}>
        <View style={styles.cardContentWrapper}>
          <Text style={styles.icon}>⏳</Text>
          <Text style={styles.title}>Waiting for Partner</Text>
          <Text style={styles.subtitle}>You've completed the {category.name} quiz! We'll let you know when {activeCouple?.partner.first_name || 'your partner'} finishes.</Text>
          <GradientButton title="Refresh Status" onPress={refreshQuizData} style={styles.button} />
          <GradientButton title="Back to Quizzes" onPress={handleReturnToQuiz} style={styles.secondaryButton} />
        </View>
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
    width: "100%",
  },
  cardContentWrapper: {
    width: "100%",
    alignItems: "center",
    padding: SPACING.xl,
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
    width: "90%",
    maxWidth: 300,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  secondaryButton: {
    width: "90%",
    maxWidth: 300,
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
