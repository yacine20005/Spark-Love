import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { radius, space, type Palette } from './theme';
import { useTheme } from './ThemeProvider';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const variants = (colors: Palette): Record<Variant, { bg: string; fg: string; border?: string }> => ({
  primary: { bg: colors.primary, fg: colors.onPrimary },
  secondary: { bg: colors.surface, fg: colors.text, border: colors.border },
  ghost: { bg: 'transparent', fg: colors.text },
  danger: { bg: 'transparent', fg: colors.danger, border: colors.border },
});

export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, style }: Props) {
  const { colors } = useTheme();
  const p = variants(colors)[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: p.bg, borderColor: p.border ?? p.bg, borderWidth: p.border ? 1 : 0 },
        pressed && { opacity: 0.85, transform: [{ translateY: 1 }] },
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={18} color={p.fg} />}
          <Text variant="label" color={p.fg}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
