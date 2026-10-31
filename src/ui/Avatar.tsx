import { View } from 'react-native';
import { Text } from './Text';
import { colors, radius } from './theme';

/** Side marker: me is side A (vermilion), my partner is side B (blue). */
export function Avatar({ name, size = 40, side = 'A' }: { name?: string | null; size?: number; side?: 'A' | 'B' }) {
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
      <Text variant="title" color={colors.onPrimary} style={{ fontSize: size * 0.55, lineHeight: size * 0.62 }}>
        {(name?.trim()[0] ?? '?').toUpperCase()}
      </Text>
    </View>
  );
}
