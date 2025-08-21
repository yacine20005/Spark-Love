import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GradientButton } from "../components/GradientButton";
import { GlassCard } from "../components/GlassCard";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { COLORS, FONTS, SPACING, OPACITY, GRADIENTS } from "../constants";

export const NameSetupScreen: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCompleteSetup = async () => {
    if (!user || !firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please enter both your first name and last name.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim()
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
    } catch (e) {
      Alert.alert('Error', 'Failed to save your information. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        colors={GRADIENTS.background as [string, string, ...string[]]}
        style={styles.backgroundGradient}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.icon}>👋</Text>
            <Text style={styles.title}>Welcome!</Text>
            <Text style={styles.subtitle}>
              Let's get to know you better. What's your name?
            </Text>
          </View>

          <GlassCard style={styles.card} opacity={OPACITY.glass}>
            <Text style={styles.cardTitle}>Tell us about yourself</Text>

            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your first name"
              placeholderTextColor={COLORS.textSecondary}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />

            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your last name"
              placeholderTextColor={COLORS.textSecondary}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
            />

            <GradientButton
              title={loading ? "Saving..." : "Continue"}
              onPress={handleCompleteSetup}
              disabled={loading || !firstName.trim() || !lastName.trim()}
              style={styles.button}
            />

            <Text style={styles.infoText}>
              This information helps us personalize your experience.
            </Text>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.xxl,
  },
  icon: {
    fontSize: 80,
    marginBottom: SPACING.md,
  },
  title: {
    ...FONTS.largeTitle,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    textAlign: "center",
    maxWidth: "80%",
  },
  card: {
    padding: SPACING.lg,
    width: "100%",
  },
  cardTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  label: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    color: COLORS.textPrimary,
    ...FONTS.body2,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glass,
  },
  button: {
    width: "100%",
    marginTop: SPACING.md,
  },
  infoText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.md,
  },
});
