import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';
import { GradientButton } from '../GradientButton';
import { GlassCard } from '../GlassCard';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING, OPACITY } from '../../constants';

export const ProfileForm: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ first_name: firstName, last_name: lastName })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard style={styles.card} opacity={OPACITY.glass}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Your Profile</Text>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={user?.email}
          editable={false}
        />
        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Enter your first name"
          placeholderTextColor={COLORS.textSecondary}
          returnKeyType="next"
        />
        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Enter your last name"
          placeholderTextColor={COLORS.textSecondary}
          returnKeyType="done"
        />
        <GradientButton
          title={loading ? 'Saving...' : 'Save Changes'}
          onPress={handleUpdateProfile}
          disabled={loading}
          style={{ marginTop: SPACING.lg }}
        />
      </ScrollView>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  scrollContent: {
    flexGrow: 1,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  label: {
    ...FONTS.body3,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: "uppercase",
    fontSize: 12,
  },
  input: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: "rgba(28, 28, 23, 0.08)",
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  disabledInput: {
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surfaceContainer,
    borderColor: "rgba(28, 28, 23, 0.04)",
    opacity: 0.8,
  },
});
