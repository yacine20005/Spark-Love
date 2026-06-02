import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, FONTS, SIZES, SHADOWS } from "../constants";

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  gradient?: readonly string[];
  disabled?: boolean;
  size?: "small" | "medium" | "large";
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  gradient = COLORS.gradientPrimary,
  disabled = false,
  size = "medium",
}) => {
  const buttonSize = {
    small: { paddingVertical: 8, paddingHorizontal: 16 },
    medium: { paddingVertical: 12, paddingHorizontal: 24 },
    large: { paddingVertical: 16, paddingHorizontal: 32 },
  };

  const textSize = {
    small: { fontSize: 14 },
    medium: { fontSize: 16 },
    large: { fontSize: 18 },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.container,
        !disabled && SHADOWS.medium,
        disabled && styles.disabledContainer,
        style,
      ]}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={
          disabled
            ? [COLORS.surfaceContainer, COLORS.surfaceContainer]
            : (gradient as any)
        }
        style={[styles.gradient, buttonSize[size]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text
          style={[
            styles.text,
            textSize[size],
            textStyle,
            disabled && styles.disabledText,
          ]}
        >
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.surface, // Perfect solid backing for Android shadow silhouette
    borderWidth: 0, // Explicitly reset border to prevent layout bleed on state transition
  },
  disabledContainer: {
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    elevation: 0,
    shadowOpacity: 0,
    backgroundColor: COLORS.surfaceContainer,
  },
  gradient: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: SIZES.radius,
  },
  text: {
    fontFamily: FONTS.button.fontFamily,
    color: COLORS.textPrimary,
    fontWeight: "600",
    textAlign: "center",
  },
  disabledText: {
    color: COLORS.textTertiary,
  },
});
