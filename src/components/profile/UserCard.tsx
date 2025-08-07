
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { GlassCard } from '../GlassCard';
import { GradientButton } from '../GradientButton';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, OPACITY } from '../../constants';

export const UserCard: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <GlassCard style={styles.featureCard} opacity={OPACITY.glass}>
      <Text style={styles.featureTitle}>Your Account</Text>
      <Text style={styles.featureDescription}>You are signed in as: {user?.email}</Text>
      <GradientButton title="Sign Out" onPress={signOut} style={{ marginTop: SPACING.lg }} />
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  featureCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  featureTitle: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  featureDescription: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
});
