import React from "react";
import { View, ViewStyle, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SIZES, SHADOWS } from "../constants";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  contentStyle?: ViewStyle | ViewStyle[];
  gradient?: readonly string[];
  opacity?: number;
}

const contentStyleProps = [
  'padding',
  'paddingHorizontal',
  'paddingVertical',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingStart',
  'paddingEnd',
  'justifyContent',
  'alignItems',
  'flexDirection',
  'flexWrap',
  'alignContent',
];

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  contentStyle,
  gradient = [COLORS.glass, COLORS.glassDark],
  opacity = 0.8,
}) => {
  // Flatten the style prop
  const flatStyle = StyleSheet.flatten(style) || {};
  
  const outerStyle: ViewStyle = {};
  const innerContentStyle: ViewStyle = {};

  // Split flatStyle properties
  Object.keys(flatStyle).forEach((key) => {
    const val = (flatStyle as any)[key];
    if (contentStyleProps.includes(key)) {
      (innerContentStyle as any)[key] = val;
    } else {
      (outerStyle as any)[key] = val;
    }
  });

  // Handle height / flex propagation to inner content so children align correctly
  if (flatStyle.height || flatStyle.minHeight || flatStyle.flex) {
    innerContentStyle.flex = 1;
  }

  const borderRadius = flatStyle.borderRadius ?? SIZES.radius;

  const innerContainerStyle: ViewStyle = {
    overflow: "hidden",
    width: "100%",
    borderRadius,
  };

  if (flatStyle.height || flatStyle.minHeight || flatStyle.flex) {
    innerContainerStyle.flex = 1;
  }

  return (
    <View style={[styles.outerContainer, { borderRadius }, outerStyle]}>
      <View style={innerContainerStyle}>
        <LinearGradient
          colors={gradient as [string, string, ...string[]]}
          style={[styles.gradient, { opacity }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[styles.content, innerContentStyle, StyleSheet.flatten(contentStyle)]}>
          {children}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    // Outer handles shadow and layout margin/positioning
    // Keep overflow visible so shadows show on iOS
    overflow: "visible",
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
    // Base padding fallback if not overridden
    padding: SIZES.padding,
    position: "relative",
    zIndex: 1,
  },
});