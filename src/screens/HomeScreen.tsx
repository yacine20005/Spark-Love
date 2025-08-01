import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from "react-native";
import { COLORS, FONTS, SPACING, OPACITY, GRADIENTS, LAYOUT } from "../constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "../components/GlassCard";
import { GradientButton } from "../components/GradientButton";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { MainTabParamList } from "../types/navigation";
import { useAuth } from "../context/AuthContext";

const { width, height } = Dimensions.get("window");

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  const features = [
    {
      title: "💕 Interactive Quizzes",
      description: "Discover your compatibility with fun questions",
      gradient: GRADIENTS.love,
    },
    {
      title: "📖 Shared Journal",
      description: "Share your thoughts and special moments",
      gradient: GRADIENTS.secondary,
    },
    {
      title: "🎬 Movie Compatibility",
      description: "Find movies you'll both love to watch",
      gradient: GRADIENTS.movie,
    },
    {
      title: "📅 Date Ideas",
      description: "Discover perfect activities for your outings",
      gradient: GRADIENTS.dates,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Static background */}
      <View style={styles.backgroundGradient} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.lg }]}>
          <GlassCard style={styles.headerCard} opacity={OPACITY.glass}>
            <Text style={styles.appTitle}>Spark Love</Text>
            <Text style={styles.subtitle}>
              Welcome, {user?.email}
            </Text>
            <GradientButton
              title="Sign Out"
              onPress={signOut}
              gradient={GRADIENTS.secondary}
              size="medium"
              style={styles.secondaryButton}
            />
          </GlassCard>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Discover our features</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <GlassCard
                key={index}
                style={styles.featureCard}
                gradient={feature.gradient}
                opacity={OPACITY.glass}
              >
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </GlassCard>
            ))}
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <GlassCard style={styles.statsCard} opacity={OPACITY.glass}>
            <Text style={styles.statsTitle}>Your Progress</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Quizzes Completed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Movies Matched</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Dates</Text>
              </View>
            </View>
          </GlassCard>
        </View>

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
  welcomeText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  appTitle: {
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
  connectionStatus: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.sm,
  },
  quickActions: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  mainButton: {
    marginBottom: SPACING.md,
  },
  secondaryButton: {
    opacity: OPACITY.secondary,
  },
  featuresSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    textAlign: "center",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  featureCard: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    marginBottom: SPACING.md,
    minHeight: LAYOUT.featureCardMinHeight,
  },
  featureTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  featureDescription: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
    lineHeight: LAYOUT.lineHeight.featureDescription,
  },
  statsSection: {
    paddingHorizontal: SPACING.lg,
  },
  statsCard: {
    paddingVertical: SPACING.lg,
  },
  statsTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SPACING.lg,
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
  bottomSpacing: {
    height: SPACING.xl,
  },
});
