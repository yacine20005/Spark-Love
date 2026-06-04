import React from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { GlassCard } from "../components/GlassCard";
import { useAuthFlow } from "../hooks/useAuthFlow";
import { COLORS, FONTS, SPACING, OPACITY, GRADIENTS } from "../constants";

export const AuthScreen: React.FC = () => {
  const { loading, handleGoogleSignIn } = useAuthFlow();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        colors={GRADIENTS.background}
        style={styles.backgroundGradient}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>💕</Text>
          <Text style={styles.title}>Spark Love</Text>
          <Text style={styles.subtitle}>
            Strengthen your connection, one question at a time.
          </Text>
        </View>

        <GlassCard style={styles.card} opacity={OPACITY.glass}>
          <Text style={styles.cardTitle}>Sign In</Text>

          <TouchableOpacity
            style={[styles.googleButton, loading && styles.disabledButton]}
            onPress={handleGoogleSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View style={styles.googleIconContainer}>
              <FontAwesome name="google" size={20} color="#DB4437" />
            </View>
            <Text style={styles.googleButtonText}>
              {loading ? "Connecting..." : "Continue with Google"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.infoText}>
            Sign in securely with Google to connect and share your couple journal.
          </Text>
        </GlassCard>
      </View>
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
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 50,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButtonText: {
    ...FONTS.body2,
    color: "#1f1f1f",
    fontWeight: "600",
    marginLeft: SPACING.sm,
  },
  googleIconContainer: {
    marginRight: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  infoText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
});

