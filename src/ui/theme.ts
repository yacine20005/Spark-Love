import type { TextStyle } from 'react-native';

/**
 * Mixtape: a cassette J-card. Paper stock, black print, and two inks for the
 * two sides of the tape. Side A is always "me", side B is always my partner.
 * Colour is quarantined to the sides, the label stripe and photos.
 * Read colours through useTheme() / makeStyles(), never import a palette directly.
 */
const light = {
  background: '#F1EADB', // J-card stock
  surface: '#F9F5EC', // insert paper
  surfaceMuted: '#E7DFCD',
  border: '#D3C8B2',
  text: '#1B1814', // print black
  textMuted: '#4F483F',
  textSubtle: '#6A6155',
  primary: '#1B1814', // actions are printed in black
  onPrimary: '#F9F5EC',
  sideA: '#C2381F', // vermilion
  sideASoft: '#F6DDD2',
  sideB: '#2340A0', // ballpoint blue
  sideBSoft: '#DCE2F3',
  onSide: '#F9F5EC',
  marigold: '#E3A13A', // label stripe only
  success: '#2F6B4F',
  successSoft: '#DCEBE1',
  danger: '#B3261E',
};

/** The same tape under a desk lamp: dark stock, cream print, inks lifted for contrast. */
const dark: typeof light = {
  background: '#15120E',
  surface: '#1F1B16',
  surfaceMuted: '#2A251F',
  border: '#3B342B',
  text: '#EFE7D6',
  textMuted: '#C2B8A6',
  textSubtle: '#9A9080',
  primary: '#EFE7D6',
  onPrimary: '#15120E',
  sideA: '#EE6446',
  sideASoft: '#3C211A',
  sideB: '#86A0EE',
  sideBSoft: '#1D2542',
  onSide: '#15120E',
  marigold: '#E3A13A',
  success: '#74C49A',
  successSoft: '#1D3328',
  danger: '#F2796B',
};

export type Palette = typeof light;
export type Scheme = 'light' | 'dark';
export const palettes: Record<Scheme, Palette> = { light, dark };

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 4, md: 6, lg: 8, pill: 999 } as const;

export const fonts = {
  label: 'BarlowCondensed_600SemiBold',
  display: 'BarlowCondensed_700Bold',
  body: 'Barlow_400Regular',
  bodyMedium: 'Barlow_500Medium',
  bodySemi: 'Barlow_600SemiBold',
} as const;

export const makeType = (colors: Palette) => ({
  display: { fontFamily: fonts.display, fontSize: 40, lineHeight: 42, color: colors.text, textTransform: 'uppercase', letterSpacing: 0.2 },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 31, color: colors.text, textTransform: 'uppercase', letterSpacing: 0.2 },
  heading: { fontFamily: fonts.bodySemi, fontSize: 18, lineHeight: 24, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 17, lineHeight: 25, color: colors.text },
  bodyMuted: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: colors.textMuted },
  label: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 20, color: colors.text },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 19, color: colors.textSubtle },
  /** Cassette-label caps: section heads, side markers, stamps. */
  tag: { fontFamily: fonts.label, fontSize: 14, lineHeight: 16, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.4 },
  counter: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 18, color: colors.text, fontVariant: ['tabular-nums'], letterSpacing: 1 },
}) satisfies Record<string, TextStyle>;

export type TypeScale = ReturnType<typeof makeType>;
export const stripeOf = (colors: Palette) => [colors.sideA, colors.marigold, colors.sideB] as const;
