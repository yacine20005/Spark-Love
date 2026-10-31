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
import { Avatar, Button, Card, colors, ErrorState, Loading, radius, Screen, SectionHead, Side, space, Stripe, Text, TrackRow } from '../ui';
import { LinkPanel } from './LinkPanel';

export function HomeScreen({ navigation }: TabProps<'Home'>) {
  const { me, partner, couple, linked } = useHousehold();
  const prompt = sparkForDate();

  const header = (
    <View style={styles.header}>
      <View style={{ flex: 1, gap: space.xs }}>
        <Text variant="display">Hi, {me.display_name}</Text>
        {linked && couple?.together_since ? (
          <View style={styles.counterRow}>
            <Text variant="bodyMuted">You and {partner?.display_name}</Text>
            <View style={styles.counter} accessibilityLabel={`Day ${daysSince(couple.together_since) + 1} together`}>
              <Text variant="counter">DAY {String(daysSince(couple.together_since) + 1).padStart(4, '0')}</Text>
            </View>
          </View>
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
          <View style={styles.spark}>
            <Stripe />
            <View style={styles.sparkBody}>
              <Text variant="title" accessibilityLabel={`Today's spark: ${prompt}`}>{prompt}</Text>
              <Side side="A" who="You" locked={!data.mine}>
                {data.mine?.body ?? 'Your side is still blank.'}
              </Side>
              <Side side="B" who={partner?.display_name ?? 'Partner'} locked={!data.mine || !data.theirs}>
                {!data.theirs
                  ? `${partner?.display_name} hasn't answered yet.`
                  : !data.mine
                    ? `${partner?.display_name} already answered. Answer to flip the tape.`
                    : data.theirs.body}
              </Side>
              {!data.mine && (
                <Button title="Answer" icon="pencil" onPress={() => navigation.navigate('Compose', { kind: 'spark', prompt })} />
              )}
            </View>
          </View>

          <View>
            <Pressable accessibilityRole="button" accessibilityLabel="Open quizzes" onPress={() => navigation.navigate('Quizzes')}>
              <TrackRow label="Quizzes finished together" value={data.quizzesTogether} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Open match" onPress={() => navigation.navigate('Match')}>
              <TrackRow label="Things you both want to do" value={data.matches} />
            </Pressable>
          </View>

          <SectionHead>Latest memory</SectionHead>
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

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, marginBottom: space.sm },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  counter: { borderWidth: 1, borderColor: colors.text, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  spark: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  sparkBody: { padding: space.md, gap: space.md - 4 },
  photo: { width: '100%', aspectRatio: 16 / 10, backgroundColor: colors.surfaceMuted },
});
