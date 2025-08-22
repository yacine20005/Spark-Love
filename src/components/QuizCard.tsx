import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GlassCard } from "./GlassCard";
import { QuizCategory } from "../types/quiz";
import { OPACITY } from "../constants";
import { COLORS, FONTS, SPACING, LAYOUT } from "../constants";

interface QuizCardProps {
  category: QuizCategory; // Now the full category object
  onPress: () => void;
  isLocked?: boolean;
  progress?: number; // 0-100
  questionCount?: number;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  category,
  onPress,
  isLocked = false,
  progress = 0,
  questionCount = 0,
}) => {
  // The gradient can be derived from the category color or be more complex
  const gradient = [category.color, category.color];

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={isLocked}
      activeOpacity={0.8}
    >
      <GlassCard
        style={styles.card}
        gradient={gradient}
        opacity={isLocked ? OPACITY.disabled : OPACITY.glass}
      >
        <View style={styles.header}>
          <Text style={styles.icon}>{category.icon}</Text>
          {isLocked && (
            <View style={styles.lockContainer}>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          )}
        </View>

        <Text style={[styles.title, isLocked && styles.lockedText]}>
          {category.name}
        </Text>

        <Text style={[styles.description, isLocked && styles.lockedText]}>
          {category.description}
        </Text>

        {!isLocked && (
          <View style={styles.footer}>
            {progress > 0 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${Math.round(progress)}%` }]}
                  />
                </View>
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
              </View>
            )}

            {questionCount > 0 && (
              <Text style={styles.questionCount}>
                {questionCount} questions
              </Text>
            )}
          </View>
        )}

        {isLocked && (
          <View style={styles.lockedFooter}>
            <Text style={styles.lockedText}>Coming soon</Text>
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "48%",
    marginBottom: SPACING.md,
  },
  card: {
    padding: SPACING.md,
    minHeight: LAYOUT.quizCardMinHeight,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  icon: {
    fontSize: 24,
  },
  lockContainer: {
    backgroundColor: COLORS.glass,
    borderRadius: 12,
    padding: 4,
  },
  lockIcon: {
    fontSize: 12,
  },
  title: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  description: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
    lineHeight: LAYOUT.lineHeight.featureDescription,
    flex: 1,
  },
  footer: {
    marginTop: SPACING.sm,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.glass,
    borderRadius: 2,
    marginRight: SPACING.xs,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    minWidth: 30,
  },
  questionCount: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  lockedFooter: {
    marginTop: SPACING.sm,
    alignItems: "center",
  },
  lockedText: {
    color: COLORS.textSecondary,
    opacity: 0.6,
  },
});
