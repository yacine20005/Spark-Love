import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { tap } from '../lib/haptics';
import type { Question } from '../lib/types';
import { colors, radius, space, Text, TextField } from '../ui';

type Props = { question: Question; value: string; onChange: (v: string) => void };

export function QuestionInput({ question: q, value, onChange }: Props) {
  if (q.type === 'text') {
    return (
      <TextField
        label="Your answer"
        value={value}
        onChangeText={onChange}
        multiline
        maxLength={2000}
        placeholder="Take your time…"
      />
    );
  }

  if (q.type === 'scale') {
    const min = q.scale_min ?? 0;
    const max = q.scale_max ?? 10;
    const labels = (q.scale_labels ?? {}) as { min?: string; max?: string };
    return (
      <View style={{ gap: space.sm }}>
        <View style={styles.scale} accessibilityRole="radiogroup">
          {Array.from({ length: max - min + 1 }, (_, i) => String(min + i)).map((n) => {
            const selected = value === n;
            return (
              <Pressable
                key={n}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={n}
                onPress={() => {
                  tap();
                  onChange(n);
                }}
                style={[styles.step, selected && styles.selected]}
              >
                <Text variant="label" color={selected ? colors.onPrimary : colors.text}>
                  {n}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.labels}>
          <Text variant="caption">{labels.min}</Text>
          <Text variant="caption">{labels.max}</Text>
        </View>
      </View>
    );
  }

  const options = q.type === 'yes_no' ? ['Yes', 'No'] : ((q.options ?? []) as string[]);
  return (
    <View style={{ gap: space.sm }} accessibilityRole="radiogroup">
      {options.map((o) => {
        const selected = value === o;
        return (
          <Pressable
            key={o}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              tap();
              onChange(o);
            }}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <Text variant="body" style={{ flex: 1 }}>
              {o}
            </Text>
            <Ionicons
              name={selected ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={selected ? colors.primary : colors.textSubtle}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  scale: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  step: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 56,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
});
