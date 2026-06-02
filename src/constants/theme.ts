import { COLORS } from './colors';

export const SIZES = {
  // Base sizes
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 18,
  extraLarge: 24,
  padding: 20, // Generous padding for Soft-Tactile feel
  radius: 24, // Rounded xl for soft touch (24px)
  
  // Screen dimensions
  width: 375,
  height: 812,
} as const;

export const FONTS = {
  largeTitle: { fontFamily: 'Quicksand_700Bold', fontSize: 40, fontWeight: '700' as const },
  h1: { fontFamily: 'Quicksand_700Bold', fontSize: 30, fontWeight: '700' as const },
  h2: { fontFamily: 'Quicksand_600SemiBold', fontSize: 22, fontWeight: '600' as const },
  h3: { fontFamily: 'Quicksand_600SemiBold', fontSize: 20, fontWeight: '600' as const },
  h4: { fontFamily: 'Quicksand_600SemiBold', fontSize: 18, fontWeight: '600' as const },
  body1: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16, fontWeight: '400' as const },
  body2: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, fontWeight: '400' as const },
  body3: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, fontWeight: '400' as const },
  button: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, fontWeight: '600' as const },
  caption: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, fontWeight: '500' as const },
} as const;

export const SHADOWS = {
  light: {
    shadowColor: '#4a154b', // Deep violet tint
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 3,
  },
  medium: {
    shadowColor: '#4a154b', // Deep violet tint
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 8,
  },
  dark: {
    shadowColor: '#4a154b',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.12,
    shadowRadius: 40,
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