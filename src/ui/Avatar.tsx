import { View } from 'react-native';
import { Text } from './Text';
import { radius } from './theme';
import { useTheme } from './ThemeProvider';

/** Side marker: me is side A (vermilion), my partner is side B (blue). */
export function Avatar({ name, size = 40, side = 'A' }: { name?: string | null; size?: number; side?: 'A' | 'B' }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: side === 'B' ? colors.sideB : colors.sideA,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="title" color={colors.onSide} style={{ fontSize: size * 0.55, lineHeight: size * 0.62 }}>
        {(name?.trim()[0] ?? '?').toUpperCase()}
      </Text>
    </View>
  );
}
