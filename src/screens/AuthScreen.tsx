import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GradientButton } from "../components/GradientButton";
import { GlassCard } from "../components/GlassCard";
import { useAuthFlow } from "../hooks/useAuthFlow";
import { COLORS, FONTS, SPACING, OPACITY, GRADIENTS } from "../constants";

export const AuthScreen: React.FC = () => {
  const {
    email,
    setEmail,
    otpCode,
    setOtpCode,
    loading,
    showOtpInput,
    pendingEmail,
    handleAuth,
    verifyOtp,
    resendConfirmationEmail,
    resetAuthFlow,
  } = useAuthFlow();

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
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.icon}>💕</Text>
          <Text style={styles.title}>Spark Love</Text>
          <Text style={styles.subtitle}>
            Strengthen your connection, one question at a time.
          </Text>
        </View>

        <GlassCard style={styles.card} opacity={OPACITY.glass}>
          <Text style={styles.cardTitle}>
            {showOtpInput ? "Enter Verification Code" : "Sign In"}
          </Text>

          {!showOtpInput ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                placeholderTextColor={COLORS.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <GradientButton
                title={loading ? "Sending..." : "Send Verification Code"}
                onPress={handleAuth}
                disabled={loading || !email.trim()}
                style={styles.button}
              />
              <Text style={styles.infoText}>
                {
                  "We'll send you a 6-digit code to sign in or create your account."
                }
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.emailDisplay}>
                Code sent to: {pendingEmail}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit code"
                placeholderTextColor={COLORS.textSecondary}
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
              <GradientButton
                title={loading ? "Verifying..." : "Verify Code"}
                onPress={verifyOtp}
                disabled={loading || otpCode.length !== 6}
                style={styles.button}
              />
              <Text style={styles.infoText}>
                Enter the 6-digit code from your email.
              </Text>
              <GradientButton
                title="Resend Code"
                onPress={resendConfirmationEmail}
                disabled={loading}
                style={styles.secondaryButton}
              />
              <GradientButton
                title="Back to Email"
                onPress={resetAuthFlow}
                disabled={loading}
                style={styles.secondaryButton}
              />
            </>
          )}
        </GlassCard>
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
  },
  infoText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.md,
  },
  emailDisplay: {
    ...FONTS.body2,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SPACING.md,
    opacity: 0.8,
  },
  secondaryButton: {
    width: "100%",
    marginTop: SPACING.md,
    opacity: 0.8,
  },
});
