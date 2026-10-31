import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { fetchCategories, fetchProgress } from '../api/quiz';
import { useHousehold } from '../context/session';
import { useLoader } from '../lib/useLoader';
import type { TabProps } from '../navigation/types';
import { Card, colors, ErrorState, Loading, Screen, space, Text } from '../ui';
import { NeedsPartner } from './NeedsPartner';

export function QuizzesScreen(props: TabProps<'Quizzes'>) {
  const { linked } = useHousehold();
  if (!linked) return <NeedsPartner body="Answer the same questions separately, then compare. Link with your partner to start." />;
  return <QuizList {...props} />;
}

function QuizList({ navigation }: TabProps<'Quizzes'>) {
  const { partner } = useHousehold();
  const { data, error, refreshing, refresh, reload } = useLoader(async () => {
    const [categories, progress] = await Promise.all([fetchCategories(), fetchProgress()]);
    const byId = new Map(progress.map((p) => [p.category_id, p]));
    return categories.map((c) => ({ ...c, progress: byId.get(c.id) ?? { total: 0, mine: 0, partner: 0 } }));
  }, []);

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Text variant="title">Quizzes</Text>
      <Text variant="bodyMuted">Answer on your own. Your answers stay hidden until you have both finished a quiz.</Text>
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data ? (
        <Loading />
      ) : (
        data.map((c) => {
          const { total, mine, partner: theirs } = c.progress;
          const done = mine === total && total > 0;
          const both = done && theirs === total;
          const status = both
            ? 'Results ready'
            : done
              ? `Waiting for ${partner?.display_name} (${theirs}/${total})`
              : mine > 0
                ? `${mine} of ${total} answered`
                : `${total} questions${theirs === total ? ` · ${partner?.display_name} is done` : ''}`;
          return (
            <Card
              key={c.id}
              accessibilityLabel={`${c.name}. ${status}`}
              onPress={() => navigation.navigate(done ? 'QuizResults' : 'QuizSession', { categoryId: c.id, name: c.name })}
              style={styles.row}
            >
              <View style={[styles.icon, { backgroundColor: `${c.color}1A` }]}>
                <Ionicons name={c.icon as keyof typeof Ionicons.glyphMap} size={22} color={c.color} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="heading">{c.name}</Text>
                <Text variant="bodyMuted" numberOfLines={1}>
                  {c.description}
                </Text>
                <Text variant="caption" color={both ? colors.success : undefined}>
                  {status}
                </Text>
              </View>
              <Ionicons name={both ? 'checkmark-circle' : 'chevron-forward'} size={20} color={both ? colors.success : colors.textSubtle} />
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
