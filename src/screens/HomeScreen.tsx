import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { fetchJournal, fetchTodaySparks } from '../api/journal';
import { fetchProgress } from '../api/quiz';
import { fetchMatches } from '../api/swipe';
import { useHousehold } from '../context/session';
import { daysSince } from '../lib/dates';
import { sparkForDate } from '../lib/spark';
import { useLoader } from '../lib/useLoader';
import type { TabProps } from '../navigation/types';
import { Avatar, Button, Card, colors, ErrorState, Loading, radius, Screen, space, Text } from '../ui';
import { LinkPanel } from './LinkPanel';

export function HomeScreen({ navigation }: TabProps<'Home'>) {
  const { me, partner, couple, linked } = useHousehold();
  const prompt = sparkForDate();

  const header = (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text variant="title">Hi, {me.display_name}</Text>
        {linked && couple?.together_since ? (
          <Text variant="bodyMuted">
            You and {partner?.display_name}, day {daysSince(couple.together_since) + 1}
          </Text>
        ) : null}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => navigation.navigate('Profile')} hitSlop={8}>
        <Avatar name={me.display_name} size={44} />
      </Pressable>
    </View>
  );

  if (!linked) {
    return (
      <Screen>
        {header}
        <Text variant="bodyMuted">Spark Love works in pairs. Link with your partner to unlock quizzes, the shared journal and swiping.</Text>
        <LinkPanel />
      </Screen>
    );
  }

  return <LinkedHome header={header} prompt={prompt} navigation={navigation} />;
}

function LinkedHome({ header, prompt, navigation }: { header: React.ReactNode; prompt: string; navigation: TabProps<'Home'>['navigation'] }) {
  const { me, partner } = useHousehold();
  const { data, error, refreshing, refresh, reload } = useLoader(async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const [sparks, journal, progress, matches] = await Promise.all([
      fetchTodaySparks(prompt, startOfDay),
      fetchJournal(10),
      fetchProgress(),
      fetchMatches(),
    ]);
    return {
      mine: sparks.find((s) => s.user_id === me.id) ?? null,
      theirs: sparks.find((s) => s.user_id !== me.id) ?? null,
      memory: journal.find((e) => e.kind !== 'spark') ?? null,
      quizzesTogether: progress.filter((p) => p.total > 0 && p.mine === p.total && p.partner === p.total).length,
      matches: matches.length,
    };
  }, [prompt, me.id]);

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      {header}
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data ? (
        <Loading />
      ) : (
        <>
          <Card style={[styles.spark, { gap: space.md }]}>
            <View style={styles.row}>
              <Ionicons name="sparkles" size={18} color={colors.onPrimary} />
              <Text variant="label" color={colors.onPrimary}>
                Today's spark
              </Text>
            </View>
            <Text variant="title" color={colors.onPrimary}>
              {prompt}
            </Text>
            {data.mine ? (
              <View style={{ gap: space.sm }}>
                <SparkAnswer who="You" body={data.mine.body} />
                <SparkAnswer
                  who={partner?.display_name ?? 'Partner'}
                  body={data.theirs?.body ?? `Hasn't answered yet. You'll see it here when they do.`}
                  muted={!data.theirs}
                />
              </View>
            ) : (
              <>
                <Text variant="body" color={colors.onPrimary} style={{ opacity: 0.9 }}>
                  {data.theirs
                    ? `${partner?.display_name} already answered. Answer to see theirs.`
                    : 'Answer first and surprise your partner.'}
                </Text>
                <Button
                  title="Answer"
                  variant="secondary"
                  onPress={() => navigation.navigate('Compose', { kind: 'spark', prompt })}
                />
              </>
            )}
          </Card>

          <View style={styles.stats}>
            <Card style={styles.stat} onPress={() => navigation.navigate('Quizzes')} accessibilityLabel="Open quizzes">
              <Ionicons name="help-circle-outline" size={22} color={colors.plum} />
              <Text variant="title">{data.quizzesTogether}</Text>
              <Text variant="caption">quizzes done together</Text>
            </Card>
            <Card style={styles.stat} onPress={() => navigation.navigate('Match')} accessibilityLabel="Open match">
              <Ionicons name="heart-outline" size={22} color={colors.primary} />
              <Text variant="title">{data.matches}</Text>
              <Text variant="caption">things you both want to do</Text>
            </Card>
          </View>

          <Text variant="heading" style={{ marginTop: space.sm }}>
            Latest memory
          </Text>
          {data.memory ? (
            <Card onPress={() => navigation.navigate('Journal')} style={{ padding: 0, overflow: 'hidden' }} accessibilityLabel="Open journal">
              {data.memory.photoUrl && (
                <Image source={{ uri: data.memory.photoUrl }} style={styles.photo} contentFit="cover" transition={200} />
              )}
              <View style={{ padding: space.md, gap: space.xs }}>
                {data.memory.title && <Text variant="heading">{data.memory.title}</Text>}
                <Text variant="bodyMuted" numberOfLines={3}>
                  {data.memory.body}
                </Text>
                <Text variant="caption">
                  {data.memory.user_id === me.id ? 'You' : partner?.display_name},{' '}
                  {new Date(data.memory.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
                </Text>
              </View>
            </Card>
          ) : (
            <Card style={{ gap: space.sm }}>
              <Text variant="bodyMuted">Nothing saved yet. Add a photo or a note about a moment you want to keep.</Text>
              <Button
                title="Add a memory"
                variant="secondary"
                icon="add"
                onPress={() => navigation.navigate('Compose', { kind: 'memory' })}
              />
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}

function SparkAnswer({ who, body, muted }: { who: string; body: string; muted?: boolean }) {
  return (
    <View style={styles.answer}>
      <Text variant="caption" color={colors.textMuted}>
        {who}
      </Text>
      <Text variant={muted ? 'bodyMuted' : 'body'}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  spark: { backgroundColor: colors.plum, padding: space.lg - 4 },
  answer: { backgroundColor: colors.surface, borderRadius: radius.md, padding: space.md - 4, gap: 2 },
  stats: { flexDirection: 'row', gap: space.md },
  stat: { flex: 1, gap: space.xs },
  photo: { width: '100%', aspectRatio: 16 / 10, backgroundColor: colors.surfaceMuted },
});
