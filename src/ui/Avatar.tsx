import { View } from 'react-native';
import { Text } from './Text';
import { colors } from './theme';

export function Avatar({ name, size = 40, tone = 'primary' }: { name?: string | null; size?: number; tone?: 'primary' | 'plum' }) {
  const bg = tone === 'plum' ? colors.plumSoft : colors.primarySoft;
  const fg = tone === 'plum' ? colors.plum : colors.primary;
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text variant="label" color={fg} style={{ fontSize: size * 0.42, lineHeight: size * 0.5 }}>
        {(name?.trim()[0] ?? '?').toUpperCase()}
      </Text>
    </View>
  );
}
