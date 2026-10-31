import { Pressable, View } from 'react-native';
import { Text } from './Text';
import { radius } from './theme';
import { makeStyles, useTheme } from './ThemeProvider';

type Option<T extends string> = { value: T; label: string };

export function Segmented<T extends string>({ options, value, onChange }: { options: Option<T>[]; value: T; onChange: (v: T) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.segment} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.item, active && styles.active]}
          >
            <Text variant="label" color={active ? colors.text : colors.textSubtle}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  segment: { flexDirection: 'row', backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: 3 },
  item: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  active: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
}));
