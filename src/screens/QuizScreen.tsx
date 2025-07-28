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
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { MainTabParamList } from "../types/navigation";
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
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
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

  // Mock data for development
  useEffect(() => {
    // Simulate loading quiz progress
    const mockProgress = {
      [QuizCategory.COMMUNICATION]: 75,
      [QuizCategory.VALUES]: 30,
      [QuizCategory.HOBBIES]: 0,
      [QuizCategory.INTIMACY]: 0,
      [QuizCategory.FAMILY]: 0,
      [QuizCategory.FUTURE]: 0,
      [QuizCategory.ACTIVITIES]: 0,
      [QuizCategory.PHYSICAL]: 0,
      [QuizCategory.DATES]: 0,
      [QuizCategory.PERSONALITY]: 0,
    };
    setQuizProgress(mockProgress);
  }, []);

  const handleCategoryPress = (category: QuizCategory) => {
    setSelectedCategory(category);
    // TODO: Navigate to quiz questions screen
    console.log("Selected category:", category);
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
              Choose a category to start discovering each other
            </Text>
          </GlassCard>
        </View>

        {/* Quick Stats */}
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
                </Text>
                <Text style={styles.statLabel}>Average Progress</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Categories Grid */}
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

        {/* Locked Categories */}
        {lockedCategories.length > 0 && (
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
});
