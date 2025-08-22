import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "../components/GlassCard";
import { QuizCard } from "../components/QuizCard";
import { GradientButton } from "../components/GradientButton";
import { QuizCategory } from "../types/quiz";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../types/navigation";
import { useAuth } from "../context/AuthContext";
import { useQuiz } from "../context/QuizContext";
import {
  COLORS,
  FONTS,
  SIZES,
  SPACING,
  GRADIENTS,
  OPACITY,
  LAYOUT,
} from "../constants";

const { width } = Dimensions.get("window");

export const QuizScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { activeCouple } = useAuth();
  const { categories, progress, loading, error, refreshQuizData } = useQuiz();
  const insets = useSafeAreaInsets();

  const handleCategoryPress = (category: QuizCategory) => {
    const categoryProgress = progress.find(p => p.category_id === category.id);
    const isCompleted = categoryProgress && categoryProgress.questions_answered >= categoryProgress.total_questions;

    if (isCompleted) {
      navigation.navigate("QuizCompletionScreen", { categoryId: category.id, answers: [], coupleId: activeCouple?.id || null });
    } else {
      navigation.navigate("QuizQuestionsScreen", { categoryId: category.id });
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.messageContainer}>
          <GlassCard style={styles.messageCard} opacity={OPACITY.glass}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading Quizzes...</Text>
          </GlassCard>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.messageContainer}>
          <GlassCard style={styles.messageCard} opacity={OPACITY.glass}>
            <Text style={styles.errorText}>{error}</Text>
            <GradientButton
              title="Try Again"
              onPress={refreshQuizData}
              style={styles.retryButton}
            />
          </GlassCard>
        </View>
      );
    }

    const totalAnswered = progress.reduce((sum, p) => sum + p.questions_answered, 0);
    const totalQuestions = progress.reduce((sum, p) => sum + p.total_questions, 0);
    const averageProgress = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;
    const categoriesStarted = progress.filter(p => p.questions_answered > 0).length;

    return (
      <>
        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <GlassCard style={styles.statsCard} opacity={OPACITY.glass}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{categoriesStarted}</Text>
                <Text style={styles.statLabel}>Categories Started</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{averageProgress}%</Text>
                <Text style={styles.statLabel}>Average Progress</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Categories Grid */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Available Categories</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => {
              const categoryProgress = progress.find(p => p.category_id === category.id);
              const questionsAnswered = categoryProgress?.questions_answered || 0;
              const totalQuestionsInCategory = category.questions.length;
              const percentage = totalQuestionsInCategory > 0 ? (questionsAnswered / totalQuestionsInCategory) * 100 : 0;

              return (
                <QuizCard
                  key={category.id}
                  category={category} // Pass the whole category object
                  onPress={() => handleCategoryPress(category)}
                  progress={percentage}
                  questionCount={totalQuestionsInCategory}
                />
              );
            })}
          </View>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.backgroundGradient} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.lg }]}>
          <GlassCard style={styles.headerCard} opacity={OPACITY.glass}>
            <Text style={styles.title}>Quiz Categories</Text>
            <Text style={styles.subtitle}>
              {activeCouple
                ? `Couple mode with ${activeCouple.partner.first_name || "your partner"}`
                : "Solo mode - Discover yourself!"}
            </Text>
          </GlassCard>
        </View>

        {renderContent()}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  headerCard: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
  },
  title: {
    ...FONTS.largeTitle,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  subtitle: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: LAYOUT.lineHeight.subtitle,
  },
  statsSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  statsCard: {
    paddingVertical: SPACING.lg,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    ...FONTS.h1,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  statDivider: {
    width: LAYOUT.statDividerWidth,
    height: LAYOUT.statDividerHeight,
    backgroundColor: COLORS.glass,
  },
  categoriesSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    textAlign: "center",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
  messageContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200, // Ensure it takes some space
  },
  messageCard: {
    padding: SPACING.xl,
    alignItems: "center",
    width: '100%',
  },
  loadingText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.md,
  },
  errorText: {
    ...FONTS.body1,
    color: COLORS.error || COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  retryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.md,
  },
});
