import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const colors = {
  background: '#FDF9F0',
  surface: '#FFFFFF',
  surfaceMuted: '#F4EFE4',
  border: '#E8DFD3',
  text: '#1C1C17',
  textMuted: '#584140',
  textSubtle: '#7A6261',
  primary: '#C2413F', // actions; white text passes AA
  primarySoft: '#FCE8E6',
  accent: '#FF6B6B', // brand coral, decoration only
  plum: '#844981',
  plumSoft: '#F3E8F2',
  success: '#2E7D5B',
  successSoft: '#E3F2EA',
  danger: '#B3261E',
  onPrimary: '#FFFFFF',
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

const heading = 'Quicksand_700Bold';
const headingSemi = 'Quicksand_600SemiBold';
const body = 'PlusJakartaSans_400Regular';
const bodyMedium = 'PlusJakartaSans_500Medium';
const bodySemi = 'PlusJakartaSans_600SemiBold';

export const type = {
  display: { fontFamily: heading, fontSize: 32, lineHeight: 38, color: colors.text },
  title: { fontFamily: heading, fontSize: 24, lineHeight: 30, color: colors.text },
  heading: { fontFamily: headingSemi, fontSize: 18, lineHeight: 24, color: colors.text },
  body: { fontFamily: body, fontSize: 16, lineHeight: 24, color: colors.text },
  bodyMuted: { fontFamily: body, fontSize: 15, lineHeight: 22, color: colors.textMuted },
  label: { fontFamily: bodySemi, fontSize: 15, lineHeight: 20, color: colors.text },
  caption: { fontFamily: bodyMedium, fontSize: 13, lineHeight: 18, color: colors.textSubtle },
} satisfies Record<string, TextStyle>;

export const shadow: ViewStyle = Platform.select({
  web: { boxShadow: '0 2px 12px rgba(74, 21, 75, 0.07)' } as ViewStyle,
  default: {
    shadowColor: '#4A154B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
});
