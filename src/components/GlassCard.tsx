import React from "react";
import { View, ViewStyle, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SIZES, SHADOWS } from "../constants";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: readonly string[];
  opacity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  gradient = [COLORS.glass, COLORS.glassDark],
  opacity = 0.8,
}) => {
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={gradient as [string, string, ...string[]]}
        style={[styles.gradient, { opacity }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: SIZES.radius,
    overflow: "hidden",
    ...SHADOWS.medium,
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    padding: SIZES.padding,
    position: "relative",
    zIndex: 1,
  },
});
