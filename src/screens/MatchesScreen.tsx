import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { fetchMatches } from '../api/swipe';
import { useLoader } from '../lib/useLoader';
import type { StackProps } from '../navigation/types';
import { Card, EmptyState, ErrorState, Loading, Screen, SectionHead, space, Stamp, Text, useTheme } from '../ui';

export function MatchesScreen({ navigation }: StackProps<'Matches'>) {
  const { colors } = useTheme();
  const { data, error, reload, refreshing, refresh } = useLoader(fetchMatches, []);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <Loading />;

  const sections = [
    { title: 'Movies to watch', items: data.filter((i) => i.kind === 'movie') },
    { title: 'Dates to plan', items: data.filter((i) => i.kind === 'date') },
  ].filter((s) => s.items.length);

  return (
    <Screen edges={['bottom']} refreshing={refreshing} onRefresh={refresh}>
      {sections.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="No matches yet"
          body="When you and your partner both like the same movie or date idea, it lands here."
          action={{ title: 'Keep swiping', onPress: () => navigation.goBack() }}
        />
      ) : (
        sections.map((s) => (
          <View key={s.title} style={{ gap: space.sm }}>
            <SectionHead>{s.title}</SectionHead>
            {s.items.map((i) => (
              <Card key={i.id} style={styles.row}>
                <Ionicons name={i.icon as keyof typeof Ionicons.glyphMap} size={24} color={colors.text} />
                <View style={{ flex: 1 }}>
                  <Text variant="label">{i.title}</Text>
                  <Text variant="bodyMuted" numberOfLines={2}>
                    {i.description}
                  </Text>
                </View>
                <Stamp label="Match" tilt={-4} />
              </Card>
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
