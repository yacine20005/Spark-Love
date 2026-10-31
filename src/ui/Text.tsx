import { Text as RNText, type TextProps } from 'react-native';
import type { TypeScale } from './theme';
import { useTheme } from './ThemeProvider';

type Props = TextProps & { variant?: keyof TypeScale; color?: string; center?: boolean };

export function Text({ variant = 'body', color, center, style, ...rest }: Props) {
  const { type } = useTheme();
  return (
    <RNText
      style={[type[variant], color ? { color } : null, center ? { textAlign: 'center' } : null, style]}
      {...rest}
    />
  );
}
