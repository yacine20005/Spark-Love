import { COLORS } from './colors';

export const SIZES = {
  // Base sizes
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 18,
  extraLarge: 24,
  padding: 15,
  radius: 12,
  
  // Screen dimensions
  width: 375,
  height: 812,
} as const;

export const FONTS = {
  largeTitle: { fontSize: 40, fontWeight: 'bold' as const },
  h1: { fontSize: 30, fontWeight: 'bold' as const },
  h2: { fontSize: 22, fontWeight: 'bold' as const },
  h3: { fontSize: 20, fontWeight: 'bold' as const },
  h4: { fontSize: 18, fontWeight: 'bold' as const },
  body1: { fontSize: 16, fontWeight: 'normal' as const },
  body2: { fontSize: 14, fontWeight: 'normal' as const },
  body3: { fontSize: 12, fontWeight: 'normal' as const },
  button: { fontSize: 16, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: 'normal' as const },
} as const;

export const SHADOWS = {
  light: {
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  medium: {
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  dark: {
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
} as const;

export const SPACING = {
  xs: SIZES.base / 2, // 4
  sm: SIZES.base, // 8
  md: SIZES.base * 2, // 16
  lg: SIZES.base * 3, // 24
  xl: SIZES.base * 4, // 32
  xxl: SIZES.base * 6, // 48
} as const;

// Additional constants to avoid magic numbers
export const OPACITY = {
  glass: 0.8,
  secondary: 0.9,
  disabled: 0.5,
} as const;

export const LAYOUT = {
  quizCardMinHeight: 160,
  featureCardMinHeight: 120,
  statDividerWidth: 1,
  statDividerHeight: 40,
  lineHeight: {
    subtitle: 22,
    featureDescription: 18,
  },
} as const; 