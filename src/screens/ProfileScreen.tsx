import React from "react";
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "../components/GlassCard";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { MainTabParamList } from "../types/navigation";
import { COLORS, FONTS, SPACING, OPACITY } from "../constants";

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <View style={styles.backgroundGradient} />

      <View style={[styles.content, { paddingTop: insets.top + SPACING.lg }]}>
        <GlassCard style={styles.headerCard} opacity={OPACITY.glass}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>
            Manage your account and preferences 👤
          </Text>
        </GlassCard>

        <GlassCard style={styles.featureCard} opacity={OPACITY.glass}>
          <Text style={styles.featureTitle}>Coming Soon!</Text>
          <Text style={styles.featureDescription}>
            This section will allow you to manage your profile, couple settings,
            and app preferences.
          </Text>
        </GlassCard>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  headerCard: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.xl,
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
  },
  featureCard: {
    padding: SPACING.lg,
    alignItems: "center",
  },
  featureTitle: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  featureDescription: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
});
