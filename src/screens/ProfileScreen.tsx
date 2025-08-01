import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, OPACITY } from '../constants';

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

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
          <Text style={styles.featureTitle}>Your Account</Text>
          <Text style={styles.featureDescription}>
            You are signed in as: {user?.email}
          </Text>
          <GradientButton title="Sign Out" onPress={signOut} style={{ marginTop: SPACING.lg }} />
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
