import { Pressable, View, type ViewProps } from 'react-native';
import { colors, radius, space } from './theme';

type Props = ViewProps & { onPress?: () => void; accessibilityLabel?: string };

/** A paper insert: hairline edge, no shadow. */
export function Card({ onPress, style, ...rest }: Props) {
  const base = [
    { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md, borderWidth: 1, borderColor: colors.border },
    style,
  ];
  if (!onPress) return <View style={base} {...rest} />;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [base, pressed && { backgroundColor: colors.surfaceMuted }]}
      {...rest}
    />
  );
}
