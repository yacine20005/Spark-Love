import { Text as RNText, type TextProps } from 'react-native';
import { type } from './theme';

type Props = TextProps & { variant?: keyof typeof type; color?: string; center?: boolean };

export function Text({ variant = 'body', color, center, style, ...rest }: Props) {
  return (
    <RNText
      style={[type[variant], color ? { color } : null, center ? { textAlign: 'center' } : null, style]}
      {...rest}
    />
  );
}
