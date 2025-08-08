import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "../components/GlassCard";
import { QuizCard } from "../components/QuizCard";
import { GradientButton } from "../components/GradientButton";
import { QuizCategory } from "../types/quiz";
import { QUIZ_CATEGORIES, QUIZ_SETTINGS } from "../constants";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "../types/navigation";
import { useAuth } from "../context/AuthContext";
import { QuizService } from "../lib/supabase";
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
  const { user, activeCouple, loading: authLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | null>(
    null
  );
  const [quizProgress, setQuizProgress] = useState<
    Record<QuizCategory, number>
  >({
    [QuizCategory.COMMUNICATION]: 0,
    [QuizCategory.VALUES]: 0,
    [QuizCategory.HOBBIES]: 0,
    [QuizCategory.INTIMACY]: 0,
    [QuizCategory.FAMILY]: 0,
    [QuizCategory.FUTURE]: 0,
    [QuizCategory.ACTIVITIES]: 0,
    [QuizCategory.PHYSICAL]: 0,
    [QuizCategory.DATES]: 0,
    [QuizCategory.PERSONALITY]: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load quiz progress based on active couple or solo mode
  const loadQuizProgress = async () => {
    if (!user || authLoading) return;

    setLoading(true);
    setError(null);

    try {
      // Debug: Get diagnostic information
      const diagnosticInfo = await QuizService.getDiagnosticInfo();
      console.log("Database diagnostic info:", diagnosticInfo);

      // If no questions exist, stop here with an info message
      if (diagnosticInfo && diagnosticInfo.totalQuestions === 0) {
        setError(
          "No questions are available in the database. Please contact the administrator."
        );
        return;
      }

      // Get progress for active couple (or solo mode if activeCouple is null)
      const progress = await QuizService.getQuizProgress(
        user.id,
        activeCouple?.id || null
      );
      setQuizProgress(progress);
    } catch (err) {
      console.error("Error loading progress:", err);
      setError(
        "Unable to load quiz progress. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizProgress();
  }, [user, activeCouple, authLoading]);

  const handleCategoryPress = (category: QuizCategory) => {
    setSelectedCategory(category);
    const progress = quizProgress[category] || 0;
    if (progress >= 100) {
      // Already completed: go to status screen (wait/compare/redo)
      navigation.navigate("QuizStatusScreen", { category, coupleId: activeCouple?.id || null });
    } else {
      // Not completed: go to questions
      navigation.navigate("QuizQuestionsScreen", { category });
    }
  };

  const getAvailableCategories = () => {
    // For now, return all categories. Later this will be based on user progress
    return Object.values(QuizCategory);
  };

  const getLockedCategories = () => {
    // Categories that are not yet available
    return [];
  };

  const availableCategories = getAvailableCategories();
  const lockedCategories = getLockedCategories();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Background */}
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
                ? `Couple mode with ${
                    activeCouple.partner.email || "your partner"
                  }`
                : "Solo mode - Discover yourself!"}
            </Text>
          </GlassCard>
        </View>

        {/* Loading or error indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <GlassCard style={styles.messageCard} opacity={OPACITY.glass}>
              <Text style={styles.loadingText}>Loading progress...</Text>
            </GlassCard>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <GlassCard style={styles.messageCard} opacity={OPACITY.glass}>
              <Text style={styles.errorText}>{error}</Text>
              <GradientButton
                title="Try Again"
                onPress={() => {
                  setError(null);
                  // Re-trigger useEffect by updating a dependency
                  loadQuizProgress();
                }}
                style={styles.retryButton}
              />
            </GlassCard>
          </View>
        )}

        {/* Quick Stats */}
        {!loading && !error && (
          <View style={styles.statsSection}>
            <GlassCard style={styles.statsCard} opacity={OPACITY.glass}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {Object.values(quizProgress).filter((p) => p > 0).length}
                  </Text>
                  <Text style={styles.statLabel}>Categories Started</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {Math.round(
                      Object.values(quizProgress).reduce((a, b) => a + b, 0) /
                        Object.keys(quizProgress).length
                    )}
                    %
                  </Text>
                  <Text style={styles.statLabel}>Average Progress</Text>
                </View>
              </View>
            </GlassCard>
          </View>
        )}

        {/* Categories Grid */}
        {!loading && !error && (
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Available Categories</Text>
            <View style={styles.categoriesGrid}>
              {availableCategories.map((category) => (
                <QuizCard
                  key={category}
                  category={category}
                  onPress={() => handleCategoryPress(category)}
                  progress={quizProgress[category]}
                  questionCount={QUIZ_SETTINGS.QUESTIONS_PER_QUIZ}
                />
              ))}
            </View>
          </View>
        )}

        {/* Locked Categories */}
        {!loading && !error && lockedCategories.length > 0 && (
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Coming Soon</Text>
            <View style={styles.categoriesGrid}>
              {lockedCategories.map((category) => (
                <QuizCard
                  key={category}
                  category={category}
                  onPress={() => {}}
                  isLocked={true}
                />
              ))}
            </View>
          </View>
        )}

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
  loadingContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  errorContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  messageCard: {
    paddingVertical: SPACING.lg,
    alignItems: "center",
  },
  loadingText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    textAlign: "center",
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
  },
});
