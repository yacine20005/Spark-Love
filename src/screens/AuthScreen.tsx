import React, { useState } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../lib/supabase";
import { GradientButton } from "../components/GradientButton";
import { GlassCard } from "../components/GlassCard";
import { COLORS, FONTS, SPACING, OPACITY, GRADIENTS } from "../constants";

export const AuthScreen: React.FC = () => {
  // State management for form inputs and UI state
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  // Removed isSignUp state since OTP flow is unified for sign-in and sign-up
  const [showOtpInput, setShowOtpInput] = useState(false); // Show OTP input field
  const [pendingEmail, setPendingEmail] = useState(""); // Store email for OTP verification

  // Email validation using regex pattern
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Function to resend confirmation email
  const resendConfirmationEmail = async () => {
    if (!pendingEmail) {
      Alert.alert("Error", "No pending email. Please start the process again.");
      return;
    }

    try {
      // Use the same method as the initial request
      const { error } = await supabase.auth.signInWithOtp({
        email: pendingEmail,
        options: {
          shouldCreateUser: true,
          data: {
            // The otpType property is included for clarity, but Supabase sends OTP codes for email by default.
            otpType: "email",
          },
        },
      });

      if (error) {
        Alert.alert(
          "Error",
          "Failed to resend verification code. Please try again."
        );
      } else {
        Alert.alert(
          "Code Sent",
          "A new 6-digit verification code has been sent to your email."
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "An unexpected error occurred while resending code."
      );
      console.error("Resend code error:", error);
    }
  };

  // Function to verify OTP code
  const verifyOtp = async () => {
    if (!otpCode.trim()) {
      Alert.alert("Error", "Please enter the verification code.");
      return;
    }

    if (!pendingEmail) {
      Alert.alert(
        "Error",
        "No pending verification. Please start the sign-in process again."
      );
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: otpCode.trim(),
        type: "email",
      });

      if (error) {
        Alert.alert(
          "Invalid Code",
          "The verification code is incorrect or has expired. Please try again."
        );
      } else {
        Alert.alert("Success!", "Welcome to Spark Love!");
        // Reset states
        setShowOtpInput(false);
        setPendingEmail("");
        setOtpCode("");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "An unexpected error occurred while verifying the code."
      );
      console.error("OTP verification error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Main authentication function - handles both sign in and sign up with OTP
  const handleAuth = async () => {
    // Input validation - check if fields are filled
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }

    // Email format validation
    if (!validateEmail(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      // Use signInWithOtp with explicit options to ensure OTP codes are sent
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true, // This will create user if they don't exist
          data: {
            // 'otpType' is included as custom user metadata; it does not affect Supabase OTP generation.
            otpType: "email",
          },
        },
      });

      if (error) {
        Alert.alert("Authentication Error", error.message);
      } else {
        // Store email and show OTP input
        setPendingEmail(email.trim());
        setShowOtpInput(true);
        Alert.alert(
          "Check Your Email",
          "We sent you a 6-digit verification code. Please check your email inbox and look for a 6-digit number - it might be in the subject line, email body, or within a confirmation link."
        );
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
      console.error("Auth error:", error);
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
                onPress={() => {
                  setShowOtpInput(false);
                  setPendingEmail("");
                  setOtpCode("");
                }}
                disabled={loading}
                style={styles.secondaryButton}
              />
            </>
          )}

          {/* Removed sign up/sign in toggle button since OTP flow is unified */}
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
