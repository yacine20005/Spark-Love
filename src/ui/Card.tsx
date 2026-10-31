import { Pressable, View, type ViewProps } from 'react-native';
import { colors, radius, shadow, space } from './theme';

type Props = ViewProps & { onPress?: () => void; accessibilityLabel?: string };

export function Card({ onPress, style, ...rest }: Props) {
  const base = [{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md }, shadow, style];
  if (!onPress) return <View style={base} {...rest} />;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [base, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}
      {...rest}
    />
  );
}
